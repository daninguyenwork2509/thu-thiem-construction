"use client"
import { useState } from "react"
import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/app-store"
import { mockProjects, mockBoqLines, mockVOs, mockMilestones, fmtVND } from "@/lib/mock-data"
import {
  ArrowLeft, CheckCircle, AlertTriangle, Clock, FileText,
  BarChart3, GitBranch, TrendingUp, Zap, FolderOpen, ClipboardCheck,
  Plus, ExternalLink, Download, Camera
} from "lucide-react"
import Link from "next/link"
import GanttChart, { generateGanttTasks, type GanttTask } from "@/components/GanttChart"

// ── Status maps ───────────────────────────────────────────────────────────────
const msColor: Record<string, string> = {
  paid: "bg-green-100 text-green-700", approved: "bg-blue-100 text-blue-700",
  pending_approval: "bg-yellow-100 text-yellow-700", draft: "bg-gray-100 text-gray-500",
  overdue: "bg-red-100 text-red-600",
}
const msLabel: Record<string, string> = {
  paid: "Đã thu", approved: "Đã duyệt", pending_approval: "Chờ duyệt", draft: "Nháp", overdue: "Quá hạn",
}
const voColor: Record<string, string> = {
  director_approved: "bg-green-100 text-green-700", customer_pending: "bg-yellow-100 text-yellow-700",
  pm_review: "bg-blue-100 text-blue-700", rejected: "bg-red-100 text-red-600", draft: "bg-gray-100 text-gray-500",
}
const voLabel: Record<string, string> = {
  director_approved: "GĐ duyệt", customer_pending: "Chờ KH", pm_review: "PM duyệt",
  rejected: "Từ chối", draft: "Nháp",
}

// ── Mock docs & QA ────────────────────────────────────────────────────────────
const MOCK_DOCS = [
  { id: 1, name: "Hợp đồng thi công.pdf",     type: "pdf",  size: "2.4 MB", date: "01/02/2025", category: "Hợp đồng" },
  { id: 2, name: "Bản vẽ kiến trúc tầng 1.dwg", type: "dwg", size: "8.1 MB", date: "05/02/2025", category: "Bản vẽ" },
  { id: 3, name: "Bản vẽ điện M&E.pdf",        type: "pdf",  size: "3.2 MB", date: "10/02/2025", category: "Bản vẽ" },
  { id: 4, name: "Biên bản nghiệm thu phần thô.pdf", type: "pdf", size: "1.1 MB", date: "15/04/2025", category: "Nghiệm thu" },
  { id: 5, name: "Bảng vật liệu được duyệt.xlsx", type: "xlsx", size: "0.8 MB", date: "20/02/2025", category: "Vật tư" },
]
const MOCK_QA = [
  { id: 1, item: "Độ phẳng tường phòng khách ≤ 3mm",    phase: "Xây tô",     status: "pass" as const, date: "10/04/2025", by: "Đặng T. Hương" },
  { id: 2, item: "Khe góc tường vuông 90°",               phase: "Xây tô",     status: "fail" as const, date: "10/04/2025", by: "Đặng T. Hương" },
  { id: 3, item: "Ống điện đúng sơ đồ M&E",               phase: "Điện rough", status: "pass" as const, date: "05/04/2025", by: "Đặng T. Hương" },
  { id: 4, item: "Thép đai cột đúng khoảng cách 150mm",  phase: "Phần thô",   status: "pass" as const, date: "01/03/2025", by: "Trần T. Bình" },
  { id: 5, item: "Bê tông không bị rỗ, vá lại đúng kỹ thuật", phase: "Phần thô", status: "pass" as const, date: "01/03/2025", by: "Trần T. Bình" },
]

const FILE_ICON: Record<string, string> = { pdf: "📄", dwg: "📐", xlsx: "📊", docx: "📝", jpg: "🖼️" }

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",  label: "Tổng quan",    icon: BarChart3 },
  { key: "boq",       label: "Dự toán BOQ",  icon: FileText },
  { key: "vo",        label: "Phát sinh VO", icon: Zap },
  { key: "gantt",     label: "Tiến độ",      icon: GitBranch },
  { key: "finance",   label: "Tài chính",    icon: TrendingUp },
  { key: "documents", label: "Hồ sơ & QA",  icon: FolderOpen },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()
  const [tab, setTab] = useState("overview")

  const project =
    state.projects.find(p => p.id === Number(id)) ??
    (mockProjects as typeof state.projects).find(p => p.id === Number(id))

  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>(() =>
    project ? generateGanttTasks(project.start_date, project.progress_pct) : []
  )

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">Không tìm thấy dự án #{id}</p>
        <Link href="/projects" className="text-orange-500 underline">Về danh sách</Link>
      </div>
    )
  }

  const boqLines   = mockBoqLines.filter(b => b.project_id === project.id)
  const vos        = mockVOs.filter(v => v.project_id === project.id)
  const milestones = mockMilestones.filter(m => m.project_id === project.id)
  const categories = [...new Set(boqLines.map(b => b.category))]

  const totalBOQ  = boqLines.reduce((s, b) => s + b.qty * b.selling_price, 0)
  const totalPaid = milestones.filter(m => m.status === "paid").reduce((s, m) => s + m.payment_amount, 0)

  const handleUpdateProgress = (taskId: number, pct: number) => {
    function updateInTree(tasks: GanttTask[]): GanttTask[] {
      return tasks.map(t => {
        if (t.id === taskId) return { ...t, progress: pct, status: pct === 100 ? "completed" : pct > 0 ? "in-progress" : "not-started" }
        if (t.children) return { ...t, children: updateInTree(t.children) }
        return t
      })
    }
    setGanttTasks(prev => updateInTree(prev))
  }

  const statusBadge = {
    under_construction: "bg-blue-100 text-blue-700",
    legal_check:        "bg-yellow-100 text-yellow-700",
    completed:          "bg-green-100 text-green-700",
    inspecting:         "bg-purple-100 text-purple-700",
    draft:              "bg-gray-100 text-gray-600",
    warranty:           "bg-teal-100 text-teal-700",
  } as Record<string, string>
  const statusText = {
    under_construction: "Đang thi công", legal_check: "Kiểm tra pháp lý",
    completed: "Hoàn thành", inspecting: "Nghiệm thu", draft: "Nháp", warranty: "Bảo hành",
  } as Record<string, string>

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/projects" className="text-gray-400 hover:text-orange-500 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dự án
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">{project.project_code}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${id}/boq`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              <FileText className="w-3.5 h-3.5" /> Bóc tách BOQ
            </Link>
            <Link href="/site/vo/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Tạo VO
            </Link>
          </div>
        </div>

        {/* Project summary row */}
        <div className="flex items-start gap-4 pb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">{project.project_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge[project.project_status] ?? "bg-gray-100 text-gray-600"}`}>
                {statusText[project.project_status] ?? project.project_status}
              </span>
              {project.has_building_permit
                ? <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-md"><CheckCircle className="w-3 h-3" /> GP thi công</span>
                : <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md"><AlertTriangle className="w-3 h-3" /> Thiếu GP</span>
              }
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.project_name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              KH: <span className="text-gray-700 font-medium">{project.customer_name}</span>
              &nbsp;·&nbsp;{project.customer_phone}
              &nbsp;·&nbsp;PM: <span className="text-gray-700 font-medium">{project.pm_name}</span>
            </p>
          </div>

          {/* Progress + KPIs */}
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex items-center gap-4 text-sm">
              <div><div className="text-xs text-gray-400">Giá trị HĐ</div><div className="font-bold text-gray-900">{fmtVND(project.contract_value)}</div></div>
              <div><div className="text-xs text-gray-400">Đã thu</div><div className="font-bold text-green-600">{fmtVND(project.total_paid)}</div></div>
              <div><div className="text-xs text-gray-400">Còn nợ</div><div className={`font-bold ${project.total_outstanding_debt > 0 ? "text-red-500" : "text-gray-400"}`}>{fmtVND(project.total_outstanding_debt)}</div></div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Tiến độ</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${project.progress_pct}%`, backgroundColor: "#E87625" }} />
                  </div>
                  <span className="text-sm font-bold text-orange-500">{project.progress_pct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 -mb-px">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.key === "vo" && vos.length > 0 && (
                <span className="ml-1 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{vos.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Tab: Tổng quan ── */}
        {tab === "overview" && (
          <div className="space-y-4 max-w-5xl">
            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Bắt đầu: {project.start_date}</span>
                <span className="font-semibold text-orange-500">{project.progress_pct}% hoàn thành</span>
                <span>Kết thúc: {project.expected_end_date}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${project.progress_pct}%`, background: "linear-gradient(90deg, #E87625, #F0922A)" }} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: BOQ summary */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">Dự toán BOQ — Tóm tắt</h3>
                    <button onClick={() => setTab("boq")} className="text-xs text-orange-500 hover:underline">Xem chi tiết →</button>
                  </div>
                  {boqLines.length === 0 ? (
                    <div className="px-5 py-6 text-center">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 mb-3">Chưa có BOQ</p>
                      <Link href={`/projects/${id}/boq`} className="text-xs text-orange-500 font-semibold hover:underline">Bóc tách BOQ ngay →</Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {categories.map(cat => {
                        const lines = boqLines.filter(b => b.category === cat)
                        const catTotal = lines.reduce((s, b) => s + b.qty * b.selling_price, 0)
                        const catPct = Math.round(lines.reduce((s, b) => s + b.progress_pct, 0) / lines.length)
                        return (
                          <div key={cat} className="px-5 py-2.5 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-800">{cat}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{lines.length} hạng mục</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-700">{fmtVND(catTotal)}</div>
                              <div className="flex items-center gap-1.5 mt-1 justify-end">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${catPct}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-400">{catPct}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="px-5 py-2.5 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">Tổng BOQ</span>
                        <span className="text-sm font-bold text-orange-600">{fmtVND(totalBOQ)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* VO summary */}
                {vos.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        Phát sinh (VO)
                        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{vos.length}</span>
                      </h3>
                      <button onClick={() => setTab("vo")} className="text-xs text-orange-500 hover:underline">Xem chi tiết →</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {vos.map(vo => (
                        <div key={vo.id} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-gray-800 truncate">{vo.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{vo.vo_code}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-orange-600">{fmtVND(vo.selling_price_vat)}</div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${voColor[vo.status]}`}>{voLabel[vo.status]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: milestones */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-fit">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Mốc thanh toán</h3>
                  <button onClick={() => setTab("finance")} className="text-xs text-orange-500 hover:underline">Chi tiết →</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {milestones.map(m => (
                    <div key={m.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-xs font-medium text-gray-800 leading-snug">Đợt {m.milestone_order}: {m.milestone_name}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${msColor[m.status]}`}>{msLabel[m.status]}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{m.payment_percent}% · {m.due_date}</span>
                        <span className={`font-semibold ${m.status === "paid" ? "text-green-600" : "text-gray-700"}`}>{fmtVND(m.payment_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: BOQ ── */}
        {tab === "boq" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">{boqLines.length} hạng mục · Tổng: <span className="font-bold text-orange-600">{fmtVND(totalBOQ)}</span></div>
              <Link href={`/projects/${id}/boq`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                <FileText className="w-3.5 h-3.5" /> Mở BOQ Editor
              </Link>
            </div>
            {boqLines.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Chưa có dự toán BOQ cho dự án này</p>
                <Link href={`/projects/${id}/boq`} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
                  <Plus className="w-4 h-4" /> Bắt đầu bóc tách BOQ
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {categories.map(cat => (
                  <div key={cat}>
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{cat}</span>
                      <span className="text-xs text-gray-500">
                        {fmtVND(boqLines.filter(b => b.category === cat).reduce((s, b) => s + b.qty * b.selling_price, 0))}
                      </span>
                    </div>
                    {boqLines.filter(b => b.category === cat).map(line => (
                      <div key={line.id} className={`px-5 py-3 flex items-center gap-4 border-b border-gray-50 last:border-0 ${line.margin_warning ? "bg-red-50" : "hover:bg-gray-50"}`}>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${line.margin_warning ? "text-red-700" : "text-gray-800"}`}>
                            {line.item_name}
                            {line.margin_warning && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Margin thấp</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{line.qty} {line.uom} × {fmtVND(line.selling_price)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-gray-700">{fmtVND(line.qty * line.selling_price)}</div>
                          <div className="flex items-center gap-1.5 mt-1 justify-end">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${line.progress_pct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 w-6 text-right">{line.progress_pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="px-5 py-3 bg-orange-50 border-t-2 border-orange-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Tổng dự toán BOQ</span>
                  <span className="text-base font-bold text-orange-600">{fmtVND(totalBOQ)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: VO ── */}
        {tab === "vo" && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {vos.length} phát sinh · Tổng: <span className="font-bold text-orange-600">{fmtVND(vos.reduce((s, v) => s + v.selling_price_vat, 0))}</span>
              </div>
              <Link href="/site/vo/new"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                <Plus className="w-3.5 h-3.5" /> Tạo VO mới
              </Link>
            </div>
            {vos.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chưa có phát sinh nào cho dự án này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vos.map(vo => (
                  <div key={vo.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{vo.vo_code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${voColor[vo.status]}`}>{voLabel[vo.status]}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{vo.title}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{vo.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-orange-600">{fmtVND(vo.selling_price_vat)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">incl. VAT {vo.vat_rate}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-400">Yêu cầu bởi: <span className="text-gray-600">{vo.requested_by}</span> · {vo.request_date}</div>
                      <div className="flex gap-2">
                        <Link href={`/guest/vo/${vo.guest_link_token}`}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                          <ExternalLink className="w-3 h-3" /> Link KH
                        </Link>
                        <Link href={`/vo/${vo.id}`}
                          className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-700 px-2 py-1 rounded-lg border border-orange-200 hover:bg-orange-50 transition">
                          Chi tiết →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Tiến độ Gantt ── */}
        {tab === "gantt" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-full">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Sơ đồ Gantt — Tiến độ thi công</h2>
                <p className="text-xs text-gray-500 mt-0.5">Nhấn vào % để cập nhật tiến độ từng công việc</p>
              </div>
              <div className="text-xs text-gray-400">{project.start_date} → {project.expected_end_date}</div>
            </div>
            <div className="p-4">
              <GanttChart tasks={ganttTasks} projectStart={project.start_date} projectEnd={project.expected_end_date} onUpdateProgress={handleUpdateProgress} />
            </div>
          </div>
        )}

        {/* ── Tab: Tài chính ── */}
        {tab === "finance" && (
          <div className="space-y-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Giá trị hợp đồng",           value: fmtVND(project.contract_value),                              color: "text-gray-900" },
                { label: "Đã thu",                       value: fmtVND(project.total_paid),                                  color: "text-green-600" },
                { label: "Còn nợ",                       value: fmtVND(project.total_outstanding_debt),                      color: project.total_outstanding_debt > 0 ? "text-red-600" : "text-gray-400" },
                { label: `Giữ lại (${project.retention_percent}%)`, value: fmtVND(project.contract_value * project.retention_percent / 100), color: "text-orange-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className={`text-lg font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Chi tiết mốc thanh toán</h3></div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs">
                  <tr>
                    {["Đợt", "Tên mốc", "% HĐ", "Số tiền", "Đến hạn", "Trạng thái"].map(h => (
                      <th key={h} className={`px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide ${h === "Đợt" || h === "Tên mốc" ? "text-left" : "text-center"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {milestones.length > 0 ? milestones.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">Đợt {m.milestone_order}</td>
                      <td className="px-4 py-3 text-gray-900">{m.milestone_name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{m.payment_percent}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{fmtVND(m.payment_amount)}</td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{m.due_date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${msColor[m.status]}`}>{msLabel[m.status]}</span>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Chưa có mốc thanh toán</td></tr>}
                </tbody>
                {milestones.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-sm">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 font-bold text-gray-900">Tổng</td>
                      <td className="px-4 py-3 text-center font-bold">100%</td>
                      <td className="px-4 py-3 text-center font-bold">{fmtVND(project.contract_value)}</td>
                      <td />
                      <td className="px-4 py-3 text-center text-xs text-green-700 font-semibold">{fmtVND(totalPaid)} đã thu</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Hồ sơ & QA ── */}
        {tab === "documents" && (
          <div className="space-y-5 max-w-4xl">
            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-orange-500" /> Tài liệu & Bản vẽ
                </h3>
                <button className="flex items-center gap-1.5 text-xs text-orange-500 font-semibold hover:text-orange-700 px-2 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-50 transition">
                  <Plus className="w-3.5 h-3.5" /> Tải lên
                </button>
              </div>
              {/* Category filter */}
              <div className="px-5 py-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
                {["Tất cả", "Hợp đồng", "Bản vẽ", "Nghiệm thu", "Vật tư"].map(f => (
                  <button key={f} className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition font-medium">
                    {f}
                  </button>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {MOCK_DOCS.map(doc => (
                  <div key={doc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                    <span className="text-2xl shrink-0">{FILE_ICON[doc.type] ?? "📎"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{doc.category} · {doc.size} · {doc.date}</div>
                    </div>
                    <button className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* QA Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-green-500" /> QA / Nghiệm thu
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                    {MOCK_QA.filter(q => q.status === "pass").length}/{MOCK_QA.length} đạt
                  </span>
                </h3>
                <button className="flex items-center gap-1.5 text-xs text-gray-500 font-medium hover:text-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <Camera className="w-3.5 h-3.5" /> Thêm checklist
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs">
                  <tr>
                    {["Hạng mục kiểm tra", "Giai đoạn", "Ngày", "Người KT", "Kết quả"].map(h => (
                      <th key={h} className={`px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide ${h === "Hạng mục kiểm tra" ? "text-left" : "text-center"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_QA.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 text-sm">{q.item}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">{q.phase}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-400">{q.date}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">{q.by}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          q.status === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {q.status === "pass" ? "✓ Đạt" : "✗ Lỗi"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
