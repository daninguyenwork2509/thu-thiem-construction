"use client"
import { useAuth } from "@/lib/auth-store"
import { fmtVND } from "@/lib/mock-data"
import { PIPELINE_ITEMS, PIPELINE_VOS } from "@/lib/project-data"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  FolderKanban, AlertCircle, Wallet, Plus, FileText,
  ArrowRight, BarChart3, Bell, DollarSign, Users,
  Activity, Package, HardHat, Target
} from "lucide-react"
import Link from "next/link"

// ── Sample data ───────────────────────────────────────────────────────────────
const MONTHLY = [
  { month: "T8/25",  revenue: 1200, cost: 900  },
  { month: "T9/25",  revenue: 1500, cost: 1100 },
  { month: "T10/25", revenue: 980,  cost: 720  },
  { month: "T11/25", revenue: 2100, cost: 1550 },
  { month: "T12/25", revenue: 1750, cost: 1280 },
  { month: "T1/26",  revenue: 2300, cost: 1700 },
  { month: "T2/26",  revenue: 1900, cost: 1400 },
  { month: "T3/26",  revenue: 2450, cost: 1800 },
]

const DEBT_LIST = [
  { project: "Biệt thự Q.9",        customer: "Nguyễn Văn A", amount: 450_000_000, dueDate: "15/02/2026", overdueDays: 25, status: "overdue" },
  { project: "Căn hộ Vinhomes",     customer: "Trần Thị B",   amount: 280_000_000, dueDate: "05/03/2026", overdueDays: 7,  status: "overdue" },
  { project: "Văn phòng Q.1",       customer: "Lê Văn C",     amount: 620_000_000, dueDate: "20/03/2026", overdueDays: 0,  status: "upcoming" },
  { project: "Nhà phố Bình Thạnh",  customer: "Phạm Thị D",   amount: 180_000_000, dueDate: "01/04/2026", overdueDays: 0,  status: "upcoming" },
  { project: "Showroom Thủ Đức",    customer: "Hoàng Văn E",  amount: 95_000_000,  dueDate: "10/01/2026", overdueDays: 61, status: "critical" },
]

const PROJECT_STATUS = [
  { label: "Đúng tiến độ",  count: 4, pct: 57, color: "bg-green-500",  text: "text-green-600",  badge: "bg-green-100 text-green-700" },
  { label: "Vượt ngân sách",count: 1, pct: 14, color: "bg-orange-500", text: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
  { label: "Chậm tiến độ",  count: 2, pct: 29, color: "bg-red-500",    text: "text-red-600",    badge: "bg-red-100 text-red-700" },
]

const TOP_PROJECTS = [
  { name: "Villa Thảo Điền – Q.2",       code: "PRJ-2025-004", pm: "Lê Minh Tuấn",  budget: 3_500_000_000, spent: 1_120_000_000, progress: 32, status: "delayed",     paid: 45 },
  { name: "Nhà phố Bình Thạnh – Q.BT",   code: "PRJ-2025-005", pm: "Trần Thị Bình", budget: 1_800_000_000, spent: 1_278_000_000, progress: 71, status: "on-track",    paid: 70 },
  { name: "Căn hộ Mỹ Khánh – PMH",       code: "PRJ-2025-001", pm: "Trần Thị Bình", budget: 820_000_000,   spent: 393_600_000,   progress: 48, status: "on-track",    paid: 50 },
  { name: "Văn phòng Landmark 81",        code: "PRJ-2026-002", pm: "Lê Minh Tuấn",  budget: 1_500_000_000, spent: 75_000_000,    progress: 5,  status: "on-track",    paid: 10 },
  { name: "Shophouse Ecopark – HY",       code: "PRJ-2025-007", pm: "Hoàng Lan Anh", budget: 2_100_000_000, spent: 1_953_000_000, progress: 93, status: "over-budget", paid: 85 },
]

const LEAD_FUNNEL = [
  { stage: "Khách hàng tiếp cận", count: 24, value: 38_400_000_000, color: "bg-blue-500",   w: "w-full" },
  { stage: "Thiết kế & Dự toán",  count: 12, value: 24_200_000_000, color: "bg-purple-500", w: "w-5/6" },
  { stage: "Chốt hợp đồng",       count: 7,  value: 15_800_000_000, color: "bg-amber-500",  w: "w-4/6" },
  { stage: "Đang thi công",       count: 7,  value: 12_100_000_000, color: "bg-orange-500", w: "w-3/6" },
  { stage: "Thanh toán & B/G",    count: 4,  value: 6_400_000_000,  color: "bg-green-500",  w: "w-2/6" },
]

const CONTRACTOR_PERF = [
  { name: "Cty XD Tiến Phát",    type: "Nhà thầu xây dựng", projects: 3, rating: 92, onTime: true  },
  { name: "Cty Điện Quang Minh", type: "Điện – Cơ điện",    projects: 5, rating: 88, onTime: true  },
  { name: "Nội thất Á Đông",     type: "Nội thất",           projects: 2, rating: 75, onTime: false },
  { name: "Cty Nước Phú Hưng",   type: "Cơ điện lạnh",      projects: 4, rating: 95, onTime: true  },
]

const ACTIVITIES = [
  { icon: "✅", text: "Mốc thanh toán T3 — Villa Thảo Điền đã được duyệt",        time: "2 giờ trước",   type: "success" },
  { icon: "📋", text: "VO #007 gửi KH xác nhận — thêm phòng họp Landmark 81",    time: "4 giờ trước",   type: "info" },
  { icon: "⚠️", text: "Công nợ Showroom Thủ Đức quá hạn 61 ngày — cần xử lý",   time: "Hôm qua",       type: "warning" },
  { icon: "👤", text: "Lead mới: Nguyễn Minh Khoa — Nhà phố Q.7 ~2.8 tỷ",        time: "Hôm qua",       type: "lead" },
  { icon: "🏗️", text: "Cập nhật tiến độ: Shophouse Ecopark đạt 93% — sắp bàn giao", time: "2 ngày trước", type: "update" },
  { icon: "📦", text: "Đơn hàng vật tư Cty Thép Miền Nam — 185 tấn thép D12",     time: "2 ngày trước",  type: "purchase" },
  { icon: "🔍", text: "QA checklist tầng 8 — Căn hộ Mỹ Khánh: 18/20 hạng mục OK", time: "3 ngày trước", type: "qa" },
  { icon: "💰", text: "Thu tiền đợt 4/5 — Shophouse Ecopark: 420 triệu",          time: "4 ngày trước",  type: "payment" },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Chào buổi sáng"; if (h < 18) return "Chào buổi chiều"; return "Chào buổi tối"
}
const fmtB = (n: number) => n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + " tỷ" : (n / 1_000_000).toFixed(0) + " tr"

const statusInfo: Record<string, { label: string; color: string }> = {
  "on-track":    { label: "Đúng tiến độ",   color: "bg-green-100 text-green-700" },
  "over-budget": { label: "Vượt ngân sách", color: "bg-orange-100 text-orange-700" },
  "delayed":     { label: "Chậm tiến độ",   color: "bg-red-100 text-red-600" },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useAuth()
  const firstName = state.user?.fullName?.split(" ").pop() ?? "bạn"

  const projects       = PIPELINE_ITEMS.filter(p => p.type === "project")
  const totalContracts = projects.filter(p => ["construction","payment","handover"].includes(p.stage)).reduce((s, p) => s + p.value, 0)
  const totalPaid      = projects.reduce((s, p) => s + (p.totalPaid ?? 0), 0)
  const totalDebt      = projects.reduce((s, p) => s + (p.totalDebt ?? 0), 0)
  const pendingVOs     = PIPELINE_VOS.filter(v => v.status === "pending").length
  const upcomingMilestones = 2 // Đợt 3 + Đợt 4 của PRJ-2025-001 chưa thu
  const totalRevenue   = MONTHLY.reduce((s, r) => s + r.revenue, 0) * 1_000_000
  const totalCost      = MONTHLY.reduce((s, r) => s + r.cost, 0) * 1_000_000
  const grossProfit    = totalRevenue - totalCost
  const margin         = ((grossProfit / totalRevenue) * 100).toFixed(1)
  const overdueDebt    = DEBT_LIST.filter(d => d.status !== "upcoming").reduce((s, d) => s + d.amount, 0)
  const maxRev         = Math.max(...MONTHLY.map(r => r.revenue))

  return (
    <div className="overflow-auto h-full bg-gray-50">
      <div className="p-6 space-y-5 max-w-[1400px]">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{greeting()}, {firstName}! 👋</h1>
            <p className="text-sm text-gray-400 mt-0.5">Tổng quan hoạt động · Tháng 3/2026</p>
          </div>
          <div className="flex gap-2">
            <Link href="/pipeline"
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Lead mới
            </Link>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: "Tổng giá trị HĐ", value: fmtB(totalContracts), sub: `${projects.length} dự án`, icon: BarChart3,    iconColor: "text-blue-600",   bg: "bg-blue-50",   trend: +8.4 },
            { label: "Đã thu",           value: fmtB(totalPaid),      sub: `${Math.round(totalPaid/totalContracts*100)}% HĐ`, icon: CheckCircle, iconColor: "text-green-600",  bg: "bg-green-50",  trend: +5.2 },
            { label: "Doanh thu YTD",    value: fmtB(totalRevenue),   sub: "8 tháng gần nhất",            icon: TrendingUp,   iconColor: "text-teal-600",   bg: "bg-teal-50",   trend: +18 },
            { label: "Lợi nhuận gộp",   value: fmtB(grossProfit),    sub: `Biên ${margin}%`,             icon: DollarSign,   iconColor: "text-purple-600", bg: "bg-purple-50", trend: null },
            { label: "Công nợ",          value: fmtB(totalDebt),      sub: `${fmtB(overdueDebt)} quá hạn`, icon: AlertTriangle,iconColor: "text-orange-600", bg: "bg-orange-50", trend: -3.1 },
            { label: "Chờ xử lý",       value: `${pendingVOs} VO`,   sub: `${upcomingMilestones} mốc TT`, icon: Clock,        iconColor: "text-red-600",    bg: "bg-red-50",    trend: null, urgent: pendingVOs > 0 },
          ].map(k => (
            <div key={k.label} className={`bg-white rounded-xl border p-4 shadow-sm ${k.urgent ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`${k.bg} rounded-lg p-1.5`}><k.icon className={`w-4 h-4 ${k.iconColor}`} /></div>
                {k.trend !== null ? (
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${k.trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {k.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {k.trend >= 0 ? "+" : ""}{k.trend}%
                  </span>
                ) : null}
              </div>
              <div className="text-lg font-bold text-gray-900 leading-tight">{k.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
              <div className="text-[10px] text-gray-300 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Revenue Chart + Lead Funnel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Revenue vs Cost chart */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Doanh thu vs Chi phí</h3>
                <p className="text-xs text-gray-400 mt-0.5">8 tháng gần nhất · triệu đồng</p>
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: "#E87625" }} />Doanh thu</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-blue-400 inline-block" />Chi phí</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-green-400 inline-block" />Lợi nhuận</span>
              </div>
            </div>
            <div className="flex items-end gap-2" style={{ height: "140px" }}>
              {MONTHLY.map(r => {
                const profit = r.revenue - r.cost
                return (
                  <div key={r.month} className="flex-1 flex flex-col items-center gap-0.5 group">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: "115px" }}>
                      <div className="flex-1 rounded-t" style={{ backgroundColor: "#E87625", height: `${(r.revenue / maxRev) * 100}%` }}
                        title={`DT: ${r.revenue}tr`} />
                      <div className="flex-1 rounded-t bg-blue-400" style={{ height: `${(r.cost / maxRev) * 100}%` }}
                        title={`CP: ${r.cost}tr`} />
                      <div className="flex-1 rounded-t bg-green-400" style={{ height: `${(profit / maxRev) * 100}%` }}
                        title={`LN: ${profit}tr`} />
                    </div>
                    <div className="text-[10px] text-gray-400">{r.month}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div><div className="text-sm font-bold text-orange-600">{fmtB(totalRevenue)}</div><div className="text-[10px] text-gray-400">Doanh thu</div></div>
              <div><div className="text-sm font-bold text-blue-600">{fmtB(totalCost)}</div><div className="text-[10px] text-gray-400">Chi phí</div></div>
              <div><div className="text-sm font-bold text-green-600">{fmtB(grossProfit)}</div><div className="text-[10px] text-gray-400">Lợi nhuận ({margin}%)</div></div>
            </div>
          </div>

          {/* Lead Funnel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Phễu chuyển đổi</h3>
                <p className="text-xs text-gray-400 mt-0.5">Lead → Dự án · YTD</p>
              </div>
              <Link href="/pipeline" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                Chi tiết <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {LEAD_FUNNEL.map((f, i) => (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{f.stage}</span>
                    <span className="text-gray-500">{f.count} · {fmtB(f.value)}</span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div className={`h-full ${f.color} rounded-lg flex items-center px-2 ${f.w} transition-all`}>
                      <span className="text-[10px] text-white font-semibold">{f.count}</span>
                    </div>
                  </div>
                  {i < LEAD_FUNNEL.length - 1 && (
                    <div className="text-[10px] text-gray-300 text-right pr-2">
                      ↓ {Math.round(LEAD_FUNNEL[i+1].count / f.count * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Project List + Project Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Project list */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">Dự án đang thực hiện</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{TOP_PROJECTS.length}</span>
              </div>
              <Link href="/pipeline" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {TOP_PROJECTS.map(p => {
                const st = statusInfo[p.status]
                const isOverBudget = p.spent > p.budget
                return (
                  <div key={p.code} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">{p.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.code} · PM: {p.pm}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-orange-600">{fmtB(p.budget)}</div>
                        <div className={`text-xs ${isOverBudget ? "text-red-500" : "text-gray-400"}`}>
                          Chi: {fmtB(p.spent)}{isOverBudget ? " ⚠" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Tiến độ</span><span className="font-semibold text-orange-500">{p.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${p.progress}%`, background: p.progress >= 80 ? "#22c55e" : "#E87625" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Thanh toán</span><span className="font-semibold text-blue-500">{p.paid}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${p.paid}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel: project status + quick actions */}
          <div className="space-y-4">
            {/* Project status */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> Tình trạng dự án
              </h3>
              <div className="space-y-3">
                {PROJECT_STATUS.map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className={`font-bold ${s.text}`}>{s.count} dự án</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 text-center gap-2">
                {PROJECT_STATUS.map(s => (
                  <div key={s.label}>
                    <div className={`text-lg font-bold ${s.text}`}>{s.count}</div>
                    <div className="text-[10px] text-gray-400 leading-tight">{s.label.split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Thao tác nhanh</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/pipeline",    icon: FolderKanban, label: "Quản lý dự án", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                  { href: "/pipeline",    icon: Users,        label: "Lead Pipeline", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                  { href: "/pipeline",    icon: FileText,     label: "Phát sinh VO",  color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" },
                  { href: "/payment",     icon: Wallet,       label: "Dòng tiền",     color: "bg-green-50 text-green-700 hover:bg-green-100" },
                  { href: "/qa",         icon: CheckCircle,  label: "QA Checklist",  color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
                  { href: "/files",      icon: Activity,     label: "Tài liệu",      color: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link key={label} href={href}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${color}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 4: Debt + Milestones + VO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Debt table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">Công nợ cần theo dõi</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                  {DEBT_LIST.filter(d => d.status !== "upcoming").length} quá hạn
                </span>
              </div>
              <Link href="/payment" className="text-xs text-orange-500 hover:underline">Xem →</Link>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5 border-b border-gray-50">Dự án / KH</th>
                  <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 border-b border-gray-50">Số tiền</th>
                  <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 border-b border-gray-50">Trạng thái</th>
                  <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 border-b border-gray-50">Đến hạn</th>
                </tr>
              </thead>
              <tbody>
                {DEBT_LIST.map(d => (
                  <tr key={d.project} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-900">{d.project}</div>
                      <div className="text-xs text-gray-400">{d.customer}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">{fmtB(d.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      {d.status === "critical" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Nghiêm trọng {d.overdueDays}ng</span>}
                      {d.status === "overdue"  && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Quá hạn {d.overdueDays}ng</span>}
                      {d.status === "upcoming" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sắp đến hạn</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">{d.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: Upcoming milestones + VO */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Wallet className="w-4 h-4 text-green-500" /> Mốc thanh toán
                </div>
                <Link href="/payment" className="text-xs text-orange-500 hover:underline">Xem →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { id: "m3", milestone_name: "Đợt 3 – Hoàn thiện nội thất (PRJ-2025-001)", due_date: "15/04/2025", payment_amount: 164_000_000 },
                  { id: "m4", milestone_name: "Đợt 4 – Bàn giao (PRJ-2025-001)",            due_date: "31/05/2025", payment_amount: 164_000_000 },
                ].map(m => (
                  <div key={m.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-800 truncate">{m.milestone_name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{m.due_date}</span>
                      <span className="text-xs font-bold text-orange-600">{fmtVND(m.payment_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <AlertCircle className="w-4 h-4 text-yellow-500" /> VO chờ duyệt
                </div>
                <Link href="/pipeline" className="text-xs text-orange-500 hover:underline">Xem →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {PIPELINE_VOS.filter(v => v.status === "pending").map(vo => (
                  <Link key={vo.id} href={`/pipeline`} className="block px-4 py-3 hover:bg-gray-50">
                    <div className="font-medium text-sm text-gray-800 truncate">{vo.title}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-gray-400">{vo.projectName}</span>
                      <span className="text-xs font-bold text-orange-600">{fmtVND(vo.amount)}</span>
                    </div>
                  </Link>
                ))}
                {PIPELINE_VOS.filter(v => v.status === "pending").length === 0 && (
                  <div className="px-4 py-5 text-center text-sm text-gray-400">Không có VO nào chờ duyệt</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 5: Contractor Performance + Activity Feed ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Contractor performance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-800 text-sm">Nhà thầu hoạt động</span>
            </div>
            <div className="divide-y divide-gray-50">
              {CONTRACTOR_PERF.map(c => (
                <div key={c.name} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.type} · {c.projects} dự án</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${c.rating >= 90 ? "text-green-600" : c.rating >= 80 ? "text-orange-600" : "text-red-500"}`}>
                        {c.rating}%
                      </div>
                      <div className={`text-[10px] font-medium ${c.onTime ? "text-green-500" : "text-red-500"}`}>
                        {c.onTime ? "✓ Đúng tiến độ" : "⚠ Trễ hạn"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.rating >= 90 ? "bg-green-500" : c.rating >= 80 ? "bg-orange-500" : "bg-red-400"}`}
                      style={{ width: `${c.rating}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vật tư summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-800 text-sm">Vật tư & Mua sắm</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { label: "Đơn hàng đang xử lý", value: 8,   color: "text-blue-600",   bg: "bg-blue-50" },
                { label: "Chờ nhận hàng",        value: 3,   color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Hoàn thành tháng này", value: 14,  color: "text-green-600",  bg: "bg-green-50" },
                { label: "Vượt ngân sách",       value: 1,   color: "text-red-600",    bg: "bg-red-50" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-base font-bold ${item.color} ${item.bg} px-2.5 py-0.5 rounded-lg`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4">
              <Link href="/materials"
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors font-medium">
                Xem vật tư <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">Hoạt động gần đây</span>
              </div>
              <Link href="/notifications" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                Tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                  <span className="text-base leading-none mt-0.5 shrink-0">{a.icon}</span>
                  <p className="flex-1 text-xs text-gray-700 leading-relaxed">{a.text}</p>
                  <span className="text-[10px] text-gray-300 shrink-0 mt-0.5 whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
