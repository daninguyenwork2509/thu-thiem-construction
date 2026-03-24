"use client"
import { useState, useEffect, useMemo } from "react"
import { Check, AlertTriangle, ChevronDown, ChevronRight, Camera, ExternalLink, Plus } from "lucide-react"
import { type PipelineItem, type BOQGroupV2, type BOQItemV2, getSeedBOQ } from "@/lib/project-data"

const TOTAL_WEEKS = 16
const SIM_WEEK    = 6

const CHECKLIST = [
  { id:"lc1", label:"Giấy phép cải tạo nội thất (upload file)",        done:true  },
  { id:"lc2", label:"Bảo hiểm công trình",                              done:true  },
  { id:"lc3", label:"HĐ nhà thầu phụ ký đủ 5 gói",                    done:true  },
  { id:"lc4", label:"Duyệt mẫu vật liệu chính (gạch, sơn, nội thất)", done:true  },
  { id:"lc5", label:"Thông báo BQL khu dân cư",                         done:true  },
  { id:"lc6", label:"KH đã thanh toán Đợt 1 – 30%",                   done:true  },
]

const STATUS_ICON: Record<string, string> = {
  not_started:"⚪", in_progress:"🔵", delayed:"🟡", done:"🔍", approved:"✅", draft:"⚪", pending:"🟡"
}

export default function ProjectConstructionStep({
  project, showToast,
}: {
  project: PipelineItem
  showToast: (msg: string, type?: "success" | "error" | "warn") => void
}) {
  const [groups, setGroups] = useState<BOQGroupV2[]>([])
  const [open, setOpen] = useState({ plan:false, qaqc:true, progress:true, vo:false })
  const tog = (k: keyof typeof open) => setOpen(p => ({ ...p, [k]: !p[k] }))

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`boq_${project.id}`)
      if (saved) setGroups(JSON.parse(saved))
      else setGroups(getSeedBOQ(project.id))
    }
  }, [project.id])

  const dynamicPhases = useMemo(() => {
    return groups.map((g, i) => {
      const contractors = new Set(g.subGroups.map(sg => sg.contractor?.name).filter(Boolean))
      const items = g.subGroups.flatMap(sg => sg.items) as BOQItemV2[]
      
      const sDates = g.subGroups.map(sg => sg.startDate).filter(Boolean) as string[]
      const eDates = g.subGroups.map(sg => sg.endDate).filter(Boolean) as string[]
      sDates.sort()
      eDates.sort()

      const startStr = sDates[0] ? new Date(sDates[0]).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'}) : "..."
      const endStr = eDates[eDates.length - 1] ? new Date(eDates[eDates.length - 1]).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'}) : "..."

      return {
        id: g.id,
        name: g.name,
        contractor: Array.from(contractors).join(" · ") || "Nội bộ",
        items,
        plannedStart: startStr,
        plannedEnd: endStr,
        startWeek: (i * 3) + 1,
        durationWeeks: 3,
        dependency: i > 0 ? groups[i - 1].id : null,
      }
    })
  }, [groups])

  const allItems = useMemo(() => dynamicPhases.flatMap(ph => ph.items), [dynamicPhases])
  const allPcts = allItems.map(i => i.progress || 0)
  const overallPct = allPcts.length > 0 ? Math.round(allPcts.reduce((s, p) => s + p, 0) / allPcts.length) : 0

  const phasePct = (phId: string) => {
    const pcts = dynamicPhases.find(p => p.id === phId)?.items.map(i => i.progress || 0) || []
    return pcts.length > 0 ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0
  }

  const qaPendingItems = useMemo(() => {
    const list: Array<{ phaseId: string, item: BOQItemV2 }> = []
    dynamicPhases.forEach(ph => {
      ph.items.forEach(i => {
        if (i.status === "done") list.push({ phaseId: ph.id, item: i })
      })
    })
    return list
  }, [dynamicPhases])

  const handleQAQC = (phaseId: string, itemId: string, action: "accepted" | "rejected") => {
    let defectNote: string | undefined = undefined
    if (action === "rejected") {
      const note = prompt("Nhập lý do không đạt (Sơn lem, sai kích thước...):")
      if (note === null) return // Cancelled
      defectNote = note
    }

    setGroups(prev => {
      const newGroups = [...prev]
      const gIdx = newGroups.findIndex(g => g.id === phaseId)
      if (gIdx === -1) return prev

      let foundSgIdx = -1, foundIIdx = -1
      
      const sgs = newGroups[gIdx].subGroups
      for (let i = 0; i < sgs.length; i++) {
        const iIdx = sgs[i].items.findIndex(x => x.id === itemId)
        if (iIdx !== -1) {
          foundSgIdx = i
          foundIIdx = iIdx
          break
        }
      }

      if (foundSgIdx === -1 || foundIIdx === -1) return prev

      const sg = sgs[foundSgIdx]
      const newItems = [...sg.items]
      const oldItem = newItems[foundIIdx]

      if (action === "accepted") {
        newItems[foundIIdx] = { ...oldItem, status: "approved" }
      } else {
        newItems[foundIIdx] = { ...oldItem, status: "pending", progress: 90, defectNote }
      }
      
      const newSg = { ...sg, items: newItems }
      const newSgs = [...sgs]
      newSgs[foundSgIdx] = newSg

      newGroups[gIdx] = { ...newGroups[gIdx], subGroups: newSgs }
      localStorage.setItem(`boq_${project.id}`, JSON.stringify(newGroups))
      showToast(action === "accepted" ? "Đã duyệt hạng mục: Đạt!" : "Đã báo cáo lỗi!", action === "accepted" ? "success" : "warn")
      return newGroups
    })
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Overall summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tiến độ thi công tổng thể</div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">{overallPct}%</div>
          </div>
          <div className="px-3 py-1.5 text-[11px] font-bold bg-green-50 text-green-700 border border-green-100 rounded-full flex items-center gap-1.5">
             Đồng bộ từ BOQ <Check className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${overallPct}%`, background:"linear-gradient(90deg, #3b82f6, #f97316)" }} />
        </div>
      </div>

      {/* Checklist khởi công */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => tog("plan")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
          <span className="text-xs font-bold text-gray-700">☑️ Checklist điều kiện khởi công</span>
          {open.plan ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {open.plan && (
          <div className="p-4 bg-white grid grid-cols-2 gap-2">
            {CHECKLIST.map(c => (
              <div key={c.id} className={`flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-lg border ${
                c.done ? "bg-green-50/50 border-green-100 text-green-800" : "bg-red-50/50 border-red-100 text-red-800"
              }`}>
                {c.done
                  ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                {c.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {groups.map((g, idx) => {
          const items = g.subGroups.flatMap(sg => sg.items)
          const total = items.length
          const doneOrMore = items.filter(i => i.status === "done" || i.status === "approved").length
          const approved = items.filter(i => i.status === "approved").length
          const pct = total > 0 ? Math.round(items.reduce((s, i) => s + (i.progress || 0), 0) / total) : 0
          
          const RomanId = ["I", "II", "III", "IV", "V", "VI", "VII"][idx] || (idx + 1)

          return (
            <div key={g.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition">
              <div className="text-[10px] font-bold text-gray-500 mb-1 truncate" title={g.name}>
                {RomanId}. {g.name}
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <div className={`text-lg font-black ${pct === 100 ? "text-green-600" : pct > 0 ? "text-orange-600" : "text-gray-400"}`}>
                  {pct}%
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-blue-600">GS: {doneOrMore}/{total}</div>
                  <div className="text-[9px] font-bold text-green-600">QA: {approved}/{total}</div>
                </div>
              </div>

              <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden relative border border-gray-100/50">
                 {/* GS completion shadow bar */}
                 <div className="absolute inset-y-0 left-0 bg-blue-100 transition-all" 
                   style={{ width: `${total > 0 ? (doneOrMore/total)*100 : 0}%` }} />
                 {/* QA/Approved bar */}
                 <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-orange-500"}`} 
                   style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Helper Footer */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <ExternalLink className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 italic">Cần cập nhật chi tiết?</div>
            <div className="text-[10px] text-gray-500">Giám sát báo cáo hoàn thành & QA nghiệm thu trực tiếp trong tab <span className="font-bold text-orange-600">Dự toán BOQ</span></div>
          </div>
        </div>
        <button className="px-4 py-2 bg-white text-orange-600 border border-orange-200 text-xs font-bold rounded-lg hover:bg-orange-50 transition shadow-sm">
          Đến tab BOQ →
        </button>
      </div>

      {/* Section: VO */}
      <div className="border border-gray-100 rounded-xl overflow-hidden mt-3">
        <button onClick={() => tog("vo")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">⚡ Phát sinh (Variation Order)</span>
            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
              Chưa có phát sinh
            </span>
          </div>
          {open.vo ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {open.vo && (
           <div className="px-4 py-6 text-center text-xs text-gray-400">
             Chưa có chi phí phát sinh nào được tạo.
             <div className="mt-2 text-orange-500 font-medium cursor-pointer hover:underline inline-block">Thêm phát sinh mới +</div>
           </div>
        )}
      </div>
    </div>
  )
}
