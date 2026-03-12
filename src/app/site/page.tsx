import { mockProjects, mockBoqLines, fmtVND } from "@/lib/mock-data"
import Link from "next/link"
import { ArrowRight, Wifi, WifiOff, Camera, AlertCircle } from "lucide-react"

export default function SiteDashboard() {
  // Chỉ hiện dự án "under_construction" cho SM
  const myProjects = mockProjects.filter(p => p.project_status === "under_construction")
  const pendingLines = mockBoqLines.filter(l => l.progress_pct === 0)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-xs text-slate-400">Hiện trường</div>
          <div className="font-bold text-base">Site Manager App</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-1 rounded-full">
            <Wifi className="w-3 h-3" /> Online
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm">
            C
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
        {/* Alert */}
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3 flex gap-2.5">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="text-yellow-300 font-medium">{pendingLines.length} hạng mục</span>
            <span className="text-yellow-200/80"> chưa cập nhật tiến độ</span>
          </div>
        </div>

        {/* My projects */}
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">
            Dự án của tôi
          </div>
          <div className="space-y-3">
            {myProjects.map(p => (
              <Link key={p.id} href={`/site/projects/${p.id}`}
                className="block bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-orange-500 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{p.project_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.project_code}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Tiến độ tổng thể</span>
                    <span className="font-medium text-orange-400">{p.progress_pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${p.progress_pct}%` }} />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                  <span>📋 {mockBoqLines.filter(l => l.project_id === p.id).length} hạng mục</span>
                  <span>⚡ {p.vo_count} VO</span>
                  <span>📅 HT: {p.expected_end_date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">
            Thao tác nhanh
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon="📸" label="Chụp ảnh nghiệm thu" color="bg-blue-600" />
            <QuickAction icon="⚡" label="Tạo lệnh phát sinh" color="bg-orange-600" href="/site/vo/new" />
            <QuickAction icon="📊" label="Cập nhật tiến độ" color="bg-green-700" />
            <QuickAction icon="📋" label="Xem giao khoán" color="bg-purple-700" />
          </div>
        </div>

        {/* Offline notice */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <WifiOff className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <div className="text-sm font-medium text-slate-300">Hỗ trợ Offline</div>
          <div className="text-xs text-slate-500 mt-1">
            Dữ liệu được cache tự động. Khi mất mạng, vẫn xem và nhập được, tự đồng bộ khi có mạng trở lại.
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, color, href = "#" }: { icon: string; label: string; color: string; href?: string }) {
  return (
    <Link href={href}
      className={`${color} hover:opacity-90 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-opacity`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-white font-medium leading-tight">{label}</span>
    </Link>
  )
}
