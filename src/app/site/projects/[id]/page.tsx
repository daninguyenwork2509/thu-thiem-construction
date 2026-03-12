"use client"
import { useState } from "react"
import { mockProjects, mockBoqLines, fmtVND } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import {
  ArrowLeft, CheckCircle, Camera, ChevronRight, BookOpen,
  ClipboardCheck, Image as ImageIcon, Minus, Plus, Send,
  AlertTriangle, Clock, MapPin
} from "lucide-react"
import Link from "next/link"
import { use } from "react"

// ── Mock site photos ─────────────────────────────────────────────────────────
const SITE_PHOTOS = [
  { id: 1, label: "Móng - Đổ bê tông",    date: "10/03", phase: "Phần thô",   color: "bg-slate-600" },
  { id: 2, label: "Cột trục B3",           date: "10/03", phase: "Phần thô",   color: "bg-slate-700" },
  { id: 3, label: "Tường phòng ngủ 1",     date: "09/03", phase: "Xây tô",     color: "bg-slate-500" },
  { id: 4, label: "Điện âm tường WC",      date: "08/03", phase: "M&E rough",  color: "bg-slate-600" },
  { id: 5, label: "Tổng quan công trường", date: "07/03", phase: "Tổng quan",  color: "bg-slate-700" },
  { id: 6, label: "Nghiệm thu móng",       date: "06/03", phase: "Nghiệm thu", color: "bg-slate-500" },
]

// ── Mock QA items ─────────────────────────────────────────────────────────────
const SITE_QA = [
  { id: 1, desc: "Độ phẳng tường phòng khách ≤3mm", status: "pass"    as const },
  { id: 2, desc: "Khe góc tường vuông 90°",          status: "fail"    as const },
  { id: 3, desc: "Ống điện đúng sơ đồ M&E",          status: "pass"    as const },
  { id: 4, desc: "Thép đai cột đúng khoảng cách",    status: "pending" as const },
  { id: 5, desc: "Bê tông không bị rỗ, vá",          status: "pending" as const },
]

type QAStatus = "pass" | "fail" | "pending"

export default function SiteProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const project = mockProjects.find(p => p.id === Number(id))
  if (!project) return notFound()

  const allLines = mockBoqLines.filter(l => l.project_id === project.id)
  const categories = [...new Set(allLines.map(l => l.category))]

  return <SiteDetailClient project={project} allLines={allLines} categories={categories} />
}

function SiteDetailClient({ project, allLines, categories }: {
  project: ReturnType<typeof mockProjects.find> & object
  allLines: typeof mockBoqLines
  categories: string[]
}) {
  const [tab, setTab]       = useState<"progress" | "diary" | "photos" | "qa">("progress")
  const [lines, setLines]   = useState(allLines)
  const [qaItems, setQaItems] = useState(SITE_QA)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(categories))
  const [diaryForm, setDiaryForm] = useState({ weather: "sunny", workers: "8", work: "", issues: "", submitted: false })

  const done    = lines.filter(l => l.progress_pct === 100).length
  const overall = Math.round(lines.reduce((s, l) => s + l.progress_pct, 0) / (lines.length || 1))

  const updateProgress = (lineId: number, delta: number) => {
    setLines(prev => prev.map(l =>
      l.id !== lineId ? l : { ...l, progress_pct: Math.min(100, Math.max(0, l.progress_pct + delta)) }
    ))
  }

  const setProgress = (lineId: number, val: number) => {
    setLines(prev => prev.map(l => l.id !== lineId ? l : { ...l, progress_pct: val }))
  }

  const toggleCat = (cat: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n
  })

  const toggleQA = (id: number) => {
    setQaItems(prev => prev.map(q => q.id !== id ? q : {
      ...q,
      status: (q.status === "pending" ? "pass" : q.status === "pass" ? "fail" : "pending") as QAStatus
    }))
  }

  const TABS = [
    { key: "progress", label: "Tiến độ",  icon: "📊" },
    { key: "diary",    label: "Nhật ký",  icon: "📝" },
    { key: "photos",   label: "Ảnh",      icon: "📸" },
    { key: "qa",       label: "QA",       icon: "✅" },
  ] as const

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Link href="/site" className="text-slate-400 hover:text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">{(project as { project_name: string }).project_name}</div>
            <div className="text-xs text-slate-400">{(project as { project_code: string }).project_code}</div>
          </div>
          <Link href="/site/vo/new"
            className="bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            ⚡ VO
          </Link>
        </div>
      </div>

      {/* Progress bar strip */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${overall}%` }} />
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 shrink-0">{overall}%</span>
          <span className="text-xs text-slate-500 shrink-0">{done}/{lines.length} HM</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-[57px] z-10">
        <div className="flex max-w-md mx-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors border-b-2 ${
                tab === t.key ? "border-orange-500 text-orange-400" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto pb-20">

        {/* ── Tab: Tiến độ ── */}
        {tab === "progress" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Nhấn +/- hoặc kéo thanh để cập nhật % hoàn thành từng hạng mục.</p>
            {categories.map(cat => {
              const catLines = lines.filter(l => l.category === cat)
              const catPct   = Math.round(catLines.reduce((s, l) => s + l.progress_pct, 0) / (catLines.length || 1))
              const isOpen   = expanded.has(cat)
              return (
                <div key={cat} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <button onClick={() => toggleCat(cat)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-750 transition-colors">
                    <div className="text-left">
                      <div className="font-medium text-sm text-white">{cat}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {catLines.filter(l => l.progress_pct === 100).length}/{catLines.length} hoàn thành
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${catPct === 100 ? "text-green-400" : "text-orange-400"}`}>{catPct}%</span>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-slate-700 border-t border-slate-700">
                      {catLines.map(line => (
                        <div key={line.id} className="px-4 py-3">
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                              line.progress_pct === 100 ? "bg-green-900/60 text-green-400" :
                              line.progress_pct > 0   ? "bg-orange-900/60 text-orange-400" :
                              "bg-slate-700 text-slate-500"
                            }`}>
                              {line.progress_pct === 100
                                ? <CheckCircle className="w-3.5 h-3.5" />
                                : <span className="text-[9px] font-bold">{line.progress_pct}</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white leading-snug">{line.item_name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{line.qty} {line.uom}</div>
                            </div>
                          </div>
                          {/* Progress slider */}
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateProgress(line.id, -10)}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 shrink-0">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex-1 relative">
                              <input type="range" min={0} max={100} step={5}
                                value={line.progress_pct}
                                onChange={e => setProgress(line.id, Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none bg-slate-700 accent-orange-500 cursor-pointer" />
                            </div>
                            <button onClick={() => updateProgress(line.id, 10)}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-right text-xs font-bold text-orange-400 shrink-0">{line.progress_pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Save button */}
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">
              <Send className="w-4 h-4" /> Lưu & Đồng bộ tiến độ
            </button>
          </div>
        )}

        {/* ── Tab: Nhật ký ── */}
        {tab === "diary" && (
          <div className="space-y-4">
            {diaryForm.submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-900/40 border border-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-lg font-bold text-white mb-1">Đã lưu nhật ký!</div>
                <div className="text-sm text-slate-400 mb-6">Nhật ký ngày hôm nay đã được ghi lại.</div>
                <button onClick={() => setDiaryForm(f => ({ ...f, submitted: false, work: "", issues: "" }))}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl text-sm font-medium">
                  Tạo nhật ký mới
                </button>
              </div>
            ) : (
              <>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Nhật ký công trường</div>
                    <div className="text-xs text-slate-400">Thứ Năm, 13/03/2026</div>
                  </div>
                </div>

                {/* Weather */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Thời tiết</label>
                  <div className="flex gap-2">
                    {[
                      { key: "sunny", label: "☀️ Nắng" },
                      { key: "cloudy", label: "⛅ Râm" },
                      { key: "rain", label: "🌧️ Mưa" },
                      { key: "storm", label: "⛈️ Bão" },
                    ].map(w => (
                      <button key={w.key} onClick={() => setDiaryForm(f => ({ ...f, weather: w.key }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          diaryForm.weather === w.key
                            ? "bg-orange-500 text-white"
                            : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workers */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Số công nhân</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDiaryForm(f => ({ ...f, workers: String(Math.max(0, Number(f.workers) - 1)) }))}
                      className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-white hover:bg-slate-700">
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center text-2xl font-bold text-white">{diaryForm.workers}</div>
                    <button onClick={() => setDiaryForm(f => ({ ...f, workers: String(Number(f.workers) + 1) }))}
                      className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-white hover:bg-slate-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Work done */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Công việc đã thực hiện *</label>
                  <textarea rows={4} value={diaryForm.work}
                    onChange={e => setDiaryForm(f => ({ ...f, work: e.target.value }))}
                    placeholder="Mô tả công việc đã làm hôm nay..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none" />
                </div>

                {/* Issues */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Vấn đề / Ghi chú
                  </label>
                  <textarea rows={3} value={diaryForm.issues}
                    onChange={e => setDiaryForm(f => ({ ...f, issues: e.target.value }))}
                    placeholder="Sự cố, thiếu vật tư, thời tiết ảnh hưởng..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none" />
                </div>

                {/* Location */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>Vị trí: <span className="text-white">Phú Mỹ Hưng, Quận 7</span></span>
                </div>

                <button
                  onClick={() => setDiaryForm(f => ({ ...f, submitted: true }))}
                  disabled={!diaryForm.work}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <BookOpen className="w-4 h-4" /> Lưu nhật ký hôm nay
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Ảnh ── */}
        {tab === "photos" && (
          <div className="space-y-4">
            {/* Upload button */}
            <button className="w-full border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-500 hover:text-orange-400 transition-colors">
              <Camera className="w-7 h-7" />
              <span className="text-sm font-medium">Chụp ảnh / Chọn từ thư viện</span>
              <span className="text-xs">Gắn tag giai đoạn tự động</span>
            </button>

            {/* Phase filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["Tất cả", "Phần thô", "Xây tô", "M&E rough", "Nghiệm thu"].map(f => (
                <button key={f}
                  className="shrink-0 px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-orange-500 hover:text-orange-400 transition-colors whitespace-nowrap">
                  {f}
                </button>
              ))}
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {SITE_PHOTOS.map(photo => (
                <div key={photo.id} className={`${photo.color} rounded-xl aspect-square flex flex-col items-center justify-center gap-1 relative overflow-hidden`}>
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                    <div className="text-[9px] text-white font-medium truncate">{photo.label}</div>
                    <div className="text-[8px] text-slate-400">{photo.date}</div>
                  </div>
                </div>
              ))}
              {/* Add more placeholder */}
              <div className="bg-slate-800 border border-dashed border-slate-600 rounded-xl aspect-square flex items-center justify-center">
                <Plus className="w-6 h-6 text-slate-600" />
              </div>
            </div>

            <div className="text-center text-xs text-slate-500">{SITE_PHOTOS.length} ảnh · Tự động backup lên cloud</div>
          </div>
        )}

        {/* ── Tab: QA ── */}
        {tab === "qa" && (
          <div className="space-y-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">
                {qaItems.filter(q => q.status === "pass").length}/{qaItems.length} hạng mục đạt
              </span>
              <span className={`text-sm font-bold ${
                qaItems.filter(q => q.status === "fail").length > 0 ? "text-red-400" : "text-green-400"
              }`}>
                {qaItems.filter(q => q.status === "fail").length > 0
                  ? `⚠ ${qaItems.filter(q => q.status === "fail").length} lỗi`
                  : "✓ OK"}
              </span>
            </div>

            <p className="text-xs text-slate-500">Nhấn vào hạng mục để chuyển trạng thái: Chờ → Đạt → Lỗi → Chờ</p>

            <div className="space-y-2">
              {qaItems.map(item => (
                <button key={item.id} onClick={() => toggleQA(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                    item.status === "pass"    ? "bg-green-900/30 border-green-700"  :
                    item.status === "fail"    ? "bg-red-900/30 border-red-700"      :
                    "bg-slate-800 border-slate-700"
                  }`}>
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm ${
                    item.status === "pass"    ? "bg-green-900 text-green-400" :
                    item.status === "fail"    ? "bg-red-900 text-red-400"     :
                    "bg-slate-700 text-slate-500"
                  }`}>
                    {item.status === "pass" ? "✓" : item.status === "fail" ? "✗" : "?"}
                  </div>
                  <span className={`text-sm flex-1 leading-snug ${
                    item.status === "pass"    ? "text-green-300" :
                    item.status === "fail"    ? "text-red-300"   :
                    "text-slate-300"
                  }`}>{item.desc}</span>
                </button>
              ))}
            </div>

            {qaItems.filter(q => q.status === "fail").length > 0 && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">
                  Có {qaItems.filter(q => q.status === "fail").length} hạng mục không đạt.
                  PM và QA sẽ được thông báo.
                </p>
              </div>
            )}

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <ClipboardCheck className="w-4 h-4" /> Gửi báo cáo QA hôm nay
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
