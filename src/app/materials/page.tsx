"use client"
import { useState } from "react"
import { Package, Plus, Search, X, AlertCircle } from "lucide-react"

const fmtVND = (n: number) => n.toLocaleString("vi-VN") + " ₫"

const CATEGORIES = ["Tất cả", "Xây dựng", "Hoàn thiện", "M&E & Điện", "Nội thất", "Thiết bị VS"]

const mockMaterials = [
  { id: 1, code: "VT-XD-001", name: "Xi măng PCB40 Hà Tiên", unit: "bao 50kg", unit_price: 85_000, category: "Xây dựng", supplier: "VLXD An Phú", in_stock: 120, min_stock: 50 },
  { id: 2, code: "VT-XD-002", name: "Cát vàng sàng xây", unit: "m³", unit_price: 220_000, category: "Xây dựng", supplier: "VLXD An Phú", in_stock: 15, min_stock: 10 },
  { id: 3, code: "VT-XD-003", name: "Gạch ống 4 lỗ 6×9×19", unit: "viên", unit_price: 1_800, category: "Xây dựng", supplier: "Gạch Đồng Tâm", in_stock: 2000, min_stock: 500 },
  { id: 4, code: "VT-XD-004", name: "Thép phi 10 CB300-V", unit: "kg", unit_price: 18_500, category: "Xây dựng", supplier: "Thép Hòa Phát", in_stock: 350, min_stock: 200 },
  { id: 5, code: "VT-HT-001", name: "Gạch ốp tường 60×60 Viglacera", unit: "m²", unit_price: 235_000, category: "Hoàn thiện", supplier: "Viglacera", in_stock: 0, min_stock: 20 },
  { id: 6, code: "VT-HT-002", name: "Sơn nước Dulux Easy Care 5L", unit: "thùng", unit_price: 480_000, category: "Hoàn thiện", supplier: "Dulux Vietnam", in_stock: 8, min_stock: 10 },
  { id: 7, code: "VT-HT-003", name: "Bột trét tường TileX 40kg", unit: "bao", unit_price: 165_000, category: "Hoàn thiện", supplier: "TileX", in_stock: 35, min_stock: 15 },
  { id: 8, code: "VT-HT-004", name: "Keo dán gạch Mapei Ultraflex 25kg", unit: "bao", unit_price: 320_000, category: "Hoàn thiện", supplier: "Mapei", in_stock: 12, min_stock: 10 },
  { id: 9, code: "VT-ME-001", name: "Dây điện CVV 1.5mm² Cadivi", unit: "cuộn 100m", unit_price: 320_000, category: "M&E & Điện", supplier: "Cadivi", in_stock: 12, min_stock: 5 },
  { id: 10, code: "VT-ME-002", name: "Ống luồn dây điện Ø25", unit: "thanh 4m", unit_price: 28_000, category: "M&E & Điện", supplier: "Sino", in_stock: 80, min_stock: 30 },
  { id: 11, code: "VT-ME-003", name: "CB MCB 20A Schneider Easy9", unit: "cái", unit_price: 95_000, category: "M&E & Điện", supplier: "Schneider", in_stock: 24, min_stock: 10 },
  { id: 12, code: "VT-ME-004", name: "Đèn downlight LED 9W Philips", unit: "cái", unit_price: 185_000, category: "M&E & Điện", supplier: "Philips Vietnam", in_stock: 0, min_stock: 20 },
  { id: 13, code: "VT-NT-001", name: "Gỗ MDF E1 dày 18mm Vanachai", unit: "tấm 1220×2440", unit_price: 520_000, category: "Nội thất", supplier: "Vanachai Thailand", in_stock: 0, min_stock: 10 },
  { id: 14, code: "VT-NT-002", name: "Sàn gỗ Egger EPL045 8mm AC4", unit: "m²", unit_price: 320_000, category: "Nội thất", supplier: "Egger Germany", in_stock: 0, min_stock: 30 },
  { id: 15, code: "VT-NT-003", name: "Bản lề âm tủ Blum 110°", unit: "cái", unit_price: 45_000, category: "Nội thất", supplier: "Blum Austria", in_stock: 150, min_stock: 50 },
  { id: 16, code: "VT-VS-001", name: "Bồn rửa âm bàn TOTO LT546CG", unit: "cái", unit_price: 2_850_000, category: "Thiết bị VS", supplier: "TOTO Vietnam", in_stock: 2, min_stock: 1 },
  { id: 17, code: "VT-VS-002", name: "Bồn cầu két liền American Standard", unit: "bộ", unit_price: 4_200_000, category: "Thiết bị VS", supplier: "American Standard", in_stock: 1, min_stock: 1 },
  { id: 18, code: "VT-VS-003", name: "Vòi sen tắm Inax BFV-20S", unit: "bộ", unit_price: 1_350_000, category: "Thiết bị VS", supplier: "Inax Vietnam", in_stock: 3, min_stock: 2 },
]

type AddForm = { code: string; name: string; unit: string; unit_price: string; category: string; supplier: string; min_stock: string }

export default function MaterialsPage() {
  const [materials, setMaterials] = useState(mockMaterials)
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("Tất cả")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>({ code: "", name: "", unit: "m²", unit_price: "", category: "Xây dựng", supplier: "", min_stock: "10" })

  const filtered = materials.filter(m => {
    const matchCat = activeCat === "Tất cả" || m.category === activeCat
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const lowStock = materials.filter(m => m.in_stock <= m.min_stock).length
  const outOfStock = materials.filter(m => m.in_stock === 0).length

  const handleAdd = () => {
    if (!form.name || !form.unit_price) return
    setMaterials(prev => [...prev, {
      id: Date.now(), code: form.code || `VT-${Date.now()}`, name: form.name,
      unit: form.unit, unit_price: parseFloat(form.unit_price) || 0,
      category: form.category, supplier: form.supplier, in_stock: 0,
      min_stock: parseInt(form.min_stock) || 10,
    }])
    setShowAdd(false)
    setForm({ code: "", name: "", unit: "m²", unit_price: "", category: "Xây dựng", supplier: "", min_stock: "10" })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" />
            Quản lý Vật tư
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{materials.length} loại vật tư trong danh mục</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" /> Thêm vật tư
        </button>
      </div>

      {/* Alert cards */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {outOfStock} loại hết hàng
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2.5 rounded-lg text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {lowStock} loại sắp hết (dưới mức tồn tối thiểu)
            </div>
          )}
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-none">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Tìm vật tư, mã..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeCat === cat ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={activeCat === cat ? { backgroundColor: "#E87625" } : undefined}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-white text-xs">
            <tr>
              <th className="px-4 py-3 text-left w-32">Mã VT</th>
              <th className="px-4 py-3 text-left">Tên vật tư</th>
              <th className="px-4 py-3 text-center w-24">ĐVT</th>
              <th className="px-4 py-3 text-right w-32">Đơn giá</th>
              <th className="px-4 py-3 text-left w-36">Nhà cung cấp</th>
              <th className="px-4 py-3 text-center w-24">Tồn kho</th>
              <th className="px-4 py-3 text-center w-28">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(m => {
              const isOut = m.in_stock === 0
              const isLow = m.in_stock > 0 && m.in_stock <= m.min_stock
              return (
                <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${isOut ? "bg-red-50/40" : isLow ? "bg-yellow-50/40" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.category}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{m.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtVND(m.unit_price)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{m.supplier}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-600"}`}>
                      {m.in_stock.toLocaleString("vi-VN")}
                    </span>
                    <div className="text-xs text-gray-400">/ min {m.min_stock}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isOut
                      ? <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Hết hàng</span>
                      : isLow
                        ? <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Sắp hết</span>
                        : <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đủ hàng</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">Không tìm thấy vật tư phù hợp</div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Thêm vật tư mới</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã vật tư</label>
                  <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="VT-XD-099"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Danh mục</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên vật tư *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Xi măng PCB40..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ĐVT</label>
                  <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đơn giá (VND) *</label>
                  <input type="number" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tồn tối thiểu</label>
                  <input type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Hủy</button>
              <button onClick={handleAdd} className="px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: "#E87625" }}>Thêm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
