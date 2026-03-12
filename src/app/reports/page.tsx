"use client"
import { useState } from "react"
import {
  BarChart3, TrendingUp, TrendingDown, AlertCircle,
  DollarSign, Wallet, Clock, CheckCircle,
  Download, Filter, Calendar
} from "lucide-react"

// ── Mock data ─────────────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: "T8/25", revenue: 1200, cost: 900 },
  { month: "T9/25", revenue: 1500, cost: 1100 },
  { month: "T10/25", revenue: 980, cost: 720 },
  { month: "T11/25", revenue: 2100, cost: 1550 },
  { month: "T12/25", revenue: 1750, cost: 1280 },
  { month: "T1/26", revenue: 2300, cost: 1700 },
  { month: "T2/26", revenue: 1900, cost: 1400 },
  { month: "T3/26", revenue: 2450, cost: 1800 },
]

const DEBT_LIST = [
  { project: "PRJ-2025-0001", customer: "Nguyễn Văn A", amount: 450_000_000, dueDate: "2026-02-15", overdueDays: 25, status: "overdue" },
  { project: "PRJ-2025-0002", customer: "Trần Thị B", amount: 280_000_000, dueDate: "2026-03-05", overdueDays: 7, status: "overdue" },
  { project: "PRJ-2025-0003", customer: "Lê Văn C", amount: 620_000_000, dueDate: "2026-03-20", overdueDays: 0, status: "upcoming" },
  { project: "PRJ-2025-0004", customer: "Phạm Thị D", amount: 180_000_000, dueDate: "2026-04-01", overdueDays: 0, status: "upcoming" },
  { project: "PRJ-2024-0008", customer: "Hoàng Văn E", amount: 95_000_000, dueDate: "2026-01-10", overdueDays: 61, status: "critical" },
]

const PROJECT_PROGRESS = [
  { project: "PRJ-2025-0001", name: "Biệt thự Q.9", pm: "Trần Bình", progress: 78, budget: 4_800_000_000, spent: 3_744_000_000, status: "on-track" },
  { project: "PRJ-2025-0002", name: "Căn hộ Vinhomes", pm: "Lê Tuấn", progress: 45, budget: 2_100_000_000, spent: 1_134_000_000, status: "on-track" },
  { project: "PRJ-2025-0003", name: "Văn phòng Q.1", pm: "Trần Bình", progress: 92, budget: 3_500_000_000, spent: 3_640_000_000, status: "over-budget" },
  { project: "PRJ-2024-0008", name: "Showroom Thủ Đức", pm: "Nguyễn Phong", progress: 15, budget: 1_200_000_000, spent: 420_000_000, status: "delayed" },
]

const VO_SUMMARY = [
  { project: "PRJ-2025-0001", voCount: 3, totalVoValue: 185_000_000, approved: 2, pending: 1, rejected: 0 },
  { project: "PRJ-2025-0002", voCount: 1, totalVoValue: 42_000_000, approved: 1, pending: 0, rejected: 0 },
  { project: "PRJ-2025-0003", voCount: 5, totalVoValue: 380_000_000, approved: 3, pending: 1, rejected: 1 },
  { project: "PRJ-2024-0008", voCount: 2, totalVoValue: 67_000_000, approved: 0, pending: 2, rejected: 0 },
]

const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n)
const fmtB = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ"
  return (n / 1_000_000).toFixed(0) + " triệu"
}

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "revenue", label: "Doanh thu" },
  { key: "debt", label: "Công nợ" },
  { key: "progress", label: "Tiến độ dự án" },
  { key: "vo", label: "Báo cáo VO" },
]

export default function ReportsPage() {
  const [tab, setTab] = useState("overview")
  const [dateRange, setDateRange] = useState("ytd")

  const totalRevenue = MONTHLY_REVENUE.reduce((s, r) => s + r.revenue, 0) * 1_000_000
  const totalCost = MONTHLY_REVENUE.reduce((s, r) => s + r.cost, 0) * 1_000_000
  const totalProfit = totalRevenue - totalCost
  const overdueDebt = DEBT_LIST.filter(d => d.status !== "upcoming").reduce((s, d) => s + d.amount, 0)
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(r => r.revenue))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Báo cáo & Phân tích
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng hợp tình hình kinh doanh và thi công</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 bg-white">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="bg-transparent outline-none text-sm">
              <option value="ytd">Năm nay (YTD)</option>
              <option value="q1">Q1 2026</option>
              <option value="q4">Q4 2025</option>
              <option value="2025">Năm 2025</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 bg-white hover:bg-gray-50 transition">
            <Download className="w-4 h-4" />Xuất Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Tổng doanh thu", value: fmtB(totalRevenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", change: "+18%", up: true },
          { label: "Tổng chi phí", value: fmtB(totalCost), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50", change: "+12%", up: true },
          { label: "Lợi nhuận gộp", value: fmtB(totalProfit), icon: Wallet, color: "text-orange-600", bg: "bg-orange-50", change: `${((totalProfit / totalRevenue) * 100).toFixed(0)}%`, up: true },
          { label: "Công nợ quá hạn", value: fmtB(overdueDebt), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", change: "3 dự án", up: false },
        ].map(({ label, value, icon: Icon, color, bg, change, up }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? "text-green-600" : "text-red-600"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${tab === t.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Revenue chart – simple bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Doanh thu vs Chi phí (triệu đồng)</h3>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: "#E87625" }} />Doanh thu</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400" />Chi phí</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-40">
              {MONTHLY_REVENUE.map(r => (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                    <div className="flex-1 rounded-t-sm transition-all"
                      style={{ backgroundColor: "#E87625", height: `${(r.revenue / maxRevenue) * 100}%` }} />
                    <div className="flex-1 rounded-t-sm bg-blue-400 transition-all"
                      style={{ height: `${(r.cost / maxRevenue) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-400">{r.month}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Project status summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Trạng thái dự án</h3>
              <div className="space-y-2">
                {[
                  { label: "Đúng tiến độ", count: 2, color: "bg-green-500", pct: 50 },
                  { label: "Vượt ngân sách", count: 1, color: "bg-orange-500", pct: 25 },
                  { label: "Chậm tiến độ", count: 1, color: "bg-red-500", pct: 25 },
                ].map(({ label, count, color, pct }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                    <div className="flex-1 text-sm text-gray-700">{label}</div>
                    <div className="text-sm font-semibold text-gray-900">{count} dự án</div>
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Tóm tắt công nợ</h3>
              <div className="space-y-3">
                {[
                  { label: "Công nợ nghiêm trọng (>60 ngày)", value: DEBT_LIST.filter(d => d.status === "critical").reduce((s, d) => s + d.amount, 0), color: "text-red-600" },
                  { label: "Công nợ quá hạn (7–60 ngày)", value: DEBT_LIST.filter(d => d.status === "overdue").reduce((s, d) => s + d.amount, 0), color: "text-orange-600" },
                  { label: "Sắp đến hạn (< 30 ngày)", value: DEBT_LIST.filter(d => d.status === "upcoming").reduce((s, d) => s + d.amount, 0), color: "text-blue-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{fmtB(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "revenue" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Doanh thu theo tháng</h3>
            <button className="text-xs text-orange-600 flex items-center gap-1 hover:underline">
              <Download className="w-3.5 h-3.5" />Excel
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Tháng</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">Doanh thu</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">Chi phí</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">Lợi nhuận</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">Biên lợi nhuận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MONTHLY_REVENUE.map(r => {
                const profit = r.revenue - r.cost
                const margin = ((profit / r.revenue) * 100).toFixed(1)
                return (
                  <tr key={r.month} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.month}</td>
                    <td className="px-5 py-3 text-right text-green-700 font-medium">{fmt(r.revenue * 1_000_000)} đ</td>
                    <td className="px-5 py-3 text-right text-gray-600">{fmt(r.cost * 1_000_000)} đ</td>
                    <td className="px-5 py-3 text-right text-orange-700 font-medium">{fmt(profit * 1_000_000)} đ</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(margin) >= 20 ? "bg-green-100 text-green-700" : parseFloat(margin) >= 15 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {margin}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-5 py-3 font-bold text-gray-900">Tổng cộng</td>
                <td className="px-5 py-3 text-right font-bold text-green-700">{fmtB(totalRevenue)}</td>
                <td className="px-5 py-3 text-right font-bold text-gray-700">{fmtB(totalCost)}</td>
                <td className="px-5 py-3 text-right font-bold text-orange-700">{fmtB(totalProfit)}</td>
                <td className="px-5 py-3 text-right">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    {((totalProfit / totalRevenue) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === "debt" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Nghiêm trọng", count: DEBT_LIST.filter(d => d.status === "critical").length, color: "bg-red-100 text-red-700" },
              { label: "Quá hạn", count: DEBT_LIST.filter(d => d.status === "overdue").length, color: "bg-orange-100 text-orange-700" },
              { label: "Sắp đến hạn", count: DEBT_LIST.filter(d => d.status === "upcoming").length, color: "bg-blue-100 text-blue-700" },
            ].map(({ label, count, color }) => (
              <div key={label} className={`px-4 py-2 rounded-lg text-sm font-medium ${color}`}>
                {label}: {count} dự án
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Dự án</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Khách hàng</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Số tiền</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày đến hạn</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Tình trạng</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DEBT_LIST.map(d => (
                  <tr key={d.project} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.project}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.customer}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(d.amount)} đ</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{d.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      {d.status === "critical" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">🔴 Nghiêm trọng ({d.overdueDays}ngày)</span>}
                      {d.status === "overdue" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">🟠 Quá hạn ({d.overdueDays}ngày)</span>}
                      {d.status === "upcoming" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">🔵 Sắp đến hạn</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-orange-600 hover:underline">Gửi nhắc</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-3">
          {PROJECT_PROGRESS.map(p => {
            const budgetUsed = ((p.spent / p.budget) * 100).toFixed(1)
            const isOverBudget = p.spent > p.budget
            return (
              <div key={p.project} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-500 font-mono">({p.project})</span>
                      {p.status === "on-track" && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Đúng tiến độ</span>}
                      {p.status === "over-budget" && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Vượt ngân sách</span>}
                      {p.status === "delayed" && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 flex items-center gap-1"><Clock className="w-3 h-3" />Chậm tiến độ</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">PM: {p.pm}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: "#E87625" }}>{p.progress}%</div>
                    <div className="text-xs text-gray-500">hoàn thành</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Tiến độ thi công</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${p.progress}%`, backgroundColor: "#E87625" }} />
                  </div>
                </div>
                {/* Budget bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Ngân sách đã dùng</span>
                    <span className={isOverBudget ? "text-red-600 font-medium" : ""}>{budgetUsed}% ({fmtB(p.spent)} / {fmtB(p.budget)})</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${isOverBudget ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(parseFloat(budgetUsed), 100)}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === "vo" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Tổng hợp phát sinh (VO) theo dự án</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Dự án</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Số VO</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Tổng giá trị</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Đã duyệt</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Chờ duyệt</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Từ chối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {VO_SUMMARY.map(v => (
                <tr key={v.project} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{v.project}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-900">{v.voCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-orange-700">{fmt(v.totalVoValue)} đ</td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{v.approved}</span></td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{v.pending}</span></td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{v.rejected}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-5 py-3 font-bold text-gray-900">Tổng</td>
                <td className="px-4 py-3 text-center font-bold">{VO_SUMMARY.reduce((s, v) => s + v.voCount, 0)}</td>
                <td className="px-4 py-3 text-right font-bold text-orange-700">{fmt(VO_SUMMARY.reduce((s, v) => s + v.totalVoValue, 0))} đ</td>
                <td className="px-4 py-3 text-center font-bold text-green-700">{VO_SUMMARY.reduce((s, v) => s + v.approved, 0)}</td>
                <td className="px-4 py-3 text-center font-bold text-yellow-700">{VO_SUMMARY.reduce((s, v) => s + v.pending, 0)}</td>
                <td className="px-4 py-3 text-center font-bold text-red-700">{VO_SUMMARY.reduce((s, v) => s + v.rejected, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
