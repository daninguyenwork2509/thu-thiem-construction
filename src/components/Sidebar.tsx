"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, FolderKanban, FileText, Users,
  AlertCircle, Wallet, BarChart3, Settings,
  Smartphone, ExternalLink, HardHat, Package, LogOut,
  ClipboardCheck, FolderOpen, Layers
} from "lucide-react"
import { useAuth, ROLE_COLORS } from "@/lib/auth-store"

const ALL_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "CRM / Lead", icon: Users },
  { href: "/projects", label: "Dự án", icon: FolderKanban },
  { href: "/boq", label: "Dự toán BOQ", icon: FileText },
  { href: "/contractors", label: "Nhà thầu", icon: HardHat },
  { href: "/materials", label: "Vật tư", icon: Package },
  { href: "/vo", label: "Phát sinh (VO)", icon: AlertCircle },
  { href: "/payment", label: "Dòng tiền", icon: Wallet },
  { href: "/qa", label: "QA / Nghiệm thu", icon: ClipboardCheck },
  { href: "/documents", label: "Tài liệu", icon: FolderOpen },
  { href: "/drawings", label: "Bản vẽ", icon: Layers },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt", icon: Settings },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const { state, can, logout } = useAuth()
  const user = state.user

  const visibleNav = ALL_NAV.filter(({ href }) => can(href))

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-700/50">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-700/60">
        <Link href="/" className="block">
          <Image
            src="/logo.svg"
            alt="Thủ Thiêm Construction"
            width={180}
            height={45}
            priority
            className="w-full h-auto max-h-12 object-contain object-left"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              style={active ? { backgroundColor: "#E87625" } : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Demo divider */}
        <div className="pt-2 mt-2 border-t border-slate-700/60">
          <div className="px-3 py-1 text-xs text-slate-600 uppercase tracking-wider font-semibold">
            Demo Links
          </div>
        </div>

        <Link href="/site"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Smartphone className="w-4 h-4 shrink-0" />
          Site Manager App
        </Link>

        <Link href="/guest/vo/abc123demo"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ExternalLink className="w-4 h-4 shrink-0" />
          Guest VO (KH)
        </Link>
        <Link href="/guest/project/proj-abc123"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ExternalLink className="w-4 h-4 shrink-0" />
          Guest Tiến độ (KH)
        </Link>
      </nav>

      {/* User badge */}
      {user && (
        <div className="px-3 py-3 border-t border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: "#E87625" }}>
              {user.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user.fullName}</div>
              <div className={`text-[10px] px-1 py-0.5 rounded inline-block mt-0.5 font-medium ${ROLE_COLORS[user.role]}`}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <button onClick={handleLogout} title="Đăng xuất"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
