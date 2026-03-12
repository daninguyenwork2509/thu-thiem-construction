import { mockProjects, mockBoqLines, fmtVND } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle, Camera, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function SiteProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = mockProjects.find(p => p.id === Number(id))
  if (!project) return notFound()

  const lines = mockBoqLines.filter(l => l.project_id === project.id)
  const categories = [...new Set(lines.map(l => l.category))]
  const done = lines.filter(l => l.progress_pct === 100).length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/site" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate">{project.project_name}</div>
            <div className="text-xs text-slate-400">{project.project_code}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Progress overview */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Tiến độ tổng thể</span>
            <span className="text-orange-400 font-bold">{project.progress_pct}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full mb-3">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${project.progress_pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>✅ {done}/{lines.length} hạng mục hoàn thành</span>
            <span>📅 {project.expected_end_date}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            <Camera className="w-4 h-4" /> Chụp ảnh
          </button>
          <Link href="/site/vo/new"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            ⚡ Tạo VO
          </Link>
        </div>

        {/* BOQ by category */}
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
            Cập nhật tiến độ hạng mục
          </div>
          {categories.map(cat => {
            const catLines = lines.filter(l => l.category === cat)
            const catDone = catLines.filter(l => l.progress_pct === 100).length
            const catPct = catLines.length > 0
              ? Math.round(catLines.reduce((s, l) => s + l.progress_pct, 0) / catLines.length)
              : 0

            return (
              <div key={cat} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-750 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white text-sm">{cat}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{catDone}/{catLines.length} hoàn thành</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${catPct === 100 ? "text-green-400" : catPct > 0 ? "text-orange-400" : "text-slate-500"}`}>
                      {catPct}%
                    </div>
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full mt-1">
                      <div className={`h-full rounded-full ${catPct === 100 ? "bg-green-500" : "bg-orange-500"}`}
                        style={{ width: `${catPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-700">
                  {catLines.map(line => (
                    <div key={line.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                        line.progress_pct === 100 ? "bg-green-900/50 text-green-400" :
                        line.progress_pct > 0 ? "bg-orange-900/50 text-orange-400" :
                        "bg-slate-700 text-slate-500"
                      }`}>
                        {line.progress_pct === 100
                          ? <CheckCircle className="w-4 h-4" />
                          : <span className="text-xs font-bold">{line.progress_pct}%</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{line.item_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {line.qty} {line.uom}
                          {line.margin_warning && <span className="ml-1.5 text-red-400">⚠ Margin thấp</span>}
                        </div>
                      </div>
                      <button className="shrink-0 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                        Cập nhật
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
