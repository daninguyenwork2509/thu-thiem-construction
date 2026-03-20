"use client"
import { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useAppStore } from "@/lib/app-store"
import { mockProjects, mockBoqLines, mockVOs, mockMilestones, fmtVND } from "@/lib/mock-data"
import {
  ArrowLeft, CheckCircle, AlertTriangle,
  GitBranch, FolderOpen,
  Plus, Camera, ChevronDown, ChevronRight,
  Zap as BoltIcon, HardHat, Users, DollarSign, AlertCircle,
  Check, X, Circle, FileText
} from "lucide-react"
import Link from "next/link"
import ProjectBOQTab from "./components/ProjectBOQTab"
import ProjectFilesTab from "./components/ProjectFilesTab"

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
  { key: "timeline", label: "Timeline",     icon: GitBranch },
  { key: "boq",      label: "Dự toán BOQ",  icon: FileText },
  { key: "files",    label: "Tài liệu",     icon: FolderOpen },
]

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE FEATURE
// ─────────────────────────────────────────────────────────────────────────────

type StepStatus = "done" | "active" | "blocked" | "pending"

interface StepGate {
  label: string
  passed: boolean
  failMsg?: string
}

interface TimelineStepDef {
  num: number
  title: string
  subtitle: string
  date?: string
  gates?: StepGate[]
  body: React.ReactNode
}

// Map project_status → current active step index (0-based)
function getActiveStep(projectStatus: string, progressPct: number): number {
  if (projectStatus === "completed") return 9 // all done
  if (projectStatus === "warranty")  return 8
  if (projectStatus === "inspecting") return 6
  if (projectStatus === "under_construction") return progressPct >= 90 ? 7 : 4
  if (projectStatus === "legal_check") return 3
  if (projectStatus === "draft") return 0
  return 4
}

function getStepStatus(stepIdx: number, activeStep: number): StepStatus {
  if (activeStep >= 9) return "done"   // all done
  if (stepIdx < activeStep) return "done"
  if (stepIdx === activeStep) return "active"
  return "pending"
}

// ── Dot component ──────────────────────────────────────────────────────────────
function StepDot({ status }: { status: StepStatus }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 relative"
  if (status === "done")
    return <div className={`${base} bg-green-500`}><Check className="w-4 h-4 text-white" /></div>
  if (status === "active")
    return (
      <div className={`${base} bg-orange-500`} style={{ boxShadow: "0 0 0 5px rgba(234,88,12,0.18)" }}>
        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
      </div>
    )
  if (status === "blocked")
    return <div className={`${base} bg-red-500`}><X className="w-4 h-4 text-white" /></div>
  return <div className={`${base} bg-white border-2 border-gray-200`}><Circle className="w-3 h-3 text-gray-300" /></div>
}

// ── Gate item ──────────────────────────────────────────────────────────────────
function GateItem({ gate }: { gate: StepGate }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
      gate.passed ? "bg-green-50 text-green-800 border border-green-100"
                  : "bg-red-50 text-red-800 border border-red-100"
    }`}>
      {gate.passed
        ? <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
        : <X className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
      }
      <span>{gate.passed ? gate.label : (gate.failMsg ?? gate.label)}</span>
    </div>
  )
}

// ── Single step card ───────────────────────────────────────────────────────────
function TimelineStep({
  step, status, isLast,
}: {
  step: TimelineStepDef
  status: StepStatus
  isLast: boolean
}) {
  const [open, setOpen] = useState(status === "active")

  const headerColor = status === "active"
    ? "border border-orange-300 bg-white shadow-sm"
    : status === "done"
    ? "border border-gray-100 bg-white"
    : "border border-gray-100 bg-gray-50/60"

  const numColor = status === "done" ? "text-green-600" : status === "active" ? "text-orange-600" : "text-gray-400"
  const titleColor = status === "pending" ? "text-gray-400" : "text-gray-900"

  const statusBadge =
    status === "done"    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Hoàn thành</span>
  : status === "active"  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">Đang thực hiện</span>
  : status === "blocked" ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Bị chặn</span>
  : null

  return (
    <div className="flex gap-4">
      {/* Left column: dot + line */}
      <div className="flex flex-col items-center w-8 shrink-0">
        <StepDot status={status} />
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-1 min-h-[24px] ${
            status === "done" ? "bg-green-300" : status === "active" ? "bg-gradient-to-b from-orange-300 to-gray-200" : "bg-gray-200"
          }`} />
        )}
      </div>

      {/* Right column: card */}
      <div className={`flex-1 mb-4 rounded-xl overflow-hidden ${headerColor}`}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-xs font-bold font-mono ${numColor}`}>
              {String(step.num).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className={`text-sm font-bold leading-tight ${titleColor}`}>{step.title}</div>
              {step.subtitle && <div className="text-[11px] text-gray-400 mt-0.5">{step.subtitle}</div>}
            </div>
            {statusBadge}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {step.date && <span className="text-[10px] text-gray-400">{step.date}</span>}
            {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {open && (
          <div className={`border-t px-4 py-3 space-y-3 ${status === "active" ? "border-orange-100" : "border-gray-100"}`}>
            {step.gates && step.gates.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Điều kiện chuyển bước</div>
                {step.gates.map((g, i) => <GateItem key={i} gate={g} />)}
              </div>
            )}
            <div className={`text-sm text-gray-600 ${status === "pending" ? "opacity-60" : ""}`}>
              {step.body}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Next action banner ─────────────────────────────────────────────────────────
function NextActionBanner({ stage, surveyCount }: { stage: string; surveyCount: number }) {
  const map: Record<string, { current: string; next: string }> = {
    lead_new:             { current: "Tiếp nhận Lead",            next: "Sales cần giao KS xuống khảo sát hiện trường" },
    surveying:            { current: "Khảo sát hiện trạng",       next: `KS cần upload đủ ảnh khảo sát (hiện có: ${surveyCount}/5)` },
    awaiting_design_fee:  { current: "Chờ thu phí bản vẽ",        next: "Kế toán cần xác nhận thu phí thiết kế" },
    designing:            { current: "Đang thiết kế",             next: "KS thiết kế + QS bóc tách BOQ, chờ KH duyệt bản vẽ" },
    quotation:            { current: "Báo giá",                   next: "PM gửi báo giá cho KH, chờ phản hồi và đàm phán" },
    contract_signed:      { current: "Đã ký hợp đồng",           next: "PM lập Gantt baseline và phân bổ gói thầu phụ" },
    construction:         { current: "Đang thi công",             next: "GS cập nhật % tiến độ hôm nay — kiểm tra VO chờ duyệt" },
    handover:             { current: "Nghiệm thu & QC",           next: "Chốt khối lượng nghiệm thu + ảnh Before/After theo BOQ" },
    warranty:             { current: "Bảo hành",                  next: "Theo dõi hết hạn bảo hành, xử lý yêu cầu bảo hành KH" },
    done:                 { current: "Hoàn thành",                next: "Dự án đã kết thúc — lưu trữ hồ sơ và đánh giá KH" },
  }
  const info = map[stage] ?? map["construction"]
  return (
    <div className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3"
      style={{ background: "linear-gradient(135deg,#FFF7ED,#FFFBEB)", border: "1.5px solid #FED7AA" }}>
      <BoltIcon className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-bold text-orange-800">Đang ở: {info.current}</div>
        <div className="text-xs text-orange-600 mt-0.5">Bước tiếp: {info.next}</div>
      </div>
    </div>
  )
}

// ── Timeline sidebar ───────────────────────────────────────────────────────────
function TimelineSidebar({ project, milestones, vos, boqLines }: {
  project: typeof mockProjects[0]
  milestones: typeof mockMilestones
  vos: typeof mockVOs
  boqLines: typeof mockBoqLines
}) {
  const totalBOQ  = boqLines.reduce((s, b) => s + b.qty * b.selling_price, 0)
  const totalCost = boqLines.reduce((s, b) => s + b.qty * b.cost_price, 0)
  const margin = totalBOQ > 0 ? ((totalBOQ - totalCost) / totalBOQ * 100) : 0
  const voWaiting = vos.filter(v => v.status === "customer_pending" || v.status === "pm_review").length
  const hasAlerts = voWaiting > 0 || project.total_outstanding_debt > 0

  const SUBCONTRACTORS = [
    { name: "Phần thô", contractor: "Xây dựng Tiến Phát", pct: 90, onTime: true },
    { name: "Điện – M&E", contractor: "M&E Đông Dương", pct: 60, onTime: true },
    { name: "Nội thất", contractor: "Nội thất Minh Long", pct: 15, onTime: false },
  ]

  const PEOPLE = [
    { role: "PM phụ trách",    name: project.pm_name, avatar: project.pm_name[0] },
    { role: "KS Thiết kế",    name: "Trần Thị Bình",  avatar: "B" },
    { role: "QS Dự toán",     name: "Hoàng Văn Nam",  avatar: "N" },
  ]

  return (
    <div className="space-y-4">
      {/* People */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nhân sự</span>
        </div>
        <div className="px-4 py-2 divide-y divide-gray-50">
          {PEOPLE.map(p => (
            <div key={p.role} className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">
                {p.avatar}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-800">{p.name}</div>
                <div className="text-[10px] text-gray-400">{p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Finance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tài chính</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          {[
            { label: "Giá trị HĐ",    value: fmtVND(project.contract_value),            color: "text-gray-900 font-bold" },
            { label: "Đã thu",         value: fmtVND(project.total_paid),                color: "text-green-600 font-semibold" },
            { label: "Còn nợ",         value: fmtVND(project.total_outstanding_debt),    color: project.total_outstanding_debt > 0 ? "text-red-600 font-semibold" : "text-gray-400" },
            { label: "Chi phí ước",   value: fmtVND(totalCost),                          color: "text-gray-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{label}</span>
              <span className={color}>{value}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">Biên LN ước</span>
            <span className={`font-bold text-sm ${margin < 15 ? "text-red-600" : margin < 25 ? "text-yellow-600" : "text-green-600"}`}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Subcontractor progress */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <HardHat className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Gói thầu</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          {SUBCONTRACTORS.map(s => (
            <div key={s.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div>
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="text-gray-400 ml-1">· {s.contractor}</span>
                </div>
                <span className={`font-bold ${s.onTime ? "text-green-600" : "text-red-600"}`}>{s.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${s.pct}%`,
                  backgroundColor: s.onTime ? "#059669" : "#DC2626"
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Cảnh báo</span>
          </div>
          <div className="px-4 py-3 space-y-2">
            {voWaiting > 0 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                <span><b>{voWaiting} VO</b> đang chờ phê duyệt</span>
              </div>
            )}
            {project.total_outstanding_debt > 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span>KH còn nợ <b>{fmtVND(project.total_outstanding_debt)}</b></span>
              </div>
            )}
            {!project.has_building_permit && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>Chưa có giấy phép thi công</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment milestones quick view */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mốc thanh toán</span>
          </div>
          <div className="px-4 py-2 divide-y divide-gray-50">
            {milestones.slice(0, 4).map(m => (
              <div key={m.id} className="py-2 flex items-center justify-between gap-2">
                <div className="text-xs text-gray-700 min-w-0 truncate">Đợt {m.milestone_order}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-gray-700">{fmtVND(m.payment_amount)}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${msColor[m.status]}`}>{msLabel[m.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Build 9 steps for a given project ─────────────────────────────────────────
function buildSteps(project: typeof mockProjects[0], milestones: typeof mockMilestones, vos: typeof mockVOs): TimelineStepDef[] {
  const surveyCount = 3 // mock
  const paidMilestones = milestones.filter(m => m.status === "paid").length

  return [
    {
      num: 1, title: "Tiếp nhận Lead",
      subtitle: "Ghi nhận thông tin khách hàng & nhu cầu",
      date: "05/01/2025",
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Khách hàng:</span> <span className="font-medium text-gray-800">{project.customer_name}</span></div>
          <div><span className="text-gray-400">SĐT:</span> <span className="font-medium text-gray-800">{project.customer_phone}</span></div>
          <div><span className="text-gray-400">Ngân sách KH:</span> <span className="font-medium text-orange-600">{fmtVND(350_000_000)}</span></div>
          <div><span className="text-gray-400">Mức linh hoạt:</span> <span className="font-medium text-gray-800">Cố định</span></div>
          <div className="col-span-2"><span className="text-gray-400">Ghi chú:</span> <span className="font-medium text-gray-800">Phong cách Nhật tối giản. Không đục kết cấu. Thi công sau 18h vì KH WFH.</span></div>
        </div>
      ),
    },
    {
      num: 2, title: "Khảo sát hiện trạng",
      subtitle: "KS xuống đo đạc, chụp ảnh & ghi nhận hiện trạng",
      date: "10/01/2025",
      gates: [
        { label: `Upload đủ 5 ảnh khảo sát (hiện có: ${surveyCount}/5)`, passed: surveyCount >= 5, failMsg: `KS chưa upload đủ ảnh — hiện có ${surveyCount}/5` },
      ],
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div><span className="text-gray-400">KS khảo sát:</span> <span className="font-medium text-gray-800">Nguyễn Văn Dũng</span></div>
            <div><span className="text-gray-400">Ảnh upload:</span> <span className="font-medium text-gray-800">{surveyCount}/5</span></div>
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <Camera className="w-4 h-4" />
              </div>
            ))}
            <button className="w-16 h-12 rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition text-xs">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
    },
    {
      num: 3, title: "Thu phí bản vẽ & Thiết kế",
      subtitle: "Thu phí thiết kế, KS vẽ bản vẽ thi công, KH duyệt",
      date: "20/01/2025",
      gates: [
        { label: "Kế toán xác nhận thu phí bản vẽ", passed: true },
        { label: "KH duyệt bản vẽ thi công", passed: true },
      ],
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Phí bản vẽ:</span> <span className="font-medium text-gray-800">{fmtVND(5_000_000)}</span></div>
          <div><span className="text-gray-400">Đã thu:</span> <span className="font-medium text-green-600">✓ 20/01/2025</span></div>
          <div><span className="text-gray-400">KS thiết kế:</span> <span className="font-medium text-gray-800">Trần Thị Bình</span></div>
          <div><span className="text-gray-400">QS dự toán:</span> <span className="font-medium text-gray-800">Hoàng Văn Nam</span></div>
          <div><span className="text-gray-400">File bản vẽ:</span> <span className="font-medium text-blue-600 underline cursor-pointer">3 file đã upload</span></div>
        </div>
      ),
    },
    {
      num: 4, title: "Báo giá & Ký hợp đồng",
      subtitle: "Gửi báo giá cho KH, đàm phán và ký kết hợp đồng",
      date: "01/02/2025",
      gates: [
        { label: "KH ký duyệt hợp đồng thi công", passed: true },
      ],
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Giá trị HĐ:</span> <span className="font-bold text-orange-600">{fmtVND(project.contract_value)}</span></div>
          <div><span className="text-gray-400">Ngày ký:</span> <span className="font-medium text-gray-800">01/02/2025</span></div>
          <div><span className="text-gray-400">Margin HĐ:</span> <span className="font-medium text-green-600">22.5%</span></div>
          <div><span className="text-gray-400">Thời gian TC:</span> <span className="font-medium text-gray-800">6 tháng</span></div>
        </div>
      ),
    },
    {
      num: 5, title: "Thi công",
      subtitle: "Triển khai gói thầu, giám sát tiến độ hàng ngày",
      date: "05/02/2025",
      gates: [
        { label: "Giấy phép thi công đã được cấp", passed: project.has_building_permit, failMsg: "Chưa có giấy phép thi công — không được khởi công" },
        { label: "Đã duyệt mẫu vật liệu chính", passed: project.has_material_board },
        { label: `VO chờ duyệt: ${vos.filter(v => v.status === "customer_pending").length} VO`, passed: vos.filter(v => v.status === "customer_pending").length === 0, failMsg: `Còn ${vos.filter(v => v.status === "customer_pending").length} VO chờ KH phê duyệt` },
      ],
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Tiến độ tổng thể</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${project.progress_pct}%`, background: "linear-gradient(90deg,#EA580C,#F97316)" }} />
                </div>
                <span className="text-sm font-bold text-orange-600 w-10 text-right">{project.progress_pct}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Phần thô", pct: 90, color: "bg-green-400" },
              { label: "Điện – M&E", pct: 60, color: "bg-blue-400" },
              { label: "Nội thất", pct: 15, color: "bg-orange-400" },
            ].map(g => (
              <div key={g.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className="text-[11px] text-gray-500 mb-1">{g.label}</div>
                <div className="text-lg font-bold text-gray-800">{g.pct}%</div>
                <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Link href={`/boq?project=${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 border border-orange-200 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition">
            <FileText className="w-3.5 h-3.5" /> Xem BOQ chi tiết →
          </Link>
        </div>
      ),
    },
    {
      num: 6, title: "Thu tiền theo đợt",
      subtitle: "Xuất hóa đơn và theo dõi thu tiền từng mốc",
      gates: [
        { label: `Đã thu ${paidMilestones}/${milestones.length || 4} đợt`, passed: paidMilestones === (milestones.length || 4), failMsg: `Còn ${(milestones.length || 4) - paidMilestones} đợt chưa thu — không thể bàn giao` },
      ],
      body: (
        <div className="space-y-1.5">
          {(milestones.length > 0 ? milestones : [
            { id: "m1", milestone_order: 1, milestone_name: "Sau ký HĐ",         payment_percent: 40, payment_amount: project.contract_value * 0.4,  status: "paid",             due_date: "01/02/2025" },
            { id: "m2", milestone_order: 2, milestone_name: "Hoàn thành thô",    payment_percent: 20, payment_amount: project.contract_value * 0.2,  status: "paid",             due_date: "10/03/2025" },
            { id: "m3", milestone_order: 3, milestone_name: "Hoàn thiện nội thất", payment_percent: 20, payment_amount: project.contract_value * 0.2, status: "pending_approval", due_date: "15/04/2025" },
            { id: "m4", milestone_order: 4, milestone_name: "Bàn giao",          payment_percent: 20, payment_amount: project.contract_value * 0.2,  status: "draft",            due_date: "31/05/2025" },
          ]).map(m => (
            <div key={m.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
              m.status === "paid" ? "bg-green-50 border border-green-100"
              : m.status === "pending_approval" ? "bg-yellow-50 border border-yellow-100"
              : "bg-gray-50 border border-gray-100"
            }`}>
              <div>
                <span className="font-medium text-gray-800">Đợt {m.milestone_order}</span>
                <span className="text-gray-400 ml-2">{m.milestone_name} · {m.payment_percent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{fmtVND(m.payment_amount)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msColor[m.status]}`}>{msLabel[m.status]}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: 7, title: "Nghiệm thu & QC",
      subtitle: "GS chốt khối lượng, chụp ảnh B/A, KH kiểm tra",
      gates: [
        { label: "GS đã chốt khối lượng nghiệm thu theo BOQ", passed: false, failMsg: "Chưa chốt khối lượng — kế toán chưa được phép thanh toán thầu phụ" },
        { label: "Ảnh Before/After đầy đủ theo từng hạng mục", passed: false },
      ],
      body: (
        <div className="text-xs text-gray-500">
          <p>Tạo biên bản nghiệm thu điện tử, ký kết với KH trước khi bàn giao.</p>
          <button className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
            <Plus className="w-3.5 h-3.5" /> Tạo biên bản nghiệm thu
          </button>
        </div>
      ),
    },
    {
      num: 8, title: "Bàn giao & Hoàn công",
      subtitle: "Bàn giao mặt bằng, bàn giao hồ sơ, thu đợt cuối",
      gates: [
        { label: "Công nợ KH = 0 ₫", passed: project.total_outstanding_debt === 0, failMsg: `KH còn nợ ${fmtVND(project.total_outstanding_debt)} — không thể bàn giao` },
        { label: "Biên bản nghiệm thu đã ký", passed: false },
      ],
      body: (
        <div className="text-xs text-gray-500">
          <p>Bàn giao tài liệu kỹ thuật, bản vẽ hoàn công, hướng dẫn sử dụng.</p>
        </div>
      ),
    },
    {
      num: 9, title: "Bảo hành",
      subtitle: "Theo dõi và xử lý các yêu cầu bảo hành sau bàn giao",
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Thời hạn BH:</span> <span className="font-medium text-gray-800">12 tháng</span></div>
          <div><span className="text-gray-400">Kết thúc:</span> <span className="font-medium text-gray-800">31/05/2026</span></div>
          <div><span className="text-gray-400">YC bảo hành:</span> <span className="font-medium text-gray-800">0 yêu cầu</span></div>
        </div>
      ),
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ProjectDetailInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { state } = useAppStore()
  const [tab, setTab] = useState(searchParams.get("tab") ?? "timeline")

  const project =
    state.projects.find(p => p.id === Number(id)) ??
    (mockProjects as typeof state.projects).find(p => p.id === Number(id))

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">Không tìm thấy dự án #{id}</p>
        <Link href="/pipeline" className="text-orange-500 underline">Về danh sách</Link>
      </div>
    )
  }

  const boqLines   = mockBoqLines.filter(b => b.project_id === project.id)
  const vos        = mockVOs.filter(v => v.project_id === project.id)
  const milestones = mockMilestones.filter(m => m.project_id === project.id)

  const statusBadge = {
    under_construction: "bg-blue-100 text-blue-700",
    legal_check: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    inspecting: "bg-purple-100 text-purple-700",
    draft: "bg-gray-100 text-gray-600",
    warranty: "bg-teal-100 text-teal-700",
  } as Record<string, string>
  const statusText = {
    under_construction: "Đang thi công", legal_check: "Kiểm tra pháp lý",
    completed: "Hoàn thành", inspecting: "Nghiệm thu", draft: "Nháp", warranty: "Bảo hành",
  } as Record<string, string>

  // Timeline data
  const activeStep = getActiveStep(project.project_status, project.progress_pct)
  const lifecycleStage = project.project_status === "under_construction" ? "construction"
    : project.project_status === "completed" ? "done"
    : project.project_status === "warranty" ? "warranty"
    : project.project_status === "legal_check" ? "contract_signed"
    : "construction"
  const timelineSteps = buildSteps(project, milestones, vos)

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/pipeline" className="text-gray-400 hover:text-orange-500 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Quản lý dự án
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">{project.project_code}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab("boq")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              <FileText className="w-3.5 h-3.5" /> Dự toán BOQ
            </button>
          </div>
        </div>

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
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex items-center gap-4 text-sm">
              <div><div className="text-xs text-gray-400">Giá trị HĐ</div><div className="font-bold text-gray-900">{fmtVND(project.contract_value)}</div></div>
              <div><div className="text-xs text-gray-400">Đã thu</div><div className="font-bold text-green-600">{fmtVND(project.total_paid)}</div></div>
              <div><div className="text-xs text-gray-400">Còn nợ</div><div className={`font-bold ${project.total_outstanding_debt > 0 ? "text-red-500" : "text-gray-400"}`}>{fmtVND(project.total_outstanding_debt)}</div></div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Tiến độ</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${project.progress_pct}%`, backgroundColor: "#EA580C" }} />
                  </div>
                  <span className="text-sm font-bold text-orange-500">{project.progress_pct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Tab: Vòng đời Timeline ── */}
        {tab === "timeline" && (
          <div className="p-6 max-w-[1100px] mx-auto">
            <NextActionBanner stage={lifecycleStage} surveyCount={3} />

            <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 300px", alignItems: "start" }}>
              {/* Timeline */}
              <div>
                {timelineSteps.map((step, i) => (
                  <TimelineStep
                    key={step.num}
                    step={step}
                    status={getStepStatus(i, activeStep)}
                    isLast={i === timelineSteps.length - 1}
                  />
                ))}
              </div>

              {/* Sidebar */}
              <div className="sticky top-4">
                <TimelineSidebar project={project} milestones={milestones} vos={vos} boqLines={boqLines} />
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* ── Tab: BOQ ── */}
          {tab === "boq" && (
            <div className="max-w-5xl mx-auto">
              <ProjectBOQTab projectId={project.id} />
            </div>
          )}

          {/* ── Tab: Tài liệu ── */}
          {tab === "files" && (
            <div className="max-w-4xl mx-auto">
              <ProjectFilesTab />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>}>
      <ProjectDetailInner />
    </Suspense>
  )
}
