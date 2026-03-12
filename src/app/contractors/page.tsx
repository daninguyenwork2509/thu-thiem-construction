"use client"
import { useState } from "react"
import { HardHat, Plus, Star, Phone, ChevronDown, ChevronRight, X, Search } from "lucide-react"
import { SUBCONTRACTORS } from "@/lib/subcontractor-data"

const fmtVND = (n: number) => n.toLocaleString("vi-VN") + " ₫"

const ALLOCATIONS = [
  { id: 1, contractorId: 1, projectCode: "PRJ-2025-0001", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",    scope: "Phần thô & Xây tô toàn bộ",                   contractValue: 95_000_000,  progress: 65,  status: "in_progress" },
  { id: 2, contractorId: 1, projectCode: "PRJ-2024-0015", projectName: "Biệt thự Sông Long – Thủ Đức",       scope: "Phần thô + bê tông nền",                       contractValue: 320_000_000, progress: 100, status: "completed"   },
  { id: 3, contractorId: 2, projectCode: "PRJ-2025-0001", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",    scope: "Toàn bộ M&E Điện",                             contractValue: 135_000_000, progress: 45,  status: "in_progress" },
  { id: 4, contractorId: 2, projectCode: "PRJ-2025-0002", projectName: "Văn phòng Landmark 81 – Tầng 22",   scope: "Hệ thống điện và điều hòa tổng thể",            contractValue: 280_000_000, progress: 10,  status: "in_progress" },
  { id: 5, contractorId: 3, projectCode: "PRJ-2025-0001", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",    scope: "Tủ bếp Acrylic + Sàn gỗ + Tủ đầu giường",     contractValue: 185_000_000, progress: 0,   status: "pending"     },
  { id: 6, contractorId: 4, projectCode: "PRJ-2025-0001", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",    scope: "Sơn nước + Trát tường toàn căn",               contractValue: 42_000_000,  progress: 30,  status: "in_progress" },
  { id: 7, contractorId: 4, projectCode: "PRJ-2024-0015", projectName: "Biệt thự Sông Long – Thủ Đức",       scope: "Sơn nước nội thất 3 tầng",                     contractValue: 95_000_000,  progress: 100, status: "completed"   },
  { id: 8, contractorId: 5, projectCode: "PRJ-2025-0001", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",    scope: "Ốp lát gạch toilet chính & phụ",               contractValue: 35_500_000,  progress: 50,  status: "in_progress" },
  { id: 9, contractorId: 7, projectCode: "PRJ-2024-0015", projectName: "Biệt thự Sông Long – Thủ Đức",       scope: "Điều hòa trung tâm 3 tầng",                    contractValue: 210_000_000, progress: 100, status: "completed"   },
]

const SCOPE_MATERIALS: Record<number, { name: string; qty: number; unit: string; unitPrice: number }[]> = {
  1: [
    { name: "Xi măng PCB40",          qty: 45,   unit: "bao 50kg",  unitPrice: 85_000  },
    { name: "Cát vàng xây",           qty: 3,    unit: "m³",        unitPrice: 220_000 },
    { name: "Gạch ống 4 lỗ",          qty: 1200, unit: "viên",      unitPrice: 1_800   },
  ],
  3: [
    { name: "Dây điện CVV 1.5mm²",    qty: 8,   unit: "cuộn 100m", unitPrice: 320_000 },
    { name: "Ống luồn dây Ø25",       qty: 120,  unit: "thanh 4m",  unitPrice: 28_000  },
    { name: "CB MCB 20A Schneider",   qty: 12,   unit: "cái",       unitPrice: 95_000  },
  ],
  5: [
    { name: "Gỗ MDF E1 18mm",         qty: 30,   unit: "tấm",       unitPrice: 520_000 },
    { name: "Sàn gỗ Egger 8mm",       qty: 40,   unit: "m²",        unitPrice: 320_000 },
    { name: "Bản lề âm tủ Blum",      qty: 48,   unit: "cái",       unitPrice: 45_000  },
  ],
  6: [
    { name: "Sơn Dulux Easy Care 5L", qty: 12,   unit: "thùng",     unitPrice: 480_000 },
    { name: "Bột trét tường TileX",   qty: 20,   unit: "bao 40kg",  unitPrice: 165_000 },
  ],
  8: [
    { name: "Gạch ốp tường 60×60 Viglacera", qty: 55, unit: "m²",  unitPrice: 235_000 },
    { name: "Keo dán gạch Mapei 25kg",        qty: 8,  unit: "bao", unitPrice: 320_000 },
  ],
}

const statusColor: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  pending:     "bg-yellow-100 text-yellow-700",
}
const statusLabel: Record<string, string> = {
  in_progress: "Đang thi công",
  completed:   "Hoàn thành",
  pending:     "Chưa thi công",
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-200 fill-gray-200"}`} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </div>
  )
}

type AddForm = { name: string; specialty: string; contactName: string; contactPhone: string; notes: string }

const SPECIALTIES = [
  "Phần thô & Xây tô",
  "M&E & Điện",
  "Nội thất gỗ",
  "Ốp lát & Gạch",
  "Sơn & Hoàn thiện",
  "Điều hòa & Lạnh",
]

export default function ContractorsPage() {
  const [contractors, setContractors] = useState(SUBCONTRACTORS)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>({ name: "", specialty: SPECIALTIES[0], contactName: "", contactPhone: "", notes: "" })

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const filtered = contractors.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.specialty.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (!form.name) return
    setContractors(prev => [...prev, {
      id: Date.now(), name: form.name, specialty: form.specialty,
      specialtyTags: [], contactPhone: form.contactPhone, contactName: form.contactName,
      rating: 0, completedJobs: 0, status: "ACTIVE" as const, notes: form.notes || undefined,
    }])
    setShowAdd(false)
    setForm({ name: "", specialty: SPECIALTIES[0], contactName: "", contactPhone: "", notes: "" })
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-orange-500" />
            Quản lý Nhà thầu
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {contractors.filter(c => c.status === "ACTIVE").length} nhà thầu đang hợp tác
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" /> Thêm nhà thầu
        </button>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input type="text" placeholder="Tìm nhà thầu, chuyên môn..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-300" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng nhà thầu",          value: contractors.length, color: "text-gray-800" },
          { label: "Đang hợp tác",            value: contractors.filter(c => c.status === "ACTIVE").length, color: "text-green-600" },
          { label: "Gói đang thi công",       value: ALLOCATIONS.filter(a => a.status === "in_progress").length, color: "text-blue-600" },
          { label: "Tổng giá trị khoán",      value: fmtVND(ALLOCATIONS.reduce((s, a) => s + a.contractValue, 0)), color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Contractor list */}
      <div className="space-y-3">
        {filtered.map(sub => {
          const allocations = ALLOCATIONS.filter(a => a.contractorId === sub.id)
          const activeAlloc = allocations.filter(a => a.status === "in_progress").length
          const totalValue  = allocations.reduce((s, a) => s + a.contractValue, 0)
          const isExpanded  = expanded.has(sub.id)

          return (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggle(sub.id)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #f97316, #E87625)" }}>
                  {sub.name.split(" ").pop()?.charAt(0) ?? "T"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{sub.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sub.specialty}</span>
                    {sub.status === "INACTIVE" && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Ngừng hợp tác</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <StarRating rating={sub.rating} />
                    <span className="text-xs text-gray-500">{sub.completedJobs} công trình</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />{sub.contactPhone} ({sub.contactName})
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex gap-6 text-center shrink-0">
                  <div>
                    <div className="text-sm font-bold text-blue-600">{activeAlloc}</div>
                    <div className="text-xs text-gray-400">Đang thi công</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{allocations.length}</div>
                    <div className="text-xs text-gray-400">Tổng dự án</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-orange-600">{totalValue > 0 ? fmtVND(totalValue) : "—"}</div>
                    <div className="text-xs text-gray-400">Tổng giá trị khoán</div>
                  </div>
                </div>

                <div className="text-gray-400 shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {allocations.length === 0 ? (
                    <div className="px-6 py-5 text-sm text-gray-400 text-center">Chưa có dự án nào được giao.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {allocations.map(a => {
                        const mats = SCOPE_MATERIALS[a.id] ?? []
                        return (
                          <div key={a.id} className="px-6 py-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <span className="text-xs font-mono text-gray-400">{a.projectCode}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status]}`}>
                                    {statusLabel[a.status]}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-800 text-sm">{a.projectName}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Phạm vi: {a.scope}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-orange-600">{fmtVND(a.contractValue)}</div>
                                <div className="text-xs text-gray-400 mt-0.5">Giá trị khoán</div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>Tiến độ thi công</span><span className="font-semibold">{a.progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${a.progress}%`, backgroundColor: a.progress === 100 ? "#16a34a" : "#E87625" }} />
                              </div>
                            </div>

                            {mats.length > 0 && (
                              <div className="mt-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-gray-100">
                                  Vật tư nhà thầu cung cấp cho phạm vi này
                                </div>
                                <table className="w-full text-xs">
                                  <tbody className="divide-y divide-gray-50">
                                    {mats.map((m, i) => (
                                      <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-700">{m.name}</td>
                                        <td className="px-3 py-2 text-center text-gray-500">{m.qty} {m.unit}</td>
                                        <td className="px-3 py-2 text-right text-gray-500">{fmtVND(m.unitPrice)}/{m.unit}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmtVND(m.qty * m.unitPrice)}</td>
                                      </tr>
                                    ))}
                                    <tr className="bg-slate-50">
                                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-slate-600">Tổng giá trị vật tư</td>
                                      <td className="px-3 py-2 text-right text-sm font-bold text-slate-800">
                                        {fmtVND(mats.reduce((s, m) => s + m.qty * m.unitPrice, 0))}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {sub.notes && (
                    <div className="px-6 py-3 border-t border-gray-100 bg-amber-50 text-xs text-amber-700 italic">
                      Ghi chú: {sub.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Thêm nhà thầu mới</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên nhà thầu / đội thợ *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Đội thợ Nguyễn Văn A..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chuyên môn</label>
                <select value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tên liên hệ</label>
                  <input type="text" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <input type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                Hủy
              </button>
              <button onClick={handleAdd}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E87625" }}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
