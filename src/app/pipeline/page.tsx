"use client"
import { useState } from "react"
import { fmtVND } from "@/lib/mock-data"
import {
  ArrowRight, ChevronRight, User, Calendar, Plus, Eye,
  Kanban, Users, FolderKanban, TrendingUp, Clock, CheckCircle2,
  Phone, Mail, MapPin, Building2
} from "lucide-react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────
type Stage = "lead" | "design" | "contract" | "construction" | "payment" | "handover"
type Priority = "high" | "medium" | "low"
type CardType = "lead" | "project"

interface PipelineCard {
  id: string; type: CardType; name: string; client: string
  value: number; stage: Stage
  responsible: { name: string; role: string; initials: string; color: string }
  progress?: number; deadline?: string; priority: Priority; tags?: string[]; href: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INIT_CARDS: PipelineCard[] = [
  { id: "l4", type: "lead", name: "Nhà phố Bình Thạnh – 4 tầng",
    client: "Ngô Bích Trâm", value: 800_000_000, stage: "lead",
    responsible: { name: "Phạm Văn Đức", role: "Sales", initials: "ĐP", color: "bg-blue-500" },
    deadline: "20/03/2026", priority: "high", tags: ["Facebook"], href: "/pipeline" },
  { id: "l3", type: "lead", name: "Căn hộ Studio – Quận 3",
    client: "Lý Thành Long", value: 450_000_000, stage: "lead",
    responsible: { name: "Nguyễn Thu Hà", role: "Sales", initials: "HN", color: "bg-pink-500" },
    deadline: "22/03/2026", priority: "medium", tags: ["Website"], href: "/pipeline" },
  { id: "l6", type: "lead", name: "Nhà vườn Long An – 200m²",
    client: "Phú Xuân Trường", value: 1_100_000_000, stage: "lead",
    responsible: { name: "Phạm Văn Đức", role: "Sales", initials: "ĐP", color: "bg-blue-500" },
    deadline: "25/03/2026", priority: "medium", tags: ["Zalo"], href: "/pipeline" },
  { id: "l5", type: "lead", name: "Penthouse Sky Garden – Tầng 28",
    client: "Dương Quốc Bảo", value: 2_000_000_000, stage: "design",
    responsible: { name: "Lê Văn Nam", role: "KS Bản vẽ", initials: "NL", color: "bg-purple-500" },
    deadline: "28/03/2026", priority: "high", tags: ["Zalo", "VIP"], href: "/pipeline" },
  { id: "l1", type: "lead", name: "Biệt thự Nhơn Trạch – Đồng Nai",
    client: "Hoàng Minh Khoa", value: 650_000_000, stage: "design",
    responsible: { name: "Nguyễn Thu Hà", role: "QS", initials: "HN", color: "bg-pink-500" },
    deadline: "30/03/2026", priority: "medium", tags: ["Referral"], href: "/pipeline" },
  { id: "l7", type: "lead", name: "Văn phòng 200m² – Quận 1",
    client: "Cty TNHH Minh Phát", value: 980_000_000, stage: "design",
    responsible: { name: "Lê Văn Nam", role: "KS Dự toán", initials: "NL", color: "bg-purple-500" },
    deadline: "02/04/2026", priority: "low", tags: ["Website"], href: "/pipeline" },
  { id: "l2", type: "lead", name: "Căn hộ 2PN – Bình Dương",
    client: "Trần Bảo Châu", value: 1_200_000_000, stage: "contract",
    responsible: { name: "Phạm Văn Đức", role: "Sales", initials: "ĐP", color: "bg-blue-500" },
    deadline: "15/03/2026", priority: "high", tags: ["Referral", "Chốt"], href: "/pipeline" },
  { id: "p2", type: "project", name: "Văn phòng Landmark 81 – T22",
    client: "Cty TNHH ABC", value: 1_500_000_000, stage: "contract",
    responsible: { name: "Lê Minh Tuấn", role: "PM", initials: "TL", color: "bg-teal-500" },
    deadline: "31/03/2026", priority: "high", tags: ["Pháp lý"], href: "/projects/2" },
  { id: "p1", type: "project", name: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    client: "Nguyễn Văn An", value: 820_000_000, stage: "construction",
    responsible: { name: "Trần Thị Bình", role: "PM", initials: "BT", color: "bg-orange-500" },
    progress: 48, deadline: "31/08/2025", priority: "high", tags: ["Đúng tiến độ"], href: "/projects/1" },
  { id: "p4", type: "project", name: "Villa Thảo Điền – Q.2",
    client: "Lê Quang Vinh", value: 3_500_000_000, stage: "construction",
    responsible: { name: "Lê Minh Tuấn", role: "PM", initials: "TL", color: "bg-teal-500" },
    progress: 32, deadline: "30/06/2026", priority: "medium", tags: ["Trễ 1 tuần"], href: "/projects" },
  { id: "p5", type: "project", name: "Nhà phố Bình Thạnh – Q.BT",
    client: "Vũ Thị Mai", value: 1_800_000_000, stage: "construction",
    responsible: { name: "Trần Thị Bình", role: "PM", initials: "BT", color: "bg-orange-500" },
    progress: 71, deadline: "15/05/2026", priority: "medium", tags: ["Đúng tiến độ"], href: "/projects" },
  { id: "p6", type: "project", name: "Căn hộ Vinhomes Central",
    client: "Bùi Ngọc Anh", value: 950_000_000, stage: "payment",
    responsible: { name: "Hoàng Lan Anh", role: "Kế toán", initials: "AL", color: "bg-green-500" },
    deadline: "10/04/2026", priority: "high", tags: ["Đợt 3/4", "Quá hạn"], href: "/payment" },
  { id: "p7", type: "project", name: "Shophouse Ecopark – Hưng Yên",
    client: "Cty Đại Phát", value: 2_100_000_000, stage: "payment",
    responsible: { name: "Hoàng Lan Anh", role: "Kế toán", initials: "AL", color: "bg-green-500" },
    deadline: "20/04/2026", priority: "medium", tags: ["Đợt 4/5"], href: "/payment" },
  { id: "p3", type: "project", name: "Biệt thự Song Long – Thủ Đức",
    client: "Phạm Thị Hoa", value: 2_200_000_000, stage: "handover",
    responsible: { name: "Trần Thị Bình", role: "PM", initials: "BT", color: "bg-orange-500" },
    progress: 100, deadline: "30/11/2024", priority: "low", tags: ["Hoàn thành"], href: "/projects" },
]

// Lead list mock
interface Lead {
  id: string; name: string; client: string; phone: string; source: string
  stage: string; stageColor: string; value: number
  responsible: string; responsibleColor: string; responsibleInitials: string
  deadline: string; priority: Priority
}
const LEADS: Lead[] = [
  { id: "l4", name: "Nhà phố Bình Thạnh – 4 tầng", client: "Ngô Bích Trâm", phone: "0901 234 567",
    source: "Facebook", stage: "Khách hàng", stageColor: "bg-blue-100 text-blue-700",
    value: 800_000_000, responsible: "Phạm Văn Đức", responsibleColor: "bg-blue-500", responsibleInitials: "ĐP",
    deadline: "20/03/2026", priority: "high" },
  { id: "l3", name: "Căn hộ Studio – Quận 3", client: "Lý Thành Long", phone: "0912 345 678",
    source: "Website", stage: "Khách hàng", stageColor: "bg-blue-100 text-blue-700",
    value: 450_000_000, responsible: "Nguyễn Thu Hà", responsibleColor: "bg-pink-500", responsibleInitials: "HN",
    deadline: "22/03/2026", priority: "medium" },
  { id: "l6", name: "Nhà vườn Long An – 200m²", client: "Phú Xuân Trường", phone: "0923 456 789",
    source: "Zalo", stage: "Khách hàng", stageColor: "bg-blue-100 text-blue-700",
    value: 1_100_000_000, responsible: "Phạm Văn Đức", responsibleColor: "bg-blue-500", responsibleInitials: "ĐP",
    deadline: "25/03/2026", priority: "medium" },
  { id: "l5", name: "Penthouse Sky Garden – Tầng 28", client: "Dương Quốc Bảo", phone: "0934 567 890",
    source: "Zalo / VIP", stage: "Thiết kế & DT", stageColor: "bg-purple-100 text-purple-700",
    value: 2_000_000_000, responsible: "Lê Văn Nam", responsibleColor: "bg-purple-500", responsibleInitials: "NL",
    deadline: "28/03/2026", priority: "high" },
  { id: "l1", name: "Biệt thự Nhơn Trạch – Đồng Nai", client: "Hoàng Minh Khoa", phone: "0945 678 901",
    source: "Referral", stage: "Thiết kế & DT", stageColor: "bg-purple-100 text-purple-700",
    value: 650_000_000, responsible: "Nguyễn Thu Hà", responsibleColor: "bg-pink-500", responsibleInitials: "HN",
    deadline: "30/03/2026", priority: "medium" },
  { id: "l7", name: "Văn phòng 200m² – Quận 1", client: "Cty TNHH Minh Phát", phone: "0956 789 012",
    source: "Website", stage: "Thiết kế & DT", stageColor: "bg-purple-100 text-purple-700",
    value: 980_000_000, responsible: "Lê Văn Nam", responsibleColor: "bg-purple-500", responsibleInitials: "NL",
    deadline: "02/04/2026", priority: "low" },
  { id: "l2", name: "Căn hộ 2PN – Bình Dương", client: "Trần Bảo Châu", phone: "0967 890 123",
    source: "Referral", stage: "Chốt HĐ", stageColor: "bg-amber-100 text-amber-700",
    value: 1_200_000_000, responsible: "Phạm Văn Đức", responsibleColor: "bg-blue-500", responsibleInitials: "ĐP",
    deadline: "15/03/2026", priority: "high" },
]

// Project list mock
interface Project {
  id: string; name: string; client: string; address: string
  status: string; statusColor: string
  progress: number; budget: number; pm: string; pmColor: string; pmInitials: string
  startDate: string; endDate: string
}
const PROJECTS: Project[] = [
  { id: "1", name: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", client: "Nguyễn Văn An",
    address: "Phú Mỹ Hưng, Q.7, TP.HCM", status: "Đang thi công", statusColor: "bg-orange-100 text-orange-700",
    progress: 48, budget: 820_000_000, pm: "Trần Thị Bình", pmColor: "bg-orange-500", pmInitials: "BT",
    startDate: "01/01/2025", endDate: "31/08/2025" },
  { id: "2", name: "Văn phòng Landmark 81 – T22", client: "Cty TNHH ABC",
    address: "Landmark 81, Bình Thạnh, TP.HCM", status: "Chốt HĐ", statusColor: "bg-amber-100 text-amber-700",
    progress: 5, budget: 1_500_000_000, pm: "Lê Minh Tuấn", pmColor: "bg-teal-500", pmInitials: "TL",
    startDate: "01/04/2026", endDate: "31/03/2027" },
  { id: "3", name: "Biệt thự Song Long – Thủ Đức", client: "Phạm Thị Hoa",
    address: "Song Long, Thủ Đức, TP.HCM", status: "Bàn giao", statusColor: "bg-teal-100 text-teal-700",
    progress: 100, budget: 2_200_000_000, pm: "Trần Thị Bình", pmColor: "bg-orange-500", pmInitials: "BT",
    startDate: "01/03/2024", endDate: "30/11/2024" },
  { id: "4", name: "Villa Thảo Điền – Q.2", client: "Lê Quang Vinh",
    address: "Thảo Điền, Q.2, TP.HCM", status: "Đang thi công", statusColor: "bg-orange-100 text-orange-700",
    progress: 32, budget: 3_500_000_000, pm: "Lê Minh Tuấn", pmColor: "bg-teal-500", pmInitials: "TL",
    startDate: "01/09/2025", endDate: "30/06/2026" },
  { id: "5", name: "Nhà phố Bình Thạnh – Q.BT", client: "Vũ Thị Mai",
    address: "Bình Thạnh, TP.HCM", status: "Đang thi công", statusColor: "bg-orange-100 text-orange-700",
    progress: 71, budget: 1_800_000_000, pm: "Trần Thị Bình", pmColor: "bg-orange-500", pmInitials: "BT",
    startDate: "01/10/2025", endDate: "15/05/2026" },
]

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES: {
  key: Stage; label: string; sublabel: string
  bg: string; border: string; header: string; dot: string; badge: string
}[] = [
  { key: "lead",         label: "Khách hàng",    sublabel: "Tiếp cận & Khảo sát",
    bg: "bg-blue-50",    border: "border-blue-200",   header: "bg-blue-100",    dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700" },
  { key: "design",       label: "Thiết kế & DT", sublabel: "Bản vẽ & Dự toán BOQ",
    bg: "bg-purple-50",  border: "border-purple-200", header: "bg-purple-100",  dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
  { key: "contract",     label: "Chốt HĐ",       sublabel: "Ký hợp đồng & Đặt cọc",
    bg: "bg-amber-50",   border: "border-amber-200",  header: "bg-amber-100",   dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-700" },
  { key: "construction", label: "Đang thi công", sublabel: "Triển khai & Giám sát",
    bg: "bg-orange-50",  border: "border-orange-200", header: "bg-orange-100",  dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  { key: "payment",      label: "Thanh toán",    sublabel: "Thu tiền & Đối chiếu",
    bg: "bg-green-50",   border: "border-green-200",  header: "bg-green-100",   dot: "bg-green-500",  badge: "bg-green-100 text-green-700" },
  { key: "handover",     label: "Bàn giao",      sublabel: "Nghiệm thu & Bảo hành",
    bg: "bg-teal-50",    border: "border-teal-200",   header: "bg-teal-100",    dot: "bg-teal-500",   badge: "bg-teal-100 text-teal-700" },
]
const STAGE_ORDER: Stage[] = ["lead", "design", "contract", "construction", "payment", "handover"]

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-100 text-red-600", medium: "bg-yellow-100 text-yellow-700", low: "bg-gray-100 text-gray-500",
}
const PRIORITY_LABEL: Record<Priority, string> = { high: "Cao", medium: "TB", low: "Thấp" }

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const [tab, setTab] = useState<"pipeline" | "leads" | "projects">("pipeline")
  const [cards, setCards] = useState<PipelineCard[]>(INIT_CARDS)
  const [cardFilter, setCardFilter] = useState<"all" | CardType>("all")

  const filtered = cardFilter === "all" ? cards : cards.filter(c => c.type === cardFilter)
  const moveCard = (id: string, direction: "forward" | "back") => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c
      const idx = STAGE_ORDER.indexOf(c.stage)
      const next = direction === "forward" ? idx + 1 : idx - 1
      if (next < 0 || next >= STAGE_ORDER.length) return c
      return { ...c, stage: STAGE_ORDER[next] }
    }))
  }

  const constructionCards = cards.filter(c => c.stage === "construction")
  const avgProgress = constructionCards.length
    ? Math.round(constructionCards.reduce((s, c) => s + (c.progress ?? 0), 0) / constructionCards.length) : 0

  const TABS = [
    { key: "pipeline" as const, label: "Pipeline",   icon: Kanban },
    { key: "leads"    as const, label: "CRM / Lead", icon: Users },
    { key: "projects" as const, label: "Dự án",      icon: FolderKanban },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Quản lý Dự án</h1>
            <p className="text-xs text-gray-400 mt-0.5">Pipeline · CRM Lead · Danh sách dự án</p>
          </div>
          <div className="flex items-center gap-2">
            {tab === "pipeline" && (
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                {(["all", "lead", "project"] as const).map(f => (
                  <button key={f} onClick={() => setCardFilter(f)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                      cardFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}>
                    {f === "all" ? "Tất cả" : f === "lead" ? "Lead" : "Dự án"}
                  </button>
                ))}
              </div>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              {tab === "leads" ? "Thêm lead" : tab === "projects" ? "Thêm dự án" : "Thêm mới"}
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: "Tổng pipeline", value: String(cards.length),                  sub: "lead & dự án",    color: "text-gray-900",   icon: TrendingUp },
            { label: "Lead đang theo", value: String(LEADS.length),                 sub: "cần chăm sóc",   color: "text-blue-600",   icon: Users },
            { label: "Đang thi công",  value: String(constructionCards.length),     sub: "dự án",          color: "text-orange-600", icon: FolderKanban },
            { label: "Tiến độ TB",     value: `${avgProgress}%`,                    sub: "đang thi công",  color: "text-green-600",  icon: CheckCircle2 },
          ].map(k => (
            <div key={k.label} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <k.icon className={`w-5 h-5 ${k.color} shrink-0`} />
              <div>
                <div className="text-xs text-gray-400">{k.label}</div>
                <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-gray-400">{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 tab-bar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`tab-item flex items-center gap-1.5 ${tab === key ? "active" : ""}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Pipeline Kanban */}
      {tab === "pipeline" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-4 h-full" style={{ minWidth: "max-content" }}>
            {STAGES.map((stage, stageIdx) => {
              const stageCards = filtered.filter(c => c.stage === stage.key)
              const stageValue = stageCards.reduce((s, c) => s + c.value, 0)
              return (
                <div key={stage.key} className="flex flex-col w-72 shrink-0 h-full">
                  <div className={`${stage.header} border ${stage.border} rounded-xl px-3 py-2.5 mb-2 shrink-0`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stage.dot} shrink-0`} />
                        <span className="text-sm font-semibold text-gray-800">{stage.label}</span>
                        <span className="text-xs font-bold text-gray-500 bg-white/70 px-1.5 py-0.5 rounded-md">{stageCards.length}</span>
                      </div>
                      {stageIdx < STAGE_ORDER.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <div className="text-[10px] text-gray-500">{stage.sublabel}</div>
                    {stageValue > 0 && <div className="text-xs font-semibold text-gray-700 mt-1">{fmtVND(stageValue)}</div>}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                    {stageCards.map(card => (
                      <KanbanCard key={card.id} card={card} stage={stage}
                        stageIdx={stageIdx} totalStages={STAGE_ORDER.length} onMove={moveCard} />
                    ))}
                    {stageCards.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                        <div className="text-xs text-gray-400">Chưa có mục nào</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: CRM / Lead */}
      {tab === "leads" && (
        <div className="flex-1 overflow-auto p-5">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Tên lead / Công trình</th>
                  <th className="text-left">Khách hàng</th>
                  <th className="text-left">Nguồn</th>
                  <th className="text-left">Giai đoạn</th>
                  <th className="text-right">Giá trị</th>
                  <th className="text-left">Phụ trách</th>
                  <th className="text-left">Deadline</th>
                  <th className="text-left">Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                {LEADS.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div className="font-semibold text-gray-900 text-sm">{lead.name}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-sm text-gray-700">{lead.client}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{lead.source}</span>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${lead.stageColor}`}>{lead.stage}</span>
                    </td>
                    <td className="text-right font-semibold text-orange-600">{fmtVND(lead.value)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full ${lead.responsibleColor} flex items-center justify-center shrink-0`}>
                          <span className="text-[9px] font-bold text-white">{lead.responsibleInitials}</span>
                        </div>
                        <span className="text-xs text-gray-600">{lead.responsible}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" /> {lead.deadline}
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${PRIORITY_STYLE[lead.priority]}`}>
                        {PRIORITY_LABEL[lead.priority]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Dự án */}
      {tab === "projects" && (
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-1 gap-3">
            {PROJECTS.map(proj => (
              <Link key={proj.id} href={`/projects/${proj.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${proj.statusColor}`}>{proj.status}</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{proj.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{proj.client}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{proj.address}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-orange-600">{fmtVND(proj.budget)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {proj.startDate} → {proj.endDate}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  {/* Progress */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Tiến độ</span>
                      <span className="font-semibold text-orange-500">{proj.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${proj.progress}%`, background: proj.progress === 100 ? "#22c55e" : proj.progress >= 60 ? "#E87625" : "#f97316" }} />
                    </div>
                  </div>
                  {/* PM */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`w-6 h-6 rounded-full ${proj.pmColor} flex items-center justify-center`}>
                      <span className="text-[9px] font-bold text-white">{proj.pmInitials}</span>
                    </div>
                    <span className="text-xs text-gray-500">{proj.pm}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────
function KanbanCard({ card, stage, stageIdx, totalStages, onMove }: {
  card: PipelineCard; stage: typeof STAGES[0]
  stageIdx: number; totalStages: number
  onMove: (id: string, dir: "forward" | "back") => void
}) {
  return (
    <div className={`bg-white border ${stage.border} rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${stage.badge}`}>
            {card.type === "lead" ? "Lead" : "Dự án"}
          </span>
          {card.tags?.slice(0, 1).map(t => (
            <span key={t} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{t}</span>
          ))}
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${PRIORITY_STYLE[card.priority]}`}>
          {PRIORITY_LABEL[card.priority]}
        </span>
      </div>
      <div className="mb-2">
        <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{card.name}</div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <User className="w-3 h-3" /> {card.client}
        </div>
      </div>
      <div className="text-sm font-bold text-orange-600 mb-2">{fmtVND(card.value)}</div>
      {card.progress !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Tiến độ</span>
            <span className="font-semibold text-orange-500">{card.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${card.progress}%`, background: card.progress === 100 ? "#22c55e" : card.progress >= 50 ? "#E87625" : "#f97316" }} />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-5 h-5 rounded-full ${card.responsible.color} flex items-center justify-center shrink-0`}>
            <span className="text-[8px] font-bold text-white">{card.responsible.initials}</span>
          </div>
          <span className="text-[10px] text-gray-500 truncate">{card.responsible.name}</span>
        </div>
        {card.deadline && (
          <div className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
            <Calendar className="w-2.5 h-2.5" /> {card.deadline}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 rounded-md flex-1 justify-center">
          <Eye className="w-3 h-3" /> {card.type === "lead" ? "Lead" : "Dự án"}
        </span>
        {stageIdx > 0 && (
          <button onClick={() => onMove(card.id, "back")}
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            ← Lùi
          </button>
        )}
        {stageIdx < totalStages - 1 && (
          <button onClick={() => onMove(card.id, "forward")}
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors">
            Tiến <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
