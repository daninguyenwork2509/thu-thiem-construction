"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, AlertCircle,
  Wallet, Settings, Smartphone, ExternalLink,
  HardHat, Package, LogOut, ChevronRight, Kanban, FolderOpen, ClipboardCheck, FileText
} from "lucide-react"
import { useAuth, ROLE_COLORS } from "@/lib/auth-store"

// ── Nav groups ────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [
      { href: "/", label: "Dashboard & Báo cáo", icon: LayoutDashboard },
    ],
  },
  {
    label: "Quản lý dự án",
    items: [
      { href: "/pipeline", label: "Quản lý dự án",    icon: Kanban },
      { href: "/boq",      label: "Dự toán BOQ",      icon: FileText },
      { href: "/qa",       label: "QA & Nghiệm thu",  icon: ClipboardCheck },
    ],
  },
  {
    label: "Hồ sơ",
    items: [
      { href: "/files", label: "Tài liệu & Bản vẽ", icon: FolderOpen },
    ],
  },
  {
    label: "Tài chính & Mua sắm",
    items: [
      { href: "/payment",      label: "Dòng tiền",      icon: Wallet },
      { href: "/vo",           label: "Phát sinh (VO)", icon: AlertCircle },
      { href: "/contractors",  label: "Nhà thầu",       icon: HardHat },
      { href: "/materials",    label: "Vật tư",         icon: Package },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/settings", label: "Cài đặt", icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const { state, can, logout } = useAuth()
  const user   = state.user

  const handleLogout = () => { logout(); router.push("/login") }

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href)

  return (
    <aside className="w-60 bg-white flex flex-col shrink-0 border-r border-gray-200">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #E87625 0%, #C9651A 100%)" }}>
            <span className="text-white font-black text-sm leading-none">TT</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 leading-none">Thủ Thiêm</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5 font-medium tracking-wide">CONSTRUCTION</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(({ href }) => can(href))
          if (visibleItems.length === 0) return null

          return (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {/* Section header */}
              {group.label && (
                <div className="px-3 pb-1 pt-1 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  {group.label}
                </div>
              )}

              {/* Items */}
              <div className="space-y-0.5">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link key={href} href={href}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-orange-50 text-orange-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? "text-orange-500" : "text-gray-400 group-hover:text-gray-600"
                      }`} />
                      <span className="flex-1 truncate">{label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-orange-400 shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Demo links */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="px-3 pb-1 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
            Demo
          </div>
          <div className="space-y-0.5">
            {[
              { href: "/site",                    label: "Site Manager App",    icon: Smartphone },
              { href: "/guest/vo/abc123demo",      label: "Guest VO (KH)",       icon: ExternalLink },
              { href: "/guest/project/proj-abc123",label: "Guest Tiến độ (KH)",  icon: ExternalLink },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
                <Icon className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 py-3 border-t border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #E87625 0%, #C9651A 100%)" }}>
              {user.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-800 truncate leading-none">{user.fullName}</div>
              <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${ROLE_COLORS[user.role]}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
            <button onClick={handleLogout} title="Đăng xuất"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
