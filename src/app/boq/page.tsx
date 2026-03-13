"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  FileText, AlertTriangle, ChevronRight, ChevronDown,
  Plus, Download, ArrowLeft, HardHat, Search, Filter,
  Pencil, Trash2, X, Check, ChevronDown as DropIcon
} from "lucide-react"
import { mockProjects, mockBoqLines, fmtVND } from "@/lib/mock-data"

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = "approved" | "pending" | "draft"

interface BOQLine {
  id: number
  project_id: number
  category: string
  item_name: string
  uom: string
  qty: number
  cost_price: number
  selling_price: number
  progress_pct: number
  margin_warning: boolean
  status: Status
  note?: string
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED: BOQLine[] = [
  ...mockBoqLines.map((l, i) => ({ ...l, status: (["approved","approved","approved","pending","draft","approved","approved","approved","approved"] as Status[])[i] ?? "approved" as Status, note: "" })),
  { id: 101, project_id: 2, category: "Phần thô",        item_name: "Cải tạo vách ngăn văn phòng",           uom: "m²",     qty: 120, cost_price: 280_000,     selling_price: 380_000,     progress_pct: 10,  margin_warning: false, status: "approved" },
  { id: 102, project_id: 2, category: "Phần thô",        item_name: "Chống thấm sàn toilet",                 uom: "m²",     qty: 35,  cost_price: 250_000,     selling_price: 340_000,     progress_pct: 0,   margin_warning: false, status: "pending"  },
  { id: 103, project_id: 2, category: "Điện – M&E",      item_name: "Hệ thống điện chiếu sáng văn phòng",    uom: "điểm",   qty: 150, cost_price: 380_000,     selling_price: 520_000,     progress_pct: 0,   margin_warning: false, status: "approved" },
  { id: 104, project_id: 2, category: "Điện – M&E",      item_name: "Hệ thống mạng/data structured cabling", uom: "port",   qty: 80,  cost_price: 650_000,     selling_price: 900_000,     progress_pct: 0,   margin_warning: false, status: "draft"    },
  { id: 105, project_id: 2, category: "Nội thất",        item_name: "Vách kính cường lực phòng họp",         uom: "m²",     qty: 45,  cost_price: 1_800_000,   selling_price: 2_400_000,   progress_pct: 0,   margin_warning: false, status: "approved" },
  { id: 106, project_id: 2, category: "Nội thất",        item_name: "Sàn vinyl plank chống mài mòn",         uom: "m²",     qty: 350, cost_price: 320_000,     selling_price: 420_000,     progress_pct: 0,   margin_warning: false, status: "pending"  },
  { id: 107, project_id: 2, category: "Hoàn thiện",      item_name: "Sơn nội thất văn phòng",                uom: "m²",     qty: 500, cost_price: 52_000,      selling_price: 72_000,      progress_pct: 0,   margin_warning: false, status: "approved" },
  { id: 201, project_id: 3, category: "Phần thô",        item_name: "Phần móng & kết cấu biệt thự",          uom: "m³",     qty: 85,  cost_price: 2_800_000,   selling_price: 3_800_000,   progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 202, project_id: 3, category: "Phần thô",        item_name: "Xây gạch tường bao",                    uom: "m²",     qty: 420, cost_price: 280_000,     selling_price: 380_000,     progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 203, project_id: 3, category: "Điện – M&E",      item_name: "Hệ thống điện smart home",              uom: "điểm",   qty: 120, cost_price: 1_200_000,   selling_price: 1_600_000,   progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 204, project_id: 3, category: "Điện – M&E",      item_name: "Hệ thống CCTV 16 camera",               uom: "bộ",     qty: 1,   cost_price: 28_000_000,  selling_price: 36_000_000,  progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 205, project_id: 3, category: "Hồ bơi & sân vườn", item_name: "Hồ bơi ngoài trời 8m×4m",            uom: "trọn gói", qty: 1, cost_price: 185_000_000, selling_price: 240_000_000, progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 206, project_id: 3, category: "Hồ bơi & sân vườn", item_name: "Sân vườn & tiểu cảnh",               uom: "m²",     qty: 200, cost_price: 850_000,     selling_price: 1_100_000,   progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 207, project_id: 3, category: "Nội thất",        item_name: "Nội thất cao cấp toàn biệt thự",        uom: "trọn gói", qty: 1, cost_price: 680_000_000, selling_price: 820_000_000, progress_pct: 100, margin_warning: false, status: "approved" },
  { id: 208, project_id: 3, category: "Hoàn thiện",      item_name: "Sơn ngoại thất + ốp đá mặt tiền",       uom: "m²",     qty: 180, cost_price: 850_000,     selling_price: 1_050_000,   progress_pct: 100, margin_warning: false, status: "approved" },
]

const CONTRACTOR_MAP: Record<string, string> = {
  "Phần thô":           "Xây dựng Tiến Phát",
  "Điện – M&E":         "M&E Đông Dương",
  "Nội thất":           "Nội thất Minh Long",
  "Hoàn thiện":         "Hoàn thiện Gia Phát",
  "Hồ bơi & sân vườn":  "Cảnh quan Xanh Viet",
}

const UOM_OPTIONS = ["m²", "m³", "m dài", "điểm", "bộ", "cái", "tấn", "kg", "lít", "port", "trọn gói"]
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "approved", label: "Đã duyệt" },
  { value: "pending",  label: "Chờ duyệt" },
  { value: "draft",    label: "Nháp" },
]
const STATUS_COLORS: Record<Status, string> = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  draft:    "bg-gray-100 text-gray-500",
}

// ── Blank form ─────────────────────────────────────────────────────────────────
const BLANK = (projectId: number, category: string): Omit<BOQLine, "id"> => ({
  project_id: projectId, category,
  item_name: "", uom: "m²", qty: 1,
  cost_price: 0, selling_price: 0,
  progress_pct: 0, margin_warning: false,
  status: "draft", note: "",
})

// ── Number input helper ────────────────────────────────────────────────────────
function numVal(s: string) { return parseFloat(s.replace(/[^0-9.]/g, "")) || 0 }

// ── BOQLine Modal ──────────────────────────────────────────────────────────────
function LineModal({
  initial, projectId, allCategories, onSave, onClose,
}: {
  initial: BOQLine | null
  projectId: number
  allCategories: string[]
  onSave: (line: BOQLine) => void
  onClose: () => void
}) {
  const isNew = initial === null
  const [form, setForm] = useState<Omit<BOQLine, "id">>(
    initial ? { ...initial } : BLANK(projectId, allCategories[0] ?? "Phần thô")
  )
  const [newCat, setNewCat] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => {
      const next = { ...prev, [k]: v }
      next.margin_warning = next.selling_price > 0 &&
        ((next.selling_price - next.cost_price) / next.selling_price) < 0.15
      return next
    })

  const margin = form.selling_price > 0
    ? ((form.selling_price - form.cost_price) / form.selling_price * 100)
    : 0
  const total = form.qty * form.selling_price

  const handleSave = () => {
    if (!form.item_name.trim()) { nameRef.current?.focus(); return }
    if (form.selling_price <= 0) return
    onSave({ ...form, id: initial?.id ?? Date.now() })
  }

  const cats = newCat
    ? [...allCategories.filter(c => !allCategories.includes(newCat)), newCat]
    : allCategories

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isNew ? "Thêm hạng mục BOQ" : "Chỉnh sửa hạng mục"}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Item name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tên hạng mục <span className="text-red-500">*</span></label>
            <input ref={nameRef} value={form.item_name} onChange={e => set("item_name", e.target.value)}
              placeholder="VD: Đập tường cũ & xử lý mặt bằng"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nhóm công việc</label>
            <div className="flex gap-2">
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={newCat} onChange={e => { setNewCat(e.target.value); if (e.target.value) set("category", e.target.value) }}
                placeholder="Nhóm mới..."
                className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>

          {/* UOM + Qty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn vị tính</label>
              <select value={form.uom} onChange={e => set("uom", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Khối lượng</label>
              <input type="number" min={0} step="any" value={form.qty}
                onChange={e => set("qty", numVal(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn giá bán (VND) <span className="text-red-500">*</span></label>
              <input type="number" min={0} value={form.selling_price}
                onChange={e => set("selling_price", numVal(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn giá vốn (VND)</label>
              <input type="number" min={0} value={form.cost_price}
                onChange={e => set("cost_price", numVal(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>

          {/* Live preview */}
          <div className={`rounded-xl p-3 border ${form.margin_warning ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-100"}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Thành tiền:</span>
              <span className="font-bold text-orange-700">{fmtVND(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Biên lợi nhuận:</span>
              <span className={`font-bold flex items-center gap-1 ${margin < 15 ? "text-red-600" : margin < 25 ? "text-yellow-600" : "text-green-600"}`}>
                {margin.toFixed(1)}%
                {form.margin_warning && <AlertTriangle className="w-3.5 h-3.5" />}
              </span>
            </div>
            {form.margin_warning && (
              <p className="text-xs text-red-600 mt-1 font-medium">⚠ Biên lợi nhuận thấp hơn 15% — cần xem lại đơn giá</p>
            )}
          </div>

          {/* Progress + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tiến độ thực hiện: <span className="text-orange-600">{form.progress_pct}%</span></label>
              <input type="range" min={0} max={100} value={form.progress_pct}
                onChange={e => set("progress_pct", Number(e.target.value))}
                className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => set("status", e.target.value as Status)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
            <textarea value={form.note ?? ""} onChange={e => set("note", e.target.value)}
              rows={2} placeholder="Mô tả kỹ thuật, yêu cầu vật liệu..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
            Hủy
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm">
            <Check className="w-3.5 h-3.5" />
            {isNew ? "Thêm hạng mục" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({ line, onConfirm, onClose }: { line: BOQLine; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Xóa hạng mục?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Thao tác này không thể hoàn tác</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-800">{line.item_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{line.category} · {fmtVND(line.qty * line.selling_price)}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Xóa</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
function BOQContent() {
  const params = useSearchParams()
  const projectParam = params.get("project")

  const [lines, setLines] = useState<BOQLine[]>(SEED)
  const [selectedProject, setSelectedProject] = useState<string>(projectParam ?? "all")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Modal state
  const [modal, setModal] = useState<{ mode: "add"; category: string } | { mode: "edit"; line: BOQLine } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BOQLine | null>(null)
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  useEffect(() => { if (projectParam) setSelectedProject(projectParam) }, [projectParam])

  const allProjects = mockProjects
  const projectIdNum = selectedProject !== "all" ? Number(selectedProject) : null

  const allCategoriesForProject = [...new Set(lines.filter(l => !projectIdNum || l.project_id === projectIdNum).map(l => l.category))]

  const filtered = lines.filter(l => {
    if (projectIdNum && l.project_id !== projectIdNum) return false
    if (search && !l.item_name.toLowerCase().includes(search.toLowerCase()) && !l.category.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== "all" && l.category !== categoryFilter) return false
    if (statusFilter !== "all" && l.status !== statusFilter) return false
    return true
  })

  const categories = [...new Set(filtered.map(l => l.category))]
  const totalBOQ  = filtered.reduce((s, l) => s + l.qty * l.selling_price, 0)
  const totalCost = filtered.reduce((s, l) => s + l.qty * l.cost_price, 0)
  const profit    = totalBOQ - totalCost
  const margin    = totalBOQ > 0 ? (profit / totalBOQ) * 100 : 0
  const warnCount = filtered.filter(l => l.margin_warning).length

  const toggleCat = (cat: string) =>
    setCollapsed(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n })

  // CRUD handlers
  const handleSave = (line: BOQLine) => {
    setLines(prev => prev.some(l => l.id === line.id)
      ? prev.map(l => l.id === line.id ? line : l)
      : [...prev, line]
    )
    setModal(null)
  }
  const handleDelete = (id: number) => {
    setLines(prev => prev.filter(l => l.id !== id))
    setDeleteTarget(null)
  }

  const selectedProjectObj = allProjects.find(p => p.id === Number(selectedProject))

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Dự toán BOQ</h1>
              {selectedProjectObj && (
                <span className="text-sm text-gray-500 font-normal">— {selectedProjectObj.project_name}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Bóc tách khối lượng · Gán nhà thầu · Kiểm soát margin</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedProjectObj && (
              <a href="/pipeline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Về dự án
              </a>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              <Download className="w-3.5 h-3.5" /> Xuất Excel
            </button>
            <button
              onClick={() => setModal({ mode: "add", category: allCategoriesForProject[0] ?? "Phần thô" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Thêm hạng mục
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0">
        <div className="flex items-center gap-6 flex-wrap">
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
            <div className="text-base font-semibold text-gray-700">{filtered.length}</div>
          </div>
          {warnCount > 0 && (
            <>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700">{warnCount} margin thấp</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-2.5 shrink-0 flex items-center gap-3 flex-wrap">
        <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setCategoryFilter("all") }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="all">Tất cả dự án</option>
          {allProjects.map(p => <option key={p.id} value={String(p.id)}>{p.project_code} — {p.project_name}</option>)}
        </select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm hạng mục..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="all">Tất cả nhóm</option>
          {allCategoriesForProject.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="all">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {(search || categoryFilter !== "all" || statusFilter !== "all") && (
          <button onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all") }}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Xóa lọc
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FileText className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium">Không có hạng mục nào</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc chọn dự án khác</p>
            {selectedProject !== "all" && (
              <button onClick={() => setModal({ mode: "add", category: allCategoriesForProject[0] ?? "Phần thô" })}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                <Plus className="w-4 h-4" /> Thêm hạng mục đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {categories.map(cat => {
              const catLines  = filtered.filter(l => l.category === cat)
              const catTotal  = catLines.reduce((s, l) => s + l.qty * l.selling_price, 0)
              const catCost   = catLines.reduce((s, l) => s + l.qty * l.cost_price, 0)
              const catMargin = catTotal > 0 ? ((catTotal - catCost) / catTotal * 100) : 0
              const contractor = CONTRACTOR_MAP[cat]
              const isCollapsed = collapsed.has(cat)

              return (
                <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Category header */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <button onClick={() => toggleCat(cat)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      {isCollapsed
                        ? <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      }
                      <span className="text-sm font-bold text-gray-800">{cat}</span>
                      <span className="text-xs text-gray-400">{catLines.length} hạng mục</span>
                      {contractor && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                          <HardHat className="w-3 h-3" />{contractor}
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-xs text-gray-500">
                        Margin: <span className={`font-bold ${catMargin < 15 ? "text-red-600" : catMargin < 25 ? "text-yellow-600" : "text-green-600"}`}>{catMargin.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm font-bold text-gray-700">{fmtVND(catTotal)}</div>
                      {/* Add line button per category */}
                      <button
                        onClick={() => {
                          setModal({ mode: "add", category: cat })
                          if (isCollapsed) toggleCat(cat)
                        }}
                        className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 border border-orange-200 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition">
                        <Plus className="w-3 h-3" /> Thêm
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <>
                      {/* Column headers */}
                      <div className="px-5 py-1.5 bg-white border-b border-gray-50 grid gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                        style={{ gridTemplateColumns: "1fr 56px 72px 100px 100px 72px 90px 84px 68px" }}>
                        <span>Hạng mục</span>
                        <span className="text-center">ĐVT</span>
                        <span className="text-right">KL</span>
                        <span className="text-right">Đơn giá bán</span>
                        <span className="text-right">Đơn giá vốn</span>
                        <span className="text-center">Margin</span>
                        <span className="text-right">Thành tiền</span>
                        <span className="text-center">Trạng thái</span>
                        <span className="text-center">Thao tác</span>
                      </div>

                      {catLines.map((line, idx) => {
                        const lineTotal  = line.qty * line.selling_price
                        const lineMargin = line.selling_price > 0
                          ? ((line.selling_price - line.cost_price) / line.selling_price * 100) : 0
                        const isHovered  = hoveredLine === line.id

                        return (
                          <div key={line.id}
                            onMouseEnter={() => setHoveredLine(line.id)}
                            onMouseLeave={() => setHoveredLine(null)}
                            className={`px-5 py-2.5 grid gap-2 items-center border-b border-gray-50 last:border-0 text-sm transition-colors ${
                              line.margin_warning ? "bg-red-50/60 hover:bg-red-50"
                              : idx % 2 === 0 ? "bg-white hover:bg-orange-50/30"
                              : "bg-gray-50/30 hover:bg-orange-50/30"
                            }`}
                            style={{ gridTemplateColumns: "1fr 56px 72px 100px 100px 72px 90px 84px 68px" }}>

                            <div className="min-w-0">
                              <div className={`font-medium truncate text-xs ${line.margin_warning ? "text-red-700" : "text-gray-800"}`}>
                                {line.item_name}
                                {line.margin_warning && (
                                  <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">⚠ Margin thấp</span>
                                )}
                              </div>
                              {line.note && <div className="text-[10px] text-gray-400 truncate mt-0.5">{line.note}</div>}
                              {line.progress_pct > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="flex-1 max-w-[72px] h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${line.progress_pct}%` }} />
                                  </div>
                                  <span className="text-[9px] text-gray-400">{line.progress_pct}%</span>
                                </div>
                              )}
                            </div>

                            <span className="text-[11px] text-gray-500 text-center">{line.uom}</span>
                            <span className="text-[11px] text-gray-700 text-right tabular-nums">{line.qty.toLocaleString("vi-VN")}</span>
                            <span className="text-[11px] text-gray-700 text-right tabular-nums">{fmtVND(line.selling_price)}</span>
                            <span className="text-[11px] text-gray-400 text-right tabular-nums">{fmtVND(line.cost_price)}</span>
                            <span className={`text-[11px] font-semibold text-center ${lineMargin < 15 ? "text-red-600" : lineMargin < 25 ? "text-yellow-600" : "text-green-600"}`}>
                              {lineMargin.toFixed(1)}%
                            </span>
                            <span className="text-[11px] font-semibold text-gray-800 text-right tabular-nums">{fmtVND(lineTotal)}</span>

                            <div className="flex justify-center">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[line.status]}`}>
                                {STATUS_OPTIONS.find(o => o.value === line.status)?.label}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className={`flex items-center justify-center gap-1 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                              <button
                                onClick={() => setModal({ mode: "edit", line })}
                                title="Chỉnh sửa"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(line)}
                                title="Xóa"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Category subtotal */}
                      <div className="px-5 py-2.5 bg-orange-50/60 border-t border-orange-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Tổng {cat}</span>
                        <div className="flex items-center gap-6">
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
            <div className="bg-white rounded-xl border-2 border-orange-300 shadow-sm">
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Tổng cộng</div>
                  <div className="text-xs text-gray-500 mt-0.5">{filtered.length} hạng mục · {categories.length} nhóm</div>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div><div className="text-xs text-gray-400">Tổng vốn</div><div className="text-sm font-semibold text-gray-700">{fmtVND(totalCost)}</div></div>
                  <div><div className="text-xs text-gray-400">Lợi nhuận</div><div className={`text-sm font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtVND(profit)}</div></div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Biên LN</div>
                    <div className={`text-base font-bold flex items-center gap-1 justify-end ${margin < 15 ? "text-red-600" : margin < 25 ? "text-yellow-600" : "text-green-600"}`}>
                      {margin.toFixed(1)}%
                      {margin < 15 && <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div><div className="text-xs text-gray-400 mb-0.5">Tổng dự toán</div><div className="text-xl font-bold text-orange-600">{fmtVND(totalBOQ)}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {modal && (
        <LineModal
          initial={modal.mode === "edit" ? modal.line : null}
          projectId={projectIdNum ?? (allProjects[0]?.id ?? 1)}
          allCategories={allCategoriesForProject.length > 0 ? allCategoriesForProject : ["Phần thô", "Điện – M&E", "Nội thất", "Hoàn thiện"]}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          line={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default function BOQPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>}>
      <BOQContent />
    </Suspense>
  )
}
