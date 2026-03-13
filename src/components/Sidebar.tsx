"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, FolderKanban, FileText, Users,
  AlertCircle, Wallet, BarChart3, Settings,
  Smartphone, ExternalLink, HardHat, Package, LogOut,
  ClipboardCheck, FolderOpen, Layers, ChevronRight
} from "lucide-react"
import { useAuth, ROLE_COLORS } from "@/lib/auth-store"

const ALL_NAV = [
  { href: "/",            label: "Dashboard",       icon: LayoutDashboard },
  { href: "/leads",       label: "CRM / Lead",      icon: Users },
  { href: "/projects",    label: "Dự án",            icon: FolderKanban },
  { href: "/boq",         label: "Dự toán BOQ",      icon: FileText },
  { href: "/contractors", label: "Nhà thầu",         icon: HardHat },
  { href: "/materials",   label: "Vật tư",           icon: Package },
  { href: "/vo",          label: "Phát sinh (VO)",   icon: AlertCircle },
  { href: "/payment",     label: "Dòng tiền",        icon: Wallet },
  { href: "/qa",          label: "QA / Nghiệm thu",  icon: ClipboardCheck },
  { href: "/documents",   label: "Tài liệu",         icon: FolderOpen },
  { href: "/drawings",    label: "Bản vẽ",           icon: Layers },
  { href: "/reports",     label: "Báo cáo",          icon: BarChart3 },
  { href: "/settings",    label: "Cài đặt",          icon: Settings },
]

export default function Sidebar() {
  const path    = usePathname()
  const router  = useRouter()
  const { state, can, logout } = useAuth()
  const user    = state.user

  const visibleNav = ALL_NAV.filter(({ href }) => can(href))

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

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
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href))
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

        {/* Demo links */}
        <div className="pt-3 mt-2 border-t border-gray-100">
          <div className="px-3 pb-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
            Demo
          </div>
        </div>

        <Link href="/site"
          className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <Smartphone className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
          Site Manager App
        </Link>
        <Link href="/guest/vo/abc123demo"
          className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <ExternalLink className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
          Guest VO (KH)
        </Link>
        <Link href="/guest/project/proj-abc123"
          className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <ExternalLink className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
          Guest Tiến độ (KH)
        </Link>
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
