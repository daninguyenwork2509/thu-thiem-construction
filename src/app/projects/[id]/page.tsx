"use client"
import { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  PIPELINE_ITEMS, PIPELINE_VOS, PROJECT_BOQ, STAGE_TO_STEP, fmtVND,
  type PipelineItem, type Stage,
} from "@/lib/project-data"
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

// ── Milestone type ─────────────────────────────────────────────────────────────
type MilestoneStatus = "paid" | "approved" | "pending_approval" | "draft" | "overdue"
interface Milestone {
  id: string
  milestone_order: number
  milestone_name: string
  payment_percent: number
  payment_amount: number
  status: MilestoneStatus
  due_date: string
}

const msColor: Record<string, string> = {
  paid: "bg-green-100 text-green-700", approved: "bg-blue-100 text-blue-700",
  pending_approval: "bg-yellow-100 text-yellow-700", draft: "bg-gray-100 text-gray-500",
  overdue: "bg-red-100 text-red-600",
}
const msLabel: Record<string, string> = {
  paid: "Đã thu", approved: "Đã duyệt", pending_approval: "Chờ duyệt", draft: "Nháp", overdue: "Quá hạn",
}

// ── Stage badge/label ─────────────────────────────────────────────────────────
const stageBadge: Record<Stage, string> = {
  lead:         "bg-gray-100 text-gray-600",
  design:       "bg-indigo-100 text-indigo-700",
  contract:     "bg-yellow-100 text-yellow-700",
  construction: "bg-blue-100 text-blue-700",
  payment:      "bg-purple-100 text-purple-700",
  handover:     "bg-green-100 text-green-700",
}
const stageText: Record<Stage, string> = {
  lead:         "Lead mới",
  design:       "Đang thiết kế",
  contract:     "Hợp đồng",
  construction: "Đang thi công",
  payment:      "Thu tiền",
  handover:     "Nghiệm thu",
}

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

function getStepStatus(stepIdx: number, activeStep: number): StepStatus {
  if (activeStep >= 8) return "done"
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
function NextActionBanner({ stage }: { stage: Stage }) {
  const map: Record<Stage, { current: string; next: string }> = {
    lead:         { current: "Tiếp nhận Lead",      next: "Sales cần giao KS xuống khảo sát hiện trường" },
    design:       { current: "Đang thiết kế",        next: "KS thiết kế + QS bóc tách BOQ, chờ KH duyệt bản vẽ" },
    contract:     { current: "Đã ký hợp đồng",       next: "PM lập Gantt baseline và phân bổ gói thầu phụ" },
    construction: { current: "Đang thi công",         next: "GS cập nhật % tiến độ hôm nay — kiểm tra VO chờ duyệt" },
    payment:      { current: "Thu tiền theo đợt",     next: "Kế toán xuất hóa đơn, theo dõi công nợ" },
    handover:     { current: "Nghiệm thu & Bàn giao", next: "Chốt khối lượng nghiệm thu + ảnh Before/After theo BOQ" },
  }
  const info = map[stage]
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
function TimelineSidebar({ project, milestones, vos }: {
  project: PipelineItem
  milestones: Milestone[]
  vos: typeof PIPELINE_VOS
}) {
  const boqLines  = PROJECT_BOQ.filter(b => b.projectId === project.id)
  const totalBOQ  = boqLines.reduce((s, b) => s + b.qty * b.selling_price, 0)
  const totalCost = boqLines.reduce((s, b) => s + b.qty * b.cost_price, 0)
  const margin    = totalBOQ > 0 ? ((totalBOQ - totalCost) / totalBOQ * 100) : (project.marginPct ?? 0)
  const voWaiting = vos.filter(v => v.status === "pending").length
  const debt      = project.totalDebt ?? 0
  const hasAlerts = voWaiting > 0 || debt > 0 || !(project.permitOk ?? true)

  const PEOPLE = [
    { role: "PM phụ trách", name: project.pm ?? project.responsible,   avatar: (project.pm ?? project.responsible)[0] },
    { role: "KS Thiết kế",  name: project.designer ?? "—",             avatar: (project.designer ?? "?")[0] },
    { role: "QS Dự toán",   name: project.qs ?? "—",                   avatar: (project.qs ?? "?")[0] },
  ]
  const SUBCONTRACTORS = [
    { name: "Phần thô",    contractor: "Xây dựng Tiến Phát", pct: 90, onTime: true },
    { name: "Điện – M&E",  contractor: "M&E Đông Dương",     pct: 60, onTime: true },
    { name: "Nội thất",    contractor: "Nội thất Minh Long",  pct: 15, onTime: false },
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
            { label: "Giá trị HĐ",  value: fmtVND(project.value),                color: "text-gray-900 font-bold" },
            { label: "Đã thu",       value: fmtVND(project.totalPaid ?? 0),        color: "text-green-600 font-semibold" },
            { label: "Còn nợ",       value: fmtVND(debt),                          color: debt > 0 ? "text-red-600 font-semibold" : "text-gray-400" },
            { label: "Chi phí ước",  value: fmtVND(totalCost || project.value * 0.77), color: "text-gray-600" },
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
            {debt > 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span>KH còn nợ <b>{fmtVND(debt)}</b></span>
              </div>
            )}
            {!(project.permitOk ?? true) && (
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

// ── Build milestones for a project ─────────────────────────────────────────────
function buildMilestones(project: PipelineItem): Milestone[] {
  const v = project.value
  const isPaid = (project.stage === "payment" || project.stage === "handover")
  return [
    { id: "m1", milestone_order: 1, milestone_name: "Sau ký HĐ",           payment_percent: 40, payment_amount: v * 0.4, status: "paid",             due_date: project.contractDate ?? "" },
    { id: "m2", milestone_order: 2, milestone_name: "Hoàn thành thô",       payment_percent: 20, payment_amount: v * 0.2, status: "paid",             due_date: "" },
    { id: "m3", milestone_order: 3, milestone_name: "Hoàn thiện nội thất",  payment_percent: 20, payment_amount: v * 0.2, status: isPaid ? "paid" : "pending_approval", due_date: "" },
    { id: "m4", milestone_order: 4, milestone_name: "Bàn giao",             payment_percent: 20, payment_amount: v * 0.2, status: project.stage === "handover" ? "pending_approval" : "draft", due_date: project.deadline ?? "" },
  ]
}

// ── Build 9 steps for a given project ─────────────────────────────────────────
function buildSteps(project: PipelineItem, milestones: Milestone[], vos: typeof PIPELINE_VOS): TimelineStepDef[] {
  const surveyCount = 3
  const paidMilestones = milestones.filter(m => m.status === "paid").length
  const permitOk = project.permitOk ?? false
  const progress = project.progress ?? 0
  const debt = project.totalDebt ?? 0

  return [
    {
      num: 1, title: "Tiếp nhận Lead",
      subtitle: "Ghi nhận thông tin khách hàng & nhu cầu",
      date: "05/01/2025",
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Khách hàng:</span> <span className="font-medium text-gray-800">{project.client}</span></div>
          <div><span className="text-gray-400">SĐT:</span> <span className="font-medium text-gray-800">{project.phone ?? "—"}</span></div>
          <div><span className="text-gray-400">Ngân sách KH:</span> <span className="font-medium text-orange-600">{fmtVND(project.value * 0.9)}</span></div>
          <div><span className="text-gray-400">Mức linh hoạt:</span> <span className="font-medium text-gray-800">Cố định</span></div>
          <div className="col-span-2"><span className="text-gray-400">Ghi chú:</span> <span className="font-medium text-gray-800">{project.note ?? "Phong cách Nhật tối giản. Không đục kết cấu."}</span></div>
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
          <div><span className="text-gray-400">KS thiết kế:</span> <span className="font-medium text-gray-800">{project.designer ?? "—"}</span></div>
          <div><span className="text-gray-400">QS dự toán:</span> <span className="font-medium text-gray-800">{project.qs ?? "—"}</span></div>
          <div><span className="text-gray-400">File bản vẽ:</span> <span className="font-medium text-blue-600 underline cursor-pointer">3 file đã upload</span></div>
        </div>
      ),
    },
    {
      num: 4, title: "Báo giá & Ký hợp đồng",
      subtitle: "Gửi báo giá cho KH, đàm phán và ký kết hợp đồng",
      date: project.contractDate ?? "01/02/2025",
      gates: [
        { label: "KH ký duyệt hợp đồng thi công", passed: true },
      ],
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Giá trị HĐ:</span> <span className="font-bold text-orange-600">{fmtVND(project.value)}</span></div>
          <div><span className="text-gray-400">Ngày ký:</span> <span className="font-medium text-gray-800">{project.contractDate ?? "—"}</span></div>
          <div><span className="text-gray-400">Margin HĐ:</span> <span className="font-medium text-green-600">{project.marginPct ?? 22}%</span></div>
          <div><span className="text-gray-400">Thời gian TC:</span> <span className="font-medium text-gray-800">6 tháng</span></div>
        </div>
      ),
    },
    {
      num: 5, title: "Thi công",
      subtitle: "Triển khai gói thầu, giám sát tiến độ hàng ngày",
      date: project.startDate ?? "05/02/2025",
      gates: [
        { label: "Giấy phép thi công đã được cấp", passed: permitOk, failMsg: "Chưa có giấy phép thi công — không được khởi công" },
        { label: "Đã duyệt mẫu vật liệu chính", passed: true },
        { label: `VO chờ duyệt: ${vos.filter(v => v.status === "pending").length} VO`, passed: vos.filter(v => v.status === "pending").length === 0, failMsg: `Còn ${vos.filter(v => v.status === "pending").length} VO chờ KH phê duyệt` },
      ],
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Tiến độ tổng thể</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#EA580C,#F97316)" }} />
                </div>
                <span className="text-sm font-bold text-orange-600 w-10 text-right">{progress}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Phần thô",   pct: 90, color: "bg-green-400" },
              { label: "Điện – M&E", pct: 60, color: "bg-blue-400" },
              { label: "Nội thất",   pct: 15, color: "bg-orange-400" },
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
        </div>
      ),
    },
    {
      num: 6, title: "Thu tiền theo đợt",
      subtitle: "Xuất hóa đơn và theo dõi thu tiền từng mốc",
      gates: [
        { label: `Đã thu ${paidMilestones}/${milestones.length} đợt`, passed: paidMilestones === milestones.length, failMsg: `Còn ${milestones.length - paidMilestones} đợt chưa thu — không thể bàn giao` },
      ],
      body: (
        <div className="space-y-1.5">
          {milestones.map(m => (
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
        { label: "Công nợ KH = 0 ₫", passed: debt === 0, failMsg: `KH còn nợ ${fmtVND(debt)} — không thể bàn giao` },
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
  const [tab, setTab] = useState(searchParams.get("tab") ?? "timeline")

  const project = PIPELINE_ITEMS.find(p => p.id === id)

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">Không tìm thấy dự án #{id}</p>
        <Link href="/pipeline" className="text-orange-500 underline">Về danh sách</Link>
      </div>
    )
  }

  const vos        = PIPELINE_VOS.filter(v => v.projectId === project.id)
  const milestones = buildMilestones(project)

  const activeStep    = STAGE_TO_STEP[project.stage]
  const timelineSteps = buildSteps(project, milestones, vos)
  const progress      = project.progress ?? 0
  const debt          = project.totalDebt ?? 0

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
            <span className="text-gray-700 font-medium">{project.id.toUpperCase()}</span>
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
              <span className="text-xs text-gray-400 font-mono">{project.id.toUpperCase()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${stageBadge[project.stage] ?? "bg-gray-100 text-gray-600"}`}>
                {stageText[project.stage] ?? project.stage}
              </span>
              {project.permitOk
                ? <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-md"><CheckCircle className="w-3 h-3" /> GP thi công</span>
                : <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md"><AlertTriangle className="w-3 h-3" /> Thiếu GP</span>
              }
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              KH: <span className="text-gray-700 font-medium">{project.client}</span>
              &nbsp;·&nbsp;{project.phone ?? ""}
              &nbsp;·&nbsp;PM: <span className="text-gray-700 font-medium">{project.pm ?? project.responsible}</span>
            </p>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex items-center gap-4 text-sm">
              <div><div className="text-xs text-gray-400">Giá trị HĐ</div><div className="font-bold text-gray-900">{fmtVND(project.value)}</div></div>
              <div><div className="text-xs text-gray-400">Đã thu</div><div className="font-bold text-green-600">{fmtVND(project.totalPaid ?? 0)}</div></div>
              <div><div className="text-xs text-gray-400">Còn nợ</div><div className={`font-bold ${debt > 0 ? "text-red-500" : "text-gray-400"}`}>{fmtVND(debt)}</div></div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Tiến độ</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: "#EA580C" }} />
                  </div>
                  <span className="text-sm font-bold text-orange-500">{progress}%</span>
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

        {/* ── Tab: Timeline ── */}
        {tab === "timeline" && (
          <div className="p-6 max-w-[1100px] mx-auto">
            <NextActionBanner stage={project.stage} />

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
                <TimelineSidebar project={project} milestones={milestones} vos={vos} />
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
