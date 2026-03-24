"use client"
import { useState, useMemo, useEffect } from "react"
import {
  Plus, Search, Filter, FileText, AlertTriangle,
  ChevronDown, ChevronRight, HardHat, Pencil, Trash2,
  X, Check, Download, Users, Clock, Camera,
} from "lucide-react"
import { 
  fmtVND, 
  ItemStatus, ContractorRef, ContractorPendingChange, 
  BOQItemV2 as BOQItem, BOQSubGroupV2 as BOQSubGroup, BOQGroupV2 as BOQGroup,
  getSeedBOQ 
} from "@/lib/project-data"
import { useAuth, type UserRole } from "@/lib/auth-store"

// ── Contractors ────────────────────────────────────────────────────────────────
const CONTRACTORS = [
  { id: "minh-phuc",  name: "Đội thợ Minh Phúc",      specialty: "Phần thô & Xây tô", rating: 4.5, emoji: "🏗️" },
  { id: "dong-duong", name: "M&E Đông Dương",          specialty: "M&E & Điện",        rating: 4.8, emoji: "⚡" },
  { id: "tien-thanh", name: "Gạch Ốp Lát Tiến Thành", specialty: "Ốp lát & Gạch",     rating: 4.4, emoji: "🪨" },
  { id: "an-khang",   name: "Đội Nội Thất An Khang",   specialty: "Nội thất gỗ",       rating: 4.3, emoji: "🪑" },
  { id: "quoc-bao",   name: "Thợ Sơn Quốc Bảo",        specialty: "Hoàn thiện & Sơn",  rating: 4.6, emoji: "🎨" },
  { id: "bao-chau",   name: "Điện lạnh Bảo Châu",      specialty: "M&E & Điện",        rating: 4.2, emoji: "❄️" },
  { id: "thanh-hung", name: "Đội thợ Thanh Hùng",      specialty: "Phần thô & Xây tô", rating: 3.9, emoji: "🔨" },
  // Adding the missing ones mapped in getSeedBOQ for E2E project:
  { id: "minh-phat",  name: "Đội Minh Phát",          specialty: "Phần thô & Xây tô", rating: 4.5, emoji: "🏗️" },
  { id: "dien-hung",  name: "Cty TNHH Điện Hưng",     specialty: "M&E & Điện",        rating: 4.6, emoji: "⚡" },
  { id: "thanh-binh", name: "Đội Thanh Bình",         specialty: "Hoàn thiện",        rating: 4.4, emoji: "🎨" },
  { id: "phuoc-loc",  name: "Xưởng Phước Lộc",        specialty: "Nội thất gỗ",       rating: 4.7, emoji: "🪑" },
  { id: "toto",       name: "Đại lý TOTO",            specialty: "Thiết bị vệ sinh",  rating: 4.9, emoji: "🛁" },
]
const cByID = Object.fromEntries(CONTRACTORS.map(c => [c.id, c]))

// ── Price Library ──────────────────────────────────────────────────────────────
const PRICE_LIBRARY = [
  { name: "Đập tường cũ & xử lý mặt bằng",    unit: "m²",   sell: 250_000,    cost: 180_000    },
  { name: "Xây tường ngăn mới (gạch nhẹ)",     unit: "m²",   sell: 420_000,    cost: 320_000    },
  { name: "Hệ thống điện âm tường toàn căn",   unit: "điểm", sell: 580_000,    cost: 450_000    },
  { name: "Thi công điều hòa trung tâm",        unit: "bộ",   sell: 15_800_000, cost: 12_500_000 },
  { name: "Đường ống cấp nước",                 unit: "m",    sell: 180_000,    cost: 130_000    },
  { name: "Gạch toilet 60×60",                  unit: "m²",   sell: 350_000,    cost: 240_000    },
  { name: "Gạch phòng khách 80×80",             unit: "m²",   sell: 480_000,    cost: 320_000    },
  { name: "Tủ bếp trên + dưới",                unit: "bộ",   sell: 45_000_000, cost: 32_000_000 },
  { name: "Tủ quần áo 3 cánh",                 unit: "bộ",   sell: 18_000_000, cost: 12_000_000 },
  { name: "Sơn nước nội thất 2 nước",           unit: "m²",   sell: 78_000,     cost: 55_000     },
  { name: "Ốp gạch toilet (60×60)",             unit: "m²",   sell: 520_000,    cost: 380_000    },
  { name: "Trần thạch cao phẳng",               unit: "m²",   sell: 280_000,    cost: 210_000    },
]

// ── Constants ──────────────────────────────────────────────────────────────────
const UOM_OPTIONS = ["m²", "m³", "m", "m dài", "điểm", "bộ", "cái", "tấn", "kg", "lít", "port", "trọn gói"]
const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "approved", label: "Đã duyệt" },
  { value: "done",     label: "Chờ nghiệm thu" },
  { value: "pending",  label: "Chờ duyệt" },
  { value: "draft",    label: "Nháp" },
]
const STATUS_COLORS: Record<ItemStatus, string> = {
  approved: "bg-green-100 text-green-700",
  done:     "bg-blue-100 text-blue-700",
  pending:  "bg-yellow-100 text-yellow-700",
  draft:    "bg-gray-100 text-gray-500",
}
const COL = "minmax(220px,2fr) 52px 68px 120px 90px 68px 80px 140px 100px"

// ── Helpers ────────────────────────────────────────────────────────────────────
function numVal(s: string) { return parseFloat(s.replace(/[^0-9.]/g, "")) || 0 }
const iSell    = (i: BOQItem) => i.quantity * i.unitPriceSell
const iCost    = (i: BOQItem) => i.quantity * i.unitPriceCost
const iMargin  = (i: BOQItem) => i.unitPriceSell > 0 ? (i.unitPriceSell - i.unitPriceCost) / i.unitPriceSell * 100 : 0
const sgSell   = (sg: BOQSubGroup) => sg.items.reduce((s, i) => s + iSell(i), 0)
const sgCost   = (sg: BOQSubGroup) => sg.items.reduce((s, i) => s + iCost(i), 0)
const gSell    = (g: BOQGroup)     => g.subGroups.reduce((s, sg) => s + sgSell(sg), 0)
const gCost    = (g: BOQGroup)     => g.subGroups.reduce((s, sg) => s + sgCost(sg), 0)
const mPct     = (sell: number, cost: number) => sell > 0 ? (sell - cost) / sell * 100 : 0
const mColor   = (m: number) => m < 15 ? "text-red-600" : m < 25 ? "text-yellow-600" : "text-green-600"

// ── Inline Contractor Picker (popover) ─────────────────────────────────────────
function ContractorPicker({
  rect, exclude, onSelect, onClose,
}: {
  rect: DOMRect; exclude?: string
  onSelect: (c: ContractorRef) => void
  onClose: () => void
}) {
  const [q, setQ] = useState("")
  const list = CONTRACTORS.filter(c => c.id !== exclude && (
    !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.specialty.toLowerCase().includes(q.toLowerCase())
  ))
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-72 overflow-hidden"
        style={{ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 296) }}>
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm nhà thầu..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
          {list.map(c => (
            <button key={c.id} type="button"
              onClick={() => { onSelect({ id: c.id, name: c.name }); onClose() }}
              className="w-full px-3 py-2.5 text-left hover:bg-orange-50 flex items-center gap-3 transition-colors">
              <span className="text-base shrink-0">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800">{c.name}</div>
                <div className="text-[10px] text-gray-400">{c.specialty}</div>
              </div>
              <div className="text-[11px] font-semibold text-yellow-600 shrink-0">⭐ {c.rating}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Change Contractor Modal ────────────────────────────────────────────────────
function ChangeContractorModal({
  current, onSave, onClose,
}: {
  current: ContractorRef
  onSave: (change: ContractorPendingChange) => void
  onClose: () => void
}) {
  const [newId, setNewId] = useState("")
  const [reason, setReason] = useState("")
  const newC = CONTRACTORS.find(c => c.id === newId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-orange-100 bg-orange-50 rounded-t-2xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <h2 className="font-bold text-gray-900">Thay đổi nhà thầu cần PM duyệt</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nhà thầu hiện tại</label>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <HardHat className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{current.name}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nhà thầu mới <span className="text-red-500">*</span></label>
            <select value={newId} onChange={e => setNewId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
              <option value="">-- Chọn nhà thầu --</option>
              {CONTRACTORS.filter(c => c.id !== current.id).map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name} – {c.specialty}</option>
              ))}
            </select>
            {newC && (
              <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <span className="text-base">{newC.emoji}</span>
                <div>
                  <div className="text-xs font-semibold text-blue-800">{newC.name}</div>
                  <div className="text-[10px] text-blue-600">{newC.specialty} · ⭐ {newC.rating}</div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lý do thay đổi <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Nhập lý do cụ thể..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Người yêu cầu:</span>
              <span className="font-semibold text-gray-700">Nguyễn Văn An</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Cần PM duyệt:</span>
              <span className="font-semibold text-gray-700">Lê Minh Tuấn</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Huỷ</button>
          <button
            disabled={!newId || !reason.trim()}
            onClick={() => onSave({ from: current, to: { id: newId, name: newC!.name }, reason, requestedBy: "Nguyễn Văn An", status: "pending" })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Check className="w-3.5 h-3.5" /> Gửi yêu cầu →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add / Edit Item Modal ──────────────────────────────────────────────────────
function ItemModal({
  initial, subGroupName, contractorName, onSave, onClose,
}: {
  initial: BOQItem | null
  subGroupName: string; contractorName: string
  onSave: (item: BOQItem) => void
  onClose: () => void
}) {
  const isNew = !initial
  const [form, setForm] = useState({
    name: initial?.name ?? "", unit: initial?.unit ?? "m²",
    quantity: initial?.quantity ?? 1,
    unitPriceSell: initial?.unitPriceSell ?? 0,
    unitPriceCost: initial?.unitPriceCost ?? 0,
    status: (initial?.status ?? "draft") as ItemStatus,
    note: initial?.note ?? "",
    progress: initial?.progress ?? 0,
  })
  const [sugg, setSugg] = useState<typeof PRICE_LIBRARY>([])
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }))
  const margin = form.unitPriceSell > 0 ? (form.unitPriceSell - form.unitPriceCost) / form.unitPriceSell * 100 : 0
  const warn   = form.unitPriceSell > 0 && margin < 15

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">{isNew ? "Thêm hạng mục" : "Chỉnh sửa hạng mục"}</h2>
            <div className="text-xs text-gray-400 mt-0.5">
              {subGroupName} ·{" "}
              <span className="text-blue-600 font-medium flex-inline items-center gap-1">
                <HardHat className="w-3 h-3 inline mr-0.5" />{contractorName}
              </span>
              {" "}(kế thừa)
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Name + autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tên hạng mục <span className="text-red-500">*</span></label>
            <div className="relative">
              <input value={form.name} autoFocus
                onChange={e => {
                  set("name", e.target.value)
                  const q = e.target.value.toLowerCase().trim()
                  setSugg(q.length >= 2 ? PRICE_LIBRARY.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5) : [])
                }}
                onBlur={() => setTimeout(() => setSugg([]), 150)}
                placeholder="VD: Đập tường cũ & xử lý mặt bằng"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
              {sugg.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Thư viện đơn giá</div>
                  {sugg.map((s, i) => (
                    <button key={i} type="button"
                      onMouseDown={() => { setForm(p => ({ ...p, name: s.name, unit: s.unit, unitPriceSell: s.sell, unitPriceCost: s.cost })); setSugg([]) }}
                      className="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center justify-between gap-3 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">{s.name}</div>
                        <div className="text-[10px] text-gray-400">{s.unit}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-semibold text-orange-600">{fmtVND(s.sell)}</div>
                        <div className="text-[10px] text-gray-400">vốn {fmtVND(s.cost)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* DVT + KL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">DVT</label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">KL</label>
              <input type="number" min={0} step="any" value={form.quantity} onChange={e => set("quantity", numVal(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn giá bán <span className="text-red-500">*</span></label>
              <input type="number" min={0} value={form.unitPriceSell} onChange={e => set("unitPriceSell", numVal(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn giá vốn</label>
              <input type="number" min={0} value={form.unitPriceCost} onChange={e => set("unitPriceCost", numVal(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
          {/* Preview */}
          <div className={`rounded-xl px-4 py-2.5 border text-xs ${warn ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-100"}`}>
            <div className="flex justify-between">
              <span className="text-gray-500">Thành tiền:</span>
              <span className="font-bold text-orange-700">{fmtVND(form.quantity * form.unitPriceSell)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Biên LN:</span>
              <span className={`font-bold flex items-center gap-1 ${warn ? "text-red-600" : margin < 25 ? "text-yellow-600" : "text-green-600"}`}>
                {margin.toFixed(1)}%{warn && <AlertTriangle className="w-3 h-3" />}
              </span>
            </div>
          </div>
          {/* Progress + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tiến độ: <span className="text-orange-600">{form.progress}%</span></label>
              <input type="range" min={0} max={100} value={form.progress} onChange={e => set("progress", Number(e.target.value))} className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => set("status", e.target.value as ItemStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
            <textarea value={form.note} onChange={e => set("note", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Huỷ</button>
          <button
            onClick={() => { if (!form.name.trim() || form.unitPriceSell <= 0) return; onSave({ ...form, id: initial?.id ?? `i-${Date.now()}` }) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm">
            <Check className="w-3.5 h-3.5" />{isNew ? "Thêm" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-red-600" /></div>
          <div><h3 className="font-bold text-gray-900">Xóa hạng mục?</h3><p className="text-xs text-gray-500">Thao tác này không thể hoàn tác</p></div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-800">{name}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Xóa</button>
        </div>
      </div>
    </div>
  )
}

// ── BOQ Mode ──────────────────────────────────────────────────────────────────
type BOQMode = "locked" | "open" | "warned" | "readonly" | "hardlocked"

function getBOQMode(lifecycle: string): BOQMode {
  if (["lead_new", "surveying", "design_quoted", "awaiting_design_fee"].includes(lifecycle)) return "locked"
  if (lifecycle === "designing") return "open"
  if (["design_approved", "design_only_closing"].includes(lifecycle)) return "warned"
  if (lifecycle === "quotation") return "readonly"
  return "hardlocked" // contract_signed, construction, handover, done, design_only_done, ""
}

// ── Contractor Badge (in SubGroup header) ──────────────────────────────────────
function ContractorBadge({
  sg,
  onPickerOpen,
  onChangeRequest,
  canEdit = true,
}: {
  sg: BOQSubGroup
  onPickerOpen: (rect: DOMRect) => void
  onChangeRequest: () => void
  canEdit?: boolean
}) {
  if (sg.pendingChange) {
    return (
      <span className="flex items-center gap-1.5 text-xs bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full shrink-0">
        <HardHat className="w-3 h-3" />
        {sg.pendingChange.from.name}
        <span className="text-orange-400">→</span>
        {sg.pendingChange.to.name}
        <Clock className="w-3 h-3 text-orange-400" />
        <span className="text-orange-400 font-normal">Chờ duyệt</span>
      </span>
    )
  }

  if (!sg.contractor) {
    if (!canEdit) return (
      <span className="text-xs text-gray-300 italic shrink-0">Chưa có nhà thầu</span>
    )
    return (
      <button type="button"
        onClick={e => onPickerOpen((e.currentTarget as HTMLButtonElement).getBoundingClientRect())}
        className="flex items-center gap-1.5 text-xs text-gray-400 border border-dashed border-gray-300 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 px-2.5 py-1 rounded-full transition shrink-0">
        <HardHat className="w-3 h-3" />
        Chọn nhà thầu...
      </button>
    )
  }

  const c = cByID[sg.contractor.id]
  return (
    <span className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full shrink-0">
      <span>{c?.emoji ?? "🏗️"}</span>
      {sg.contractor.name}
      {canEdit && (
        <button type="button" onClick={onChangeRequest}
          className="text-blue-400 hover:text-blue-700 transition ml-0.5 p-0.5 rounded hover:bg-blue-100">
          <Pencil className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  )
}

// ── Item-level NCC Badge ──────────────────────────────────────────────────────
function ItemNCCBadge({
  item, inheritedContractor, onPickerOpen, onChangeRequest, canEdit,
}: {
  item: BOQItem
  inheritedContractor: ContractorRef | null
  onPickerOpen: (rect: DOMRect) => void
  onChangeRequest: () => void
  canEdit: boolean
}) {
  const effectiveContractor = item.contractorOverride !== undefined
    ? item.contractorOverride
    : inheritedContractor
  const isInherited = item.contractorOverride === undefined && !!inheritedContractor

  if (!effectiveContractor) {
    if (!canEdit) return <span className="text-[10px] text-gray-300 italic">—</span>
    return (
      <button type="button"
        onClick={e => onPickerOpen((e.currentTarget as HTMLButtonElement).getBoundingClientRect())}
        className="flex items-center gap-1 text-[10px] text-gray-400 border border-dashed border-gray-300 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 px-1.5 py-0.5 rounded-full transition shrink-0 whitespace-nowrap">
        + Chọn NCC
      </button>
    )
  }

  const c = cByID[effectiveContractor.id]

  if (isInherited) {
    return (
      <span
        className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-1.5 py-0.5 rounded-md transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap max-w-[140px]"
        title={`Kế thừa từ nhóm: ${effectiveContractor.name}`}>
        <span className="shrink-0">{c?.emoji ?? "🏗️"}</span>
        <span className="truncate">{effectiveContractor.name}</span>
        {canEdit && (
          <button type="button" onClick={onChangeRequest}
            className="text-gray-400 hover:text-blue-600 transition shrink-0 p-0.5 rounded hover:bg-blue-100">
            ✎
          </button>
        )}
      </span>
    )
  }

  // Override
  return (
    <span
      className="flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 border border-orange-300 hover:bg-orange-100 hover:border-orange-400 px-1.5 py-0.5 rounded-md transition-colors font-semibold shrink-0 whitespace-nowrap max-w-[140px]"
      title={effectiveContractor.name}>
      <span className="shrink-0">{c?.emoji ?? "🏗️"}</span>
      <span className="truncate">{effectiveContractor.name}</span>
      {canEdit && (
        <button type="button" onClick={onChangeRequest}
          className="text-orange-400 hover:text-orange-700 transition shrink-0 p-0.5 rounded hover:bg-orange-200">
          ✎
        </button>
      )}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
type PickerState = { groupId: string; sgId: string; rect: DOMRect }
type ItemPickerState = { groupId: string; sgId: string; itemId: string; rect: DOMRect }
type ItemChangeModalState = { groupId: string; sgId: string; itemId: string }
type ItemModalState = { groupId: string; sgId: string; item: BOQItem | null }
type ChangeModalState = { groupId: string; sgId: string }
type DeleteState = { groupId: string; sgId: string; itemId: string; name: string }
type QAModalState = { groupId: string; sgId: string; item: BOQItem }

export default function ProjectBOQTab({ projectId, lifecycle = "" }: { projectId: string; lifecycle?: string }) {
  const { state: authState } = useAuth()
  const userRole: UserRole | undefined = authState.user?.role
  // Role gates
  const canMarkDone    = !userRole || ["admin","pm","site"].includes(userRole)  // GS (site) marks Xong
  const canQAReview    = !userRole || ["admin","pm","qa"].includes(userRole)    // QC/PM nghiệm thu

  const [isLoaded, setIsLoaded] = useState(false)
  const [groups, setGroups]     = useState<BOQGroup[]>([])
  
  const [view, setView]             = useState<"group" | "contractor">("group")
  const [search, setSearch]         = useState("")
  const [collapsedG,  setCollapsedG]  = useState<Set<string>>(new Set())
  const [collapsedSG, setCollapsedSG] = useState<Set<string>>(new Set())
  const [picker, setPicker]           = useState<PickerState | null>(null)
  const [changeModal, setChangeModal] = useState<ChangeModalState | null>(null)
  const [itemModal, setItemModal]     = useState<ItemModalState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteState | null>(null)
  const [itemPicker, setItemPicker]   = useState<ItemPickerState | null>(null)
  const [itemChangeModal, setItemChangeModal] = useState<ItemChangeModalState | null>(null)
  const [qaModal, setQaModal] = useState<QAModalState | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`boq_${projectId}`)
      if (saved) setGroups(JSON.parse(saved))
      else setGroups(getSeedBOQ(projectId))
    }
    setIsLoaded(true)
  }, [projectId])

  const boqMode = getBOQMode(lifecycle)
  const canEdit = boqMode === "open" || boqMode === "warned"
  const showVO  = boqMode === "hardlocked"

  // ── Aggregates
  const allItems    = useMemo(() => groups.flatMap(g => g.subGroups.flatMap(sg => sg.items)), [groups])
  const totalSell   = useMemo(() => groups.reduce((s, g) => s + gSell(g), 0), [groups])
  const totalCost   = useMemo(() => groups.reduce((s, g) => s + gCost(g), 0), [groups])
  const totalProfit = totalSell - totalCost
  const totalMargin = mPct(totalSell, totalCost)

  // ── Persistence
  const saveGroups = (newGroups: BOQGroup[]) => {
    setGroups(newGroups)
    localStorage.setItem(`boq_${projectId}`, JSON.stringify(newGroups))
  }
  const warnCount   = allItems.filter(i => i.unitPriceSell > 0 && iMargin(i) < 15).length

  // ── Mutations
  const updateSG = (groupId: string, sgId: string, patch: Partial<BOQSubGroup>) =>
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, subGroups: g.subGroups.map(sg => sg.id !== sgId ? sg : { ...sg, ...patch }),
    }))

  const saveItem = (groupId: string, sgId: string, item: BOQItem) =>
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, subGroups: g.subGroups.map(sg => sg.id !== sgId ? sg : {
        ...sg, items: sg.items.some(i => i.id === item.id) ? sg.items.map(i => i.id === item.id ? item : i) : [...sg.items, item],
      }),
    }))

  const updateItemContractor = (groupId: string, sgId: string, itemId: string, contractor: ContractorRef | null) =>
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, subGroups: g.subGroups.map(sg => sg.id !== sgId ? sg : {
        ...sg, items: sg.items.map(i => i.id !== itemId ? i : { ...i, contractorOverride: contractor }),
      }),
    }))

  const deleteItem = (groupId: string, sgId: string, itemId: string) =>
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, subGroups: g.subGroups.map(sg => sg.id !== sgId ? sg : {
        ...sg, items: sg.items.filter(i => i.id !== itemId),
      }),
    }))

  const completeItem = (groupId: string, sgId: string, item: BOQItem) => {
    const today = new Date().toISOString().split('T')[0]
    let timeliness: "early" | "on_time" | "late" = "on_time"
    
    setGroups(prev => {
      const sg = prev.find(g => g.id === groupId)?.subGroups.find(s => s.id === sgId)
      if (sg?.endDate) {
        if (today > sg.endDate) timeliness = "late"
        else if (today < sg.endDate) timeliness = "early"
      }

      const gIdx = prev.findIndex(g => g.id === groupId)
      if (gIdx < 0) return prev
      const sgIdx = prev[gIdx].subGroups.findIndex(s => s.id === sgId)
      if (sgIdx < 0) return prev
      const iIdx = prev[gIdx].subGroups[sgIdx].items.findIndex(i => i.id === item.id)
      if (iIdx < 0) return prev

      const newGroups = [...prev]
      const newItems = [...newGroups[gIdx].subGroups[sgIdx].items]
      newItems[iIdx] = { ...newItems[iIdx], progress: 100, completedDate: today, timeliness, status: "done", defectNote: undefined }

      const newSGs = [...newGroups[gIdx].subGroups]
      const newSg = { ...newSGs[sgIdx], items: newItems }
      newSg.progress = Math.round(newItems.reduce((s, x) => s + x.progress, 0) / newItems.length)
      newSGs[sgIdx] = newSg
      
      newGroups[gIdx] = { ...newGroups[gIdx], subGroups: newSGs }
      localStorage.setItem(`boq_${projectId}`, JSON.stringify(newGroups))
      return newGroups
    })
  }

  const handleQAAccept = (groupId: string, sgId: string, item: BOQItem, verdict: "pass" | "fail", reason: string) => {
    setGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === groupId)
      if (gIdx < 0) return prev
      const sgIdx = prev[gIdx].subGroups.findIndex(s => s.id === sgId)
      if (sgIdx < 0) return prev
      const iIdx = prev[gIdx].subGroups[sgIdx].items.findIndex(i => i.id === item.id)
      if (iIdx < 0) return prev
      const newGroups = [...prev]
      const newItems = [...newGroups[gIdx].subGroups[sgIdx].items]
      if (verdict === "pass") {
        newItems[iIdx] = { ...newItems[iIdx], status: "approved", defectNote: undefined }
      } else {
        newItems[iIdx] = { ...newItems[iIdx], status: "pending", progress: 90, defectNote: reason }
      }
      const newSGs = [...newGroups[gIdx].subGroups]
      const newSg = { ...newSGs[sgIdx], items: newItems }
      newSg.progress = Math.round(newItems.reduce((s, x) => s + x.progress, 0) / newItems.length)
      newSGs[sgIdx] = newSg
      newGroups[gIdx] = { ...newGroups[gIdx], subGroups: newSGs }
      localStorage.setItem(`boq_${projectId}`, JSON.stringify(newGroups))
      return newGroups
    })
    setQaModal(null)
  }


  const toggleG  = (id: string) => setCollapsedG(p  => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSG = (id: string) => setCollapsedSG(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── Contractor view data
  const contractorView = useMemo(() => {
    const map = new Map<string, { name: string; specialty: string; rating: number; emoji: string; items: (BOQItem & { groupName: string; sgName: string })[]; contractedValue: number }>()
    groups.forEach(g => g.subGroups.forEach(sg => {
      // Accumulate contractedValue to subgroup's own contractor
      if (sg.contractor) {
        const cid = sg.contractor.id
        if (!map.has(cid)) {
          const c = cByID[cid]
          map.set(cid, { name: sg.contractor.name, specialty: c?.specialty ?? "", rating: c?.rating ?? 0, emoji: c?.emoji ?? "🏗️", items: [], contractedValue: 0 })
        }
        map.get(cid)!.contractedValue += sg.contractedValue ?? 0
      }
      // Each item goes under its effective contractor (override takes priority)
      sg.items.forEach(item => {
        const effectiveRef = item.contractorOverride !== undefined ? item.contractorOverride : sg.contractor
        if (!effectiveRef) return
        const cid = effectiveRef.id
        if (!map.has(cid)) {
          const c = cByID[cid]
          map.set(cid, { name: effectiveRef.name, specialty: c?.specialty ?? "", rating: c?.rating ?? 0, emoji: c?.emoji ?? "🏗️", items: [], contractedValue: 0 })
        }
        map.get(cid)!.items.push({ ...item, groupName: g.name, sgName: sg.name })
      })
    }))
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
  }, [groups])

  // ── Filtered groups
  const filteredGroups = useMemo(() => {
    if (!search) return groups
    const q = search.toLowerCase()
    return groups.map(g => ({
      ...g,
      subGroups: g.subGroups.map(sg => ({
        ...sg, items: sg.items.filter(i => i.name.toLowerCase().includes(q) || (sg.contractor?.name ?? "").toLowerCase().includes(q)),
      })).filter(sg => sg.items.length > 0),
    })).filter(g => g.subGroups.length > 0)
  }, [groups, search])

  // ── Picker & change modal helpers
  const getSG = (groupId: string, sgId: string) => groups.find(g => g.id === groupId)?.subGroups.find(sg => sg.id === sgId)
  const getItem = (groupId: string, sgId: string, itemId: string) => getSG(groupId, sgId)?.items.find(i => i.id === itemId)

  if (!isLoaded) return null

  return (
    <div className="space-y-4">
      {/* ── KPI ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-6 flex-wrap">
        <div><div className="text-xs text-gray-400 mb-0.5">Tổng dự toán</div><div className="text-lg font-bold text-orange-600">{fmtVND(totalSell)}</div></div>
        <div className="w-px h-8 bg-gray-200" />
        <div><div className="text-xs text-gray-400 mb-0.5">Chi phí</div><div className="text-sm font-semibold text-gray-700">{fmtVND(totalCost)}</div></div>
        <div className="w-px h-8 bg-gray-200" />
        <div><div className="text-xs text-gray-400 mb-0.5">Lợi nhuận</div><div className={`text-sm font-semibold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtVND(totalProfit)}</div></div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Biên LN</div>
          <div className={`text-sm font-bold flex items-center gap-1 ${mColor(totalMargin)}`}>
            {totalMargin.toFixed(1)}%{totalMargin < 15 && <AlertTriangle className="w-3.5 h-3.5" />}
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div><div className="text-xs text-gray-400 mb-0.5">Hạng mục</div><div className="text-sm font-semibold text-gray-700">{allItems.length}</div></div>
        {warnCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 ml-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-700">{warnCount} margin thấp</span>
          </div>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm hạng mục, nhà thầu..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Xóa lọc
          </button>
        )}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-auto">
          <button onClick={() => setView("group")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === "group" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            Theo nhóm CV
          </button>
          <button onClick={() => setView("contractor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === "contractor" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            <Users className="w-3 h-3" /> Theo nhà thầu
          </button>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Xuất Excel
        </button>
        {canEdit && (
          <button onClick={() => {
            const name = prompt("Tên nhóm lớn mới (VD: Phần hoàn thiện):")
            if (name) {
              saveGroups([...groups, { id: "g_" + Date.now(), name, subGroups: [] }])
            }
          }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            <Plus className="w-3.5 h-3.5" /> Thêm Nhóm chính
          </button>
        )}
      </div>

      {/* ── Status banners & locked overlay ─────────────────────────────────── */}
      {boqMode === "locked" && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-sm font-bold text-gray-700 mb-1.5">Chưa thể bóc tách khối lượng</div>
          <div className="text-xs text-gray-400 max-w-xs leading-relaxed">Cần hoàn thiện bản vẽ trước — Bước 03B (Thu tạm ứng & Thiết kế)</div>
        </div>
      )}
      {boqMode === "open" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">📐</span>
          <div>
            <div className="text-xs font-semibold text-yellow-800">QS đang bóc tách khối lượng</div>
            <div className="text-[11px] text-yellow-700 mt-0.5">Cập nhật theo bản vẽ từ KS Thiết kế — BOQ mở toàn bộ</div>
          </div>
        </div>
      )}
      {boqMode === "warned" && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <div className="text-xs font-semibold text-orange-800">KH đã duyệt bản vẽ</div>
            <div className="text-[11px] text-orange-700 mt-0.5">Mọi thay đổi BOQ sẽ ảnh hưởng đến báo giá thi công</div>
          </div>
        </div>
      )}
      {boqMode === "readonly" && (
        <div className="bg-orange-100 border border-orange-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <div className="text-xs font-semibold text-orange-900">BOQ đang trong quá trình báo giá — không được thay đổi</div>
            <div className="text-[11px] text-orange-800 mt-0.5">Chờ KH ký hợp đồng trước khi tiếp tục chỉnh sửa</div>
          </div>
        </div>
      )}
      {boqMode === "hardlocked" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <div className="text-xs font-semibold text-red-800">HĐ đã ký — mọi thay đổi phải qua Phát sinh VO</div>
            <div className="text-[11px] text-red-700 mt-0.5">Nhấn "Tạo VO" bên cạnh hạng mục cần thay đổi</div>
          </div>
        </div>
      )}

      {/* ── VIEW: BY GROUP ───────────────────────────────────────────────────── */}
      {boqMode !== "locked" && view === "group" && (
        <div className="space-y-3">
          {filteredGroups.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mb-3 text-gray-200" />
              <p className="font-medium text-sm mb-3">Chưa có hạng mục nào</p>
              {canEdit && (
                <button type="button" onClick={() => setGroups([{ id: "g-default", name: "Phần thô", subGroups: [{ id: "sg-default", name: "Công việc chung", contractor: null, items: [] }] }])}
                  className="px-4 py-2 bg-orange-50 text-orange-600 font-bold text-sm border border-orange-200 rounded-lg hover:bg-orange-100 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Khởi tạo Dự toán (BOQ)
                </button>
              )}
            </div>
          )}
          {filteredGroups.map(group => {
            const gs = gSell(group), gc = gCost(group), gm = mPct(gs, gc)
            const gItems = group.subGroups.flatMap(sg => sg.items)
            const isGCol = collapsedG.has(group.id)
            return (
              <div key={group.id} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                {/* Level 1 */}
                <div className="bg-gray-700 text-white px-5 py-3 flex items-center gap-3">
                  <button type="button" onClick={() => toggleG(group.id)} className="shrink-0">
                    {isGCol ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <span className="font-bold text-sm uppercase tracking-wide flex-1">{group.name}</span>
                  <span className="text-xs text-gray-300">{group.subGroups.length} phân nhóm · {gItems.length} hạng mục</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-600 ${mColor(gm)}`}>Margin: {gm.toFixed(1)}%</span>
                  <span className="text-sm font-bold text-orange-300">{fmtVND(gs)}</span>
                  {canEdit && (
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => {
                        const name = prompt("Tên phân nhóm mới (VD: Trần thạch cao):")
                        if (name) {
                          const newGroups = groups.map(g => g.id === group.id 
                            ? { ...g, subGroups: [...g.subGroups, { id: "sg_" + Date.now(), name, contractor: null, items: [] }] }
                            : g)
                          saveGroups(newGroups)
                        }
                      }} className="p-1.5 text-orange-300 hover:text-white hover:bg-white/10 rounded transition" title="Thêm phân nhóm">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        if (confirm(`Xóa toàn bộ nhóm "${group.name}"?`)) {
                          saveGroups(groups.filter(g => g.id !== group.id))
                        }
                      }} className="p-1.5 text-orange-300/50 hover:text-red-400 hover:bg-white/10 rounded transition" title="Xóa nhóm lớn">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!isGCol && (
                  <div className="divide-y divide-gray-100">
                    {group.subGroups.map(sg => {
                      const ss = sgSell(sg), sc = sgCost(sg), sm = mPct(ss, sc)
                      const isSGCol = collapsedSG.has(sg.id)
                      const avgProg = sg.items.length > 0 ? Math.round(sg.items.reduce((s, i) => s + i.progress, 0) / sg.items.length) : 0

                      return (
                        <div key={sg.id} className="bg-white">
                          {/* Level 2 — 2-row header */}
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                            {/* Row 1: name + contractor + summary + add */}
                            <div className="flex items-center gap-2.5">
                              <button type="button" onClick={() => toggleSG(sg.id)} className="shrink-0 ml-3">
                                {isSGCol ? <ChevronRight className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                              </button>
                              <span className="text-sm font-semibold text-gray-700 truncate min-w-0">{sg.name}</span>
                              <ContractorBadge
                                sg={sg}
                                onPickerOpen={rect => setPicker({ groupId: group.id, sgId: sg.id, rect })}
                                onChangeRequest={() => setChangeModal({ groupId: group.id, sgId: sg.id })}
                                canEdit={canEdit}
                              />
                              <div className="ml-auto flex items-center gap-3 shrink-0">
                                <span className={`text-xs font-semibold ${sg.items.length === 0 ? "text-gray-300" : mColor(sm)}`}>
                                  {sg.items.length === 0 ? "—" : `${sm.toFixed(1)}%`}
                                </span>
                                <span className="text-sm font-bold text-gray-700">{fmtVND(ss)}</span>
                                {canEdit && (
                                  <div className="flex items-center gap-1.5">
                                    <button type="button"
                                      onClick={() => setItemModal({ groupId: group.id, sgId: sg.id, item: null })}
                                      className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 border border-orange-200 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition">
                                      <Plus className="w-3 h-3" /> HM
                                    </button>
                                    <button type="button"
                                      onClick={() => {
                                        if (confirm(`Xóa phân nhóm "${sg.name}"?`)) {
                                          const newGroups = groups.map(g => g.id === group.id 
                                            ? { ...g, subGroups: g.subGroups.filter(s => s.id !== sg.id) }
                                            : g)
                                          saveGroups(newGroups)
                                        }
                                      }}
                                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Row 2: Khoán + Timeline Toolbar (GS updates this during construction) */}
                            <div className="ml-9 mt-1.5 mb-1.5 flex items-center flex-wrap gap-4 text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-fit shadow-sm">
                              {sg.contractedValue ? (
                                <div className="flex items-center gap-1"><span className="text-gray-400">Khoán:</span><span className="font-bold text-gray-700 w-24">{fmtVND(sg.contractedValue)}</span></div>
                              ) : null}
                              {sg.contractedValue && <div className="w-px h-3 bg-gray-200" />}
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">Bắt đầu:</span>
                                <input type="date" value={sg.startDate || ""} onChange={e => updateSG(group.id, sg.id, { startDate: e.target.value })} className="bg-transparent text-gray-700 font-medium outline-none cursor-pointer" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">Kết thúc:</span>
                                <input type="date" value={sg.endDate || ""} onChange={e => {
                                  const newVal = e.target.value
                                  const patch: Partial<BOQSubGroup> = { endDate: newVal }
                                  if (sg.startDate && newVal) {
                                    const diffT = new Date(newVal).getTime() - new Date(sg.startDate).getTime()
                                    patch.durationDays = Math.ceil(diffT / (1000 * 3600 * 24))
                                  }
                                  updateSG(group.id, sg.id, patch)
                                }} className="bg-transparent text-gray-700 font-medium outline-none cursor-pointer" />
                              </div>

                              <div className="w-px h-3 bg-gray-200" />
                              
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Tiến độ thi công:</span>
                                <input type="range" min="0" max="100" value={sg.progress || 0} onChange={e => updateSG(group.id, sg.id, { progress: parseInt(e.target.value) })} className="w-24 accent-blue-500 cursor-pointer" />
                                <span className={`font-bold w-8 ${sg.progress === 100 ? "text-green-600" : "text-blue-600"}`}>{sg.progress || 0}%</span>
                              </div>
                            </div>
                          </div>

                          {!isSGCol && (
                            <>
                              {sg.items.length === 0 && (
                                <div className="pl-14 pr-5 py-4 text-xs text-gray-400 text-center">
                                  {canEdit ? (
                                    <>Chưa có hạng mục ·{" "}<button type="button" onClick={() => setItemModal({ groupId: group.id, sgId: sg.id, item: null })} className="text-orange-500 hover:underline">Thêm ngay</button></>
                                  ) : "Chưa có hạng mục"}
                                </div>
                              )}
                              {sg.items.length > 0 && (
                                <div className="pl-14 pr-5 py-1.5 border-b border-gray-50 grid gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                                  style={{ gridTemplateColumns: COL }}>
                                  <span>Hạng mục</span><span className="text-center">DVT</span><span className="text-right">KL</span>
                                  <span className="text-right">Đơn giá</span>
                                  <span className="text-right">Thành tiền</span>
                                  <span className="text-center">Tiến độ</span><span className="text-center">Trạng thái</span>
                                  <span className="text-left text-amber-500">NCC</span><span />
                                </div>
                              )}
                              {sg.items.map((item, idx) => {
                                const is = iSell(item), im = iMargin(item), warn = item.unitPriceSell > 0 && im < 15
                                return (
                                  <div key={item.id}
                                    className={`pl-14 pr-5 py-2.5 grid gap-2 items-center border-b border-gray-50 last:border-0 transition-colors group ${
                                      warn ? "bg-red-50/50 hover:bg-red-50" : idx % 2 === 0 ? "hover:bg-orange-50/30" : "bg-gray-50/20 hover:bg-orange-50/30"
                                    }`}
                                    style={{ gridTemplateColumns: COL }}>
                                    <div className="min-w-0" title={item.name}>
                                      <div className={`text-xs font-medium truncate ${warn ? "text-red-700" : "text-gray-800"}`}>
                                        {item.name}
                                        {warn && <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">⚠</span>}
                                      </div>
                                      {item.note && <div className="text-[10px] text-gray-400 truncate">{item.note}</div>}
                                    </div>
                                    <span className="text-[11px] text-gray-500 text-center">{item.unit}</span>
                                    <span className="text-[11px] text-gray-700 text-right tabular-nums">{item.quantity.toLocaleString("vi-VN")}</span>
                                    {/* Merged price: sell (line 1) + cost in gray (line 2) */}
                                    <div className="text-right">
                                      <div className="text-[11px] text-gray-700 tabular-nums">{fmtVND(item.unitPriceSell)}</div>
                                      <div className="text-[10px] text-gray-400 tabular-nums">{fmtVND(item.unitPriceCost)}</div>
                                    </div>
                                    {/* Thành tiền + margin visible on row hover */}
                                    <div className="text-right">
                                      <div className="text-[11px] font-semibold text-gray-800 tabular-nums">{fmtVND(is)}</div>
                                      <div className={`text-[10px] font-semibold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity ${mColor(im)}`}>{im.toFixed(1)}%</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {item.completedDate ? (
                                        <div className="text-[9px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex items-center gap-1">
                                          <Check className="w-2.5 h-2.5 text-green-500" />
                                          {item.timeliness === "early" ? <span className="text-green-600 font-bold">Sớm</span> : 
                                           item.timeliness === "late" ? <span className="text-red-500 font-bold">Trễ</span> : 
                                           <span className="text-blue-500 font-bold">Khớp</span>}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <div className="flex-1 w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.progress}%` }} />
                                          </div>
                                          <span className="text-[10px] text-gray-400 w-6 text-right">{item.progress}%</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-center">
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                                        {STATUS_OPTIONS.find(o => o.value === item.status)?.label}
                                      </span>
                                    </div>
                                    {/* NCC column */}
                                    <div className="flex items-center min-w-0">
                                      <ItemNCCBadge
                                        item={item}
                                        inheritedContractor={sg.contractor}
                                        canEdit={canEdit}
                                        onPickerOpen={rect => setItemPicker({ groupId: group.id, sgId: sg.id, itemId: item.id, rect })}
                                        onChangeRequest={() => setItemChangeModal({ groupId: group.id, sgId: sg.id, itemId: item.id })}
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-1">
                                      {canEdit && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button type="button" onClick={() => setItemModal({ groupId: group.id, sgId: sg.id, item })}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button type="button" onClick={() => setDeleteTarget({ groupId: group.id, sgId: sg.id, itemId: item.id, name: item.name })}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                      
                                      {boqMode === "hardlocked" && !item.completedDate && canMarkDone && (
                                        <button type="button" onClick={() => completeItem(group.id, sg.id, item)}
                                          className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 border border-green-200 px-2 py-1.5 rounded-md transition font-bold shadow-sm whitespace-nowrap hover:bg-green-100">
                                          <Check className="w-3 h-3" /> Xong
                                        </button>
                                      )}
                                      
                                      {boqMode === "hardlocked" && item.status === "done" && (
                                        canQAReview ? (
                                          <button type="button" onClick={() => setQaModal({ groupId: group.id, sgId: sg.id, item })}
                                            className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1.5 rounded-md transition font-bold shadow-sm whitespace-nowrap animate-pulse hover:bg-blue-100">
                                            🔍 Nghiệm thu
                                          </button>
                                        ) : (
                                          <span className="flex items-center gap-1 text-[10px] text-gray-400 border border-gray-200 px-2 py-1.5 rounded-md whitespace-nowrap bg-gray-50 italic">
                                            🔒 Chờ QC
                                          </span>
                                        )
                                      )}
                                      
                                      {showVO && (
                                        <button type="button"
                                          className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg transition">
                                          <Plus className="w-3 h-3" /> VO
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                              {sg.items.length > 0 && (
                                <div className="pl-14 pr-5 py-2 bg-blue-50/40 border-t border-blue-100 flex items-center justify-between">
                                  <span className="text-xs text-gray-500 font-medium">Tổng {sg.name}</span>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-gray-400">Vốn: {fmtVND(sc)}</span>
                                    <span className="font-bold text-gray-700">{fmtVND(ss)}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                    {/* Group footer */}
                    <div className="px-5 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">TỔNG {group.name}</span>
                      <div className="flex items-center gap-6 text-xs">
                        <span className="text-gray-500">Vốn: {fmtVND(gc)}</span>
                        <span className={`font-semibold ${mColor(gm)}`}>Margin: {gm.toFixed(1)}%</span>
                        <span className="font-bold text-gray-800 text-sm">{fmtVND(gs)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Grand total */}
          {filteredGroups.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-orange-300 shadow-sm px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">Tổng cộng</div>
                <div className="text-xs text-gray-500 mt-0.5">{allItems.length} hạng mục · {groups.reduce((s, g) => s + g.subGroups.length, 0)} phân nhóm</div>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div><div className="text-xs text-gray-400">Tổng vốn</div><div className="text-sm font-semibold text-gray-700">{fmtVND(totalCost)}</div></div>
                <div><div className="text-xs text-gray-400">Lợi nhuận</div><div className={`text-sm font-semibold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtVND(totalProfit)}</div></div>
                <div><div className="text-xs text-gray-400 mb-0.5">Biên LN</div><div className={`text-base font-bold ${mColor(totalMargin)}`}>{totalMargin.toFixed(1)}%</div></div>
                <div><div className="text-xs text-gray-400 mb-0.5">Tổng dự toán</div><div className="text-xl font-bold text-orange-600">{fmtVND(totalSell)}</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: BY CONTRACTOR ──────────────────────────────────────────────── */}
      {boqMode !== "locked" && view === "contractor" && (
        <div className="space-y-3">
          {contractorView.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-12 text-gray-400">
              <Users className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Chưa có nhà thầu nào được gán</p>
            </div>
          )}
          {contractorView.map(cg => {
            const cgSell = cg.items.reduce((s, i) => s + iSell(i), 0)
            const cgProg = cg.items.length > 0 ? Math.round(cg.items.reduce((s, i) => s + i.progress, 0) / cg.items.length) : 0
            return (
              <div key={cg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Contractor header */}
                <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-base shrink-0 mt-0.5">
                    {cg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-blue-900">{cg.name}</span>
                      <span className="text-xs text-yellow-600 font-semibold">★ {cg.rating}</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-0.5">Chuyên môn: {cg.specialty}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-blue-700">
                      {cg.contractedValue > 0 && <span>Tổng khoán: {fmtVND(cg.contractedValue)}</span>}
                      <span>· Đã thi công: {cgProg}%</span>
                      <span>· {cg.items.length} HM</span>
                    </div>
                  </div>
                  {cgProg > 0 && (
                    <div className="w-28 h-2 bg-blue-200 rounded-full overflow-hidden shrink-0 self-center">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${cgProg}%` }} />
                    </div>
                  )}
                </div>
                {/* Item table */}
                <div className="px-5 py-1.5 grid gap-2 border-b border-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                  style={{ gridTemplateColumns: "2fr 80px 60px 100px 80px 84px" }}>
                  <span>Hạng mục</span><span>DVT · KL</span><span className="text-right">Thành tiền</span>
                  <span>Nhóm</span><span className="text-center">Tiến độ</span><span className="text-center">Trạng thái</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cg.items.map(item => (
                    <div key={item.id} className="px-5 py-2.5 grid gap-2 items-center hover:bg-gray-50"
                      style={{ gridTemplateColumns: "2fr 80px 60px 100px 80px 84px" }}>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">{item.name}</div>
                      </div>
                      <span className="text-[11px] text-gray-500">{item.quantity} {item.unit}</span>
                      <span className="text-[11px] font-semibold text-gray-800 text-right tabular-nums">{fmtVND(iSell(item))}</span>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-400 truncate">{item.groupName}</div>
                        <div className="text-[10px] text-gray-300 truncate">{item.sgName}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 w-7 text-right">{item.progress}%</span>
                      </div>
                      <div className="flex justify-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                          {STATUS_OPTIONS.find(o => o.value === item.status)?.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Total row */}
                <div className="px-5 py-2 bg-blue-50/50 border-t border-blue-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{cg.items.length} hạng mục</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">Giá bán KH: <span className="font-semibold text-gray-700">{fmtVND(cgSell)}</span></span>
                    {cg.contractedValue > 0 && (
                      <span className={`font-semibold ${cgSell - cg.contractedValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                        LN: {fmtVND(cgSell - cg.contractedValue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Inline contractor picker (SubGroup level) ────────────────────────── */}
      {picker && (
        <ContractorPicker
          rect={picker.rect}
          exclude={getSG(picker.groupId, picker.sgId)?.contractor?.id}
          onSelect={c => updateSG(picker.groupId, picker.sgId, { contractor: c, pendingChange: undefined })}
          onClose={() => setPicker(null)}
        />
      )}

      {/* ── Inline contractor picker (Item level) ─────────────────────────────── */}
      {itemPicker && (
        <ContractorPicker
          rect={itemPicker.rect}
          exclude={getItem(itemPicker.groupId, itemPicker.sgId, itemPicker.itemId)?.contractorOverride?.id
            ?? getSG(itemPicker.groupId, itemPicker.sgId)?.contractor?.id}
          onSelect={c => {
            updateItemContractor(itemPicker.groupId, itemPicker.sgId, itemPicker.itemId, c)
            setItemPicker(null)
          }}
          onClose={() => setItemPicker(null)}
        />
      )}

      {/* ── Change contractor modal (Item level) ──────────────────────────────── */}
      {itemChangeModal && (() => {
        const item = getItem(itemChangeModal.groupId, itemChangeModal.sgId, itemChangeModal.itemId)
        const sg = getSG(itemChangeModal.groupId, itemChangeModal.sgId)
        const current = item?.contractorOverride ?? sg?.contractor ?? null
        if (!current) return null
        return (
          <ChangeContractorModal
            current={current}
            onSave={change => {
              // Apply the new contractor as override immediately (optimistic)
              updateItemContractor(itemChangeModal.groupId, itemChangeModal.sgId, itemChangeModal.itemId, change.to)
              setItemChangeModal(null)
            }}
            onClose={() => setItemChangeModal(null)}
          />
        )
      })()}

      {/* ── Change contractor modal ──────────────────────────────────────────── */}
      {changeModal && (() => {
        const sg = getSG(changeModal.groupId, changeModal.sgId)
        if (!sg?.contractor) return null
        return (
          <ChangeContractorModal
            current={sg.contractor}
            onSave={change => { updateSG(changeModal.groupId, changeModal.sgId, { pendingChange: change }); setChangeModal(null) }}
            onClose={() => setChangeModal(null)}
          />
        )
      })()}

      {/* ── Add/Edit item modal ──────────────────────────────────────────────── */}
      {itemModal && (() => {
        const sg = getSG(itemModal.groupId, itemModal.sgId)
        if (!sg) return null
        return (
          <ItemModal
            initial={itemModal.item}
            subGroupName={sg.name}
            contractorName={sg.contractor?.name ?? "Chưa có nhà thầu"}
            onSave={item => { saveItem(itemModal.groupId, itemModal.sgId, item); setItemModal(null) }}
            onClose={() => setItemModal(null)}
          />
        )
      })()}

      {/* ── Delete confirm ───────────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={() => { deleteItem(deleteTarget.groupId, deleteTarget.sgId, deleteTarget.itemId); setDeleteTarget(null) }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── QA/QC Nghiệm thu modal ──────────────────────────────────────────── */}
      {qaModal && (
        <QANghiemThuModal
          item={qaModal.item}
          onClose={() => setQaModal(null)}
          onSubmit={(verdict, reason) => handleQAAccept(qaModal.groupId, qaModal.sgId, qaModal.item, verdict, reason)}
        />
      )}
    </div>
  )
}

// ── QA/QC Nghiệm thu Modal ───────────────────────────────────────────────────
function QANghiemThuModal({
  item, onClose, onSubmit,
}: {
  item: BOQItem
  onClose: () => void
  onSubmit: (verdict: "pass" | "fail", reason: string) => void
}) {
  const [verdict, setVerdict] = useState<"pass" | "fail" | null>(null)
  const [reason, setReason]   = useState("")
  const [photos, setPhotos]   = useState<string[]>([])
  const canSubmit = verdict === "pass" || (verdict === "fail" && reason.trim().length > 0)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => { if (ev.target?.result) setPhotos(p => [...p, ev.target!.result as string]) }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-0.5">QA/QC · Nghiệm thu hạng mục</div>
            <div className="text-sm font-bold text-gray-900 leading-tight">{item.name}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              GS báo hoàn thành: <span className="font-semibold text-gray-600">{item.completedDate ?? "—"}</span>
              {item.timeliness && (
                <span className={`ml-1.5 font-bold ${item.timeliness === "early" ? "text-green-600" : item.timeliness === "late" ? "text-red-600" : "text-blue-600"}`}>
                  ({item.timeliness === "early" ? "Sớm 🟢" : item.timeliness === "late" ? "Trễ 🔴" : "Khớp 🔵"})
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Verdict choice */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kết quả nghiệm thu <span className="text-gray-400 normal-case font-normal">(chỉ QC/PM được duyệt)</span></div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setVerdict("pass")}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                  verdict === "pass"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-md"
                    : "border-gray-200 hover:border-green-300 text-gray-500 hover:bg-green-50/50"
                }`}>
                <span className="text-2xl">✅</span>
                <span>Đạt</span>
                <span className="text-[10px] font-normal opacity-70">Chấp nhận nghiệm thu</span>
              </button>
              <button type="button" onClick={() => setVerdict("fail")}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                  verdict === "fail"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-md"
                    : "border-gray-200 hover:border-red-300 text-gray-500 hover:bg-red-50/50"
                }`}>
                <span className="text-2xl">❌</span>
                <span>Không đạt</span>
                <span className="text-[10px] font-normal opacity-70">Yêu cầu làm lại</span>
              </button>
            </div>
          </div>

          {/* Fail details */}
          {verdict === "fail" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5">
                  Lý do không đạt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Mô tả chi tiết lỗi: Sơn lem góc trần, sai kích thước, bề mặt không phẳng..."
                  rows={3}
                  className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400 resize-none bg-red-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5">
                  Hình ảnh bằng chứng lỗi
                </label>
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border-2 border-dashed border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50/50 transition text-xs text-red-600 font-semibold w-fit">
                  <Camera className="w-4 h-4" />
                  Upload ảnh lỗi
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} />
                </label>
                {photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {photos.map((src, i) => (
                      <div key={i} className="relative w-16 h-14 rounded-lg overflow-hidden border border-red-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Lỗi ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button"
                          onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 rounded-full text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pass note */}
          {verdict === "pass" && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-700">
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>Hạng mục sẽ được đánh dấu <b>Đã nghiệm thu đạt</b> và khóa ở 100%.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition">
            Huỷ
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => verdict && onSubmit(verdict, reason)}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition shadow-sm ${
              !canSubmit
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : verdict === "pass"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
            }`}>
            {verdict === "pass" ? "✅ Xác nhận Đạt" : verdict === "fail" ? "❌ Xác nhận Không đạt" : "Chọn kết quả"}
          </button>
        </div>
      </div>
    </div>
  )
}
