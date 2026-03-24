"use client"
import { useState, useMemo, useEffect } from "react"
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
type ProjectType = "renovation_apartment" | "renovation_office" | "signage" | "new_build" | "furniture_supply"

interface PipelineItem {
  id: string; type: ItemType; projectType?: ProjectType; name: string; client: string
  phone?: string; source?: string; value: number; stage: Stage
  responsible: string; responsibleInitials: string; responsibleColor: string
  progress?: number; deadline?: string; priority: Priority
  tags?: string[]; note?: string; voCount?: number; permitRequired?: boolean
  surveyPhotoCount?: number; surveyPhotos?: string[]
  budgetFlexibility?: "fixed" | "flexible" | "open" | null
}

const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  renovation_apartment: "Cải tạo căn hộ",
  renovation_office:    "Cải tạo VP",
  signage:              "Bảng hiệu",
  new_build:            "Xây mới",
  furniture_supply:     "Cung cấp nội thất",
}

const PROJECT_TYPE_EMOJI: Record<ProjectType, string> = {
  renovation_apartment: "🏠",
  renovation_office:    "🏢",
  signage:              "🪧",
  new_build:            "🏗️",
  furniture_supply:     "🛋️",
}

const LEAD_SOURCES = ["Zalo OA", "Referral", "Facebook", "Website", "TikTok"]

interface LeadForm {
  clientName: string; phone: string; source: string; address: string
  budget: string
  flexibility: "fixed" | "flexible" | "open" | ""; notes: string; sales: string
}

interface VOItem {
  id: string; projectId: string; projectName: string
  title: string; reason: string; amount: number
  status: "pending" | "approved" | "rejected"
  requestedBy: string; date: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INIT_ITEMS: PipelineItem[] = [
  {
    id: "PRJ-E2E-001", type: "project", projectType: "renovation_apartment",
    name: "Căn hộ Masteri Thảo Điền – Chị Mai",
    client: "Chị Mai", phone: "0901 234 567",
    value: 0, stage: "lead",
    responsible: "Lê Minh Tuấn", responsibleInitials: "TL", responsibleColor: "bg-teal-500",
    progress: 0, priority: "high",
    tags: ["Lead mới"], voCount: 0,
    note: "Khách hàng muốn thiết kế lại toàn bộ căn 2PN, phong cách hiện đại.",
    permitRequired: true,
  }
]

const INIT_VOS: VOItem[] = []

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
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<PipelineItem[]>(INIT_ITEMS)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load dynamic leads (created via form) from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dynamic_leads")
      if (!saved) return
      const leads = JSON.parse(saved) as PipelineItem[]
      if (leads.length === 0) return
      setItems(prev => {
        const merged = [...prev]
        leads.forEach(l => {
          const idx = merged.findIndex(m => m.id === l.id)
          if (idx >= 0) merged[idx] = l
          else merged.unshift(l)
        })
        return merged
      })
    } catch { /* ignore */ }
  }, [])

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
  const [modal, setModal] = useState<"edit" | "delete" | null>(null)
  const [selected, setSelected] = useState<PipelineItem | null>(null)
  const [form, setForm] = useState<Omit<PipelineItem, "id">>(EMPTY_FORM)
  // Lead panel state
  const [showLeadPanel, setShowLeadPanel] = useState(false)
  const [leadProjectType, setLeadProjectType] = useState<ProjectType | "">("")
  const [leadForm, setLeadForm] = useState<LeadForm>({
    clientName: "", phone: "", source: "", address: "",
    budget: "", flexibility: "", notes: "", sales: "Phạm Văn Đức"
  })
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({})
  const [phoneWarning, setPhoneWarning] = useState("")
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warn" } | null>(null)

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
  const openAdd = () => { setForm(EMPTY_FORM) } // kept for potential future use
  const openEdit = (item: PipelineItem) => {
    setSelected(item)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = item
    setForm(rest); setModal("edit")
  }
  const openDelete = (item: PipelineItem) => { setSelected(item); setModal("delete") }
  const closeModal = () => { setModal(null); setSelected(null) }

  const showToast = (msg: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openLeadPanel = () => {
    setLeadProjectType("")
    setLeadForm({ clientName: "", phone: "", source: "", address: "", budget: "", flexibility: "", notes: "", sales: "Phạm Văn Đức" })
    setLeadErrors({})
    setPhoneWarning("")
    setShowLeadPanel(true)
  }

  const handleLeadSubmit = () => {
    const errors: Record<string, string> = {}
    if (!leadForm.clientName.trim()) errors.clientName = "Vui lòng điền thông tin này"
    if (!leadForm.phone.trim()) errors.phone = "Vui lòng điền thông tin này"
    else if (!/^\d{10}$/.test(leadForm.phone.replace(/\s|-/g, ""))) errors.phone = "SĐT phải có 10 chữ số"
    if (!leadForm.address.trim()) errors.address = "Vui lòng điền thông tin này"
    if (!leadProjectType) errors.projectType = "Vui lòng chọn loại dự án"
    if (!leadForm.budget || Number(leadForm.budget) <= 0) errors.budget = "Vui lòng điền ngân sách"
    setLeadErrors(errors)
    if (Object.keys(errors).length > 0) return

    // Phone duplicate check (warning, not blocking)
    const phoneClean = leadForm.phone.replace(/\s|-/g, "")
    const dup = items.find(i => i.phone?.replace(/\s|-/g, "") === phoneClean)
    setPhoneWarning(dup ? `⚠ SĐT này đã có trong hệ thống – ${dup.name}` : "")

    const FLEXIBILITY_LABEL: Record<string, string> = {
      fixed: "Ngân sách cố định",
      flexible: "Linh hoạt ±20%",
      open: "Ngân sách mở",
    }
    const flexLabel = leadForm.flexibility ? FLEXIBILITY_LABEL[leadForm.flexibility] : null
    const noteLines = [
      flexLabel ? `💰 Ngân sách: ${flexLabel}` : null,
      leadForm.address ? `📍 Địa chỉ: ${leadForm.address}` : null,
      leadForm.notes || null,
    ].filter(Boolean)

    const pt = leadProjectType as ProjectType
    const addressShort = leadForm.address.split(",")[0].trim()
    const resp = RESPONSIBLE_OPTIONS.find(r => r.name === leadForm.sales) ?? RESPONSIBLE_OPTIONS[0]
    const newId = `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
    const newItem: PipelineItem = {
      id: newId,
      type: "lead",
      projectType: pt,
      name: `${PROJECT_TYPE_LABEL[pt]} – ${addressShort}`,
      client: leadForm.clientName,
      phone: leadForm.phone,
      source: leadForm.source || undefined,
      value: Number(leadForm.budget),
      stage: "lead",
      responsible: resp.name,
      responsibleInitials: resp.initials,
      responsibleColor: resp.color,
      priority: "medium",
      note: noteLines.length > 0 ? noteLines.join("\n") : undefined,
      budgetFlexibility: leadForm.flexibility || "fixed",
      permitRequired: false,
      progress: 0,
    }
    // Persist to localStorage — include budgetFlexibility as a custom field
    try {
      const stored: PipelineItem[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      localStorage.setItem("dynamic_leads", JSON.stringify([
        { ...newItem, lifecycleStage: "lead_new" },
        ...stored,
      ]))
    } catch { /* quota exceeded */ }

    setItems(prev => [newItem, ...prev])
    setShowLeadPanel(false)
    setFilterType("all")
    setFilterStage("all")
    setSearch("")
    showToast("✓ Lead đã tạo · Task khảo sát đã giao", "success")
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.client.trim()) return
    if (modal === "edit" && selected) {
      const updated = { ...form, id: selected.id }
      setItems(prev => prev.map(it => it.id === selected.id ? updated : it))
      try {
        const saved: PipelineItem[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
        const idx = saved.findIndex(l => l.id === selected.id)
        if (idx >= 0) {
          saved[idx] = updated as PipelineItem
        } else {
          saved.push(updated as PipelineItem)
        }
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
      } catch { /* ignore */ }
    }
    closeModal()
  }

  const handleDelete = () => {
    if (!selected) { closeModal(); return }
    const deletedId = selected.id
    setItems(prev => prev.filter(it => it.id !== deletedId))
    // Remove from localStorage
    try {
      const saved: object[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      localStorage.setItem("dynamic_leads", JSON.stringify(
        saved.filter((l: unknown) => (l as { id: string }).id !== deletedId)
      ))
    } catch { /* ignore */ }
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

  if (!mounted) return null

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
            <button onClick={() => {
              if (confirm("Thao tác này sẽ xoá TOÀN BỘ dữ liệu local storage (Dự án mới, Tiến độ Gantt, Hợp đồng...) để test E2E lại từ đầu. Bạn chắc chắn?")) {
                localStorage.clear();
                window.location.reload();
              }
            }} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg transition-colors shadow-sm">
              <Trash2 className="w-3.5 h-3.5" /> Xoá & Khôi phục Dữ liệu E2E
            </button>
            {view !== "vo" && (
              <button onClick={openLeadPanel}
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
        <div className="relative flex-1 overflow-hidden">
          {/* Right-edge gradient scroll hint */}
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-gray-100/80 to-transparent z-10 pointer-events-none" />
          <div className="flex-1 h-full overflow-x-auto overflow-y-hidden scroll-smooth pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
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
        <VOView vos={vos} voSearch={voSearch} setVoSearch={setVoSearch} voFilter={voFilter} setVoFilter={setVoFilter} filteredVos={filteredVos} />
      )}

      {/* ── Modals & Panels ── */}
      {modal === "edit" && (
        <EditModal 
          form={form} 
          setForm={setForm} 
          closeModal={closeModal} 
          handleSave={handleSave} 
          setFormResponsible={setFormResponsible}
        />
      )}

      {modal === "delete" && selected && (
        <DeleteModal selected={selected} closeModal={closeModal} handleDelete={handleDelete} />
      )}

      {showLeadPanel && (
        <NewLeadPanel 
          leadForm={leadForm} 
          setLeadForm={setLeadForm} 
          leadErrors={leadErrors} 
          phoneWarning={phoneWarning} 
          setPhoneWarning={setPhoneWarning}
          leadProjectType={leadProjectType}
          setLeadProjectType={setLeadProjectType}
          setShowLeadPanel={setShowLeadPanel}
          handleLeadSubmit={handleLeadSubmit}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-[100] ${
          toast.type === "success" ? "bg-emerald-600 text-white" :
          toast.type === "error" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── VO View ──────────────────────────────────────────────────────────────────
function VOView({ vos, voSearch, setVoSearch, voFilter, setVoFilter, filteredVos }: any) {
  return (
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
          { label: "Tổng VO",     value: vos.length,                                sub: `${fmtVND(vos.reduce((s:any,v:any)=>s+v.amount,0))}`,     color: "text-gray-700" },
          { label: "Chờ duyệt",   value: vos.filter((v:any)=>v.status==="pending").length, sub: `${fmtVND(vos.filter((v:any)=>v.status==="pending").reduce((s:any,v:any)=>s+v.amount,0))}`, color: "text-yellow-600" },
          { label: "Đã duyệt",    value: vos.filter((v:any)=>v.status==="approved").length, sub: `${fmtVND(vos.filter((v:any)=>v.status==="approved").reduce((s:any,v:any)=>s+v.amount,0))}`, color: "text-green-600" },
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
            {filteredVos.map((vo:any) => {
              const st = VO_STATUS[vo.status as keyof typeof VO_STATUS]
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
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ form, setForm, closeModal, handleSave, setFormResponsible }: any) {
  const [valueInput, setValueInput] = useState((form.value || 0).toLocaleString("vi-VN"))
  const SOURCE_OPTIONS = ["Facebook", "Website", "Hotline", "Referral", "Walk-in"]
  const [isCustomSource, setIsCustomSource] = useState(!!form.source && !SOURCE_OPTIONS.includes(form.source))

  const handleValueChange = (v: string) => {
    const raw = v.replace(/[^0-9]/g, "")
    const num = Number(raw)
    setForm((f:any) => ({ ...f, value: num }))
    setValueInput(num.toLocaleString("vi-VN"))
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Chỉnh sửa thông tin</h2>
          <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Loại</label>
            <div className="flex gap-2">
              {(["lead", "project"] as const).map(t => (
                <button key={t} onClick={() => setForm((f:any) => ({ ...f, type: t }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${form.type === t ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {t === "lead" ? "Lead (Tiềm năng)" : "Dự án (Đã HĐ)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên công trình <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => setForm((f:any) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Nhà phố 4 tầng – Bình Thạnh" className="input-field text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Khách hàng <span className="text-red-400">*</span></label>
              <input value={form.client} onChange={e => setForm((f:any) => ({ ...f, client: e.target.value }))}
                placeholder="Nguyễn Văn A" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
              <input value={form.phone ?? ""} onChange={e => setForm((f:any) => ({ ...f, phone: e.target.value }))}
                placeholder="0901 234 567" className="input-field text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giá trị (VNĐ)</label>
              <input type="text" value={valueInput}
                onChange={e => handleValueChange(e.target.value)}
                placeholder="800,000,000" className="input-field text-sm font-bold text-orange-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nguồn / Kênh</label>
              <div className="flex flex-col gap-1.5">
                <select 
                  value={isCustomSource ? "Other" : (form.source || "")} 
                  onChange={e => {
                    if (e.target.value === "Other") {
                      setIsCustomSource(true)
                      setForm((f:any) => ({ ...f, source: "" }))
                    } else {
                      setIsCustomSource(false)
                      setForm((f:any) => ({ ...f, source: e.target.value }))
                    }
                  }}
                  className="input-field text-sm"
                >
                  <option value="">-- Chọn nguồn --</option>
                  {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  <option value="Other">Khác...</option>
                </select>
                {isCustomSource && (
                  <input type="text" value={form.source ?? ""} onChange={e => setForm((f:any) => ({ ...f, source: e.target.value }))}
                    placeholder="Nhập nguồn khác..."
                    className="input-field text-[10px] py-1 !h-auto" />
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giai đoạn</label>
              <div className="relative">
                <select value={form.stage} onChange={e => setForm((f:any) => ({ ...f, stage: e.target.value as Stage }))}
                  className="input-field text-sm appearance-none pr-8">
                  {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ưu tiên</label>
              <div className="relative">
                <select value={form.priority} onChange={e => setForm((f:any) => ({ ...f, priority: e.target.value as Priority }))}
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
              <input type="date" value={form.deadline ?? ""} onChange={e => setForm((f:any) => ({ ...f, deadline: e.target.value }))}
                className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ghi chú</label>
            <textarea value={form.note ?? ""} onChange={e => setForm((f:any) => ({ ...f, note: e.target.value }))}
              rows={2} placeholder="Thông tin thêm…" className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={closeModal} className="btn-secondary text-sm px-4 py-2">Hủy</button>
          <button onClick={handleSave} disabled={!form.name.trim() || !form.client.trim()}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ selected, closeModal, handleDelete }: any) {
  return (
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
  )
}

// ── New Lead Panel ────────────────────────────────────────────────────────────
function NewLeadPanel({ 
  leadForm, setLeadForm, leadErrors, phoneWarning, setPhoneWarning, 
  leadProjectType, setLeadProjectType, setShowLeadPanel, handleLeadSubmit 
}: any) {
  const [budgetInput, setBudgetInput] = useState(leadForm.budget ? Number(leadForm.budget).toLocaleString("vi-VN") : "")
  const [isCustomSource, setIsCustomSource] = useState(!!leadForm.source && !LEAD_SOURCES.includes(leadForm.source))

  const handleBudgetChange = (v: string) => {
    const raw = v.replace(/[^0-9]/g, "")
    setLeadForm((f:any) => ({ ...f, budget: raw }))
    setBudgetInput(raw ? Number(raw).toLocaleString("vi-VN") : "")
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-40"
      onClick={(e) => { if (e.target === e.currentTarget) setShowLeadPanel(false) }}>
      <div className="absolute top-0 right-0 w-[480px] h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideInRight 0.2s ease" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Thêm Lead mới</h2>
            <p className="text-xs text-gray-400 mt-0.5">Điền thông tin để tạo lead trong hệ thống</p>
          </div>
          <button onClick={() => setShowLeadPanel(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-6">

          {/* Section 1 – Thông tin KH */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin khách hàng</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tên KH / Công ty <span className="text-red-400">*</span></label>
                <input value={leadForm.clientName} onChange={e => setLeadForm((f:any) => ({ ...f, clientName: e.target.value }))}
                  placeholder="VD: Chị Lan Anh, Cty ABC..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-400 transition ${leadErrors.clientName ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
                {leadErrors.clientName && <p className="text-xs text-red-500 mt-1">{leadErrors.clientName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Số điện thoại <span className="text-red-400">*</span></label>
                <input value={leadForm.phone} onChange={e => { setLeadForm((f:any) => ({ ...f, phone: e.target.value })); setPhoneWarning("") }}
                  placeholder="0901 234 567" type="tel"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-400 transition ${leadErrors.phone ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
                {leadErrors.phone && <p className="text-xs text-red-500 mt-1">{leadErrors.phone}</p>}
                {phoneWarning && <p className="text-xs text-amber-600 mt-1">{phoneWarning}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nguồn Lead</label>
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <select 
                        value={isCustomSource ? "Other" : leadForm.source} 
                        onChange={e => {
                          if (e.target.value === "Other") {
                            setIsCustomSource(true)
                            setLeadForm((f:any) => ({ ...f, source: "" }))
                          } else {
                            setIsCustomSource(false)
                            setLeadForm((f:any) => ({ ...f, source: e.target.value }))
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-orange-400 bg-white"
                      >
                        <option value="">-- Chọn nguồn --</option>
                        {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="Other">Khác...</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    {isCustomSource && (
                      <input type="text" value={leadForm.source} onChange={e => setLeadForm((f:any) => ({ ...f, source: e.target.value }))}
                        placeholder="Nhập nguồn khác..."
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Địa chỉ thi công <span className="text-red-400">*</span></label>
                  <input value={leadForm.address} onChange={e => setLeadForm((f:any) => ({ ...f, address: e.target.value }))}
                    placeholder="Quận/Phường, Thành phố"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-400 transition ${leadErrors.address ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
                  {leadErrors.address && <p className="text-xs text-red-500 mt-1">{leadErrors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 – Loại dự án */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Loại dự án <span className="text-red-400">*</span></div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "renovation_apartment", emoji: "🏠", label: "Cải tạo căn hộ" },
                { value: "renovation_office",    emoji: "🏢", label: "Cải tạo VP" },
                { value: "signage",              emoji: "🪧", label: "Bảng hiệu" },
                { value: "new_build",            emoji: "🏗️", label: "Xây mới" },
                { value: "furniture_supply",     emoji: "🛋️", label: "Cung cấp nội thất" },
              ] as { value: ProjectType; emoji: string; label: string }[]).map(({ value, emoji, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setLeadProjectType(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition ${leadProjectType === value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {leadErrors.projectType && <p className="text-xs text-red-500 mt-2">{leadErrors.projectType}</p>}
          </div>

          {/* Section 3 – Ngân sách */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ngân sách</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ngân sách kỳ vọng (₫) <span className="text-red-400">*</span></label>
                <input type="text" value={budgetInput} onChange={e => handleBudgetChange(e.target.value)}
                  placeholder="VD: 500,000,000"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-400 transition font-bold text-orange-600 ${leadErrors.budget ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
                {leadErrors.budget && <p className="text-xs text-red-500 mt-1">{leadErrors.budget}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Mức độ linh hoạt</label>
                <div className="grid grid-cols-3 gap-2">
                  {([["fixed", "Cố định"], ["flexible", "Linh hoạt ±20%"], ["open", "Mở"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setLeadForm((f:any) => ({ ...f, flexibility: val }))}
                      className={`py-2 px-3 rounded-lg border-2 text-xs font-medium transition ${leadForm.flexibility === val ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-orange-300"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 – Ghi chú */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ghi chú & Phân công</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Yêu cầu đặc biệt</label>
                <textarea value={leadForm.notes} onChange={e => setLeadForm((f:any) => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Phong cách, vật liệu đặc biệt, thời gian thi công…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 resize-none transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sales phụ trách</label>
                <div className="relative">
                  <select value={leadForm.sales} onChange={e => setLeadForm((f:any) => ({ ...f, sales: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-orange-400 bg-white">
                    {RESPONSIBLE_OPTIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 shrink-0" style={{ position: "sticky", bottom: 0, background: "white", padding: "16px 20px", borderTop: "1px solid #E5E7EB", zIndex: 10 }}>
          <button onClick={() => setShowLeadPanel(false)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            Huỷ
          </button>
          <button onClick={handleLeadSubmit}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition"
            style={{ background: "#EA580C" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#C2410C")}
            onMouseLeave={e => (e.currentTarget.style.background = "#EA580C")}>
            Lưu Lead →
          </button>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
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
          {item.projectType && (
            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
              {PROJECT_TYPE_LABEL[item.projectType]}
            </span>
          )}
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
      <div className="mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/projects/${item.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 py-1 text-[10px] text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
          <Eye className="w-3 h-3" /> {item.type === "lead" ? "Xem Lead chi tiết" : "Xem chi tiết dự án"}
        </Link>
      </div>
    </div>
  )
}
