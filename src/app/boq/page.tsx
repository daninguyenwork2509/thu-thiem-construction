"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  FileText, AlertTriangle, ChevronRight, ChevronDown,
  Plus, Download, ArrowLeft, HardHat, Search, Filter
} from "lucide-react"
import { mockProjects, mockBoqLines, fmtVND } from "@/lib/mock-data"

// ── Extended mock BOQ data ─────────────────────────────────────────────────────
const EXTRA_BOQ = [
  // PRJ-2025-0002 (id=2)
  { id: 101, project_id: 2, category: "Phần thô", item_name: "Cải tạo vách ngăn văn phòng", uom: "m²", qty: 120, cost_price: 280_000, selling_price: 380_000, progress_pct: 10, margin_warning: false },
  { id: 102, project_id: 2, category: "Phần thô", item_name: "Chống thấm sàn toilet", uom: "m²", qty: 35, cost_price: 250_000, selling_price: 340_000, progress_pct: 0, margin_warning: false },
  { id: 103, project_id: 2, category: "Điện – M&E", item_name: "Hệ thống điện chiếu sáng văn phòng", uom: "điểm", qty: 150, cost_price: 380_000, selling_price: 520_000, progress_pct: 0, margin_warning: false },
  { id: 104, project_id: 2, category: "Điện – M&E", item_name: "Hệ thống mạng/data structured cabling", uom: "port", qty: 80, cost_price: 650_000, selling_price: 900_000, progress_pct: 0, margin_warning: false },
  { id: 105, project_id: 2, category: "Nội thất", item_name: "Vách kính cường lực phòng họp", uom: "m²", qty: 45, cost_price: 1_800_000, selling_price: 2_400_000, progress_pct: 0, margin_warning: false },
  { id: 106, project_id: 2, category: "Nội thất", item_name: "Sàn vinyl plank chống mài mòn", uom: "m²", qty: 350, cost_price: 320_000, selling_price: 420_000, progress_pct: 0, margin_warning: false },
  { id: 107, project_id: 2, category: "Hoàn thiện", item_name: "Sơn nội thất văn phòng", uom: "m²", qty: 500, cost_price: 52_000, selling_price: 72_000, progress_pct: 0, margin_warning: false },
  // PRJ-2024-0015 (id=3)
  { id: 201, project_id: 3, category: "Phần thô", item_name: "Phần móng & kết cấu biệt thự", uom: "m³", qty: 85, cost_price: 2_800_000, selling_price: 3_800_000, progress_pct: 100, margin_warning: false },
  { id: 202, project_id: 3, category: "Phần thô", item_name: "Xây gạch tường bao", uom: "m²", qty: 420, cost_price: 280_000, selling_price: 380_000, progress_pct: 100, margin_warning: false },
  { id: 203, project_id: 3, category: "Điện – M&E", item_name: "Hệ thống điện smart home", uom: "điểm", qty: 120, cost_price: 1_200_000, selling_price: 1_600_000, progress_pct: 100, margin_warning: false },
  { id: 204, project_id: 3, category: "Điện – M&E", item_name: "Hệ thống CCTV 16 camera", uom: "bộ", qty: 1, cost_price: 28_000_000, selling_price: 36_000_000, progress_pct: 100, margin_warning: false },
  { id: 205, project_id: 3, category: "Hồ bơi & sân vườn", item_name: "Hồ bơi ngoài trời 8m×4m", uom: "trọn gói", qty: 1, cost_price: 185_000_000, selling_price: 240_000_000, progress_pct: 100, margin_warning: false },
  { id: 206, project_id: 3, category: "Hồ bơi & sân vườn", item_name: "Sân vườn & tiểu cảnh", uom: "m²", qty: 200, cost_price: 850_000, selling_price: 1_100_000, progress_pct: 100, margin_warning: false },
  { id: 207, project_id: 3, category: "Nội thất", item_name: "Nội thất cao cấp toàn biệt thự", uom: "trọn gói", qty: 1, cost_price: 680_000_000, selling_price: 820_000_000, progress_pct: 100, margin_warning: false },
  { id: 208, project_id: 3, category: "Hoàn thiện", item_name: "Sơn ngoại thất + ốp đá mặt tiền", uom: "m²", qty: 180, cost_price: 850_000, selling_price: 1_050_000, progress_pct: 100, margin_warning: false },
]

const CONTRACTOR_MAP: Record<string, string> = {
  "Phần thô":          "Xây dựng Tiến Phát",
  "Điện – M&E":        "M&E Đông Dương",
  "Nội thất":          "Nội thất Minh Long",
  "Hoàn thiện":        "Hoàn thiện Gia Phát",
  "Hồ bơi & sân vườn": "Cảnh quan Xanh Viet",
}

const STATUS_OPTIONS = [
  { value: "all",      label: "Tất cả trạng thái" },
  { value: "approved", label: "Đã duyệt" },
  { value: "pending",  label: "Chờ duyệt" },
  { value: "draft",    label: "Nháp" },
]

// Assign mock status to lines
function getStatus(id: number): "approved" | "pending" | "draft" {
  if (id % 5 === 0) return "draft"
  if (id % 3 === 0) return "pending"
  return "approved"
}

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  draft:    "bg-gray-100 text-gray-500",
}
const STATUS_LABELS: Record<string, string> = {
  approved: "Đã duyệt",
  pending:  "Chờ duyệt",
  draft:    "Nháp",
}

// ── Inner Component (needs useSearchParams) ───────────────────────────────────
function BOQContent() {
  const params = useSearchParams()
  const projectParam = params.get("project")

  const allProjects = mockProjects
  const allLines = [...mockBoqLines, ...EXTRA_BOQ]

  const [selectedProject, setSelectedProject] = useState<string>(projectParam ?? "all")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Sync with URL param when it changes
  useEffect(() => {
    if (projectParam) setSelectedProject(projectParam)
  }, [projectParam])

  // Filter lines
  const filteredLines = allLines.filter(line => {
    if (selectedProject !== "all" && line.project_id !== Number(selectedProject)) return false
    if (search && !line.item_name.toLowerCase().includes(search.toLowerCase()) &&
        !line.category.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== "all" && line.category !== categoryFilter) return false
    if (statusFilter !== "all" && getStatus(line.id) !== statusFilter) return false
    return true
  })

  const categories = [...new Set(filteredLines.map(l => l.category))]
  const allCategories = [...new Set(allLines.filter(l =>
    selectedProject === "all" || l.project_id === Number(selectedProject)
  ).map(l => l.category))]

  const totalBOQ    = filteredLines.reduce((s, l) => s + l.qty * l.selling_price, 0)
  const totalCost   = filteredLines.reduce((s, l) => s + l.qty * l.cost_price, 0)
  const profit      = totalBOQ - totalCost
  const margin      = totalBOQ > 0 ? (profit / totalBOQ) * 100 : 0
  const warnCount   = filteredLines.filter(l => l.margin_warning).length

  const toggleCategory = (cat: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })

  const selectedProjectObj = allProjects.find(p => p.id === Number(selectedProject))

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {selectedProjectObj && (
              <Link href={`/pipeline`}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Dự toán BOQ</h1>
                {selectedProjectObj && (
                  <span className="text-sm text-gray-500 font-normal">
                    — {selectedProjectObj.project_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Bóc tách khối lượng · Gán nhà thầu · Kiểm soát margin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedProjectObj && (
              <Link href={`/pipeline`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Về dự án
              </Link>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              <Download className="w-3.5 h-3.5" /> Xuất Excel
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Thêm hạng mục
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Tổng dự toán</div>
            <div className="text-lg font-bold text-orange-600">{fmtVND(totalBOQ)}</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Chi phí</div>
            <div className="text-base font-semibold text-gray-700">{fmtVND(totalCost)}</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Lợi nhuận gộp</div>
            <div className={`text-base font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtVND(profit)}</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Biên LN</div>
            <div className={`text-base font-bold flex items-center gap-1 ${margin < 15 ? "text-red-600" : margin < 25 ? "text-yellow-600" : "text-green-600"}`}>
              {margin.toFixed(1)}%
              {margin < 15 && <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Hạng mục</div>
            <div className="text-base font-semibold text-gray-700">{filteredLines.length}</div>
          </div>
          {warnCount > 0 && (
            <>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700">{warnCount} hạng mục margin thấp</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-2.5 shrink-0 flex items-center gap-3">
        {/* Project selector */}
        <select
          value={selectedProject}
          onChange={e => { setSelectedProject(e.target.value); setCategoryFilter("all") }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 pr-7 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="all">Tất cả dự án</option>
          {allProjects.map(p => (
            <option key={p.id} value={String(p.id)}>{p.project_code} — {p.project_name}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm hạng mục..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 pr-7 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="all">Tất cả nhóm</option>
          {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 pr-7 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {(search || categoryFilter !== "all" || statusFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all") }}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
          >
            <Filter className="w-3 h-3" /> Xóa lọc
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {filteredLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FileText className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium">Không có hạng mục nào</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc chọn dự án khác</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {categories.map(cat => {
              const catLines = filteredLines.filter(l => l.category === cat)
              const catTotal      = catLines.reduce((s, l) => s + l.qty * l.selling_price, 0)
              const catCost       = catLines.reduce((s, l) => s + l.qty * l.cost_price, 0)
              const catMargin     = catTotal > 0 ? ((catTotal - catCost) / catTotal * 100) : 0
              const contractor    = CONTRACTOR_MAP[cat]
              const isCollapsed   = collapsed.has(cat)

              return (
                <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed
                        ? <ChevronRight className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                      <span className="text-sm font-bold text-gray-800">{cat}</span>
                      <span className="text-xs text-gray-400">{catLines.length} hạng mục</span>
                      {contractor && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          <HardHat className="w-3 h-3" />{contractor}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-xs text-gray-500">
                        Margin: <span className={`font-bold ${catMargin < 15 ? "text-red-600" : catMargin < 25 ? "text-yellow-600" : "text-green-600"}`}>{catMargin.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm font-bold text-gray-700">{fmtVND(catTotal)}</div>
                    </div>
                  </button>

                  {/* Lines */}
                  {!isCollapsed && (
                    <>
                      {/* Column headers */}
                      <div className="px-5 py-1.5 bg-white border-b border-gray-50 grid grid-cols-[1fr_60px_80px_100px_100px_80px_90px_90px] gap-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        <span>Hạng mục</span>
                        <span className="text-center">ĐVT</span>
                        <span className="text-right">KL</span>
                        <span className="text-right">Đơn giá bán</span>
                        <span className="text-right">Đơn giá vốn</span>
                        <span className="text-center">Margin</span>
                        <span className="text-right">Thành tiền</span>
                        <span className="text-center">Trạng thái</span>
                      </div>

                      {catLines.map((line, idx) => {
                        const lineTotal  = line.qty * line.selling_price
                        const lineMargin = line.selling_price > 0
                          ? ((line.selling_price - line.cost_price) / line.selling_price * 100)
                          : 0
                        const status = getStatus(line.id)
                        return (
                          <div key={line.id}
                            className={`px-5 py-3 grid grid-cols-[1fr_60px_80px_100px_100px_80px_90px_90px] gap-3 items-center border-b border-gray-50 last:border-0 text-sm transition-colors ${
                              line.margin_warning ? "bg-red-50/60 hover:bg-red-50" : idx % 2 === 0 ? "bg-white hover:bg-gray-50/80" : "bg-gray-50/30 hover:bg-gray-50"
                            }`}>

                            {/* Item name */}
                            <div className="min-w-0">
                              <div className={`font-medium truncate ${line.margin_warning ? "text-red-700" : "text-gray-800"}`}>
                                {line.item_name}
                                {line.margin_warning && (
                                  <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">⚠ Margin thấp</span>
                                )}
                              </div>
                              {/* Progress bar */}
                              {line.progress_pct > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="flex-1 max-w-[80px] h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${line.progress_pct}%` }} />
                                  </div>
                                  <span className="text-[9px] text-gray-400">{line.progress_pct}%</span>
                                </div>
                              )}
                            </div>

                            <span className="text-xs text-gray-500 text-center">{line.uom}</span>
                            <span className="text-xs text-gray-700 text-right tabular-nums">{line.qty.toLocaleString("vi-VN")}</span>
                            <span className="text-xs text-gray-700 text-right tabular-nums">{fmtVND(line.selling_price)}</span>
                            <span className="text-xs text-gray-500 text-right tabular-nums">{fmtVND(line.cost_price)}</span>
                            <span className={`text-xs font-semibold text-center ${lineMargin < 15 ? "text-red-600" : lineMargin < 25 ? "text-yellow-600" : "text-green-600"}`}>
                              {lineMargin.toFixed(1)}%
                            </span>
                            <span className="text-sm font-semibold text-gray-800 text-right tabular-nums">{fmtVND(lineTotal)}</span>
                            <div className="flex justify-center">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
                                {STATUS_LABELS[status]}
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {/* Category subtotal */}
                      <div className="px-5 py-2.5 bg-orange-50/60 border-t border-orange-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Tổng nhóm {cat}</span>
                        <div className="flex items-center gap-6 text-right">
                          <span className="text-xs text-gray-500">Vốn: {fmtVND(catCost)}</span>
                          <span className="text-sm font-bold text-orange-700">{fmtVND(catTotal)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {/* Grand Total */}
            <div className="bg-white rounded-xl border-2 border-orange-300 overflow-hidden shadow-sm">
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Tổng cộng</div>
                  <div className="text-xs text-gray-500 mt-0.5">{filteredLines.length} hạng mục · {categories.length} nhóm</div>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <div className="text-xs text-gray-400">Tổng vốn</div>
                    <div className="text-sm font-semibold text-gray-700">{fmtVND(totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Lợi nhuận</div>
                    <div className={`text-sm font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtVND(profit)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Biên LN</div>
                    <div className={`text-base font-bold flex items-center gap-1 justify-end ${margin < 15 ? "text-red-600" : margin < 25 ? "text-yellow-600" : "text-green-600"}`}>
                      {margin.toFixed(1)}%
                      {margin < 15 && <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Tổng dự toán</div>
                    <div className="text-xl font-bold text-orange-600">{fmtVND(totalBOQ)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page (wrap with Suspense for useSearchParams) ─────────────────────────────
export default function BOQPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>}>
      <BOQContent />
    </Suspense>
  )
}
