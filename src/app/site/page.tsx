"use client"
import { useState } from "react"
import { mockProjects, mockBoqLines } from "@/lib/mock-data"
import Link from "next/link"
import {
  ArrowRight, Wifi, WifiOff, Camera, AlertCircle,
  BookOpen, ClipboardCheck, Bell, CheckCircle,
  CloudSun, Zap
} from "lucide-react"

const myProjects = mockProjects.filter(p => p.project_status === "under_construction")
const pendingLines = mockBoqLines.filter(l => l.progress_pct === 0)

const NOTIFICATIONS = [
  { id: 1, text: "PM duyệt VO #003 — Thêm đèn LED",    time: "1 giờ trước" },
  { id: 2, text: "Nhắc nhở: cập nhật tiến độ tuần này", time: "3 giờ trước" },
  { id: 3, text: "QA: 2 hạng mục chờ nghiệm thu lại",  time: "Hôm qua"     },
]

export default function SiteDashboard() {
  const [checkedIn, setCheckedIn] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  const now     = new Date()
  const hour    = now.getHours()
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối"
  const today   = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <div className="text-xs text-slate-400">Site Manager App</div>
            <div className="font-bold text-base leading-tight">Thủ Thiêm Construction</div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)}
                className="relative w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {showNotif && (
                <div className="absolute right-0 top-11 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wide">Thông báo</div>
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50">
                      <p className="text-sm text-slate-200">{n.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-1.5 rounded-full">
              <Wifi className="w-3 h-3" /> Online
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm shadow">C</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto pb-8">
        {/* Greeting card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-slate-400">{today}</div>
              <div className="text-lg font-bold text-white mt-0.5">{greeting}, Chính! 👷</div>
              <div className="text-xs text-slate-400 mt-1">Căn hộ Mỹ Khánh – Phú Mỹ Hưng</div>
            </div>
            <div className="text-right shrink-0">
              <CloudSun className="w-8 h-8 text-yellow-400 ml-auto" />
              <div className="text-sm font-bold text-white mt-1">32°C</div>
              <div className="text-xs text-slate-500">Nắng nhẹ</div>
            </div>
          </div>
          <button onClick={() => setCheckedIn(!checkedIn)}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              checkedIn
                ? "bg-green-900/50 border border-green-700 text-green-400"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
            }`}>
            {checkedIn
              ? <><CheckCircle className="w-4 h-4" /> Đã check-in — 07:32</>
              : "📍 Check-in công trường"}
          </button>
        </div>

        {/* Alert */}
        {pendingLines.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3 flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="text-yellow-300 font-semibold">{pendingLines.length} hạng mục</span>
              <span className="text-yellow-200/80"> chưa cập nhật tiến độ tuần này</span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Thao tác nhanh</div>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={<Camera className="w-5 h-5" />}         label="Chụp ảnh" color="bg-blue-600"   href="#" />
            <QuickAction icon={<Zap className="w-5 h-5" />}            label="Tạo VO"   color="bg-orange-600" href="/site/vo/new" />
            <QuickAction icon={<BookOpen className="w-5 h-5" />}       label="Nhật ký"  color="bg-purple-700" href={`/site/projects/${myProjects[0]?.id ?? 1}`} />
            <QuickAction icon={<ClipboardCheck className="w-5 h-5" />} label="QA"       color="bg-teal-700"   href={`/site/projects/${myProjects[0]?.id ?? 1}`} />
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Dự án của tôi</div>
          <div className="space-y-3">
            {myProjects.map(p => {
              const lines = mockBoqLines.filter(l => l.project_id === p.id)
              const done  = lines.filter(l => l.progress_pct === 100).length
              return (
                <Link key={p.id} href={`/site/projects/${p.id}`}
                  className="block bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-orange-500/60 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{p.project_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.project_code}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Tiến độ</span>
                    <span className="font-semibold text-orange-400">{p.progress_pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${p.progress_pct}%` }} />
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>✅ {done}/{lines.length} HM</span>
                    <span>⚡ {p.vo_count} VO</span>
                    <span>📅 HT: {p.expected_end_date}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Today's diary */}
        <Link href={`/site/projects/${myProjects[0]?.id ?? 1}`}
          className="block bg-slate-800 border border-slate-700 hover:border-purple-600/60 rounded-xl p-4 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> Nhật ký hôm nay
            </span>
            <span className="text-xs text-orange-400">Mở →</span>
          </div>
          <div className="text-xs text-slate-500 italic">Chưa có nhật ký hôm nay. Nhấn để ghi.</div>
        </Link>

        {/* Offline */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <div className="text-sm font-medium text-slate-300">Hỗ trợ Offline</div>
            <div className="text-xs text-slate-500 mt-0.5">Cache tự động. Mất mạng vẫn nhập được, tự đồng bộ khi online.</div>
          </div>
        </div>
      </div>

      {showNotif && <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />}
    </div>
  )
}

function QuickAction({ icon, label, color, href }: {
  icon: React.ReactNode; label: string; color: string; href: string
}) {
  return (
    <Link href={href}
      className={`${color} hover:opacity-90 rounded-xl py-3 flex flex-col items-center justify-center gap-1.5 text-center transition-opacity`}>
      <span className="text-white">{icon}</span>
      <span className="text-[10px] text-white font-medium leading-tight">{label}</span>
    </Link>
  )
}
