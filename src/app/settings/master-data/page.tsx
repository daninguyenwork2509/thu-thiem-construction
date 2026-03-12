"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus, Search, Edit2, Trash2, Save, X, Phone, MapPin, Star } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface SimpleItem { id: number; name: string; code?: string; note?: string; active: boolean }

interface Supplier {
  id: number; name: string; code: string; contact: string; phone: string
  address: string; taxCode: string; category: string; rating: number; active: boolean
}

interface Material {
  id: number; name: string; code: string; uom: string; category: string
  supplierId: number; supplierName: string; costPrice: number; note: string; active: boolean
}

interface PriceItem {
  id: number; workCode: string; workName: string; uom: string
  category: string; refPrice: number; region: string; note: string; active: boolean
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const INIT_SIMPLE: Record<string, SimpleItem[]> = {
  uom: [
    { id: 1, name: "m²", code: "M2", note: "Mét vuông", active: true },
    { id: 2, name: "m³", code: "M3", note: "Mét khối", active: true },
    { id: 3, name: "m", code: "M", note: "Mét dài", active: true },
    { id: 4, name: "bộ", code: "BO", note: "", active: true },
    { id: 5, name: "cái", code: "CAI", note: "", active: true },
    { id: 6, name: "kg", code: "KG", note: "Kilogram", active: true },
    { id: 7, name: "tấn", code: "TAN", note: "", active: true },
    { id: 8, name: "lít", code: "LIT", note: "", active: true },
    { id: 9, name: "cuộn", code: "CUO", note: "", active: true },
    { id: 10, name: "thùng", code: "THU", note: "", active: true },
  ],
  categories: [
    { id: 1, name: "Căn hộ chung cư", code: "CHCC", note: "Nội thất căn hộ", active: true },
    { id: 2, name: "Biệt thự", code: "BT", note: "", active: true },
    { id: 3, name: "Nhà phố", code: "NP", note: "", active: true },
    { id: 4, name: "Văn phòng", code: "VP", note: "Office fit-out", active: true },
    { id: 5, name: "Showroom", code: "SR", note: "", active: true },
    { id: 6, name: "Nhà hàng / F&B", code: "FB", note: "", active: true },
    { id: 7, name: "Khách sạn", code: "KS", note: "", active: true },
  ],
  actions: [
    { id: 1, name: "Phá dỡ", code: "PD", note: "", active: true },
    { id: 2, name: "Thi công mới", code: "TCM", note: "", active: true },
    { id: 3, name: "Sửa chữa", code: "SC", note: "", active: true },
    { id: 4, name: "Lắp đặt", code: "LD", note: "", active: true },
    { id: 5, name: "Hoàn thiện", code: "HT", note: "", active: true },
  ],
}

const INIT_SUPPLIERS: Supplier[] = [
  { id: 1, name: "Gỗ Đức Thành", code: "NCC-001", contact: "Nguyễn Đức", phone: "0901234567", address: "Q.12, HCM", taxCode: "0301234567", category: "Gỗ & Nội thất", rating: 5, active: true },
  { id: 2, name: "Gạch Đồng Tâm", code: "NCC-002", contact: "Trần Thị Lan", phone: "0912345678", address: "Long An", taxCode: "1100234567", category: "Gạch & Đá", rating: 4, active: true },
  { id: 3, name: "Sơn Nippon Việt Nam", code: "NCC-003", contact: "Lê Văn Hùng", phone: "0923456789", address: "Bình Dương", taxCode: "3701234567", category: "Sơn & Hoàn thiện", rating: 5, active: true },
  { id: 4, name: "Thiết bị vệ sinh TOTO", code: "NCC-004", contact: "Phạm Thu Hà", phone: "0934567890", address: "Đà Nẵng", taxCode: "0401234567", category: "Thiết bị vệ sinh", rating: 4, active: true },
  { id: 5, name: "Điện Lioa", code: "NCC-005", contact: "Hoàng Văn Nam", phone: "0945678901", address: "Hà Nội", taxCode: "0101234567", category: "Điện & Chiếu sáng", rating: 3, active: true },
  { id: 6, name: "Kính Pilkington", code: "NCC-006", contact: "Vũ Thị Mai", phone: "0956789012", address: "HCM", taxCode: "0302345678", category: "Kính & Nhôm", rating: 4, active: false },
]

const INIT_MATERIALS: Material[] = [
  { id: 1, name: "Gỗ MDF phủ melamine 18mm", code: "VT-001", uom: "m²", category: "Gỗ", supplierId: 1, supplierName: "Gỗ Đức Thành", costPrice: 320000, note: "Màu trắng, vân gỗ", active: true },
  { id: 2, name: "Gạch men 600x600 cao cấp", code: "VT-002", uom: "m²", category: "Gạch", supplierId: 2, supplierName: "Gạch Đồng Tâm", costPrice: 280000, note: "Series Platinum", active: true },
  { id: 3, name: "Sơn nội thất Nippon Easy Wash", code: "VT-003", uom: "lít", category: "Sơn", supplierId: 3, supplierName: "Sơn Nippon VN", costPrice: 95000, note: "Sơn 2 lớp / 1 lót", active: true },
  { id: 4, name: "Bồn cầu TOTO CS300", code: "VT-004", uom: "cái", category: "Thiết bị VS", supplierId: 4, supplierName: "Thiết bị VS TOTO", costPrice: 3_200_000, note: "Bồn cầu 1 khối", active: true },
  { id: 5, name: "Đèn LED âm trần 9W", code: "VT-005", uom: "cái", category: "Điện", supplierId: 5, supplierName: "Điện Lioa", costPrice: 75000, note: "Ánh sáng trắng 6500K", active: true },
  { id: 6, name: "Kính cường lực 10mm", code: "VT-006", uom: "m²", category: "Kính", supplierId: 6, supplierName: "Kính Pilkington", costPrice: 650000, note: "Kính trong suốt", active: false },
  { id: 7, name: "Gỗ công nghiệp HMR 18mm", code: "VT-007", uom: "m²", category: "Gỗ", supplierId: 1, supplierName: "Gỗ Đức Thành", costPrice: 380000, note: "Chống ẩm, khu vực bếp/nhà tắm", active: true },
]

const INIT_PRICES: PriceItem[] = [
  { id: 1, workCode: "DD-001", workName: "Thi công trần thạch cao phẳng", uom: "m²", category: "Trần", refPrice: 250000, region: "HCM", note: "Bao gồm khung xương + tấm + nhân công", active: true },
  { id: 2, workCode: "DD-002", workName: "Thi công tường sơn nước (lớp hoàn thiện)", uom: "m²", category: "Tường", refPrice: 85000, region: "HCM", note: "Chưa bao gồm sơn lót", active: true },
  { id: 3, workCode: "DD-003", workName: "Lát sàn gạch ceramic 60x60", uom: "m²", category: "Sàn", refPrice: 180000, region: "HCM", note: "Nhân công + vữa + keo dán", active: true },
  { id: 4, workCode: "DD-004", workName: "Lắp đặt cửa gỗ công nghiệp", uom: "cái", category: "Cửa", refPrice: 1_200_000, region: "HCM", note: "Chuẩn 900x2100", active: true },
  { id: 5, workCode: "DD-005", workName: "Đi dây điện âm tường (trọn gói/m²)", uom: "m²", category: "Điện", refPrice: 120000, region: "HCM", note: "Bao gồm dây, ống, nhân công", active: true },
  { id: 6, workCode: "DD-006", workName: "Thi công hệ thống cấp thoát nước", uom: "điểm", category: "Nước", refPrice: 850000, region: "HCM", note: "Mỗi điểm cấp/thoát", active: true },
  { id: 7, workCode: "DD-007", workName: "Ốp gạch nhà vệ sinh (tường + sàn)", uom: "m²", category: "Toilet", refPrice: 220000, region: "HCM", note: "Nhân công ốp lát tổng hợp", active: true },
  { id: 8, workCode: "DD-008", workName: "Thi công tủ bếp (cánh phủ Acrylic)", uom: "m dài", category: "Nội thất", refPrice: 3_500_000, region: "HCM", note: "Tủ trên + dưới / m dài tổng", active: true },
]

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n)

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "uom", label: "Đơn vị tính" },
  { key: "categories", label: "Loại công trình" },
  { key: "actions", label: "Loại công tác" },
  { key: "suppliers", label: "Nhà cung cấp" },
  { key: "materials", label: "Vật tư" },
  { key: "prices", label: "Thư viện đơn giá" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function MasterDataPage() {
  const router = useRouter()
  const [tab, setTab] = useState("uom")
  const [simpleData, setSimpleData] = useState(INIT_SIMPLE)
  const [suppliers, setSuppliers] = useState(INIT_SUPPLIERS)
  const [materials, setMaterials] = useState(INIT_MATERIALS)
  const [prices, setPrices] = useState(INIT_PRICES)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Simple form
  const [sForm, setSForm] = useState({ name: "", code: "", note: "" })
  // Supplier form
  const [supForm, setSupForm] = useState({ name: "", code: "", contact: "", phone: "", address: "", taxCode: "", category: "", rating: 5 })
  // Material form
  const [matForm, setMatForm] = useState({ name: "", code: "", uom: "m²", category: "", supplierId: 0, supplierName: "", costPrice: 0, note: "" })
  // Price form
  const [priceForm, setPriceForm] = useState({ workCode: "", workName: "", uom: "m²", category: "", refPrice: 0, region: "HCM", note: "" })

  const isSimple = ["uom", "categories", "actions"].includes(tab)
  const q = search.toLowerCase()

  // ── filtered lists ──────────────────────────────────────────────────────────
  const simpleItems = (simpleData[tab] ?? []).filter(i =>
    !q || i.name.toLowerCase().includes(q) || (i.code ?? "").toLowerCase().includes(q)
  )
  const filteredSuppliers = suppliers.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  )
  const filteredMaterials = materials.filter(m =>
    !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
  )
  const filteredPrices = prices.filter(p =>
    !q || p.workName.toLowerCase().includes(q) || p.workCode.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  )

  // ── open modal ──────────────────────────────────────────────────────────────
  const openCreate = () => { setEditId(null); resetForms(); setShowModal(true) }
  const resetForms = () => {
    setSForm({ name: "", code: "", note: "" })
    setSupForm({ name: "", code: "", contact: "", phone: "", address: "", taxCode: "", category: "", rating: 5 })
    setMatForm({ name: "", code: "", uom: "m²", category: "", supplierId: 0, supplierName: "", costPrice: 0, note: "" })
    setPriceForm({ workCode: "", workName: "", uom: "m²", category: "", refPrice: 0, region: "HCM", note: "" })
  }
  const openEdit = (id: number) => {
    setEditId(id)
    if (isSimple) {
      const item = (simpleData[tab] ?? []).find(i => i.id === id)!
      setSForm({ name: item.name, code: item.code ?? "", note: item.note ?? "" })
    } else if (tab === "suppliers") {
      const s = suppliers.find(i => i.id === id)!
      setSupForm({ name: s.name, code: s.code, contact: s.contact, phone: s.phone, address: s.address, taxCode: s.taxCode, category: s.category, rating: s.rating })
    } else if (tab === "materials") {
      const m = materials.find(i => i.id === id)!
      setMatForm({ name: m.name, code: m.code, uom: m.uom, category: m.category, supplierId: m.supplierId, supplierName: m.supplierName, costPrice: m.costPrice, note: m.note })
    } else if (tab === "prices") {
      const p = prices.find(i => i.id === id)!
      setPriceForm({ workCode: p.workCode, workName: p.workName, uom: p.uom, category: p.category, refPrice: p.refPrice, region: p.region, note: p.note })
    }
    setShowModal(true)
  }

  // ── save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (isSimple) {
      if (!sForm.name) return
      setSimpleData(prev => {
        const list = prev[tab] ?? []
        if (editId) return { ...prev, [tab]: list.map(i => i.id === editId ? { ...i, ...sForm } : i) }
        return { ...prev, [tab]: [...list, { id: Date.now(), ...sForm, active: true }] }
      })
    } else if (tab === "suppliers") {
      if (!supForm.name) return
      if (editId) setSuppliers(p => p.map(s => s.id === editId ? { ...s, ...supForm } : s))
      else setSuppliers(p => [...p, { id: Date.now(), ...supForm, active: true }])
    } else if (tab === "materials") {
      if (!matForm.name) return
      const sup = suppliers.find(s => s.id === matForm.supplierId)
      const entry = { ...matForm, supplierName: sup?.name ?? matForm.supplierName }
      if (editId) setMaterials(p => p.map(m => m.id === editId ? { ...m, ...entry } : m))
      else setMaterials(p => [...p, { id: Date.now(), ...entry, active: true }])
    } else if (tab === "prices") {
      if (!priceForm.workName) return
      if (editId) setPrices(p => p.map(i => i.id === editId ? { ...i, ...priceForm } : i))
      else setPrices(p => [...p, { id: Date.now(), ...priceForm, active: true }])
    }
    setShowModal(false)
  }

  const toggleActive = (id: number) => {
    if (isSimple) setSimpleData(prev => ({ ...prev, [tab]: (prev[tab] ?? []).map(i => i.id === id ? { ...i, active: !i.active } : i) }))
    else if (tab === "suppliers") setSuppliers(p => p.map(s => s.id === id ? { ...s, active: !s.active } : s))
    else if (tab === "materials") setMaterials(p => p.map(m => m.id === id ? { ...m, active: !m.active } : m))
    else if (tab === "prices") setPrices(p => p.map(i => i.id === id ? { ...i, active: !i.active } : i))
  }

  const deleteItem = (id: number) => {
    if (!confirm("Xác nhận xóa?")) return
    if (isSimple) setSimpleData(prev => ({ ...prev, [tab]: (prev[tab] ?? []).filter(i => i.id !== id) }))
    else if (tab === "suppliers") setSuppliers(p => p.filter(s => s.id !== id))
    else if (tab === "materials") setMaterials(p => p.filter(m => m.id !== id))
    else if (tab === "prices") setPrices(p => p.filter(i => i.id !== id))
  }

  const tabCount = (key: string) => {
    if (["uom", "categories", "actions"].includes(key)) return simpleData[key]?.length ?? 0
    if (key === "suppliers") return suppliers.length
    if (key === "materials") return materials.length
    if (key === "prices") return prices.length
    return 0
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/settings")} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Danh mục dữ liệu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý đơn vị tính, nhà cung cấp, vật tư, thư viện đơn giá</p>
        </div>
        <button onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" />Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch("") }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${tab === t.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{tabCount(t.key)}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      {/* ── Simple tabs (UOM / Category / Action) ── */}
      {isSimple && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Ghi chú</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {simpleItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{item.code}</span></td>
                  <td className="px-4 py-2.5 text-gray-500">{item.note || "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleActive(item.id)} className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${item.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500"}`}>
                      {item.active ? "Hoạt động" : "Tắt"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {simpleItems.length === 0 && <div className="py-10 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>}
        </div>
      )}

      {/* ── Suppliers ── */}
      {tab === "suppliers" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nhà cung cấp</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Danh mục</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Liên hệ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">MST</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Đánh giá</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{s.code}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{s.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{s.contact}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Phone className="w-3 h-3" />{s.phone}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin className="w-3 h-3" />{s.address}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{s.taxCode}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= s.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(s.id)} className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.active ? "Hoạt động" : "Ngừng"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && <div className="py-10 text-center text-gray-400 text-sm">Chưa có nhà cung cấp</div>}
        </div>
      )}

      {/* ── Materials ── */}
      {tab === "materials" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tên vật tư</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Danh mục</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nhà cung cấp</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">ĐVT</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Giá nhập</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">TT</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{m.name}</div>
                    {m.note && <div className="text-xs text-gray-400 mt-0.5">{m.note}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{m.code}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">{m.category}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{m.supplierName}</td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{m.uom}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(m.costPrice)} đ</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(m.id)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.active ? "✓" : "✗"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(m.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMaterials.length === 0 && <div className="py-10 text-center text-gray-400 text-sm">Chưa có vật tư</div>}
        </div>
      )}

      {/* ── Price Library ── */}
      {tab === "prices" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tên công tác</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Danh mục</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">ĐVT</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Đơn giá tham chiếu</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Vùng</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">TT</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrices.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.workCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.workName}</div>
                    {p.note && <div className="text-xs text-gray-400 mt-0.5">{p.note}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{p.uom}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-700">{fmt(p.refPrice)} đ</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">{p.region}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(p.id)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.active ? "✓" : "✗"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPrices.length === 0 && <div className="py-10 text-center text-gray-400 text-sm">Chưa có đơn giá</div>}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{editId ? "Chỉnh sửa" : "Thêm mới"} — {TABS.find(t => t.key === tab)?.label}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-5 space-y-3">
              {/* Simple form */}
              {isSimple && (<>
                <Field label="Tên *"><input value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} autoFocus className={INPUT} /></Field>
                <Field label="Mã"><input value={sForm.code} onChange={e => setSForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={INPUT + " uppercase font-mono"} /></Field>
                <Field label="Ghi chú"><input value={sForm.note} onChange={e => setSForm(f => ({ ...f, note: e.target.value }))} className={INPUT} /></Field>
              </>)}

              {/* Supplier form */}
              {tab === "suppliers" && (<>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên NCC *"><input value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} autoFocus className={INPUT} /></Field>
                  <Field label="Mã NCC"><input value={supForm.code} onChange={e => setSupForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={INPUT + " uppercase font-mono"} /></Field>
                  <Field label="Người liên hệ"><input value={supForm.contact} onChange={e => setSupForm(f => ({ ...f, contact: e.target.value }))} className={INPUT} /></Field>
                  <Field label="Số điện thoại"><input value={supForm.phone} onChange={e => setSupForm(f => ({ ...f, phone: e.target.value }))} className={INPUT} /></Field>
                  <Field label="Địa chỉ"><input value={supForm.address} onChange={e => setSupForm(f => ({ ...f, address: e.target.value }))} className={INPUT} /></Field>
                  <Field label="Mã số thuế"><input value={supForm.taxCode} onChange={e => setSupForm(f => ({ ...f, taxCode: e.target.value }))} className={INPUT + " font-mono"} /></Field>
                  <Field label="Danh mục"><input value={supForm.category} onChange={e => setSupForm(f => ({ ...f, category: e.target.value }))} placeholder="Gỗ, Gạch, Sơn..." className={INPUT} /></Field>
                  <Field label="Đánh giá (1–5)">
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} type="button" onClick={() => setSupForm(f => ({ ...f, rating: i }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition ${i <= supForm.rating ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-400"}`}>{i}</button>
                      ))}
                    </div>
                  </Field>
                </div>
              </>)}

              {/* Material form */}
              {tab === "materials" && (<>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên vật tư *"><input value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} autoFocus className={INPUT} /></Field>
                  <Field label="Mã vật tư"><input value={matForm.code} onChange={e => setMatForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={INPUT + " uppercase font-mono"} /></Field>
                  <Field label="Danh mục"><input value={matForm.category} onChange={e => setMatForm(f => ({ ...f, category: e.target.value }))} className={INPUT} /></Field>
                  <Field label="Đơn vị tính">
                    <select value={matForm.uom} onChange={e => setMatForm(f => ({ ...f, uom: e.target.value }))} className={INPUT + " bg-white"}>
                      {["m²","m³","m","bộ","cái","kg","tấn","lít","cuộn","thùng"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Nhà cung cấp">
                    <select value={matForm.supplierId} onChange={e => setMatForm(f => ({ ...f, supplierId: +e.target.value }))} className={INPUT + " bg-white"}>
                      <option value={0}>— Chọn NCC —</option>
                      {suppliers.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Giá nhập (đ/ĐVT)">
                    <input type="number" value={matForm.costPrice} onChange={e => setMatForm(f => ({ ...f, costPrice: +e.target.value }))} className={INPUT} />
                  </Field>
                  <Field label="Ghi chú" className="col-span-2"><input value={matForm.note} onChange={e => setMatForm(f => ({ ...f, note: e.target.value }))} className={INPUT} /></Field>
                </div>
              </>)}

              {/* Price form */}
              {tab === "prices" && (<>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên công tác *"><input value={priceForm.workName} onChange={e => setPriceForm(f => ({ ...f, workName: e.target.value }))} autoFocus className={INPUT} /></Field>
                  <Field label="Mã công tác"><input value={priceForm.workCode} onChange={e => setPriceForm(f => ({ ...f, workCode: e.target.value.toUpperCase() }))} className={INPUT + " uppercase font-mono"} /></Field>
                  <Field label="Danh mục"><input value={priceForm.category} onChange={e => setPriceForm(f => ({ ...f, category: e.target.value }))} className={INPUT} /></Field>
                  <Field label="Đơn vị tính">
                    <select value={priceForm.uom} onChange={e => setPriceForm(f => ({ ...f, uom: e.target.value }))} className={INPUT + " bg-white"}>
                      {["m²","m³","m","bộ","cái","kg","điểm","m dài"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Đơn giá tham chiếu (đ)">
                    <input type="number" value={priceForm.refPrice} onChange={e => setPriceForm(f => ({ ...f, refPrice: +e.target.value }))} className={INPUT} />
                  </Field>
                  <Field label="Vùng / Khu vực">
                    <select value={priceForm.region} onChange={e => setPriceForm(f => ({ ...f, region: e.target.value }))} className={INPUT + " bg-white"}>
                      {["HCM","Hà Nội","Đà Nẵng","Cả nước"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Ghi chú" className="col-span-2"><input value={priceForm.note} onChange={e => setPriceForm(f => ({ ...f, note: e.target.value }))} className={INPUT} /></Field>
                </div>
              </>)}
            </div>

            <div className="flex gap-3 px-5 pb-5 sticky bottom-0 bg-white border-t border-gray-100 pt-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#E87625" }}>
                <Save className="w-4 h-4" />Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
