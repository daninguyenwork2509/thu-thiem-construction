"use client"
import { useState } from "react"
import { useAuth } from "@/lib/auth-store"
import { mockProjects, mockLeads, mockVOs, mockMilestones, fmtVND } from "@/lib/mock-data"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  FolderKanban, Users, AlertCircle, Wallet, Plus, FileText,
  ArrowRight, BarChart3, Bell, DollarSign, Download, Calendar
} from "lucide-react"
import Link from "next/link"

// ── Mini revenue chart ────────────────────────────────────────────────────────
const REVENUE_DATA = [
  { month: "T4", value: 1.2 }, { month: "T5", value: 2.1 }, { month: "T6", value: 1.8 },
  { month: "T7", value: 3.4 }, { month: "T8", value: 2.9 }, { month: "T9", value: 4.1 },
  { month: "T10", value: 3.6 }, { month: "T11", value: 5.2 }, { month: "T12", value: 4.8 },
  { month: "T1", value: 6.3 }, { month: "T2", value: 5.9 }, { month: "T3", value: 7.4 },
]
const MAX_REV = Math.max(...REVENUE_DATA.map(d => d.value))

const MONTHLY_REVENUE = [
  { month: "T8/25", revenue: 1200, cost: 900 },  { month: "T9/25", revenue: 1500, cost: 1100 },
  { month: "T10/25", revenue: 980, cost: 720 },  { month: "T11/25", revenue: 2100, cost: 1550 },
  { month: "T12/25", revenue: 1750, cost: 1280 }, { month: "T1/26", revenue: 2300, cost: 1700 },
  { month: "T2/26", revenue: 1900, cost: 1400 },  { month: "T3/26", revenue: 2450, cost: 1800 },
]
const DEBT_LIST = [
  { project: "PRJ-2025-0001", customer: "Nguyễn Văn A", amount: 450_000_000, dueDate: "2026-02-15", overdueDays: 25, status: "overdue" },
  { project: "PRJ-2025-0002", customer: "Trần Thị B",   amount: 280_000_000, dueDate: "2026-03-05", overdueDays: 7,  status: "overdue" },
  { project: "PRJ-2025-0003", customer: "Lê Văn C",     amount: 620_000_000, dueDate: "2026-03-20", overdueDays: 0,  status: "upcoming" },
  { project: "PRJ-2025-0004", customer: "Phạm Thị D",   amount: 180_000_000, dueDate: "2026-04-01", overdueDays: 0,  status: "upcoming" },
  { project: "PRJ-2024-0008", customer: "Hoàng Văn E",  amount: 95_000_000,  dueDate: "2026-01-10", overdueDays: 61, status: "critical" },
]
const PROJECT_PROGRESS = [
  { project: "PRJ-2025-0001", name: "Biệt thự Q.9",         pm: "Trần Bình",    progress: 78, budget: 4_800_000_000, spent: 3_744_000_000, status: "on-track" },
  { project: "PRJ-2025-0002", name: "Căn hộ Vinhomes",      pm: "Lê Tuấn",      progress: 45, budget: 2_100_000_000, spent: 1_134_000_000, status: "on-track" },
  { project: "PRJ-2025-0003", name: "Văn phòng Q.1",        pm: "Trần Bình",    progress: 92, budget: 3_500_000_000, spent: 3_640_000_000, status: "over-budget" },
  { project: "PRJ-2024-0008", name: "Showroom Thủ Đức",     pm: "Nguyễn Phong", progress: 15, budget: 1_200_000_000, spent: 420_000_000,   status: "delayed" },
]
const VO_SUMMARY = [
  { project: "PRJ-2025-0001", voCount: 3, totalVoValue: 185_000_000, approved: 2, pending: 1, rejected: 0 },
  { project: "PRJ-2025-0002", voCount: 1, totalVoValue: 42_000_000,  approved: 1, pending: 0, rejected: 0 },
  { project: "PRJ-2025-0003", voCount: 5, totalVoValue: 380_000_000, approved: 3, pending: 1, rejected: 1 },
  { project: "PRJ-2024-0008", voCount: 2, totalVoValue: 67_000_000,  approved: 0, pending: 2, rejected: 0 },
]

const ACTIVITIES = [
  { icon: "✅", text: "Mốc thanh toán T3 — Villa Thảo Điền đã duyệt",         time: "2 giờ trước" },
  { icon: "📋", text: "VO #005 gửi KH xác nhận — thay đổi nội thất phòng ngủ", time: "5 giờ trước" },
  { icon: "⚠️", text: "Công nợ Penthouse Thủ Đức quá hạn 45 ngày",            time: "Hôm qua" },
  { icon: "👤", text: "Lead mới: Nguyễn Minh Khoa — Nhà phố Q7 ~2.8 tỷ",      time: "Hôm qua" },
  { icon: "🏗️", text: "Cập nhật tiến độ: Biệt thự Đà Lạt đạt 68%",           time: "2 ngày trước" },
]

const statusColor: Record<string, string> = {
  under_construction: "bg-blue-100 text-blue-700", legal_check: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700", draft: "bg-gray-100 text-gray-600", inspecting: "bg-purple-100 text-purple-700",
}
const statusLabel: Record<string, string> = {
  under_construction: "Đang thi công", legal_check: "Kiểm tra pháp lý",
  completed: "Hoàn thành", draft: "Nháp", inspecting: "Nghiệm thu",
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Chào buổi sáng"; if (h < 18) return "Chào buổi chiều"; return "Chào buổi tối"
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n)
const fmtB = (n: number) => n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + " tỷ" : (n / 1_000_000).toFixed(0) + " triệu"

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useAuth()
  const user = state.user
  const firstName = user?.fullName?.split(" ").pop() ?? "bạn"
  const [tab, setTab] = useState<"dashboard" | "reports">("dashboard")
  const [reportTab, setReportTab] = useState("overview")
  const [dateRange, setDateRange] = useState("ytd")

  const totalContracts    = mockProjects.reduce((s, p) => s + p.contract_value, 0)
  const totalPaid         = mockProjects.reduce((s, p) => s + p.total_paid, 0)
  const totalDebt         = mockProjects.reduce((s, p) => s + p.total_outstanding_debt, 0)
  const activeProjects    = mockProjects.filter(p => p.project_status === "under_construction").length
  const pendingVOs        = mockVOs.filter(v => v.status === "customer_pending").length
  const overdueMilestones = mockMilestones.filter(m => m.status === "approved").length
  const paidPct           = Math.round(totalPaid / totalContracts * 100)

  const totalRevenue = MONTHLY_REVENUE.reduce((s, r) => s + r.revenue, 0) * 1_000_000
  const totalCost    = MONTHLY_REVENUE.reduce((s, r) => s + r.cost, 0) * 1_000_000
  const totalProfit  = totalRevenue - totalCost
  const overdueDebt  = DEBT_LIST.filter(d => d.status !== "upcoming").reduce((s, d) => s + d.amount, 0)
  const maxMonthRevenue = Math.max(...MONTHLY_REVENUE.map(r => r.revenue))

  const REPORT_TABS = [
    { key: "overview",  label: "Tổng quan" },
    { key: "revenue",   label: "Doanh thu" },
    { key: "debt",      label: "Công nợ" },
    { key: "progress",  label: "Tiến độ" },
    { key: "vo",        label: "Báo cáo VO" },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Page header with tabs ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            {tab === "dashboard"
              ? <h1 className="text-lg font-bold text-gray-900">{greeting()}, {firstName}! 👋</h1>
              : <h1 className="text-lg font-bold text-gray-900">Báo cáo & Phân tích</h1>
            }
            <p className="text-xs text-gray-400 mt-0.5">
              {tab === "dashboard" ? "Tổng quan hoạt động · Tháng 3/2026" : "Tổng hợp tình hình kinh doanh và thi công"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tab === "dashboard" && (
              <Link href="/pipeline"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Lead mới
              </Link>
            )}
            {tab === "reports" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-transparent outline-none text-xs">
                    <option value="ytd">Năm nay (YTD)</option>
                    <option value="q1">Q1 2026</option>
                    <option value="q4">Q4 2025</option>
                    <option value="2025">Năm 2025</option>
                  </select>
                </div>
                <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white hover:bg-gray-50 transition">
                  <Download className="w-3.5 h-3.5" /> Xuất Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main tabs: Dashboard | Báo cáo */}
        <div className="flex gap-0 tab-bar">
          <button onClick={() => setTab("dashboard")}
            className={`tab-item flex items-center gap-1.5 ${tab === "dashboard" ? "active" : ""}`}>
            <Bell className="w-3.5 h-3.5" /> Tổng quan
          </button>
          <button onClick={() => setTab("reports")}
            className={`tab-item flex items-center gap-1.5 ${tab === "reports" ? "active" : ""}`}>
            <BarChart3 className="w-3.5 h-3.5" /> Báo cáo
          </button>
        </div>
      </div>

      {/* ── Dashboard Tab ── */}
      {tab === "dashboard" && (
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Tổng giá trị HĐ" value={fmtVND(totalContracts)}
              sub={`${activeProjects} dự án đang thi công`} trend={+8.4}
              icon={<BarChart3 className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" />
            <KpiCard label="Đã thu" value={fmtVND(totalPaid)}
              sub={`${paidPct}% giá trị hợp đồng`} trend={+5.2}
              icon={<CheckCircle className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" />
            <KpiCard label="Còn công nợ" value={fmtVND(totalDebt)}
              sub="Cần theo dõi thu hồi" trend={-3.1}
              icon={<AlertTriangle className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-50" />
            <KpiCard label="Chờ xử lý" value={`${pendingVOs} VO · ${overdueMilestones} Mốc`}
              sub="Cần duyệt ngay hôm nay" trend={null}
              icon={<Clock className="w-5 h-5 text-red-600" />} iconBg="bg-red-50"
              urgent={pendingVOs + overdueMilestones > 0} />
          </div>

          {/* Revenue Chart + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Doanh thu theo tháng</h3>
                  <p className="text-xs text-gray-400 mt-0.5">12 tháng gần nhất · tỷ đồng</p>
                </div>
                <button onClick={() => setTab("reports")} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {REVENUE_DATA.map((d, i) => {
                  const isRecent = i >= 9
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className={`w-full rounded-t-sm transition-all ${isRecent ? "bg-orange-500" : "bg-gray-200"} group-hover:opacity-80`}
                        style={{ height: `${(d.value / MAX_REV) * 100}%` }} title={`${d.month}: ${d.value} tỷ`} />
                      <span className={`text-[10px] ${isRecent ? "text-orange-600 font-semibold" : "text-gray-400"}`}>{d.month}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-orange-500 inline-block" /> 3 tháng gần nhất</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-gray-200 inline-block" /> Các tháng trước</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Thao tác nhanh</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction href="/pipeline"  icon={<FolderKanban className="w-5 h-5" />} label="Dự án"         color="bg-blue-50 text-blue-700 hover:bg-blue-100" />
                <QuickAction href="/pipeline"  icon={<Users className="w-5 h-5" />}        label="Lead Pipeline" color="bg-purple-50 text-purple-700 hover:bg-purple-100" />
                <QuickAction href="/pipeline"  icon={<FileText className="w-5 h-5" />}     label="Phát sinh VO"  color="bg-yellow-50 text-yellow-700 hover:bg-yellow-100" />
                <QuickAction href="/payment"   icon={<Wallet className="w-5 h-5" />}       label="Dòng tiền"     color="bg-green-50 text-green-700 hover:bg-green-100" />
              </div>
              {(pendingVOs > 0 || overdueMilestones > 0) && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
                    <Bell className="w-4 h-4" /> Cần xử lý ngay
                  </div>
                  {pendingVOs > 0 && (
                    <Link href="/pipeline" className="flex items-center justify-between text-xs text-red-600 hover:underline py-1">
                      <span>· {pendingVOs} VO chờ KH xác nhận</span><ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {overdueMilestones > 0 && (
                    <Link href="/payment" className="flex items-center justify-between text-xs text-red-600 hover:underline py-1">
                      <span>· {overdueMilestones} mốc chờ thu tiền</span><ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <FolderKanban className="w-4 h-4 text-orange-500" /> Dự án đang thực hiện
                </div>
                <Link href="/pipeline" className="text-sm text-orange-500 hover:underline flex items-center gap-1">Xem tất cả <ArrowRight className="w-3.5 h-3.5" /></Link>
              </div>
              <div className="divide-y divide-gray-50">
                {mockProjects.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/40 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                      {p.project_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors truncate">{p.project_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.project_code} · PM: {p.pm_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-700">{fmtVND(p.contract_value)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.project_status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[p.project_status] ?? p.project_status}
                      </span>
                    </div>
                    <div className="w-24 shrink-0">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>Tiến độ</span><span className="font-semibold text-gray-600">{p.progress_pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.progress_pct >= 80 ? "bg-green-500" : p.progress_pct >= 40 ? "bg-orange-500" : "bg-blue-400"}`}
                          style={{ width: `${p.progress_pct}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm"><Wallet className="w-4 h-4 text-green-500" />Mốc sắp đến hạn</div>
                  <Link href="/payment" className="text-xs text-orange-500 hover:underline">Xem →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {mockMilestones.filter(m => m.status !== "paid").slice(0, 3).map(m => (
                    <div key={m.id} className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800 truncate">{m.milestone_name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {m.due_date}</span>
                        <span className="text-xs font-bold text-orange-600">{fmtVND(m.payment_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm"><AlertCircle className="w-4 h-4 text-yellow-500" />VO chờ KH duyệt</div>
                  <Link href="/pipeline" className="text-xs text-orange-500 hover:underline">Xem →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {mockVOs.filter(v => v.status === "customer_pending").map(vo => (
                    <Link key={vo.id} href={`/vo/${vo.id}`} className="block px-4 py-3 hover:bg-gray-50">
                      <div className="font-medium text-sm text-gray-800 truncate">{vo.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-between">
                        <span>{vo.vo_code}</span><span className="font-semibold text-orange-600">{fmtVND(vo.selling_price_vat)}</span>
                      </div>
                    </Link>
                  ))}
                  {mockVOs.filter(v => v.status === "customer_pending").length === 0 && (
                    <div className="px-4 py-5 text-center text-sm text-gray-400">Không có VO nào chờ duyệt</div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm"><Users className="w-4 h-4 text-blue-500" />Lead mới nhất</div>
                  <Link href="/pipeline" className="text-xs text-orange-500 hover:underline">Xem →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {mockLeads.slice(0, 3).map(l => (
                    <div key={l.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{l.customer_name}
                            {l.is_duplicate_phone && <span className="ml-1.5 text-red-500 text-xs font-normal">⚠ SĐT trùng</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{l.source}</div>
                        </div>
                        <span className="text-xs font-bold text-gray-600 shrink-0">{fmtVND(l.estimated_budget ?? 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-800"><Bell className="w-4 h-4 text-orange-500" />Hoạt động gần đây</div>
              <Link href="/notifications" className="text-sm text-orange-500 hover:underline flex items-center gap-1">Tất cả <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="divide-y divide-gray-50">
              {ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                  <span className="text-lg leading-none mt-0.5">{a.icon}</span>
                  <p className="flex-1 text-sm text-gray-700">{a.text}</p>
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Reports Tab ── */}
      {tab === "reports" && (
        <div className="flex-1 overflow-auto p-6">
          {/* Report KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Tổng doanh thu", value: fmtB(totalRevenue), icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50",  change: "+18%", up: true },
              { label: "Tổng chi phí",   value: fmtB(totalCost),    icon: DollarSign,   color: "text-blue-600",   bg: "bg-blue-50",   change: "+12%", up: true },
              { label: "Lợi nhuận gộp",  value: fmtB(totalProfit),  icon: Wallet,       color: "text-orange-600", bg: "bg-orange-50", change: `${((totalProfit / totalRevenue) * 100).toFixed(0)}%`, up: true },
              { label: "Công nợ quá hạn",value: fmtB(overdueDebt),  icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50",    change: "3 dự án", up: false },
            ].map(({ label, value, icon: Icon, color, bg, change, up }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? "text-green-600" : "text-red-600"}`}>
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{change}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Report sub-tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit overflow-x-auto">
            {REPORT_TABS.map(t => (
              <button key={t.key} onClick={() => setReportTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${reportTab === t.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {reportTab === "overview" && (
            <div className="space-y-5">
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
                        <div className="flex-1 rounded-t-sm" style={{ backgroundColor: "#E87625", height: `${(r.revenue / maxMonthRevenue) * 100}%` }} />
                        <div className="flex-1 rounded-t-sm bg-blue-400" style={{ height: `${(r.cost / maxMonthRevenue) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-gray-400">{r.month}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Trạng thái dự án</h3>
                  <div className="space-y-2">
                    {[{ label: "Đúng tiến độ", count: 2, color: "bg-green-500", pct: 50 },
                      { label: "Vượt ngân sách", count: 1, color: "bg-orange-500", pct: 25 },
                      { label: "Chậm tiến độ", count: 1, color: "bg-red-500", pct: 25 }].map(({ label, count, color, pct }) => (
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
                    {[{ label: "Công nợ nghiêm trọng (>60 ngày)", value: DEBT_LIST.filter(d => d.status === "critical").reduce((s,d) => s+d.amount,0), color: "text-red-600" },
                      { label: "Công nợ quá hạn (7–60 ngày)", value: DEBT_LIST.filter(d => d.status === "overdue").reduce((s,d) => s+d.amount,0), color: "text-orange-600" },
                      { label: "Sắp đến hạn (< 30 ngày)", value: DEBT_LIST.filter(d => d.status === "upcoming").reduce((s,d) => s+d.amount,0), color: "text-blue-600" },
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

          {/* Revenue table */}
          {reportTab === "revenue" && (
            <div className="table-container">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h3 className="font-semibold text-gray-900">Doanh thu theo tháng</h3>
                <button className="text-xs text-orange-600 flex items-center gap-1 hover:underline"><Download className="w-3.5 h-3.5" />Excel</button>
              </div>
              <table>
                <thead><tr><th className="text-left">Tháng</th><th className="text-right">Doanh thu</th><th className="text-right">Chi phí</th><th className="text-right">Lợi nhuận</th><th className="text-right">Biên LN</th></tr></thead>
                <tbody>
                  {MONTHLY_REVENUE.map(r => {
                    const profit = r.revenue - r.cost
                    const margin = ((profit / r.revenue) * 100).toFixed(1)
                    return (
                      <tr key={r.month}>
                        <td className="font-medium">{r.month}</td>
                        <td className="text-right text-green-700 font-medium">{fmt(r.revenue * 1_000_000)} đ</td>
                        <td className="text-right text-gray-600">{fmt(r.cost * 1_000_000)} đ</td>
                        <td className="text-right text-orange-700 font-medium">{fmt(profit * 1_000_000)} đ</td>
                        <td className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(margin) >= 20 ? "bg-green-100 text-green-700" : parseFloat(margin) >= 15 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{margin}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td className="font-bold text-gray-900">Tổng cộng</td>
                    <td className="text-right font-bold text-green-700">{fmtB(totalRevenue)}</td>
                    <td className="text-right font-bold text-gray-700">{fmtB(totalCost)}</td>
                    <td className="text-right font-bold text-orange-700">{fmtB(totalProfit)}</td>
                    <td className="text-right"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{((totalProfit / totalRevenue) * 100).toFixed(1)}%</span></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Debt */}
          {reportTab === "debt" && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                {[{ label: "Nghiêm trọng", count: DEBT_LIST.filter(d => d.status === "critical").length, color: "bg-red-100 text-red-700" },
                  { label: "Quá hạn", count: DEBT_LIST.filter(d => d.status === "overdue").length, color: "bg-orange-100 text-orange-700" },
                  { label: "Sắp đến hạn", count: DEBT_LIST.filter(d => d.status === "upcoming").length, color: "bg-blue-100 text-blue-700" },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`px-4 py-2 rounded-lg text-sm font-medium ${color}`}>{label}: {count} dự án</div>
                ))}
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th className="text-left">Dự án</th><th className="text-left">Khách hàng</th><th className="text-right">Số tiền</th><th className="text-center">Đến hạn</th><th className="text-center">Tình trạng</th><th className="text-right">Thao tác</th></tr></thead>
                  <tbody>
                    {DEBT_LIST.map(d => (
                      <tr key={d.project}>
                        <td className="font-mono text-xs text-gray-600">{d.project}</td>
                        <td className="font-medium">{d.customer}</td>
                        <td className="text-right font-bold">{fmt(d.amount)} đ</td>
                        <td className="text-center text-xs text-gray-500">{d.dueDate}</td>
                        <td className="text-center">
                          {d.status === "critical" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Nghiêm trọng ({d.overdueDays}ng)</span>}
                          {d.status === "overdue"  && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Quá hạn ({d.overdueDays}ng)</span>}
                          {d.status === "upcoming" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sắp đến hạn</span>}
                        </td>
                        <td className="text-right"><button className="text-xs text-orange-600 hover:underline">Gửi nhắc</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress */}
          {reportTab === "progress" && (
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
                          {p.status === "on-track"    && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Đúng tiến độ</span>}
                          {p.status === "over-budget" && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Vượt ngân sách</span>}
                          {p.status === "delayed"     && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 flex items-center gap-1"><Clock className="w-3 h-3" />Chậm tiến độ</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">PM: {p.pm}</div>
                      </div>
                      <div className="text-right"><div className="text-lg font-bold text-orange-600">{p.progress}%</div><div className="text-xs text-gray-500">hoàn thành</div></div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Tiến độ thi công</span><span>{p.progress}%</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${p.progress}%`, backgroundColor: "#E87625" }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Ngân sách đã dùng</span><span className={isOverBudget ? "text-red-600 font-medium" : ""}>{budgetUsed}% ({fmtB(p.spent)} / {fmtB(p.budget)})</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${isOverBudget ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(parseFloat(budgetUsed), 100)}%` }} /></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VO Report */}
          {reportTab === "vo" && (
            <div className="table-container">
              <div className="px-5 py-4 border-b border-gray-100 bg-white"><h3 className="font-semibold text-gray-900">Tổng hợp phát sinh (VO) theo dự án</h3></div>
              <table>
                <thead><tr><th className="text-left">Dự án</th><th className="text-center">Số VO</th><th className="text-right">Tổng giá trị</th><th className="text-center">Đã duyệt</th><th className="text-center">Chờ duyệt</th><th className="text-center">Từ chối</th></tr></thead>
                <tbody>
                  {VO_SUMMARY.map(v => (
                    <tr key={v.project}>
                      <td className="font-mono text-xs text-gray-600">{v.project}</td>
                      <td className="text-center font-medium">{v.voCount}</td>
                      <td className="text-right font-medium text-orange-700">{fmt(v.totalVoValue)} đ</td>
                      <td className="text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{v.approved}</span></td>
                      <td className="text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{v.pending}</span></td>
                      <td className="text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{v.rejected}</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td className="font-bold">Tổng</td>
                    <td className="text-center font-bold">{VO_SUMMARY.reduce((s,v) => s+v.voCount, 0)}</td>
                    <td className="text-right font-bold text-orange-700">{fmt(VO_SUMMARY.reduce((s,v) => s+v.totalVoValue, 0))} đ</td>
                    <td className="text-center font-bold text-green-700">{VO_SUMMARY.reduce((s,v) => s+v.approved, 0)}</td>
                    <td className="text-center font-bold text-yellow-700">{VO_SUMMARY.reduce((s,v) => s+v.pending, 0)}</td>
                    <td className="text-center font-bold text-red-700">{VO_SUMMARY.reduce((s,v) => s+v.rejected, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon, iconBg, urgent }: {
  label: string; value: string; sub: string; trend: number | null
  icon: React.ReactNode; iconBg: string; urgent?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${urgent ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">{label}</p>
        <div className={`${iconBg} rounded-lg p-2 shrink-0`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">{sub}</p>
        {trend !== null && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-colors font-medium text-sm text-center ${color}`}>
      {icon}<span className="text-xs leading-tight">{label}</span>
    </Link>
  )
}
