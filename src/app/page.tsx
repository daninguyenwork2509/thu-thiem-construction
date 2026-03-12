"use client"
import { useAuth } from "@/lib/auth-store"
import { mockProjects, mockLeads, mockVOs, mockMilestones, fmtVND } from "@/lib/mock-data"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  FolderKanban, Users, AlertCircle, Wallet, Plus, FileText,
  ArrowRight, BarChart3, Bell
} from "lucide-react"
import Link from "next/link"

// ── Mini revenue chart data ──────────────────────────────────────────────────
const REVENUE_DATA = [
  { month: "T4", value: 1.2 }, { month: "T5", value: 2.1 }, { month: "T6", value: 1.8 },
  { month: "T7", value: 3.4 }, { month: "T8", value: 2.9 }, { month: "T9", value: 4.1 },
  { month: "T10", value: 3.6 }, { month: "T11", value: 5.2 }, { month: "T12", value: 4.8 },
  { month: "T1", value: 6.3 }, { month: "T2", value: 5.9 }, { month: "T3", value: 7.4 },
]
const MAX_REV = Math.max(...REVENUE_DATA.map(d => d.value))

// ── Activity feed ────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { icon: "✅", text: "Mốc thanh toán T3 — Villa Thảo Điền đã duyệt", time: "2 giờ trước", color: "text-green-600" },
  { icon: "📋", text: "VO #005 gửi KH xác nhận — thay đổi nội thất phòng ngủ", time: "5 giờ trước", color: "text-blue-600" },
  { icon: "⚠️", text: "Công nợ Penthouse Thủ Đức quá hạn 45 ngày", time: "Hôm qua", color: "text-orange-600" },
  { icon: "👤", text: "Lead mới: Nguyễn Minh Khoa — Nhà phố Q7 ~2.8 tỷ", time: "Hôm qua", color: "text-purple-600" },
  { icon: "🏗️", text: "Cập nhật tiến độ: Biệt thự Đà Lạt đạt 68%", time: "2 ngày trước", color: "text-gray-600" },
]

// ── Status helpers ───────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  under_construction: "bg-blue-100 text-blue-700",
  legal_check:        "bg-yellow-100 text-yellow-700",
  completed:          "bg-green-100 text-green-700",
  draft:              "bg-gray-100 text-gray-600",
  inspecting:         "bg-purple-100 text-purple-700",
}
const statusLabel: Record<string, string> = {
  under_construction: "Đang thi công",
  legal_check:        "Kiểm tra pháp lý",
  completed:          "Hoàn thành",
  draft:              "Nháp",
  inspecting:         "Nghiệm thu",
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Chào buổi sáng"
  if (h < 18) return "Chào buổi chiều"
  return "Chào buổi tối"
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useAuth()
  const user = state.user
  const firstName = user?.fullName?.split(" ").pop() ?? "bạn"

  const totalContracts   = mockProjects.reduce((s, p) => s + p.contract_value, 0)
  const totalPaid        = mockProjects.reduce((s, p) => s + p.total_paid, 0)
  const totalDebt        = mockProjects.reduce((s, p) => s + p.total_outstanding_debt, 0)
  const activeProjects   = mockProjects.filter(p => p.project_status === "under_construction").length
  const pendingVOs       = mockVOs.filter(v => v.status === "customer_pending").length
  const overdueMilestones = mockMilestones.filter(m => m.status === "approved").length
  const paidPct          = Math.round(totalPaid / totalContracts * 100)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Tổng quan hoạt động · Tháng 3/2026</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/new"
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Lead mới
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng giá trị HĐ"
          value={fmtVND(totalContracts)}
          sub={`${activeProjects} dự án đang thi công`}
          trend={+8.4}
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <KpiCard
          label="Đã thu"
          value={fmtVND(totalPaid)}
          sub={`${paidPct}% giá trị hợp đồng`}
          trend={+5.2}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
        />
        <KpiCard
          label="Còn công nợ"
          value={fmtVND(totalDebt)}
          sub="Cần theo dõi thu hồi"
          trend={-3.1}
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-50"
        />
        <KpiCard
          label="Chờ xử lý"
          value={`${pendingVOs} VO · ${overdueMilestones} Mốc`}
          sub="Cần duyệt ngay hôm nay"
          trend={null}
          icon={<Clock className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50"
          urgent={pendingVOs + overdueMilestones > 0}
        />
      </div>

      {/* ── Revenue Chart + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Doanh thu theo tháng</h3>
              <p className="text-xs text-gray-400 mt-0.5">12 tháng gần nhất · tỷ đồng</p>
            </div>
            <Link href="/reports" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
              Chi tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {REVENUE_DATA.map((d, i) => {
              const isRecent = i >= 9
              const heightPct = (d.value / MAX_REV) * 100
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className={`w-full rounded-t-sm transition-all ${isRecent ? "bg-orange-500" : "bg-gray-200"} group-hover:opacity-80`}
                    style={{ height: `${heightPct}%` }}
                    title={`${d.month}: ${d.value} tỷ`}
                  />
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

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href="/leads" icon={<Users className="w-5 h-5" />} label="Lead Pipeline" color="bg-purple-50 text-purple-700 hover:bg-purple-100" />
            <QuickAction href="/projects" icon={<FolderKanban className="w-5 h-5" />} label="Dự án" color="bg-blue-50 text-blue-700 hover:bg-blue-100" />
            <QuickAction href="/vo" icon={<FileText className="w-5 h-5" />} label="Phát sinh VO" color="bg-yellow-50 text-yellow-700 hover:bg-yellow-100" />
            <QuickAction href="/payment" icon={<Wallet className="w-5 h-5" />} label="Dòng tiền" color="bg-green-50 text-green-700 hover:bg-green-100" />
          </div>

          {/* Alert summary */}
          {(pendingVOs > 0 || overdueMilestones > 0) && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
                <Bell className="w-4 h-4" /> Cần xử lý ngay
              </div>
              {pendingVOs > 0 && (
                <Link href="/vo" className="flex items-center justify-between text-xs text-red-600 hover:underline py-1">
                  <span>· {pendingVOs} VO chờ KH xác nhận</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {overdueMilestones > 0 && (
                <Link href="/payment" className="flex items-center justify-between text-xs text-red-600 hover:underline py-1">
                  <span>· {overdueMilestones} mốc chờ thu tiền</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <FolderKanban className="w-4 h-4 text-orange-500" />
              Dự án đang thực hiện
            </div>
            <Link href="/projects" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
                    <div
                      className={`h-full rounded-full transition-all ${p.progress_pct >= 80 ? "bg-green-500" : p.progress_pct >= 40 ? "bg-orange-500" : "bg-blue-400"}`}
                      style={{ width: `${p.progress_pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Upcoming milestones */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <Wallet className="w-4 h-4 text-green-500" />
                Mốc sắp đến hạn
              </div>
              <Link href="/payment" className="text-xs text-orange-500 hover:underline">Xem →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockMilestones.filter(m => m.status !== "paid").slice(0, 3).map(m => (
                <div key={m.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-800 truncate">{m.milestone_name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {m.due_date}
                    </span>
                    <span className="text-xs font-bold text-orange-600">{fmtVND(m.payment_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending VOs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                VO chờ KH duyệt
              </div>
              <Link href="/vo" className="text-xs text-orange-500 hover:underline">Xem →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockVOs.filter(v => v.status === "customer_pending").map(vo => (
                <Link key={vo.id} href={`/vo/${vo.id}`} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-sm text-gray-800 truncate">{vo.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-between">
                    <span>{vo.vo_code}</span>
                    <span className="font-semibold text-orange-600">{fmtVND(vo.selling_price_vat)}</span>
                  </div>
                </Link>
              ))}
              {mockVOs.filter(v => v.status === "customer_pending").length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Không có VO nào chờ duyệt</div>
              )}
            </div>
          </div>

          {/* New leads */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <Users className="w-4 h-4 text-blue-500" />
                Lead mới nhất
              </div>
              <Link href="/leads" className="text-xs text-orange-500 hover:underline">Xem →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockLeads.slice(0, 3).map(l => (
                <div key={l.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {l.customer_name}
                        {l.is_duplicate_phone && (
                          <span className="ml-1.5 inline-flex items-center text-red-500 text-xs font-normal">⚠ SĐT trùng</span>
                        )}
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

      {/* ── Activity Feed ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Bell className="w-4 h-4 text-orange-500" />
            Hoạt động gần đây
          </div>
          <Link href="/notifications" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
            Tất cả thông báo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {ACTIVITIES.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <span className="text-lg leading-none mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{a.text}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 mt-0.5">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, icon, iconBg, urgent
}: {
  label: string
  value: string
  sub: string
  trend: number | null
  icon: React.ReactNode
  iconBg: string
  urgent?: boolean
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

function QuickAction({ href, icon, label, color }: {
  href: string; icon: React.ReactNode; label: string; color: string
}) {
  return (
    <Link href={href}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-colors font-medium text-sm text-center ${color}`}>
      {icon}
      <span className="text-xs leading-tight">{label}</span>
    </Link>
  )
}
