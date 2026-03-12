"use client"
import { useState } from "react"
import Image from "next/image"
import {
  CheckCircle, Clock, AlertTriangle, Camera, ChevronLeft,
  ChevronRight, X, Phone, MapPin, Calendar, TrendingUp, FileCheck
} from "lucide-react"

// ── Mock project data for guest view ─────────────────────────────────────────

const MOCK_PROJECT = {
  token: "proj-abc123",
  project_code: "PRJ-2025-0001",
  project_name: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
  customer_name: "Anh/Chị Nguyễn Văn An",
  address: "Tầng 12, Block A, Mỹ Khánh, Phú Mỹ Hưng, Q.7, HCM",
  pm_name: "Trần Thị Bình",
  pm_phone: "0912345678",
  start_date: "01/02/2025",
  expected_end_date: "31/08/2025",
  progress_pct: 48,
  contract_value: 820_000_000,
  total_paid: 410_000_000,
}

const PHASES = [
  { id: 1, name: "Phá dỡ & Chuẩn bị", progress: 100, status: "completed", date: "01/02 – 14/02" },
  { id: 2, name: "Xây dựng thô (Điện, Nước)", progress: 100, status: "completed", date: "15/02 – 31/03" },
  { id: 3, name: "Trần & Vách ngăn", progress: 65, status: "in-progress", date: "01/04 – 15/05" },
  { id: 4, name: "Sàn & Ốp lát", progress: 0, status: "not-started", date: "16/05 – 20/06" },
  { id: 5, name: "Nội thất & Hoàn thiện", progress: 0, status: "not-started", date: "21/06 – 25/07" },
  { id: 6, name: "Nghiệm thu & Bàn giao", progress: 0, status: "not-started", date: "26/07 – 31/07" },
]

const MILESTONES = [
  { order: 1, name: "Đặt cọc ký hợp đồng", pct: 20, amount: 164_000_000, date: "01/02/2025", status: "paid" },
  { order: 2, name: "Nghiệm thu phần thô", pct: 30, amount: 246_000_000, date: "30/04/2025", status: "paid" },
  { order: 3, name: "Nghiệm thu M&E hoàn thiện", pct: 30, amount: 246_000_000, date: "15/07/2025", status: "pending" },
  { order: 4, name: "Bàn giao & hoàn công", pct: 20, amount: 164_000_000, date: "30/08/2025", status: "pending" },
]

const PHOTOS = [
  { id: 1, src: null, caption: "Phá dỡ nội thất cũ hoàn thành", date: "14/02/2025", phase: "Phá dỡ", color: "bg-slate-200" },
  { id: 2, src: null, caption: "Đi dây điện âm tường phòng khách", date: "22/02/2025", phase: "Thô", color: "bg-yellow-100" },
  { id: 3, src: null, caption: "Hệ thống cấp thoát nước hoàn thiện", date: "05/03/2025", phase: "Thô", color: "bg-blue-100" },
  { id: 4, src: null, caption: "Khung trần thạch cao phòng ngủ master", date: "12/04/2025", phase: "Trần", color: "bg-orange-100" },
  { id: 5, src: null, caption: "Thi công vách thạch cao khu vực bếp", date: "20/04/2025", phase: "Trần", color: "bg-green-100" },
  { id: 6, src: null, caption: "Hoàn thiện trần thạch cao phòng khách", date: "28/04/2025", phase: "Trần", color: "bg-purple-100" },
]

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuestProjectPage() {
  const [tab, setTab] = useState<"progress" | "photos" | "payment">("progress")
  const [lightbox, setLightbox] = useState<number | null>(null)

  const p = MOCK_PROJECT
  const paidCount = MILESTONES.filter(m => m.status === "paid").length

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #1a3a4a 100%)" }}>
      {/* Header */}
      <div className="px-4 py-5 text-center border-b border-white/10">
        <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/20 mb-3">
          <Image src="/logo.svg" alt="Thủ Thiêm Construction" width={160} height={40} className="h-9 w-auto" />
        </div>
        <h1 className="text-xl font-bold text-white">Cổng thông tin khách hàng</h1>
        <p className="text-slate-400 text-sm mt-0.5">Theo dõi tiến độ dự án của bạn</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Project info card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-mono text-gray-400 mb-0.5">{p.project_code}</div>
            <h2 className="text-lg font-bold text-gray-900">{p.project_name}</h2>
            <div className="text-sm text-gray-500 mt-1">Kính gửi: {p.customer_name}</div>
            <div className="flex items-start gap-1 text-xs text-gray-400 mt-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{p.address}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">Tiến độ tổng thể</div>
              <div className="text-2xl font-bold" style={{ color: "#E87625" }}>{p.progress_pct}%</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${p.progress_pct}%`, backgroundColor: "#E87625" }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.start_date}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.expected_end_date}</span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-0 border-t border-gray-100 divide-x divide-gray-100">
            <div className="px-4 py-3 text-center">
              <div className="text-xs text-gray-400">Giai đoạn</div>
              <div className="font-bold text-gray-900 mt-0.5 text-sm">3/6</div>
              <div className="text-[10px] text-gray-400">hoàn thành</div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-xs text-gray-400">Thanh toán</div>
              <div className="font-bold text-green-600 mt-0.5 text-sm">{paidCount}/{MILESTONES.length}</div>
              <div className="text-[10px] text-gray-400">đợt đã thu</div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-xs text-gray-400">PM phụ trách</div>
              <div className="font-bold text-gray-900 mt-0.5 text-xs leading-tight">{p.pm_name}</div>
              <a href={`tel:${p.pm_phone}`} className="text-[10px] text-orange-500 flex items-center justify-center gap-0.5 mt-0.5">
                <Phone className="w-2.5 h-2.5" />{p.pm_phone}
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 p-1 rounded-xl gap-1">
          {[
            { key: "progress", label: "📋 Tiến độ" },
            { key: "photos", label: "📷 Ảnh thi công" },
            { key: "payment", label: "💰 Thanh toán" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-white text-gray-900 shadow" : "text-white/70 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Progress ── */}
        {tab === "progress" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Các giai đoạn thi công</h3>
              <p className="text-xs text-gray-500 mt-0.5">Cập nhật mới nhất — {new Date().toLocaleDateString("vi-VN")}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {PHASES.map((phase, idx) => (
                <div key={phase.id} className={`px-5 py-4 ${phase.status === "in-progress" ? "bg-orange-50/50" : ""}`}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      phase.status === "completed" ? "bg-green-100" :
                      phase.status === "in-progress" ? "bg-orange-100" : "bg-gray-100"
                    }`}>
                      {phase.status === "completed" ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                       phase.status === "in-progress" ? <TrendingUp className="w-4 h-4 text-orange-600" /> :
                       <Clock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className={`font-semibold text-sm ${phase.status === "not-started" ? "text-gray-400" : "text-gray-900"}`}>
                            {idx + 1}. {phase.name}
                            {phase.status === "in-progress" && (
                              <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">Đang thi công</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{phase.date}
                          </div>
                        </div>
                        <div className={`text-sm font-bold shrink-0 ${
                          phase.status === "completed" ? "text-green-600" :
                          phase.status === "in-progress" ? "text-orange-600" : "text-gray-300"
                        }`}>{phase.progress}%</div>
                      </div>
                      {phase.status !== "not-started" && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-100 rounded-full">
                            <div className={`h-full rounded-full transition-all ${phase.status === "completed" ? "bg-green-500" : "bg-orange-400"}`}
                              style={{ width: `${phase.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Photos ── */}
        {tab === "photos" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-500" />
                Ảnh tiến độ thi công
              </h3>
              <span className="text-xs text-gray-400">{PHOTOS.length} ảnh</span>
            </div>

            {/* Phase filter chips */}
            <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto">
              {["Tất cả", ...new Set(PHOTOS.map(p => p.phase))].map(phase => (
                <span key={phase} className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition">
                  {phase}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              {PHOTOS.map((photo, idx) => (
                <button key={photo.id} onClick={() => setLightbox(idx)}
                  className={`aspect-square rounded-xl overflow-hidden relative ${photo.color} border border-gray-100 hover:opacity-90 transition`}>
                  {/* Placeholder image */}
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-[10px] text-gray-400 text-center px-2 leading-tight">{photo.phase}</span>
                  </div>
                  {/* Caption overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2">
                    <div className="text-[10px] text-white font-medium leading-tight">{photo.caption}</div>
                    <div className="text-[9px] text-white/60 mt-0.5">{photo.date}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Payment ── */}
        {tab === "payment" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Mốc thanh toán</h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Đã thanh toán</span>
                <span className="font-bold text-green-600">{fmtVND(p.total_paid)}</span>
              </div>
              <div className="mt-1 h-2 bg-gray-100 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(p.total_paid / p.contract_value) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Đã thu: {fmtVND(p.total_paid)}</span>
                <span>Tổng HĐ: {fmtVND(p.contract_value)}</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {MILESTONES.map(m => (
                <div key={m.order} className={`px-5 py-4 ${m.status === "paid" ? "" : "opacity-70"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${m.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {m.status === "paid" ? <CheckCircle className="w-4 h-4" /> : m.order}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className={`font-semibold text-sm ${m.status === "paid" ? "text-gray-900" : "text-gray-500"}`}>
                            Đợt {m.order}: {m.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />Dự kiến: {m.date}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-bold text-sm ${m.status === "paid" ? "text-green-600" : "text-gray-500"}`}>
                            {fmtVND(m.amount)}
                          </div>
                          <div className="text-[10px] text-gray-400">{m.pct}% HĐ</div>
                        </div>
                      </div>
                      <div className="mt-1.5">
                        {m.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-2.5 h-2.5" />Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5" />Chưa đến hạn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="px-5 py-4 bg-orange-50 border-t border-orange-100">
              <div className="text-xs font-semibold text-orange-800 mb-2">Liên hệ PM của bạn</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{p.pm_name}</div>
                  <div className="text-xs text-gray-500">Project Manager</div>
                </div>
                <a href={`tel:${p.pm_phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition">
                  <Phone className="w-3.5 h-3.5" />Gọi ngay
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs pb-4">
          <p>© 2026 Thủ Thiêm Construction · <span className="text-orange-400">0901 234 567</span></p>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <button onClick={() => setLightbox(l => l !== null && l > 0 ? l - 1 : l)} className="absolute left-4 text-white/70 hover:text-white">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="max-w-sm w-full">
            <div className={`aspect-square rounded-2xl ${PHOTOS[lightbox].color} flex items-center justify-center`}>
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
            <div className="text-center mt-3">
              <div className="text-white font-medium">{PHOTOS[lightbox].caption}</div>
              <div className="text-white/50 text-sm mt-1">{PHOTOS[lightbox].date} · {PHOTOS[lightbox].phase}</div>
              <div className="text-white/30 text-xs mt-1">{lightbox + 1} / {PHOTOS.length}</div>
            </div>
          </div>
          <button onClick={() => setLightbox(l => l !== null && l < PHOTOS.length - 1 ? l + 1 : l)} className="absolute right-4 text-white/70 hover:text-white">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  )
}
