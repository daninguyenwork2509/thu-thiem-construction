"use client"
import { useState } from "react"
import { Check, AlertTriangle, X, ChevronDown, ChevronRight } from "lucide-react"
import { fmtVND, type PipelineItem } from "@/lib/project-data"

// ── Types ──────────────────────────────────────────────────────────────────────
type PayStatus = "not_due" | "eligible" | "invoiced" | "paid" | "overdue"

interface PayMilestone {
  id: string; order: number; name: string
  pct: number; amount: number
  status: PayStatus
  condition: string
  conditionMet: boolean
  linkedContractors: { name: string; pkg: string; amount: number; paidToNT: boolean }[]
  paidDate?: string
}

interface NTPayment {
  id: string; contractor: string; pkg: string
  total: number; advance: number; advancePaid: boolean
  balance: number; balancePaid: boolean
  balanceEligibleAt: string   // "Đợt N"
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CONTRACT_VALUE = 370_000_000

const SEED_MILESTONES: PayMilestone[] = [
  {
    id:"pm1", order:1, name:"Ký HĐ + Khởi công", pct:30,
    amount: Math.round(CONTRACT_VALUE * 0.30),
    status:"paid", conditionMet:true,
    condition:"HĐ đã ký + KH chuyển khoản",
    paidDate:"01/02/2025",
    linkedContractors:[
      { name:"Đội Minh Phát",        pkg:"Phá dỡ & Xây thô", amount:25_300_000, paidToNT:true  },
    ],
  },
  {
    id:"pm2", order:2, name:"Hoàn thành phần thô", pct:30,
    amount: Math.round(CONTRACT_VALUE * 0.30),
    status:"eligible", conditionMet:true,
    condition:"Gói thầu 1+2 đạt 100% · GS xác nhận · PM nghiệm thu · KH duyệt",
    linkedContractors:[
      { name:"Đội Minh Phát",        pkg:"Phá dỡ & Xây thô", amount:47_175_000, paidToNT:false },
      { name:"Cty TNHH Điện Hưng",   pkg:"Điện nước",         amount:42_000_000, paidToNT:false },
    ],
  },
  {
    id:"pm3", order:3, name:"Hoàn thiện + Nội thất", pct:30,
    amount: Math.round(CONTRACT_VALUE * 0.30),
    status:"not_due", conditionMet:false,
    condition:"Gói thầu 3+4 đạt 100% · GS xác nhận · PM nghiệm thu · KH duyệt",
    linkedContractors:[
      { name:"Đội Thanh Bình",        pkg:"Hoàn thiện",        amount:44_100_000, paidToNT:false },
      { name:"Xưởng Phước Lộc",       pkg:"Nội thất gỗ",       amount:65_000_000, paidToNT:false },
    ],
  },
  {
    id:"pm4", order:4, name:"Nghiệm thu & Bàn giao", pct:10,
    amount: Math.round(CONTRACT_VALUE * 0.10),
    status:"not_due", conditionMet:false,
    condition:"Toàn bộ hoàn tất 100% · KH ký biên bản bàn giao",
    linkedContractors:[
      { name:"Đại lý TOTO",           pkg:"Thiết bị VS",       amount:21_000_000, paidToNT:false },
    ],
  },
]

const SEED_NT_PAYMENTS: NTPayment[] = [
  { id:"nt1", contractor:"Đội Minh Phát",       pkg:"Phá dỡ & Xây thô",  total:72_475_000, advance:36_237_500, advancePaid:true,  balance:36_237_500, balancePaid:false, balanceEligibleAt:"Đợt 2" },
  { id:"nt2", contractor:"Cty TNHH Điện Hưng",  pkg:"Điện nước",          total:60_000_000, advance:18_000_000, advancePaid:true,  balance:42_000_000, balancePaid:false, balanceEligibleAt:"Đợt 2" },
  { id:"nt3", contractor:"Đội Thanh Bình",       pkg:"Hoàn thiện",         total:62_800_000, advance:18_840_000, advancePaid:false, balance:43_960_000, balancePaid:false, balanceEligibleAt:"Đợt 3" },
  { id:"nt4", contractor:"Xưởng Phước Lộc",      pkg:"Nội thất gỗ",        total:108_750_000,advance:43_500_000, advancePaid:false, balance:65_250_000, balancePaid:false, balanceEligibleAt:"Đợt 3" },
  { id:"nt5", contractor:"Đại lý TOTO",           pkg:"Thiết bị VS",        total:30_000_000, advance:0,         advancePaid:false, balance:30_000_000, balancePaid:false, balanceEligibleAt:"Đợt 4" },
]

const STATUS_CONFIG: Record<PayStatus, { label: string; cls: string; dot: string }> = {
  not_due:  { label:"Chưa đến hạn",      cls:"bg-gray-100 text-gray-500",        dot:"bg-gray-300"    },
  eligible: { label:"✓ Đủ điều kiện thu", cls:"bg-green-100 text-green-700",      dot:"bg-green-500"   },
  invoiced: { label:"Đã gửi invoice",    cls:"bg-blue-100 text-blue-700",        dot:"bg-blue-500"    },
  paid:     { label:"Đã thu ✓",          cls:"bg-green-100 text-green-700 font-bold", dot:"bg-green-600" },
  overdue:  { label:"Quá hạn!",          cls:"bg-red-100 text-red-700",          dot:"bg-red-500"     },
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectCashflowTab({
  project, showToast,
}: {
  project: PipelineItem
  showToast: (msg: string, type?: "success" | "error" | "warn") => void
}) {
  const [milestones, setMilestones] = useState<PayMilestone[]>(SEED_MILESTONES)
  const [ntPayments, setNtPayments] = useState<NTPayment[]>(SEED_NT_PAYMENTS)
  const [expandedMs, setExpandedMs] = useState<Record<string, boolean>>({ pm2:true })
  const [showNT, setShowNT] = useState(false)

  const paidTotal     = milestones.filter(m => m.status === "paid").reduce((s, m) => s + m.amount, 0)
  const remaining     = CONTRACT_VALUE - paidTotal
  const paidNTTotal   = ntPayments.reduce((s, n) => s + (n.advancePaid ? n.advance : 0) + (n.balancePaid ? n.balance : 0), 0)
  const profit        = paidTotal - paidNTTotal

  const handleInvoice = (id: string) => {
    setMilestones(p => p.map(m => m.id === id ? { ...m, status:"invoiced" as PayStatus } : m))
    showToast("Đã tạo invoice — gửi cho kế toán xử lý", "success")
  }
  const handleConfirmPaid = (id: string) => {
    const today = new Date()
    setMilestones(p => p.map(m => m.id === id ? { ...m, status:"paid" as PayStatus, paidDate:`${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}` } : m))
    showToast("✅ Đã xác nhận thu tiền — kế toán cập nhật", "success")
  }
  const handlePayNT = (ntId: string, type: "advance" | "balance") => {
    setNtPayments(p => p.map(n => n.id === ntId
      ? { ...n, advancePaid: type==="advance" ? true : n.advancePaid, balancePaid: type==="balance" ? true : n.balancePaid }
      : n
    ))
    showToast("✅ Đã xác nhận chi tiền nhà thầu phụ", "success")
  }

  return (
    <div className="space-y-3">
      {/* Financial summary */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden">
        {[
          { label:"Giá trị HĐ",    value:fmtVND(CONTRACT_VALUE), cls:"text-gray-800 font-bold"  },
          { label:"Đã thu",         value:fmtVND(paidTotal),       cls:"text-green-600 font-bold" },
          { label:"Còn lại",        value:fmtVND(remaining),       cls:remaining>0?"text-red-500 font-bold":"text-gray-400" },
          { label:"Lợi nhuận thực", value:fmtVND(profit),          cls:profit>0?"text-green-600 font-bold":"text-red-500"   },
        ].map(x => (
          <div key={x.label} className="bg-white py-2.5 px-3 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">{x.label}</div>
            <div className={`text-xs ${x.cls}`}>{x.value}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {milestones.map((m, idx) => {
          const cfg = STATUS_CONFIG[m.status]
          const isOpen = expandedMs[m.id]
          const ntForThisMs = ntPayments.filter(nt => nt.balanceEligibleAt === `Đợt ${m.order}`)
          const eligibleToPay = m.status === "paid" && ntForThisMs.some(nt => !nt.balancePaid)

          return (
            <div key={m.id}>
              {/* Milestone header */}
              <button
                type="button"
                onClick={() => setExpandedMs(p => ({ ...p, [m.id]: !p[m.id] }))}
                className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors ${
                  m.status === "paid" ? "bg-green-50/40" : m.status === "eligible" ? "bg-amber-50/40" : "hover:bg-gray-50"
                }`}
              >
                {/* Number */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.status === "paid" ? "bg-green-100 text-green-700"
                  : m.status === "eligible" ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
                }`}>{m.order}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-800">{m.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    {m.status === "paid" && m.paidDate && (
                      <span className="text-[10px] text-gray-400">{m.paidDate}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.pct}% HĐ · {fmtVND(m.amount)}</div>
                </div>

                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50/30">
                  {/* Condition */}
                  <div className={`flex items-start gap-2 mt-3 text-xs px-3 py-2 rounded-lg ${
                    m.conditionMet ? "bg-green-50 border border-green-100 text-green-700" : "bg-orange-50 border border-orange-100 text-orange-700"
                  }`}>
                    {m.conditionMet
                      ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />}
                    <span>{m.condition}</span>
                  </div>

                  {/* Actions */}
                  {m.status === "eligible" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleInvoice(m.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm">
                        📄 Tạo invoice gửi KH
                      </button>
                    </div>
                  )}
                  {m.status === "invoiced" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirmPaid(m.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm">
                        <Check className="w-3.5 h-3.5" /> Kế toán xác nhận đã thu
                      </button>
                    </div>
                  )}

                  {/* Cashflow breakdown */}
                  <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      Dòng tiền đợt {m.order}
                    </div>
                    <div className="px-3 py-2 space-y-1.5 text-xs">
                      <div className="flex justify-between text-blue-600">
                        <span className="text-gray-500">KH chuyển khoản</span>
                        <span className="font-bold">+{fmtVND(m.amount)}</span>
                      </div>
                      {m.linkedContractors.map(c => (
                        <div key={c.name} className="flex justify-between text-red-500">
                          <span className="text-gray-500">Trả {c.name}</span>
                          <span className="font-bold">−{fmtVND(c.amount)}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between font-bold border-t border-gray-100 pt-1.5 ${
                        m.amount - m.linkedContractors.reduce((s,c)=>s+c.amount,0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        <span>Lợi nhuận đợt này</span>
                        <span>{fmtVND(m.amount - m.linkedContractors.reduce((s,c)=>s+c.amount,0))}</span>
                      </div>
                    </div>
                  </div>

                  {/* NT payment actions when paid */}
                  {m.status === "paid" && ntForThisMs.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Giải ngân nhà thầu phụ</div>
                      <div className="space-y-2">
                        {ntForThisMs.map(nt => (
                          <div key={nt.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                            nt.balancePaid ? "bg-green-50 border-green-100" : "bg-white border-gray-200"
                          }`}>
                            <div>
                              <span className="font-semibold text-gray-800">{nt.contractor}</span>
                              <span className="text-gray-400 ml-1">· {nt.pkg}</span>
                              <div className="text-[10px] text-gray-500">Thanh lý: {fmtVND(nt.balance)}</div>
                            </div>
                            {nt.balancePaid
                              ? <span className="text-green-600 font-bold text-[10px]">Đã chi ✓</span>
                              : (
                                <button onClick={() => handlePayNT(nt.id, "balance")}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
                                  Duyệt chi →
                                </button>
                              )
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* NT Payment overview */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setShowNT(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">💸 Công nợ nhà thầu phụ</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">5 nhà thầu</span>
          </div>
          {showNT ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {showNT && (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]" style={{ minWidth:580 }}>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Nhà thầu phụ</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">Tổng gói</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">Tạm ứng</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-semibold">T.Ứ đã chi</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">Thanh lý</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-semibold">TL đã chi</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Đủ điều kiện</th>
                </tr>
              </thead>
              <tbody>
                {ntPayments.map(nt => (
                  <tr key={nt.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800">{nt.contractor}</div>
                      <div className="text-[10px] text-gray-400">{nt.pkg}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-700">{fmtVND(nt.total)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmtVND(nt.advance)}</td>
                    <td className="px-3 py-2 text-center">
                      {nt.advance > 0
                        ? nt.advancePaid
                          ? <span className="text-[10px] text-green-600 font-bold">✓ Đã chi</span>
                          : <button onClick={() => handlePayNT(nt.id,"advance")}
                              className="text-[10px] font-bold text-orange-600 hover:underline">Chi ngay</button>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmtVND(nt.balance)}</td>
                    <td className="px-3 py-2 text-center">
                      {nt.balancePaid
                        ? <span className="text-[10px] text-green-600 font-bold">✓ Đã chi</span>
                        : <span className="text-[10px] text-gray-400">Chờ {nt.balanceEligibleAt}</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-[10px] text-gray-500">{nt.balanceEligibleAt}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-3 py-2 font-bold text-gray-700">Tổng</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-800">{fmtVND(ntPayments.reduce((s,n)=>s+n.total,0))}</td>
                  <td className="px-3 py-2 text-right font-bold">{fmtVND(ntPayments.reduce((s,n)=>s+n.advance,0))}</td>
                  <td />
                  <td className="px-3 py-2 text-right font-bold">{fmtVND(ntPayments.reduce((s,n)=>s+n.balance,0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
