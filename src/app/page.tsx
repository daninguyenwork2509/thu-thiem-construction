"use client"
import { useAuth } from "@/lib/auth-store"
import { PIPELINE_ITEMS, PIPELINE_VOS, fmtVND } from "@/lib/project-data"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  FolderKanban, AlertCircle, Wallet, Plus, FileText,
  ArrowRight, BarChart3, Bell, DollarSign, Users,
  Activity, Package, HardHat, Target
} from "lucide-react"
import Link from "next/link"

// ── Historical revenue (không liên quan project-specific, giữ nguyên) ─────────
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

// ── Data từ 3 dự án thực tế ───────────────────────────────────────────────────

// Công nợ: 2 đợt chưa thu của PRJ-2025-001
type DebtStatus = "upcoming" | "overdue" | "critical"
const DEBT_LIST: { project: string; customer: string; amount: number; dueDate: string; overdueDays: number; status: DebtStatus }[] = [
  { project: "Vinhomes Central Park – T12", customer: "Chị Lan Anh", amount: 164_000_000, dueDate: "15/04/2026", overdueDays: 0, status: "upcoming" },
  { project: "Vinhomes Central Park – T12", customer: "Chị Lan Anh", amount: 164_000_000, dueDate: "31/05/2026", overdueDays: 0, status: "upcoming" },
]

// Nhà thầu: thực tế từ PRJ-2025-001
const CONTRACTOR_PERF = [
  { name: "Đội thợ Minh Phúc",     type: "Phần thô",   projects: 1, rating: 90, onTime: true  },
  { name: "Cty Điện Hoàng Long",   type: "Điện – M&E", projects: 1, rating: 85, onTime: true  },
  { name: "Đội Nội Thất An Khang", type: "Nội thất",   projects: 1, rating: 65, onTime: false },
]

// Hoạt động gần đây: từ 3 dự án thực
const ACTIVITIES = [
  { icon: "⚠️", text: "Nội thất An Khang trễ 5 ngày – PRJ-2025-001, cần đốc thúc ngay",   time: "Hôm nay",      type: "warning" },
  { icon: "📋", text: "VO-001: Bổ sung điểm điện phòng làm việc – đang chờ KH xác nhận",   time: "2 giờ trước",  type: "info" },
  { icon: "📋", text: "VO-002: Thay đổi vật liệu sàn phòng ngủ – đang chờ KH xác nhận",    time: "4 giờ trước",  type: "info" },
  { icon: "🔍", text: "KS Nguyễn Thu Hà đang lên bản vẽ VP FPT – dự kiến gửi KH 30/03",   time: "Hôm qua",      type: "update" },
  { icon: "💬", text: "Báo giá Ecopark đã gửi 18/03 – chưa có phản hồi từ Cty Đại Phát",  time: "2 ngày trước", type: "warning" },
  { icon: "✅", text: "Đội Minh Phúc: phần thô đạt 80% – PRJ-2025-001 đúng kế hoạch",      time: "3 ngày trước", type: "success" },
  { icon: "💰", text: "Thu đợt 2/4 – PRJ-2025-001: 164 triệu từ Chị Lan Anh",              time: "4 ngày trước", type: "payment" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
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

  // ── KPIs từ 3 dự án thực ─────────────────────────────────────────────────
  const signedProjects  = PIPELINE_ITEMS.filter(p => ["construction","payment","handover"].includes(p.stage))
  const totalContracts  = signedProjects.reduce((s, p) => s + p.value, 0)          // 820tr
  const totalPaid       = PIPELINE_ITEMS.reduce((s, p) => s + (p.totalPaid ?? 0), 0) // 492tr
  const totalDebt       = PIPELINE_ITEMS.reduce((s, p) => s + (p.totalDebt ?? 0), 0) // 328tr
  const pendingVOs      = PIPELINE_VOS.filter(v => v.status === "pending").length    // 3
  const upcomingMilestones = DEBT_LIST.length                                        // 2

  // ── Chart ─────────────────────────────────────────────────────────────────
  const totalRevenue = MONTHLY.reduce((s, r) => s + r.revenue, 0) * 1_000_000
  const totalCost    = MONTHLY.reduce((s, r) => s + r.cost, 0) * 1_000_000
  const grossProfit  = totalRevenue - totalCost
  const margin       = ((grossProfit / totalRevenue) * 100).toFixed(1)
  const maxRev       = Math.max(...MONTHLY.map(r => r.revenue))

  // ── Dự án đang thực hiện (từ PIPELINE_ITEMS) ─────────────────────────────
  const TOP_PROJECTS = PIPELINE_ITEMS.map(p => ({
    name:     p.name,
    code:     p.id,
    pm:       p.pm ?? p.responsible,
    budget:   p.value,
    spent:    p.totalPaid ?? 0,
    progress: p.progress ?? 0,
    status:   p.tags?.some(t => t.toLowerCase().includes("trễ")) ? "delayed"
            : "on-track",
    paid: p.value > 0 ? Math.round(((p.totalPaid ?? 0) / p.value) * 100) : 0,
  }))

  // ── Tình trạng dự án (tính động) ─────────────────────────────────────────
  const delayedCount  = PIPELINE_ITEMS.filter(p => p.tags?.some(t => t.toLowerCase().includes("trễ"))).length
  const onTrackCount  = PIPELINE_ITEMS.length - delayedCount
  const total         = PIPELINE_ITEMS.length
  const PROJECT_STATUS = [
    { label: "Đúng tiến độ",  count: onTrackCount, pct: Math.round(onTrackCount / total * 100),  color: "bg-green-500",  text: "text-green-600",  badge: "bg-green-100 text-green-700" },
    { label: "Chậm tiến độ",  count: delayedCount,  pct: Math.round(delayedCount  / total * 100), color: "bg-red-500",    text: "text-red-600",    badge: "bg-red-100 text-red-700" },
    { label: "Vượt ngân sách",count: 0,              pct: 0,                                       color: "bg-orange-500", text: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
  ]

  // ── Phễu chuyển đổi (tính động từ PIPELINE_ITEMS) ────────────────────────
  const funnelStages = [
    { stage: "Khách hàng tiếp cận", key: ["lead"],                        color: "bg-blue-500"   },
    { stage: "Thiết kế & Dự toán",  key: ["design"],                      color: "bg-purple-500" },
    { stage: "Chốt hợp đồng",       key: ["contract"],                    color: "bg-amber-500"  },
    { stage: "Đang thi công",        key: ["construction"],                color: "bg-orange-500" },
    { stage: "Thanh toán & B/G",     key: ["payment", "handover"],         color: "bg-green-500"  },
  ]
  const maxFunnelCount = Math.max(1, ...funnelStages.map(f =>
    PIPELINE_ITEMS.filter(p => (f.key as string[]).includes(p.stage)).length
  ))
  const LEAD_FUNNEL = funnelStages.map(f => {
    const items  = PIPELINE_ITEMS.filter(p => (f.key as string[]).includes(p.stage))
    const count  = items.length
    const value  = items.reduce((s, p) => s + p.value, 0)
    const widthPct = Math.round((count / maxFunnelCount) * 100)
    return { stage: f.stage, count, value, color: f.color, widthPct }
  })

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
            { label: "Tổng giá trị HĐ", value: fmtB(totalContracts), sub: `${signedProjects.length} dự án đã ký`,  icon: BarChart3,    iconColor: "text-blue-600",   bg: "bg-blue-50",   trend: null },
            { label: "Đã thu",           value: fmtB(totalPaid),      sub: totalContracts > 0 ? `${Math.round(totalPaid/totalContracts*100)}% HĐ` : "—", icon: CheckCircle, iconColor: "text-green-600", bg: "bg-green-50", trend: null },
            { label: "Doanh thu YTD",    value: fmtB(totalRevenue),   sub: "8 tháng gần nhất",            icon: TrendingUp,   iconColor: "text-teal-600",   bg: "bg-teal-50",   trend: +18 },
            { label: "Lợi nhuận gộp",   value: fmtB(grossProfit),    sub: `Biên ${margin}%`,             icon: DollarSign,   iconColor: "text-purple-600", bg: "bg-purple-50", trend: null },
            { label: "Công nợ",          value: fmtB(totalDebt),      sub: `${DEBT_LIST.length} đợt chưa thu`, icon: AlertTriangle, iconColor: "text-orange-600", bg: "bg-orange-50", trend: null },
            { label: "Chờ xử lý",       value: `${pendingVOs} VO`,   sub: `${upcomingMilestones} mốc TT`, icon: Clock,       iconColor: "text-red-600",    bg: "bg-red-50",    trend: null, urgent: pendingVOs > 0 },
          ].map(k => (
            <div key={k.label} className={`bg-white rounded-xl border p-4 shadow-sm ${k.urgent ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`${k.bg} rounded-lg p-1.5`}><k.icon className={`w-4 h-4 ${k.iconColor}`} /></div>
                {k.trend !== null && k.trend !== undefined ? (
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
                <p className="text-xs text-gray-400 mt-0.5">{PIPELINE_ITEMS.length} dự án · hiện tại</p>
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
                    <div className={`h-full ${f.color} rounded-lg flex items-center px-2 transition-all`}
                      style={{ width: f.count > 0 ? `${f.widthPct}%` : "0%" }}>
                      {f.count > 0 && <span className="text-[10px] text-white font-semibold">{f.count}</span>}
                    </div>
                  </div>
                  {i < LEAD_FUNNEL.length - 1 && LEAD_FUNNEL[i].count > 0 && LEAD_FUNNEL[i+1].count > 0 && (
                    <div className="text-[10px] text-gray-300 text-right pr-2">
                      ↓ {Math.round(LEAD_FUNNEL[i+1].count / LEAD_FUNNEL[i].count * 100)}%
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
                const st = statusInfo[p.status] ?? statusInfo["on-track"]
                const isOverBudget = p.spent > p.budget && p.budget > 0
                return (
                  <Link key={p.code} href={`/projects/${p.code}`} className="block px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
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
                          Đã thu: {fmtB(p.spent)}{isOverBudget ? " ⚠" : ""}
                        </div>
                      </div>
                    </div>
                    {p.progress > 0 && (
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
                    )}
                  </Link>
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
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                  {DEBT_LIST.length} đợt
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
                {DEBT_LIST.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
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
                {DEBT_LIST.map((m, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      Đợt {i + 3} – {i === 0 ? "Hoàn thiện nội thất" : "Bàn giao"} · PRJ-2025-001
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{m.dueDate}</span>
                      <span className="text-xs font-bold text-orange-600">{fmtVND(m.amount)}</span>
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
                  <Link key={vo.id} href="/pipeline" className="block px-4 py-3 hover:bg-gray-50">
                    <div className="font-medium text-sm text-gray-800 truncate">{vo.title}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-gray-400">{vo.projectName}</span>
                      <span className="text-xs font-bold text-orange-600">{fmtVND(vo.amount)}</span>
                    </div>
                  </Link>
                ))}
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
                { label: "Đơn hàng đang xử lý", value: 2,  color: "text-blue-600",   bg: "bg-blue-50" },
                { label: "Chờ nhận hàng",        value: 1,  color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Hoàn thành tháng này", value: 3,  color: "text-green-600",  bg: "bg-green-50" },
                { label: "Vượt ngân sách",       value: 0,  color: "text-red-600",    bg: "bg-red-50" },
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
