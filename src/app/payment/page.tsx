"use client"
import { useState } from "react"
import { mockMilestones, mockProjects, fmtVND } from "@/lib/mock-data"
import {
  Wallet, AlertTriangle, AlertCircle, CheckCircle2,
  X, FileCheck, Bell, Filter
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Milestone {
  id: number; project_id: number; milestone_order: number; milestone_name: string
  payment_percent: number; payment_amount: number; paid_amount: number
  due_date: string; status: string
  overdue_days?: number; reminder_sent?: boolean; handover_confirmed?: boolean
}

const TODAY = "2026-03-12"

function calcOverdueDays(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date(TODAY)
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000))
}

// Enrich milestones
const BASE_MILESTONES: Milestone[] = [
  ...mockMilestones,
  { id: 5, project_id: 2, milestone_order: 1, milestone_name: "Đặt cọc ký HĐ", payment_percent: 20, payment_amount: 300_000_000, paid_amount: 300_000_000, due_date: "2025-03-15", status: "paid" },
  { id: 6, project_id: 2, milestone_order: 2, milestone_name: "Hoàn thiện thiết kế", payment_percent: 20, payment_amount: 300_000_000, paid_amount: 0, due_date: "2025-06-01", status: "overdue" },
  { id: 7, project_id: 3, milestone_order: 1, milestone_name: "Đặt cọc", payment_percent: 10, payment_amount: 220_000_000, paid_amount: 220_000_000, due_date: "2024-01-15", status: "paid" },
  { id: 8, project_id: 3, milestone_order: 6, milestone_name: "Bàn giao cuối", payment_percent: 10, payment_amount: 220_000_000, paid_amount: 220_000_000, due_date: "2024-11-30", status: "paid", handover_confirmed: true },
].map(m => ({
  ...m,
  overdue_days: ["paid", "draft"].includes(m.status) ? 0 : calcOverdueDays(m.due_date),
  status: m.status === "paid" ? "paid"
    : calcOverdueDays(m.due_date) > 0 && m.status !== "draft" && m.status !== "approved" ? "overdue"
    : m.status,
}))

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700", approved: "bg-blue-100 text-blue-700",
  pending_approval: "bg-yellow-100 text-yellow-700", draft: "bg-gray-100 text-gray-500",
  overdue: "bg-red-100 text-red-600",
}
const STATUS_LABEL: Record<string, string> = {
  paid: "Đã thu", approved: "Đã duyệt", pending_approval: "Chờ duyệt", draft: "Nháp", overdue: "Quá hạn",
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const [milestones, setMilestones] = useState<Milestone[]>(BASE_MILESTONES)
  const [filterStatus, setFilterStatus] = useState("")
  const [handoverModal, setHandoverModal] = useState<Milestone | null>(null)
  const [confirmModal, setConfirmModal] = useState<Milestone | null>(null)
  const [handoverNote, setHandoverNote] = useState("")
  const [showAlert, setShowAlert] = useState(true)

  const totalMust = milestones.reduce((s, m) => s + m.payment_amount, 0)
  const totalPaid = milestones.filter(m => m.status === "paid").reduce((s, m) => s + m.paid_amount, 0)
  const totalPending = milestones.filter(m => m.status === "approved").reduce((s, m) => s + m.payment_amount, 0)
  const totalOverdue = milestones.filter(m => m.status === "overdue").reduce((s, m) => s + m.payment_amount, 0)
  const overdueList = milestones.filter(m => m.status === "overdue")
  const criticalCount = overdueList.filter(m => (m.overdue_days ?? 0) > 60).length

  const filtered = milestones.filter(m => !filterStatus || m.status === filterStatus)

  const sendReminder = (id: number) => setMilestones(p => p.map(m => m.id === id ? { ...m, reminder_sent: true } : m))

  const confirmPayment = () => {
    if (!confirmModal) return
    setMilestones(p => p.map(m => m.id === confirmModal.id ? { ...m, status: "paid", paid_amount: m.payment_amount } : m))
    setConfirmModal(null)
  }

  const confirmHandover = () => {
    if (!handoverModal) return
    setMilestones(p => p.map(m => m.id === handoverModal.id ? { ...m, handover_confirmed: true, status: "pending_approval" } : m))
    setHandoverModal(null)
    setHandoverNote("")
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-orange-500" />
          Dòng tiền
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Theo dõi thu chi, cảnh báo công nợ theo mốc thanh toán</p>
      </div>

      {/* ── Debt warning banner ── */}
      {overdueList.length > 0 && showAlert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-red-800 text-sm">
              ⚠ {overdueList.length} mốc thanh toán quá hạn
              {criticalCount > 0 && (
                <span className="ml-2 bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {criticalCount} nghiêm trọng &gt;60 ngày
                </span>
              )}
            </div>
            <div className="text-sm text-red-600 mt-1">
              Tổng tiền quá hạn: <strong>{fmtVND(totalOverdue)}</strong>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {overdueList.slice(0, 4).map(m => {
                const proj = mockProjects.find(p => p.id === m.project_id)
                return (
                  <span key={m.id} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                    {proj?.project_code} — {m.overdue_days} ngày
                  </span>
                )
              })}
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-red-400 hover:text-red-600 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tổng phải thu</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{fmtVND(totalMust)}</div>
          <div className="text-xs text-gray-400 mt-1">{milestones.length} mốc</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Đã thu</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{fmtVND(totalPaid)}</div>
          <div className="text-xs text-green-500 mt-1">{totalMust > 0 ? Math.round(totalPaid / totalMust * 100) : 0}% kế hoạch</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="text-xs text-yellow-600 font-medium uppercase tracking-wide">Chờ thu</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">{fmtVND(totalPending)}</div>
          <div className="text-xs text-yellow-500 mt-1">Đã duyệt</div>
        </div>
        <div className={`rounded-xl border p-4 ${overdueList.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
          <div className={`text-xs font-medium uppercase tracking-wide ${overdueList.length > 0 ? "text-red-600" : "text-gray-400"}`}>Quá hạn</div>
          <div className={`text-2xl font-bold mt-1 ${overdueList.length > 0 ? "text-red-700" : "text-gray-400"}`}>
            {overdueList.length > 0 ? fmtVND(totalOverdue) : "—"}
          </div>
          <div className={`text-xs mt-1 ${overdueList.length > 0 ? "text-red-500" : "text-gray-400"}`}>
            {overdueList.length > 0 ? `${overdueList.length} mốc cần xử lý` : "Không có"}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        {[
          { key: "", label: "Tất cả", count: milestones.length },
          { key: "overdue", label: "Quá hạn", count: overdueList.length },
          { key: "approved", label: "Chờ thu", count: milestones.filter(m => m.status === "approved").length },
          { key: "pending_approval", label: "Chờ duyệt", count: milestones.filter(m => m.status === "pending_approval").length },
          { key: "paid", label: "Đã thu", count: milestones.filter(m => m.status === "paid").length },
          { key: "draft", label: "Nháp", count: milestones.filter(m => m.status === "draft").length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${filterStatus === f.key ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Mốc thanh toán</h2>
          <span className="text-xs text-gray-400">{filtered.length} mốc</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Dự án / KH</th>
              <th className="px-4 py-3 text-left">Đợt / Mốc</th>
              <th className="px-4 py-3 text-right">Phải thu</th>
              <th className="px-4 py-3 text-right">Đã thu</th>
              <th className="px-4 py-3 text-left">Đến hạn</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(m => {
              const project = mockProjects.find(p => p.id === m.project_id)
              const isOverdue = m.status === "overdue"
              const isCritical = isOverdue && (m.overdue_days ?? 0) > 60
              return (
                <tr key={m.id} className={`hover:bg-gray-50 transition ${isCritical ? "bg-red-50/40" : isOverdue ? "bg-orange-50/20" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="text-xs font-mono text-gray-600">{project?.project_code}</div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate">{project?.customer_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold inline-flex items-center justify-center shrink-0">
                        {m.milestone_order}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">{m.milestone_name}</div>
                        <div className="text-xs text-gray-400">{m.payment_percent}% HĐ</div>
                      </div>
                    </div>
                    {m.handover_confirmed && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                        <FileCheck className="w-2.5 h-2.5" />Đã bàn giao
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">{fmtVND(m.payment_amount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {m.paid_amount > 0 ? fmtVND(m.paid_amount) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-500 text-xs">{m.due_date}</div>
                    {isOverdue && (
                      <div className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${isCritical ? "text-red-600" : "text-orange-600"}`}>
                        <AlertTriangle className="w-3 h-3" />Quá {m.overdue_days} ngày
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[m.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {isOverdue && (
                        <button onClick={() => sendReminder(m.id)} title={m.reminder_sent ? "Đã gửi" : "Gửi nhắc nhở"}
                          className={`p-1.5 rounded-lg transition ${m.reminder_sent ? "text-green-500 bg-green-50" : "text-orange-500 hover:bg-orange-50"}`}>
                          {m.reminder_sent ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>
                      )}
                      {m.status === "approved" && (
                        <button onClick={() => setConfirmModal(m)}
                          className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />Thu tiền
                        </button>
                      )}
                      {m.status === "draft" && !m.handover_confirmed && (
                        <button onClick={() => setHandoverModal(m)}
                          className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />Bàn giao
                        </button>
                      )}
                      {m.status === "paid" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={2} className="px-5 py-3 font-semibold text-gray-700 text-sm">Tổng cộng</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtVND(totalMust)}</td>
              <td className="px-4 py-3 text-right font-bold text-green-600">{fmtVND(totalPaid)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Confirm payment modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Xác nhận đã thu tiền</h2>
              <p className="text-sm text-gray-500 mt-1">{confirmModal.milestone_name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-center">
              <div className="text-xs text-gray-500 mb-1">Số tiền xác nhận thu</div>
              <div className="text-2xl font-bold text-green-700">{fmtVND(confirmModal.payment_amount)}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={confirmPayment} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Handover modal ── */}
      {handoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />Biên bản bàn giao
              </h2>
              <button onClick={() => setHandoverModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-xs text-blue-600 font-medium mb-1">Mốc thanh toán</div>
                <div className="font-semibold text-blue-900">{handoverModal.milestone_name}</div>
                <div className="text-sm text-blue-700 mt-1">{fmtVND(handoverModal.payment_amount)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nội dung biên bản</label>
                <textarea rows={4} value={handoverNote} onChange={e => setHandoverNote(e.target.value)}
                  placeholder="Ghi chú tình trạng bàn giao, hạng mục hoàn thành, yêu cầu bảo hành..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-600" />
                Sau xác nhận, mốc này chuyển sang <strong>Chờ duyệt</strong> để kế toán thu tiền.
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setHandoverModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={confirmHandover}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                <FileCheck className="w-4 h-4" />Xác nhận bàn giao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
