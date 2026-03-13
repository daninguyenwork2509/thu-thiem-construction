"use client"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Search, ChevronDown, LogOut, User, Settings, X, CheckCheck } from "lucide-react"
import { useAuth, ROLE_COLORS } from "@/lib/auth-store"

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "warning", title: "Margin thấp", body: "BOQ PRJ-2025-0001: Hạng mục Điện có margin 8.2% < 15%", time: "5 phút trước", read: false, href: "/boq" },
  { id: 2, type: "info", title: "VO mới cần duyệt", body: "Phát sinh #VO-2025-012 từ công trình Quận 2", time: "32 phút trước", read: false, href: "/vo" },
  { id: 3, type: "success", title: "Thanh toán xác nhận", body: "Đợt 2 dự án Vinhomes — 450.000.000 đ đã nhận", time: "2 giờ trước", read: false, href: "/payment" },
  { id: 4, type: "warning", title: "Công nợ quá hạn", body: "Khách hàng Nguyễn Văn B — 30 ngày chưa thanh toán đợt 3", time: "1 ngày trước", read: true, href: "/payment" },
  { id: 5, type: "info", title: "Lead mới", body: "Khách hàng Trần Thị C — biệt thự Thủ Đức 2.5 tỷ", time: "2 ngày trước", read: true, href: "/leads" },
]

const notifIcon: Record<string, string> = { warning: "🔶", info: "🔵", success: "✅", error: "🔴" }

// Page title map
const PAGE_TITLES: Record<string, string> = {
  "/":             "Dashboard",
  "/leads":        "CRM / Lead",
  "/projects":     "Dự án",
  "/boq":          "Dự toán BOQ",
  "/contractors":  "Nhà thầu",
  "/materials":    "Vật tư",
  "/vo":           "Phát sinh (VO)",
  "/payment":      "Dòng tiền",
  "/qa":           "QA / Nghiệm thu",
  "/documents":    "Tài liệu",
  "/drawings":     "Bản vẽ",
  "/reports":      "Báo cáo",
  "/settings":     "Cài đặt",
  "/notifications":"Thông báo",
}

export default function TopBar() {
  const { state, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser,  setShowUser]  = useState(false)
  const [notifs,    setNotifs]    = useState(MOCK_NOTIFICATIONS)

  const unread = notifs.filter(n => !n.read).length
  const user   = state.user

  // Resolve page title
  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => key === "/" ? pathname === "/" : pathname.startsWith(key))?.[1] ?? ""

  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })))
  const markOne = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  const handleLogout = () => { logout(); router.push("/login") }

  if (!user) return null

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 shrink-0 z-20">
      {/* Page title */}
      {pageTitle && (
        <div className="hidden md:block shrink-0">
          <h1 className="text-sm font-semibold text-gray-900">{pageTitle}</h1>
        </div>
      )}

      {/* Divider */}
      {pageTitle && <div className="hidden md:block h-4 w-px bg-gray-200 shrink-0" />}

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án, VO, khách hàng..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-gray-400 transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false) }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-800">
            <Bell className="w-4.5 h-4.5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl shadow-gray-200/80 border border-gray-100 z-40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">Thông báo</span>
                    {unread > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAll} className="text-xs text-orange-500 hover:text-orange-700 flex items-center gap-1 font-medium">
                        <CheckCheck className="w-3 h-3" /> Đọc hết
                      </button>
                    )}
                    <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifs.map(n => (
                    <Link key={n.id} href={n.href}
                      onClick={() => { markOne(n.id); setShowNotif(false) }}
                      className={`flex gap-3 px-4 py-3 hover:bg-gray-50/80 transition cursor-pointer ${n.read ? "opacity-50" : ""}`}>
                      <span className="text-base shrink-0 mt-0.5">{notifIcon[n.type]}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm text-gray-900 ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</div>
                        <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />}
                    </Link>
                  ))}
                </div>
                <Link href="/notifications" onClick={() => setShowNotif(false)}
                  className="block text-center py-2.5 text-xs font-semibold text-orange-500 hover:text-orange-700 hover:bg-orange-50/50 transition border-t border-gray-100">
                  Xem tất cả thông báo →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotif(false) }}
            className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #E87625 0%, #C9651A 100%)" }}>
              {user.avatarInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-gray-800 leading-none">{user.fullName}</div>
              <div className="text-[10px] text-gray-400 leading-none mt-0.5">{user.roleLabel}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUser ? "rotate-180" : ""}`} />
          </button>

          {showUser && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowUser(false)} />
              <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl shadow-gray-200/80 border border-gray-100 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                  <div className="font-semibold text-sm text-gray-900">{user.fullName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                    {user.roleLabel}
                  </span>
                </div>
                <div className="py-1">
                  <Link href="/settings/profile" onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">
                    <User className="w-4 h-4 text-gray-400" /> Hồ sơ cá nhân
                  </Link>
                  <Link href="/settings" onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">
                    <Settings className="w-4 h-4 text-gray-400" /> Cài đặt
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition">
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
