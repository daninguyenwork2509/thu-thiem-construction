"use client"
import { useState, useMemo } from "react"
import { fmtVND } from "@/lib/mock-data"
import {
  ArrowRight, ChevronRight, User, Calendar, Plus, Eye,
  Kanban, List, Search, TrendingUp, CheckCircle2,
  FolderKanban, Users, Pencil, Trash2, X, ChevronDown,
  AlertTriangle, AlertCircle, GripVertical
} from "lucide-react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────
type Stage = "lead" | "design" | "contract" | "construction" | "payment" | "handover"
type Priority = "high" | "medium" | "low"
type ItemType = "lead" | "project"

interface PipelineItem {
  id: string; type: ItemType; name: string; client: string
  phone?: string; source?: string; value: number; stage: Stage
  responsible: string; responsibleInitials: string; responsibleColor: string
  progress?: number; deadline?: string; priority: Priority
  tags?: string[]; note?: string; voCount?: number
}

interface VOItem {
  id: string; projectId: string; projectName: string
  title: string; reason: string; amount: number
  status: "pending" | "approved" | "rejected"
  requestedBy: string; date: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INIT_ITEMS: PipelineItem[] = [
  { id: "l4", type: "lead", name: "Nhà phố Bình Thạnh – 4 tầng", client: "Ngô Bích Trâm", phone: "0901 234 567", source: "Facebook",
    value: 800_000_000, stage: "lead", responsible: "Phạm Văn Đức", responsibleInitials: "ĐP", responsibleColor: "bg-blue-500",
    deadline: "2026-03-20", priority: "high", tags: ["Facebook"] },
  { id: "l3", type: "lead", name: "Căn hộ Studio – Quận 3", client: "Lý Thành Long", phone: "0912 345 678", source: "Website",
    value: 450_000_000, stage: "lead", responsible: "Nguyễn Thu Hà", responsibleInitials: "HN", responsibleColor: "bg-pink-500",
    deadline: "2026-03-22", priority: "medium", tags: ["Website"] },
  { id: "l6", type: "lead", name: "Nhà vườn Long An – 200m²", client: "Phú Xuân Trường", phone: "0923 456 789", source: "Zalo",
    value: 1_100_000_000, stage: "lead", responsible: "Phạm Văn Đức", responsibleInitials: "ĐP", responsibleColor: "bg-blue-500",
    deadline: "2026-03-25", priority: "medium", tags: ["Zalo"] },
  { id: "l5", type: "lead", name: "Penthouse Sky Garden – Tầng 28", client: "Dương Quốc Bảo", phone: "0934 567 890", source: "Zalo",
    value: 2_000_000_000, stage: "design", responsible: "Lê Văn Nam", responsibleInitials: "NL", responsibleColor: "bg-purple-500",
    deadline: "2026-03-28", priority: "high", tags: ["VIP"] },
  { id: "l1", type: "lead", name: "Biệt thự Nhơn Trạch – Đồng Nai", client: "Hoàng Minh Khoa", phone: "0945 678 901", source: "Referral",
    value: 650_000_000, stage: "design", responsible: "Nguyễn Thu Hà", responsibleInitials: "HN", responsibleColor: "bg-pink-500",
    deadline: "2026-03-30", priority: "medium", tags: ["Referral"] },
  { id: "l7", type: "lead", name: "Văn phòng 200m² – Quận 1", client: "Cty TNHH Minh Phát", phone: "0956 789 012", source: "Website",
    value: 980_000_000, stage: "design", responsible: "Lê Văn Nam", responsibleInitials: "NL", responsibleColor: "bg-purple-500",
    deadline: "2026-04-02", priority: "low", tags: ["Website"] },
  { id: "l2", type: "lead", name: "Căn hộ 2PN – Bình Dương", client: "Trần Bảo Châu", phone: "0967 890 123", source: "Referral",
    value: 1_200_000_000, stage: "contract", responsible: "Phạm Văn Đức", responsibleInitials: "ĐP", responsibleColor: "bg-blue-500",
    deadline: "2026-03-15", priority: "high", tags: ["Chốt"] },
  { id: "p2", type: "project", name: "Văn phòng Landmark 81 – T22", client: "Cty TNHH ABC", phone: "0901 111 222",
    value: 1_500_000_000, stage: "contract", responsible: "Lê Minh Tuấn", responsibleInitials: "TL", responsibleColor: "bg-teal-500",
    deadline: "2026-03-31", priority: "high", tags: ["Pháp lý"], voCount: 1 },
  { id: "p1", type: "project", name: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", client: "Nguyễn Văn An", phone: "0912 222 333",
    value: 820_000_000, stage: "construction", responsible: "Trần Thị Bình", responsibleInitials: "BT", responsibleColor: "bg-orange-500",
    progress: 48, deadline: "2025-08-31", priority: "high", tags: ["Đúng tiến độ"], voCount: 3 },
  { id: "p4", type: "project", name: "Villa Thảo Điền – Q.2", client: "Lê Quang Vinh", phone: "0923 333 444",
    value: 3_500_000_000, stage: "construction", responsible: "Lê Minh Tuấn", responsibleInitials: "TL", responsibleColor: "bg-teal-500",
    progress: 32, deadline: "2026-06-30", priority: "medium", tags: ["Trễ 1 tuần"], voCount: 2 },
  { id: "p5", type: "project", name: "Nhà phố Bình Thạnh – Q.BT", client: "Vũ Thị Mai", phone: "0934 444 555",
    value: 1_800_000_000, stage: "construction", responsible: "Trần Thị Bình", responsibleInitials: "BT", responsibleColor: "bg-orange-500",
    progress: 71, deadline: "2026-05-15", priority: "medium", tags: ["Đúng tiến độ"] },
  { id: "p6", type: "project", name: "Căn hộ Vinhomes Central", client: "Bùi Ngọc Anh", phone: "0945 555 666",
    value: 950_000_000, stage: "payment", responsible: "Hoàng Lan Anh", responsibleInitials: "AL", responsibleColor: "bg-green-500",
    deadline: "2026-04-10", priority: "high", tags: ["Quá hạn"], voCount: 1 },
  { id: "p7", type: "project", name: "Shophouse Ecopark – Hưng Yên", client: "Cty Đại Phát", phone: "0956 666 777",
    value: 2_100_000_000, stage: "payment", responsible: "Hoàng Lan Anh", responsibleInitials: "AL", responsibleColor: "bg-green-500",
    deadline: "2026-04-20", priority: "medium", tags: ["Đợt 4/5"] },
  { id: "p3", type: "project", name: "Biệt thự Song Long – Thủ Đức", client: "Phạm Thị Hoa", phone: "0967 777 888",
    value: 2_200_000_000, stage: "handover", responsible: "Trần Thị Bình", responsibleInitials: "BT", responsibleColor: "bg-orange-500",
    progress: 100, deadline: "2024-11-30", priority: "low", tags: ["Hoàn thành"] },
]

const INIT_VOS: VOItem[] = [
  { id: "vo1", projectId: "p1", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    title: "Thay đổi vật liệu sàn tầng 3", reason: "Khách hàng yêu cầu nâng cấp từ gạch 60x60 lên đá marble nhập",
    amount: 45_000_000, status: "approved", requestedBy: "Trần Thị Bình", date: "2026-02-15" },
  { id: "vo2", projectId: "p1", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    title: "Bổ sung điểm điện phòng làm việc", reason: "Phát sinh 4 ổ cắm + 2 đèn chiều sáng theo yêu cầu",
    amount: 12_000_000, status: "pending", requestedBy: "Vũ Đình Mạnh", date: "2026-03-01" },
  { id: "vo3", projectId: "p1", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    title: "Thêm vách ngăn phòng ngủ", reason: "Điều chỉnh layout theo yêu cầu gia chủ",
    amount: 28_000_000, status: "pending", requestedBy: "Trần Thị Bình", date: "2026-03-05" },
  { id: "vo4", projectId: "p4", projectName: "Villa Thảo Điền – Q.2",
    title: "Nâng cấp hệ thống điện năng lượng mặt trời", reason: "Chủ đầu tư bổ sung yêu cầu sau khi ký HĐ",
    amount: 180_000_000, status: "approved", requestedBy: "Lê Minh Tuấn", date: "2026-01-20" },
  { id: "vo5", projectId: "p4", projectName: "Villa Thảo Điền – Q.2",
    title: "Thay đổi thiết kế hồ bơi", reason: "Thay hồ bơi 5m thành 8m + jacuzzi theo yêu cầu chủ đầu tư",
    amount: 220_000_000, status: "pending", requestedBy: "Lê Minh Tuấn", date: "2026-02-28" },
  { id: "vo6", projectId: "p6", projectName: "Căn hộ Vinhomes Central",
    title: "Bổ sung hệ thống điều hòa âm trần", reason: "Yêu cầu nâng cấp từ điều hòa treo tường",
    amount: 65_000_000, status: "rejected", requestedBy: "Hoàng Lan Anh", date: "2026-02-10" },
  { id: "vo7", projectId: "p2", projectName: "Văn phòng Landmark 81 – T22",
    title: "Thêm phòng họp tầng 22", reason: "Cơ cấu tổ chức thay đổi, cần 1 phòng họp nhỏ bổ sung",
    amount: 95_000_000, status: "pending", requestedBy: "Lê Minh Tuấn", date: "2026-03-10" },
]

// ── Configs ───────────────────────────────────────────────────────────────────
const STAGES: { key: Stage; label: string; sublabel: string; dot: string; badge: string; border: string; header: string; dropBg: string }[] = [
  { key: "lead",         label: "Khách hàng",    sublabel: "Tiếp cận & Khảo sát",    dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700",     border: "border-blue-200",   header: "bg-blue-100",   dropBg: "bg-blue-50/80" },
  { key: "design",       label: "Thiết kế & DT", sublabel: "Bản vẽ & Dự toán BOQ",   dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700", border: "border-purple-200", header: "bg-purple-100", dropBg: "bg-purple-50/80" },
  { key: "contract",     label: "Chốt HĐ",       sublabel: "Ký hợp đồng & Đặt cọc", dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-700",   border: "border-amber-200",  header: "bg-amber-100",  dropBg: "bg-amber-50/80" },
  { key: "construction", label: "Đang thi công", sublabel: "Triển khai & Giám sát",  dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700", border: "border-orange-200", header: "bg-orange-100", dropBg: "bg-orange-50/80" },
  { key: "payment",      label: "Thanh toán",    sublabel: "Thu tiền & Đối chiếu",   dot: "bg-green-500",  badge: "bg-green-100 text-green-700",   border: "border-green-200",  header: "bg-green-100",  dropBg: "bg-green-50/80" },
  { key: "handover",     label: "Bàn giao",      sublabel: "Nghiệm thu & Bảo hành",  dot: "bg-teal-500",   badge: "bg-teal-100 text-teal-700",     border: "border-teal-200",   header: "bg-teal-100",   dropBg: "bg-teal-50/80" },
]
const STAGE_ORDER: Stage[] = ["lead", "design", "contract", "construction", "payment", "handover"]
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s])) as Record<Stage, typeof STAGES[0]>

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-100 text-red-600", medium: "bg-yellow-100 text-yellow-700", low: "bg-gray-100 text-gray-500",
}
const PRIORITY_LABEL: Record<Priority, string> = { high: "Cao", medium: "TB", low: "Thấp" }

const VO_STATUS: Record<VOItem["status"], { label: string; color: string }> = {
  pending:  { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Đã duyệt",  color: "bg-green-100 text-green-700" },
  rejected: { label: "Từ chối",   color: "bg-red-100 text-red-600" },
}

const RESPONSIBLE_OPTIONS = [
  { name: "Phạm Văn Đức",  initials: "ĐP", color: "bg-blue-500" },
  { name: "Nguyễn Thu Hà", initials: "HN", color: "bg-pink-500" },
  { name: "Lê Văn Nam",    initials: "NL", color: "bg-purple-500" },
  { name: "Lê Minh Tuấn",  initials: "TL", color: "bg-teal-500" },
  { name: "Trần Thị Bình", initials: "BT", color: "bg-orange-500" },
  { name: "Hoàng Lan Anh", initials: "AL", color: "bg-green-500" },
]

const EMPTY_FORM: Omit<PipelineItem, "id"> = {
  type: "lead", name: "", client: "", phone: "", source: "",
  value: 0, stage: "lead", responsible: "Phạm Văn Đức",
  responsibleInitials: "ĐP", responsibleColor: "bg-blue-500",
  priority: "medium", deadline: "", note: "", tags: [],
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>(INIT_ITEMS)
  const [vos] = useState<VOItem[]>(INIT_VOS)
  const [view, setView] = useState<"kanban" | "list" | "vo">("kanban")
  const [search, setSearch] = useState("")
  const [filterStage, setFilterStage] = useState<Stage | "all">("all")
  const [filterType, setFilterType] = useState<ItemType | "all">("all")
  const [voSearch, setVoSearch] = useState("")
  const [voFilter, setVoFilter] = useState<VOItem["status"] | "all">("all")
  // Drag state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null)
  // Modal state
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null)
  const [selected, setSelected] = useState<PipelineItem | null>(null)
  const [form, setForm] = useState<Omit<PipelineItem, "id">>(EMPTY_FORM)

  // ── Filtered
  const filtered = useMemo(() => items.filter(it => {
    if (filterType !== "all" && it.type !== filterType) return false
    if (filterStage !== "all" && it.stage !== filterStage) return false
    if (search && !it.name.toLowerCase().includes(search.toLowerCase()) &&
        !it.client.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [items, filterType, filterStage, search])

  const filteredVos = useMemo(() => vos.filter(v => {
    if (voFilter !== "all" && v.status !== voFilter) return false
    if (voSearch && !v.title.toLowerCase().includes(voSearch.toLowerCase()) &&
        !v.projectName.toLowerCase().includes(voSearch.toLowerCase())) return false
    return true
  }), [vos, voFilter, voSearch])

  // ── KPIs
  const constructing = items.filter(c => c.stage === "construction")
  const avgProgress = constructing.length
    ? Math.round(constructing.reduce((s, c) => s + (c.progress ?? 0), 0) / constructing.length) : 0
  const pendingVos = vos.filter(v => v.status === "pending").length

  // ── CRUD
  const openAdd = () => { setForm(EMPTY_FORM); setModal("add") }
  const openEdit = (item: PipelineItem) => {
    setSelected(item)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = item
    setForm(rest); setModal("edit")
  }
  const openDelete = (item: PipelineItem) => { setSelected(item); setModal("delete") }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (!form.name.trim() || !form.client.trim()) return
    if (modal === "add") {
      setItems(prev => [...prev, { ...form, id: `item_${Date.now()}` }])
    } else if (modal === "edit" && selected) {
      setItems(prev => prev.map(it => it.id === selected.id ? { ...form, id: it.id } : it))
    }
    closeModal()
  }

  const handleDelete = () => {
    if (selected) setItems(prev => prev.filter(it => it.id !== selected.id))
    closeModal()
  }

  // ── Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("itemId", id)
    e.dataTransfer.effectAllowed = "move"
    setDragId(id)
  }
  const handleDragEnd = () => { setDragId(null); setDragOverStage(null) }
  const handleDragOver = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStage(stage)
  }
  const handleDrop = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("itemId")
    if (id) setItems(prev => prev.map(it => it.id === id ? { ...it, stage } : it))
    setDragId(null); setDragOverStage(null)
  }
  const handleDragLeave = () => setDragOverStage(null)

  const setFormResponsible = (name: string) => {
    const found = RESPONSIBLE_OPTIONS.find(r => r.name === name)
    if (found) setForm(f => ({ ...f, responsible: found.name, responsibleInitials: found.initials, responsibleColor: found.color }))
  }

  const TABS = [
    { key: "kanban" as const, label: "Kanban",    icon: Kanban },
    { key: "list"   as const, label: "Danh sách", icon: List },
    { key: "vo"     as const, label: `Phát sinh VO${pendingVos > 0 ? ` (${pendingVos})` : ""}`, icon: AlertCircle },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Quản lý Dự án</h1>
            <p className="text-xs text-gray-400 mt-0.5">Toàn bộ lead & dự án theo từng giai đoạn</p>
          </div>
          <div className="flex items-center gap-2">
            {view !== "vo" && (
              <button onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Thêm mới
              </button>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: "Tổng pipeline",  value: String(items.length),       sub: "lead & dự án",   color: "text-gray-900",   icon: TrendingUp },
            { label: "Lead đang theo", value: String(items.filter(i => i.type === "lead").length), sub: "cần chăm sóc", color: "text-blue-600", icon: Users },
            { label: "Đang thi công",  value: String(constructing.length), sub: "dự án",          color: "text-orange-600", icon: FolderKanban },
            { label: "VO chờ duyệt",   value: String(pendingVos),         sub: "cần xử lý",      color: pendingVos > 0 ? "text-red-500" : "text-green-600", icon: AlertCircle },
          ].map(k => (
            <div key={k.label} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <k.icon className={`w-5 h-5 ${k.color} shrink-0 opacity-70`} />
              <div>
                <div className="text-xs text-gray-400">{k.label}</div>
                <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
                <div className="text-[10px] text-gray-400">{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar — Kanban & List only */}
        {view !== "vo" && (
          <div className="flex items-center gap-2 pb-3">
            <div className="relative flex-1 max-w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên, khách hàng…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-orange-400 focus:outline-none transition-colors" />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs shrink-0">
              {(["all", "lead", "project"] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${filterType === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {f === "all" ? "Tất cả" : f === "lead" ? "Lead" : "Dự án"}
                </button>
              ))}
            </div>
            <div className="relative shrink-0">
              <select value={filterStage} onChange={e => setFilterStage(e.target.value as Stage | "all")}
                className="appearance-none pl-3 pr-7 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:border-orange-400 focus:outline-none cursor-pointer">
                <option value="all">Tất cả giai đoạn</option>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            {(search || filterStage !== "all" || filterType !== "all") && (
              <button onClick={() => { setSearch(""); setFilterStage("all"); setFilterType("all") }}
                className="flex items-center gap-1 px-2.5 py-2 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-3 h-3" /> Xóa lọc
              </button>
            )}
            <div className="ml-auto text-xs text-gray-400">{filtered.length} mục</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 tab-bar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)}
              className={`tab-item flex items-center gap-1.5 ${view === key ? "active" : ""} ${key === "vo" && pendingVos > 0 ? "!text-red-500" : ""}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-4 h-full" style={{ minWidth: "max-content" }}>
            {STAGES.map((stage, stageIdx) => {
              const stageItems = filtered.filter(c => c.stage === stage.key)
              const stageValue = stageItems.reduce((s, c) => s + c.value, 0)
              const isOver = dragOverStage === stage.key
              return (
                <div key={stage.key} className="flex flex-col w-72 shrink-0 h-full"
                  onDragOver={e => handleDragOver(e, stage.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage.key)}>
                  {/* Column header */}
                  <div className={`${stage.header} border ${stage.border} rounded-xl px-3 py-2.5 mb-2 shrink-0 transition-all ${isOver ? "ring-2 ring-offset-1 ring-orange-400" : ""}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stage.dot} shrink-0`} />
                        <span className="text-sm font-semibold text-gray-800">{stage.label}</span>
                        <span className="text-xs font-bold text-gray-500 bg-white/70 px-1.5 py-0.5 rounded-md">{stageItems.length}</span>
                      </div>
                      {stageIdx < STAGE_ORDER.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <div className="text-[10px] text-gray-500">{stage.sublabel}</div>
                    {stageValue > 0 && <div className="text-xs font-semibold text-gray-700 mt-1">{fmtVND(stageValue)}</div>}
                  </div>
                  {/* Drop zone */}
                  <div className={`flex-1 overflow-y-auto space-y-2 pr-0.5 rounded-xl transition-all ${isOver ? `${stage.dropBg} ring-2 ring-dashed ring-orange-300 p-1` : ""}`}>
                    {stageItems.map(item => (
                      <KanbanCard key={item.id} item={item}
                        isDragging={dragId === item.id}
                        stageIdx={stageIdx} totalStages={STAGE_ORDER.length}
                        onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                        onEdit={() => openEdit(item)} onDelete={() => openDelete(item)} />
                    ))}
                    {stageItems.length === 0 && !isOver && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                        <div className="text-xs text-gray-300">Kéo thả vào đây</div>
                      </div>
                    )}
                    {isOver && (
                      <div className="border-2 border-dashed border-orange-300 rounded-xl py-6 text-center">
                        <div className="text-xs text-orange-400 font-medium">Thả vào {stage.label}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {view === "list" && (
        <div className="flex-1 overflow-auto p-5">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left w-8">#</th>
                  <th className="text-left">Tên / Công trình</th>
                  <th className="text-left">Khách hàng</th>
                  <th className="text-left">Giai đoạn</th>
                  <th className="text-left">Loại</th>
                  <th className="text-right">Giá trị</th>
                  <th className="text-left">Tiến độ</th>
                  <th className="text-center">VO</th>
                  <th className="text-left">Phụ trách</th>
                  <th className="text-left">Deadline</th>
                  <th className="text-left">Ưu tiên</th>
                  <th className="text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const stage = STAGE_MAP[item.stage]
                  const itemVos = vos.filter(v => v.projectId === item.id)
                  const pendingItemVos = itemVos.filter(v => v.status === "pending").length
                  return (
                    <tr key={item.id}>
                      <td className="text-gray-400 text-xs">{idx + 1}</td>
                      <td>
                        <div className="font-semibold text-gray-900 text-sm max-w-[220px] truncate">{item.name}</div>
                        {item.tags?.length ? (
                          <div className="flex gap-1 mt-0.5">
                            {item.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div className="text-sm text-gray-700">{item.client}</div>
                        {item.phone && <div className="text-xs text-gray-400">{item.phone}</div>}
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${stage.badge}`}>{stage.label}</span>
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${item.type === "lead" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
                          {item.type === "lead" ? "Lead" : "Dự án"}
                        </span>
                      </td>
                      <td className="text-right font-semibold text-orange-600 text-sm">{fmtVND(item.value)}</td>
                      <td>
                        {item.progress !== undefined ? (
                          <div className="w-20">
                            <div className="text-[10px] text-gray-400 mb-1">{item.progress}%</div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${item.progress}%`, background: item.progress === 100 ? "#22c55e" : "#E87625" }} />
                            </div>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="text-center">
                        {itemVos.length > 0 ? (
                          <button onClick={() => setView("vo")}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${pendingItemVos > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}
                            title={`${itemVos.length} VO, ${pendingItemVos} chờ duyệt`}>
                            {itemVos.length} VO
                          </button>
                        ) : <span className="text-xs text-gray-200">—</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full ${item.responsibleColor} flex items-center justify-center shrink-0`}>
                            <span className="text-[9px] font-bold text-white">{item.responsibleInitials}</span>
                          </div>
                          <span className="text-xs text-gray-600 truncate max-w-[90px]">{item.responsible}</span>
                        </div>
                      </td>
                      <td>
                        {item.deadline
                          ? <div className="text-xs text-gray-500">{new Date(item.deadline).toLocaleDateString("vi-VN")}</div>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${PRIORITY_STYLE[item.priority]}`}>
                          {PRIORITY_LABEL[item.priority]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          {item.type === "project" && (
                            <Link href={`/projects/${item.id}`}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết">
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <button onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDelete(item)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={12} className="text-center py-12 text-gray-400 text-sm">Không tìm thấy kết quả phù hợp</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VO View ── */}
      {view === "vo" && (
        <div className="flex-1 overflow-auto p-5">
          {/* VO filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={voSearch} onChange={e => setVoSearch(e.target.value)}
                placeholder="Tìm VO, dự án…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:border-orange-400 focus:outline-none" />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
              {(["all", "pending", "approved", "rejected"] as const).map(s => (
                <button key={s} onClick={() => setVoFilter(s)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${voFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {s === "all" ? "Tất cả" : VO_STATUS[s].label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-xs text-gray-400">{filteredVos.length} phát sinh</div>
          </div>

          {/* VO summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Tổng VO",     value: vos.length,                                sub: `${fmtVND(vos.reduce((s,v)=>s+v.amount,0))}`,     color: "text-gray-700" },
              { label: "Chờ duyệt",   value: vos.filter(v=>v.status==="pending").length, sub: `${fmtVND(vos.filter(v=>v.status==="pending").reduce((s,v)=>s+v.amount,0))}`, color: "text-yellow-600" },
              { label: "Đã duyệt",    value: vos.filter(v=>v.status==="approved").length, sub: `${fmtVND(vos.filter(v=>v.status==="approved").reduce((s,v)=>s+v.amount,0))}`, color: "text-green-600" },
            ].map(k => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="text-xs text-gray-400">{k.label}</div>
                <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Dự án</th>
                  <th className="text-left">Nội dung phát sinh</th>
                  <th className="text-left">Lý do</th>
                  <th className="text-right">Giá trị</th>
                  <th className="text-left">Trạng thái</th>
                  <th className="text-left">Người yêu cầu</th>
                  <th className="text-left">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {filteredVos.map(vo => {
                  const st = VO_STATUS[vo.status]
                  return (
                    <tr key={vo.id}>
                      <td>
                        <div className="text-xs font-semibold text-gray-700 max-w-[180px] truncate">{vo.projectName}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-gray-900 max-w-[220px]">{vo.title}</div>
                      </td>
                      <td>
                        <div className="text-xs text-gray-500 max-w-[200px] line-clamp-2">{vo.reason}</div>
                      </td>
                      <td className="text-right font-semibold text-orange-600">{fmtVND(vo.amount)}</td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="text-xs text-gray-600">{vo.requestedBy}</td>
                      <td className="text-xs text-gray-500">{new Date(vo.date).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  )
                })}
                {filteredVos.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Không có phát sinh nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modal === "add" || modal === "edit") && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {modal === "add" ? "Thêm lead / dự án mới" : "Chỉnh sửa thông tin"}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Loại</label>
                <div className="flex gap-2">
                  {(["lead", "project"] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${form.type === t ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {t === "lead" ? "Lead (Tiềm năng)" : "Dự án (Đã HĐ)"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên công trình <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Nhà phố 4 tầng – Bình Thạnh" className="input-field text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Khách hàng <span className="text-red-400">*</span></label>
                  <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    placeholder="Nguyễn Văn A" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
                  <input value={form.phone ?? ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0901 234 567" className="input-field text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giá trị (VNĐ)</label>
                  <input type="number" value={form.value || ""}
                    onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                    placeholder="800000000" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nguồn / Kênh</label>
                  <input value={form.source ?? ""} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="Facebook, Zalo, Referral…" className="input-field text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giai đoạn</label>
                  <div className="relative">
                    <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}
                      className="input-field text-sm appearance-none pr-8">
                      {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ưu tiên</label>
                  <div className="relative">
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="input-field text-sm appearance-none pr-8">
                      <option value="high">Cao</option>
                      <option value="medium">Trung bình</option>
                      <option value="low">Thấp</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phụ trách</label>
                  <div className="relative">
                    <select value={form.responsible} onChange={e => setFormResponsible(e.target.value)}
                      className="input-field text-sm appearance-none pr-8">
                      {RESPONSIBLE_OPTIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deadline</label>
                  <input type="date" value={form.deadline ?? ""} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ghi chú</label>
                <textarea value={form.note ?? ""} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  rows={2} placeholder="Thông tin thêm…" className="input-field text-sm resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button onClick={closeModal} className="btn-secondary text-sm px-4 py-2">Hủy</button>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.client.trim()}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {modal === "add" ? "Thêm mới" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {modal === "delete" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Xóa mục này?</h3>
              <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">{selected.name}</span></p>
              <p className="text-xs text-gray-400">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Hủy</button>
              <button onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────
function KanbanCard({ item, isDragging, stageIdx, totalStages, onDragStart, onDragEnd, onEdit, onDelete }: {
  item: PipelineItem; isDragging: boolean
  stageIdx: number; totalStages: number
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onEdit: () => void; onDelete: () => void
}) {
  const stage = STAGE_MAP[item.stage]
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item.id)}
      onDragEnd={onDragEnd}
      className={`bg-white border ${stage.border} rounded-xl p-3 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing select-none ${isDragging ? "opacity-40 rotate-1 scale-95" : ""}`}>
      {/* Drag handle + type + actions */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3 text-gray-300 shrink-0" />
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${stage.badge}`}>
            {item.type === "lead" ? "Lead" : "Dự án"}
          </span>
          {item.tags?.slice(0, 1).map(t => (
            <span key={t} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">{item.name}</div>
      <div className="text-xs text-gray-400 flex items-center gap-1 mb-2">
        <User className="w-3 h-3" /> {item.client}
      </div>

      {/* Value + VO badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-orange-600">{fmtVND(item.value)}</div>
        {item.voCount ? (
          <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
            {item.voCount} VO
          </span>
        ) : null}
      </div>

      {/* Progress */}
      {item.progress !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Tiến độ</span>
            <span className="font-semibold text-orange-500">{item.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${item.progress}%`, background: item.progress === 100 ? "#22c55e" : "#E87625" }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-5 h-5 rounded-full ${item.responsibleColor} flex items-center justify-center shrink-0`}>
            <span className="text-[8px] font-bold text-white">{item.responsibleInitials}</span>
          </div>
          <span className="text-[10px] text-gray-500 truncate">{item.responsible}</span>
        </div>
        {item.deadline && (
          <div className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
            <Calendar className="w-2.5 h-2.5" />
            {new Date(item.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </div>
        )}
      </div>

      {/* View detail link */}
      {item.type === "project" && (
        <div className="mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/projects/${item.id}`}
            className="flex items-center justify-center gap-1 py-1 text-[10px] text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
            <Eye className="w-3 h-3" /> Xem chi tiết dự án
          </Link>
        </div>
      )}
    </div>
  )
}
