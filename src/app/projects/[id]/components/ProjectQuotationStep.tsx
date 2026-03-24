"use client"
import { useState, useEffect } from "react"
import { Check, Send, CheckCircle, FileSignature, X, UploadCloud, User } from "lucide-react"
import { fmtVND, type PipelineItem, type LifecycleStage, getSeedBOQ, BOQGroupV2 } from "@/lib/project-data"

export default function ProjectQuotationStep({
  project, localLifecycle, updateProjectField, showToast,
}: {
  project: PipelineItem
  localLifecycle: LifecycleStage
  updateProjectField: (f: Partial<PipelineItem>) => void
  showToast: (msg: string, type?: "success" | "error" | "warn") => void
}) {
  const [groups, setGroups] = useState<BOQGroupV2[]>([])
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`boq_${project.id}`)
      if (saved) setGroups(JSON.parse(saved))
      else setGroups(getSeedBOQ(project.id))
    }
  }, [project.id])

  const iCost  = (i: any) => i.quantity * i.unitPriceCost
  const iSell  = (i: any) => i.quantity * i.unitPriceSell
  const sgCost = (sg: any) => sg.items.reduce((s: number, i: any) => s + iCost(i), 0)
  const sgSell = (sg: any) => sg.items.reduce((s: number, i: any) => s + iSell(i), 0)
  const gCost  = (g: any) => g.subGroups.reduce((s: number, sg: any) => s + sgCost(sg), 0)
  const gSell  = (g: any) => g.subGroups.reduce((s: number, sg: any) => s + sgSell(sg), 0)

  const totalCost = groups.reduce((s, g) => s + gCost(g), 0)
  const totalSell = groups.reduce((s, g) => s + gSell(g), 0)
  const avgMargin = totalCost > 0 ? ((totalSell - totalCost) / totalCost * 100) : 0
  const contractVal = project.contractValue ?? Math.round(totalSell / 1_000_000) * 1_000_000

  // Evidence logs states
  const [quoteLog, setQuoteLog] = useState(project.quotationLog)
  const [approvalLog, setApprovalLog] = useState(project.approvalLog)
  const [contractLog, setContractLog] = useState(project.contractLog)

  const [activeAction, setActiveAction] = useState<"send" | "approve" | "sign" | null>(null)

  // Form states
  const [actor, setActor] = useState(project.pm || "Lê Minh Tuấn")
  const [fileUrl, setFileUrl] = useState("")

  useEffect(() => {
    setQuoteLog(project.quotationLog)
    setApprovalLog(project.approvalLog)
    setContractLog(project.contractLog)
  }, [project])

  const submitSendQuote = () => {
    if (!actor || !fileUrl) return showToast("Vui lòng nhập người gửi và kèm file báo giá", "warn")
    const log = { actor, date: new Date().toISOString().split('T')[0], fileUrl }
    setQuoteLog(log)
    updateProjectField({ quotationSent: true, quotationLog: log })
    showToast("Đã ghi nhận gửi báo giá cho KH", "success")
    setActiveAction(null)
    setFileUrl("")
  }

  const submitApprove = () => {
    if (!actor || !fileUrl) return showToast("Vui lòng nhập người xác nhận và hình ảnh Zalo/Email", "warn")
    const log = { actor, date: new Date().toISOString().split('T')[0], evidenceUrl: fileUrl }
    setApprovalLog(log)
    updateProjectField({ approvalLog: log })
    showToast("Đã lưu bằng chứng KH duyệt báo giá", "success")
    setActiveAction(null)
    setFileUrl("")
  }

  const submitSign = () => {
    if (!actor || !fileUrl) return showToast("Vui lòng nhập người phụ trách và đính kèm bản scan HĐ", "warn")
    const log = { actor, date: new Date().toISOString().split('T')[0], signDate: new Date().toISOString().split('T')[0], fileUrl }
    setContractLog(log)
    
    updateProjectField({ 
      contractSigned: true, 
      contractLog: log,
      contractValue: contractVal,
      lifecycleStage: "construction",
      contractDate: log.signDate
    })
    
    // Explicit sync for dynamic_leads to avoid cache mismatch
    try {
      const saved = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      const idx = saved.findIndex((l: any) => l.id === project.id)
      if (idx >= 0) {
        saved[idx].lifecycleStage = "construction"
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
      }
    } catch {}

    showToast("Hợp đồng đã ký! Dự án chuyển sang giai đoạn thi công", "success")
    setActiveAction(null)
    setTimeout(() => window.location.reload(), 1500)
  }

  const renderActionForm = (
    title: string, 
    actorLabel: string, 
    filePlaceholder: string, 
    onSubmit: () => void
  ) => (
    <div className="absolute top-0 left-0 w-full h-full bg-white rounded-lg p-3 z-10 flex flex-col justify-between border shadow-lg">
      <div className="flex justify-between items-center mb-1 border-b pb-1">
        <span className="text-[11px] font-bold text-gray-800">{title}</span>
        <button onClick={() => setActiveAction(null)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="space-y-2 flex-1 mt-1">
        <div>
          <label className="text-[9px] text-gray-500 font-semibold">{actorLabel}</label>
          <input value={actor} onChange={e => setActor(e.target.value)} className="w-full text-xs border rounded px-2 py-1 focus:outline-blue-500" />
        </div>
        <div>
          <label className="text-[9px] text-gray-500 font-semibold">Tài liệu / Bằng chứng</label>
          <div className="flex items-center gap-1 border rounded px-2 py-1 focus-within:ring-1 ring-blue-500 bg-gray-50">
            <UploadCloud className="w-3.5 h-3.5 text-gray-400" />
            <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder={filePlaceholder} className="w-full text-xs bg-transparent outline-none" />
          </div>
        </div>
      </div>
      <div className="mt-2 text-right">
        <button onClick={onSubmit} className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded hover:bg-black">Xác nhận</button>
      </div>
    </div>
  )

  const renderLogSummary = (log: any, tColor: string, bColor: string) => (
    <div className="mt-2 text-left bg-white/50 border rounded p-1.5 w-full">
      <div className="text-[9px] text-gray-400 mb-0.5 border-b pb-0.5">BẰNG CHỨNG LƯU TRỮ</div>
      <div className="flex items-center gap-1 text-[10px] text-gray-700">
        <User className="w-3 h-3 text-gray-400" /> <b>{log.actor}</b>
      </div>
      <div className="text-[9px] text-gray-500 truncate mt-0.5">
        Đính kèm: <span className={`text-${tColor}-600 underline cursor-pointer hover:text-${tColor}-800`}>{log.fileUrl || log.evidenceUrl}</span>
      </div>
      <div className="text-[9px] text-gray-400 mt-0.5 text-right">{log.date}</div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
          <div className="text-[11px] text-gray-500 font-medium mb-1 uppercase tracking-wide">Tổng vốn NTP</div>
          <div className="text-sm font-bold text-gray-800">{fmtVND(totalCost)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <div className="text-[11px] text-amber-600 font-medium mb-1 uppercase tracking-wide">Báo giá KH</div>
          <div className="text-sm font-bold text-amber-800">{fmtVND(totalSell)}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center relative overflow-hidden">
          <div className="text-[11px] text-green-700 font-medium mb-1 uppercase tracking-wide">Giá trị HĐ chốt</div>
          <div className="text-sm font-bold text-green-800">{fmtVND(contractVal)}</div>
          <div className="absolute top-0 right-0 bg-green-200 text-green-800 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">Biên LN: {avgMargin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-xs font-bold text-gray-800 uppercase tracking-widest">Tóm tắt báo giá ({groups.length} nhóm)</div>
          <div className="text-sm font-bold text-orange-600">{fmtVND(totalSell)}</div>
        </div>
      </div>

      {/* Action Checkpoints */}
      <div className="bg-white border rounded-xl p-3 gap-3 flex flex-col md:flex-row shadow-sm">
        
        {/* Box 1: Send Quote */}
        <div className={`relative flex-1 rounded-lg border p-3 flex flex-col items-center justify-start text-center transition-all min-h-[140px] ${
           quoteLog ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-blue-300"
        }`}>
          {activeAction === "send" && renderActionForm("Ghi nhận gửi báo giá", "Người gửi báo giá", "Link file báo giá (PDF)...", submitSendQuote)}
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 shrink-0 ${quoteLog ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-500"}`}>
            {quoteLog ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <div className={`text-xs font-bold mb-2 ${quoteLog ? "text-blue-800" : "text-gray-700"}`}>1. Gửi báo giá</div>
          
          {!quoteLog ? (
            <button onClick={() => { setActor(project.pm || ""); setFileUrl("baogia_v1.pdf"); setActiveAction("send") }} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg transition-colors w-full mt-auto">Gửi cho KH</button>
          ) : renderLogSummary(quoteLog, "blue", "blue")}
        </div>

        {/* Box 2: Approve */}
        <div className={`relative flex-1 rounded-lg border p-3 flex flex-col items-center justify-start text-center transition-all min-h-[140px] ${
           !quoteLog ? "opacity-40 grayscale" : approvalLog ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-green-300"
        }`}>
          {activeAction === "approve" && renderActionForm("Bằng chứng KH duyệt", "Người ghi nhận", "Hình ảnh/Link Zalo xác nhận...", submitApprove)}
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 shrink-0 ${approvalLog ? "bg-green-500 text-white" : "bg-green-100 text-green-500"}`}>
            {approvalLog ? <Check className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </div>
          <div className={`text-xs font-bold mb-2 ${approvalLog ? "text-green-800" : "text-gray-700"}`}>2. KH duyệt giá</div>
          
          {!approvalLog ? (
            <button disabled={!quoteLog} onClick={() => { setActor(project.pm || ""); setFileUrl("zalo_confirm_kh.png"); setActiveAction("approve") }} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold rounded-lg transition-colors w-full mt-auto disabled:bg-gray-300">Xác nhận duyệt</button>
          ) : renderLogSummary(approvalLog, "green", "green")}
        </div>

        {/* Box 3: Sign */}
        <div className={`relative flex-1 rounded-lg border p-3 flex flex-col items-center justify-start text-center transition-all min-h-[140px] ${
           !approvalLog ? "opacity-40 grayscale" : contractLog ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200 hover:border-orange-400"
        }`}>
          {activeAction === "sign" && renderActionForm("Ký hợp đồng thi công", "Đại diện công ty", "Bản scan hợp đồng có chữ ký (PDF)...", submitSign)}
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 shrink-0 ${contractLog ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-500"}`}>
            {contractLog ? <Check className="w-4 h-4" /> : <FileSignature className="w-4 h-4" />}
          </div>
          <div className={`text-xs font-bold mb-2 ${contractLog ? "text-orange-800" : "text-gray-700"}`}>3. Ký hợp đồng</div>
          
          {!contractLog ? (
            <button disabled={!approvalLog} onClick={() => { setActor(project.pm || ""); setFileUrl("hopdong_thicong_signed.pdf"); setActiveAction("sign") }} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg transition-colors w-full mt-auto disabled:bg-gray-300">Ký HĐ Thi công</button>
          ) : renderLogSummary(contractLog, "orange", "orange")}
        </div>

      </div>
    </div>
  )
}
