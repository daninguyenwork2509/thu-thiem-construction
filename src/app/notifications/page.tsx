"use client"
import { useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Trash2, Filter, X } from "lucide-react"

interface Notification {
  id: number
  type: "warning" | "info" | "success" | "error"
  title: string
  body: string
  time: string
  date: string
  read: boolean
  href: string
  category: "margin" | "payment" | "vo" | "lead" | "system"
}

const ALL_NOTIFS: Notification[] = [
  { id: 1, type: "warning", title: "Margin thấp — BOQ PRJ-2025-0001", body: "Hạng mục Điện có margin 8.2% < ngưỡng 15%. Vui lòng kiểm tra lại đơn giá bán hoặc chi phí.", time: "5 phút trước", date: "2026-03-12", read: false, href: "/boq", category: "margin" },
  { id: 2, type: "info", title: "VO mới cần duyệt", body: "Phát sinh #VO-2025-012 trị giá 85.000.000đ từ công trình Quận 2 — đang chờ PM review.", time: "32 phút trước", date: "2026-03-12", read: false, href: "/vo", category: "vo" },
  { id: 3, type: "success", title: "Thanh toán xác nhận", body: "Đợt 2 dự án PRJ-2025-0001 — 450.000.000đ đã nhận được xác nhận từ kế toán.", time: "2 giờ trước", date: "2026-03-12", read: false, href: "/payment", category: "payment" },
  { id: 4, type: "warning", title: "Công nợ quá hạn — 30 ngày", body: "Khách hàng Nguyễn Văn B (PRJ-2025-0001) chưa thanh toán đợt 3 sau 30 ngày. Số tiền: 280.000.000đ.", time: "1 ngày trước", date: "2026-03-11", read: true, href: "/payment", category: "payment" },
  { id: 5, type: "info", title: "Lead mới từ Facebook", body: "Khách hàng Trần Thị C — biệt thự Thủ Đức, budget 2.5 tỷ. Được giao cho Sales Nguyễn Thu Hà.", time: "2 ngày trước", date: "2026-03-10", read: true, href: "/leads", category: "lead" },
  { id: 6, type: "error", title: "Công nợ nghiêm trọng — 61 ngày", body: "Dự án PRJ-2024-0008 (Hoàng Văn E) chưa thanh toán đợt cuối sau 61 ngày. Số tiền: 95.000.000đ.", time: "3 ngày trước", date: "2026-03-09", read: true, href: "/payment", category: "payment" },
  { id: 7, type: "success", title: "VO được khách hàng phê duyệt", body: "Phát sinh #VO-2025-010 — Khách hàng Nguyễn Văn A đã ký duyệt qua Guest Portal.", time: "4 ngày trước", date: "2026-03-08", read: true, href: "/vo", category: "vo" },
  { id: 8, type: "info", title: "BOQ mới được tạo", body: "PM Trần Thị Bình đã tạo BOQ v2 cho dự án PRJ-2025-0003 — Văn phòng Q.1.", time: "5 ngày trước", date: "2026-03-07", read: true, href: "/boq", category: "system" },
  { id: 9, type: "warning", title: "Margin thấp — BOQ PRJ-2025-0003", body: "Hạng mục Sàn gỗ có margin 11.5% < 15%. Đề xuất tăng đơn giá bán hoặc đàm phán NCC.", time: "6 ngày trước", date: "2026-03-06", read: true, href: "/boq", category: "margin" },
  { id: 10, type: "success", title: "Dự án hoàn thành", body: "Dự án PRJ-2024-0015 (Biệt thự Song Long) đã được đánh dấu hoàn thành. Bàn giao thành công.", time: "1 tuần trước", date: "2026-03-05", read: true, href: "/projects", category: "system" },
]

const TYPE_ICON: Record<string, string> = {
  warning: "🔶", info: "🔵", success: "✅", error: "🔴"
}

const TYPE_BG: Record<string, string> = {
  warning: "bg-orange-50 border-orange-100",
  info: "bg-blue-50 border-blue-100",
  success: "bg-green-50 border-green-100",
  error: "bg-red-50 border-red-100",
}

const CATEGORY_LABELS: Record<string, string> = {
  margin: "Margin", payment: "Thanh toán", vo: "VO", lead: "CRM", system: "Hệ thống"
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(ALL_NOTIFS)
  const [filterType, setFilterType] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = notifs.filter(n => {
    if (showUnreadOnly && n.read) return false
    if (filterType && n.type !== filterType) return false
    if (filterCategory && n.category !== filterCategory) return false
    return true
  })

  const unread = notifs.filter(n => !n.read).length

  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })))
  const markOne = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  const deleteOne = (id: number) => setNotifs(n => n.filter(x => x.id !== id))
  const clearAll = () => {
    if (confirm("Xóa tất cả thông báo đã đọc?"))
      setNotifs(n => n.filter(x => !x.read))
  }

  // Group by date
  const grouped: Record<string, Notification[]> = {}
  for (const n of filtered) {
    const key = n.date === "2026-03-12" ? "Hôm nay" : n.date === "2026-03-11" ? "Hôm qua" : n.date
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(n)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Thông báo
            {unread > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unread} mới</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{notifs.length} thông báo tổng cộng</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              <CheckCheck className="w-3.5 h-3.5" />Đánh dấu đã đọc
            </button>
          )}
          <button onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
            <Trash2 className="w-3.5 h-3.5" />Xóa đã đọc
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${showUnreadOnly ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          {showUnreadOnly ? "✓ " : ""}Chưa đọc ({unread})
        </button>

        <div className="flex items-center gap-1 text-gray-400 text-xs"><Filter className="w-3 h-3" /></div>

        {["warning", "info", "success", "error"].map(t => (
          <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filterType === t ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {TYPE_ICON[t]} {t === "warning" ? "Cảnh báo" : t === "info" ? "Thông tin" : t === "success" ? "Thành công" : "Lỗi"}
          </button>
        ))}

        {filterType || filterCategory || showUnreadOnly ? (
          <button onClick={() => { setFilterType(""); setFilterCategory(""); setShowUnreadOnly(false) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-500 border border-red-200 hover:bg-red-50 transition">
            <X className="w-3 h-3" />Xóa lọc
          </button>
        ) : null}
      </div>

      {/* Notification list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <div className="text-gray-400">Không có thông báo</div>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{date}</div>
              <div className="space-y-2">
                {items.map(n => (
                  <div key={n.id}
                    className={`flex gap-3 p-4 rounded-xl border transition ${n.read ? "bg-white border-gray-100" : `${TYPE_BG[n.type]} border`}`}>
                    <div className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-sm font-medium text-gray-900 ${!n.read ? "font-semibold" : ""}`}>
                          {n.title}
                          {!n.read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-orange-500 align-middle" />}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.read && (
                            <button onClick={() => markOne(n.id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition" title="Đánh dấu đã đọc">
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => deleteOne(n.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition" title="Xóa">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{n.time}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                            {CATEGORY_LABELS[n.category]}
                          </span>
                          <Link href={n.href} onClick={() => markOne(n.id)}
                            className="text-xs font-medium text-orange-600 hover:underline">
                            Xem →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
