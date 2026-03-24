"use client"
import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  PIPELINE_ITEMS, PIPELINE_VOS, PROJECT_BOQ, STAGE_TO_STEP, fmtVND,
  BOQ_SUBGROUPS, PAYMENT_MILESTONES,
  type PipelineItem, type Stage, type LifecycleStage,
  type BOQSubGroup, type PaymentMilestone,
} from "@/lib/project-data"

// ── Lifecycle stage maps ───────────────────────────────────────────────────────

// Main linear path — design_approved branches off into design_only or quotation
const LIFECYCLE_ORDER: LifecycleStage[] = [
  "lead_new", "surveying", "design_quoted", "awaiting_design_fee", "designing",
  "design_approved", "quotation", "contract_signed", "construction", "done",
]

const LIFECYCLE_TO_STAGE: Record<LifecycleStage, Stage> = {
  lead_new: "lead", surveying: "lead",
  design_quoted: "lead", awaiting_design_fee: "lead",
  designing: "design", design_approved: "design",
  design_only_closing: "design", design_only_done: "handover",
  quotation: "contract",
  contract_signed: "construction", construction: "construction",
  handover: "payment", done: "handover",
}

const LIFECYCLE_STEP: Record<LifecycleStage, number> = {
  lead_new: 0, surveying: 1,
  design_quoted: 2, awaiting_design_fee: 2, designing: 2, design_approved: 2,
  design_only_closing: 3, design_only_done: 6,
  quotation: 3, contract_signed: 3,
  construction: 4, handover: 4, done: 5,
}

const LIFECYCLE_TOAST: Record<LifecycleStage, string> = {
  lead_new: "Đã tiếp nhận lead",
  surveying: "Đã giao KS khảo sát",
  design_quoted: "Đã gửi báo giá phí thiết kế cho KH",
  awaiting_design_fee: "Đã xác nhận thu tạm ứng · KS bắt đầu vẽ",
  designing: "KH đã duyệt bản vẽ thi công",
  design_approved: "KH đã duyệt bản vẽ · PM chọn hướng tiếp theo",
  design_only_closing: "Design Only · Thu nốt 50% phí thiết kế còn lại",
  design_only_done: "Design Only · Đã đóng hồ sơ",
  quotation: "Đã gửi báo giá thi công cho KH",
  contract_signed: "HĐ đã ký · Chuẩn bị thi công",
  construction: "Bắt đầu thi công & tích hợp Nghiệm thu",
  handover: "Đã chuyển sang bước Nghiệm thu & QC",
  done: "🎉 Dự án chuyển sang giai đoạn Bàn giao!",
}

const LIFECYCLE_NEXT_LABEL: Record<LifecycleStage, string> = {
  lead_new: "Giao KS khảo sát",
  surveying: "Báo giá phí thiết kế",
  design_quoted: "Gửi Kế toán thu tiền",
  awaiting_design_fee: "Bắt đầu thiết kế",
  designing: "KH đã duyệt bản vẽ",
  design_approved: "Chốt thi công",         // special: topbar shows 2 buttons
  design_only_closing: "Đã thu đủ phí TK",
  design_only_done: "Đã đóng hồ sơ",
  quotation: "Ký hợp đồng",
  contract_signed: "Bắt đầu thi công",
  construction: "Chuyển Bàn giao",
  handover: "Hoàn thành dự án",
  done: "Đã hoàn thành",
}

function stageToLifecycle(s: Stage): LifecycleStage {
  const m: Record<Stage, LifecycleStage> = {
    lead: "lead_new", design: "designing", contract: "quotation",
    construction: "construction", payment: "handover", handover: "done",
  }
  return m[s]
}
import {
  ArrowLeft, CheckCircle, AlertTriangle,
  GitBranch, FolderOpen,
  Plus, Camera, ChevronDown, ChevronRight,
  Zap as BoltIcon, HardHat, Users, DollarSign, AlertCircle,
  Check, X, Circle, FileText, Loader2, Settings
} from "lucide-react"
import Link from "next/link"
import ProjectBOQTab from "./components/ProjectBOQTab"
import ProjectFilesTab from "./components/ProjectFilesTab"
import ProjectQuotationStep from "./components/ProjectQuotationStep"
import ProjectConstructionStep from "./components/ProjectConstructionStep"
import ProjectCashflowTab from "./components/ProjectCashflowTab"
import ProjectAcceptanceStep from "./components/ProjectAcceptanceStep"

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
  { key: "cashflow", label: "Dòng tiền",    icon: DollarSign },
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
  if (activeStep >= 7) return "done"
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
            {step.gates && step.gates.length > 0 && status !== "done" && (
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
function NextActionBanner({ lifecycle }: { lifecycle: LifecycleStage }) {
  const map: Partial<Record<LifecycleStage, { current: string; next: string }>> = {
    lead_new:            { current: "Tiếp nhận Lead",                 next: "Sales giao KS xuống khảo sát hiện trường" },
    surveying:           { current: "Đang khảo sát hiện trạng",        next: "KS hoàn thành khảo sát → lập báo giá phí thiết kế" },
    design_quoted:       { current: "Đã báo giá phí thiết kế",         next: "Chờ KH tạm ứng 50% phí thiết kế trước khi bắt đầu vẽ" },
    awaiting_design_fee: { current: "Chờ tạm ứng phí thiết kế",        next: "Kế toán xác nhận đã thu → KS bắt đầu thiết kế" },
    designing:           { current: "Đang thiết kế",                   next: "KS thiết kế + QS bóc tách BOQ, chờ KH duyệt bản vẽ" },
    design_approved:     { current: "KH đã duyệt bản vẽ",             next: "PM chọn hướng — KH chỉ lấy bản vẽ hay chốt thi công?" },
    design_only_closing: { current: "Design Only — Thu nốt phí TK",   next: "Kế toán thu 50% còn lại → Đóng hồ sơ" },
    quotation:           { current: "Đã gửi báo giá thi công",         next: "Chờ KH ký hợp đồng thi công" },
    contract_signed:     { current: "Đã ký hợp đồng",                  next: "PM lập Gantt baseline và phân bổ gói thầu phụ" },
    construction:        { current: "Đang thi công & Nghiệm thu",       next: "GS và QA chốt % hoàn thành trực tiếp trong BOQ" },
    done:                { current: "Đang Bàn giao & Hoàn công",        next: "Thu nốt công nợ, bàn giao chìa khóa & hồ sơ hoàn công" },
  }
  const info = map[lifecycle]
  if (!info) return null
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS: milestone condition checking
// ─────────────────────────────────────────────────────────────────────────────
function avgSubGroupProgress(groupName: string, subGroups: BOQSubGroup[]): number {
  // Map BOQ group names to subgroup name patterns
  const nameMap: Record<string, string[]> = {
    "Phần thô":  ["Phá dỡ", "Gạch ốp"],
    "Điện – M&E": ["Điện", "Cấp thoát"],
    "Nội thất":  ["Nội thất"],
  }
  const patterns = nameMap[groupName] ?? [groupName]
  const matched = subGroups.filter(g => patterns.some(p => g.name.includes(p)))
  if (matched.length === 0) return 0
  return matched.reduce((s, g) => s + g.actualProgress, 0) / matched.length
}

function checkMilestone(
  m: PaymentMilestone,
  subGroups: BOQSubGroup[],
  localLifecycle: LifecycleStage,
): boolean {
  if (!m.conditions) return true
  const c = m.conditions
  if (c.stageRequired) {
    const stageMap: Record<string, LifecycleStage[]> = {
      construction: ["construction", "done"],
      handover:     ["done"],
    }
    if (!(stageMap[c.stageRequired] ?? []).includes(localLifecycle)) return false
  }
  if (c.boqGroupProgress) {
    return c.boqGroupProgress.every(cond => {
      const avg = avgSubGroupProgress(cond.groupName, subGroups)
      return avg >= cond.minPercent
    })
  }
  return true
}

function getMilestoneConditionDetail(
  m: PaymentMilestone,
  subGroups: BOQSubGroup[],
  localLifecycle: LifecycleStage,
): { met: boolean; detail: string } {
  if (!m.conditions) return { met: true, detail: "" }
  const c = m.conditions

  if (c.stageRequired) {
    const stageMap: Record<string, LifecycleStage[]> = {
      construction: ["construction", "done"],
      handover:     ["done"],
    }
    const ok = (stageMap[c.stageRequired] ?? []).includes(localLifecycle)
    if (!ok) return { met: false, detail: `Cần giai đoạn: ${c.stageRequired === "handover" ? "Bàn giao" : "Thi công"}` }
  }

  if (c.boqGroupProgress) {
    for (const cond of c.boqGroupProgress) {
      const avg = Math.round(avgSubGroupProgress(cond.groupName, subGroups))
      if (avg < cond.minPercent) {
        return { met: false, detail: `Cần: ${cond.groupName} ${cond.minPercent}% (hiện ${avg}%)` }
      }
    }
  }
  return { met: true, detail: "" }
}

// ── Timeline sidebar ───────────────────────────────────────────────────────────
function TimelineSidebar({ project, milestones, vos, subGroups, localLifecycle, today }: {
  project: PipelineItem
  milestones: Milestone[]
  vos: typeof PIPELINE_VOS
  subGroups: BOQSubGroup[]
  localLifecycle: LifecycleStage
  today: Date
}) {
  const boqLines  = PROJECT_BOQ.filter(b => b.projectId === project.id)
  const totalBOQ  = boqLines.reduce((s, b) => s + b.qty * b.selling_price, 0)
  const totalCost = boqLines.reduce((s, b) => s + b.qty * b.cost_price, 0)
  const margin    = totalBOQ > 0 ? ((totalBOQ - totalCost) / totalBOQ * 100) : (project.marginPct ?? 0)
  const voWaiting = vos.filter(v => v.status === "pending").length
  const debt      = project.totalDebt ?? 0
  const hasAlerts = voWaiting > 0 || debt > 0 || (project.permitRequired !== false && !(project.permitOk ?? true))
  const isConstruction = localLifecycle === "construction"

  const PEOPLE = [
    { role: "PM phụ trách", name: project.pm ?? project.responsible,   avatar: (project.pm ?? project.responsible)[0] },
    { role: "KS Thiết kế",  name: project.designer ?? "—",             avatar: (project.designer ?? "?")[0] },
    { role: "QS Dự toán",   name: project.qs ?? "—",                   avatar: (project.qs ?? "?")[0] },
  ]

  // Construction progress calculations
  const contractSignedDate = project.contractSignedDate
  const startDate = contractSignedDate ? new Date(contractSignedDate) : null
  const currentWeek = startDate
    ? Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1
  const overallProgress = subGroups.length > 0
    ? Math.round(subGroups.reduce((s, g) => s + g.actualProgress, 0) / subGroups.length)
    : (project.progress ?? 0)
  const plannedCompletion = project.plannedCompletionDate ? new Date(project.plannedCompletionDate) : null
  const daysLeft = plannedCompletion
    ? Math.ceil((plannedCompletion.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    : null

  // Milestone conditions
  const extMilestones = (PAYMENT_MILESTONES.filter(m => m.projectId === project.id).length > 0
    ? PAYMENT_MILESTONES.filter(m => m.projectId === project.id)
    : milestones.map(m => {
        let conditions: PaymentMilestone["conditions"] = undefined;
        if (m.milestone_order === 1) conditions = { stageRequired: "construction" };
        if (m.milestone_order === 2) conditions = { boqGroupProgress: [{ groupName: "Phần thô", minPercent: 100 }] };
        if (m.milestone_order === 3) conditions = { boqGroupProgress: [{ groupName: "Nội thất", minPercent: 100 }] };
        if (m.milestone_order === 4) conditions = { stageRequired: "handover" }; // 'handover' condition now maps to 'done' stage

        return { 
          ...m, 
          order: m.milestone_order, 
          percent: m.payment_percent, 
          amount: m.payment_amount,
          conditions
        } as unknown as PaymentMilestone
      })
  )

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

      {/* PART 4: Construction Progress Dashboard — only when construction stage */}
      {isConstruction && subGroups.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-orange-100 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)' }}>
            <HardHat className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">📊 Tiến độ thi công</span>
          </div>
          <div className="px-4 py-3 space-y-3">
            {/* Overall progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">Tổng thể</span>
                <span className="font-bold text-orange-600 text-sm">{overallProgress}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${overallProgress}%`, background: 'linear-gradient(90deg,#EA580C,#F97316)' }} />
              </div>
            </div>

            {/* Per-group mini bars */}
            <div className="space-y-2 pt-1">
              {subGroups.map(g => {
                const expectedPct = startDate
                  ? Math.min(100, currentWeek > g.plannedStartWeek
                    ? Math.round((currentWeek - g.plannedStartWeek) / g.plannedDurationWeeks * 100)
                    : 0)
                  : 0
                const isBehind = g.actualProgress < expectedPct
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium text-gray-700 truncate">{g.name}</span>
                        {isBehind && <span className="text-orange-500 text-[10px] shrink-0">⚠️</span>}
                      </div>
                      <span className={`font-bold shrink-0 ml-1 ${isBehind ? 'text-red-600' : 'text-green-600'}`}>
                        {g.actualProgress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${g.actualProgress}%`,
                          backgroundColor: isBehind ? '#DC2626' : '#16a34a',
                        }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Date info */}
            <div className="border-t border-gray-100 pt-2 space-y-1 text-[11px]">
              {project.contractSignedDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">📅 Ngày ký HĐ</span>
                  <span className="font-medium text-gray-700">
                    {new Date(project.contractSignedDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              {project.plannedCompletionDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">📅 KH hoàn thành</span>
                  <span className="font-medium text-gray-700">
                    {new Date(project.plannedCompletionDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              {daysLeft !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-400">⏳ Còn lại</span>
                  <span className={`font-bold ${daysLeft < 14 ? 'text-red-600' : daysLeft < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                    {daysLeft > 0 ? `${daysLeft} ngày` : `Quá hạn ${Math.abs(daysLeft)} ngày`}
                  </span>
                </div>
              )}
            </div>

            {/* Delay warnings */}
            {subGroups.some(g => {
              const expPct = startDate && currentWeek > g.plannedStartWeek
                ? Math.min(100, (currentWeek - g.plannedStartWeek) / g.plannedDurationWeeks * 100)
                : 0
              return g.actualProgress < expPct
            }) && (
              <div className="space-y-1">
                {subGroups.map(g => {
                  const expPct = startDate && currentWeek > g.plannedStartWeek
                    ? Math.min(100, Math.round((currentWeek - g.plannedStartWeek) / g.plannedDurationWeeks * 100))
                    : 0
                  if (g.actualProgress >= expPct) return null
                  return (
                    <div key={g.id} className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-md px-2 py-1.5 text-[10px] text-red-700">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span><b>{g.name}</b> kỳ vọng {expPct}%, thực tế {g.actualProgress}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tài chính</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          {[
            { label: "Giá trị HĐ",  value: fmtVND(project.contractValue ?? project.value),                color: "text-gray-900 font-bold" },
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

      {/* Design fee section */}
      {(project.designFee ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Phí thiết kế</span>
          </div>
          <div className="px-4 py-3 space-y-2">
            {[
              { label: "Phí thiết kế",  value: fmtVND(project.designFee ?? 0),                                         color: "text-gray-900 font-bold" },
              { label: "Đã thu (50%)",   value: fmtVND(project.designDepositAmount ?? 0),                                color: "text-green-600 font-semibold" },
              { label: "Còn lại",        value: fmtVND((project.designFee ?? 0) - (project.designDepositAmount ?? 0)),   color: "text-orange-600 font-semibold" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">Trạng thái</span>
              {project.contractType === "construction" && (
                <span className="text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-md">Trừ vào HĐ ✓</span>
              )}
              {project.contractType === "design_only" && (
                <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">Design Only</span>
              )}
              {!project.contractType && (
                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">Chờ KH quyết định</span>
              )}
            </div>
          </div>
        </div>
      )}

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
            {project.permitRequired !== false && !(project.permitOk ?? true) && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>Chưa có giấy phép thi công</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PART 3: Payment milestones with condition badges */}
      {extMilestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mốc thanh toán</span>
          </div>
          <div className="px-4 py-2 divide-y divide-gray-50">
            {extMilestones.map(m => {
              const { met, detail } = getMilestoneConditionDetail(m, subGroups, localLifecycle)
              return (
                <div key={m.id} className="py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-gray-700 min-w-0">
                      Đợt {m.order} · {m.name}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 shrink-0">{fmtVND(m.amount)}</span>
                  </div>
                  <div>
                    {m.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-700 text-white">
                        Đã thu ✓
                      </span>
                    ) : met ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✓ Đủ điều kiện thu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        {detail || 'Chưa đủ điều kiện'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Build milestones for a project ─────────────────────────────────────────────
function buildMilestones(project: PipelineItem): Milestone[] {
  const v = project.contractValue ?? project.value ?? 0
  return [
    { id: "m1", milestone_order: 1, milestone_name: "Ký HĐ + Khởi công",       payment_percent: 30, payment_amount: v * 0.3, status: "draft", due_date: project.contractDate ?? "" },
    { id: "m2", milestone_order: 2, milestone_name: "Hoàn thành phần thô",     payment_percent: 30, payment_amount: v * 0.3, status: "draft", due_date: "" },
    { id: "m3", milestone_order: 3, milestone_name: "Hoàn thiện + Nội thất",   payment_percent: 30, payment_amount: v * 0.3, status: "draft", due_date: "" },
    { id: "m4", milestone_order: 4, milestone_name: "Nghiệm thu & Bàn giao",   payment_percent: 10, payment_amount: v * 0.1, status: "draft", due_date: project.deadline ?? "" },
  ]
}

// ── Build 9 steps for a given project ─────────────────────────────────────────
function buildSteps(
  project: PipelineItem,
  milestones: Milestone[],
  vos: typeof PIPELINE_VOS,
  surveyPhotos: string[],
  onAddSurveyPhoto: (base64: string) => void,
  subGroups: BOQSubGroup[],
  localLifecycle: LifecycleStage,
  today: Date,
  onOpenContractModal: () => void,
  onOpenAccountantModal: () => void,
  onOpenDesignModal: () => void,
  onOpenPermitModal: () => void,
  onOpenDesignFeeModal: () => void,
  onOpenDesignFinalModal: () => void,
  updateProjectField: (f: Partial<PipelineItem>) => void,
  showToast: (msg: string, type?: "success" | "error" | "warn") => void,
): TimelineStepDef[] {
  const surveyCount = surveyPhotos.length
  const paidMilestones = milestones.filter(m => m.status === "paid").length
  const permitOk = project.permitRequired === false || (project.permitOk ?? false)
  const progress = project.progress ?? 0
  const contractValue = project.contractValue ?? project.value
  const totalPaid = project.totalPaid ?? 0
  const debt = Math.max(0, contractValue - totalPaid)

  return [
    {
      num: 1, title: "Tiếp nhận Lead",
      subtitle: "Ghi nhận thông tin khách hàng & nhu cầu",
      date: "05/01/2025",
      body: (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-gray-400">Khách hàng:</span> <span className="font-medium text-gray-800">{project.client}</span></div>
          <div><span className="text-gray-400">SĐT:</span> <span className="font-medium text-gray-800">{project.phone ?? "—"}</span></div>
          <div><span className="text-gray-400">Ngân sách KH:</span> <span className="font-medium text-orange-600">{fmtVND(project.value)}</span></div>
          <div><span className="text-gray-400">Mức linh hoạt:</span> <span className="font-medium text-gray-800">{
            project.budgetFlexibility === "flexible" ? "Linh hoạt ±20%" :
            project.budgetFlexibility === "open" ? "Ngân sách mở" : "Cố định"
          }</span></div>
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
      body: (() => {
        const inputId = `survey-file-input-${project.id}`
        return (
          <div className="space-y-3">
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach(file => {
                  const reader = new FileReader()
                  reader.onload = ev => {
                    if (ev.target?.result) onAddSurveyPhoto(ev.target.result as string)
                  }
                  reader.readAsDataURL(file)
                })
                e.target.value = ""
              }}
            />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div><span className="text-gray-400">KS khảo sát:</span> <span className="font-medium text-gray-800">Nguyễn Văn Dũng</span></div>
              <div><span className="text-gray-400">Ảnh upload:</span> <span className={`font-medium ${surveyCount >= 5 ? "text-green-600" : "text-gray-800"}`}>{surveyCount}/5</span></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {surveyPhotos.map((src, i) => (
                <div key={i} className="w-16 h-12 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Ảnh KS ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {surveyCount === 0 && [1, 2, 3].map(i => (
                <div key={i} className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                  <Camera className="w-4 h-4" />
                </div>
              ))}
              {surveyCount < 5 && (
                <button
                  type="button"
                  onClick={() => document.getElementById(inputId)?.click()}
                  className="w-16 h-12 rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              {surveyCount >= 5 && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium self-center">
                  <span>✓ Đủ ảnh</span>
                </div>
              )}
            </div>
          </div>
        )
      })(),
    },
    {
      num: 3, title: "Thu phí bản vẽ & Thiết kế",
      subtitle: "Báo giá phí TK → tạm ứng 50% → KS vẽ → KH duyệt bản vẽ",
      date: "20/01/2025",
      gates: [
        { label: "KH đã nhận báo giá phí thiết kế", passed: (project.designFee ?? 0) > 0 },
        { label: "Kế toán xác nhận thu tạm ứng 50%", passed: project.designDepositPaid ?? false, failMsg: "Chưa thu tạm ứng 50% phí thiết kế — KS chưa được phép bắt đầu vẽ" },
        { label: "KH đã duyệt bản vẽ thi công", passed: project.drawingApproved ?? false, failMsg: "KH chưa duyệt bản vẽ — không thể chuyển bước báo giá thi công" },
        { label: "Kế toán xác nhận thu 50% còn lại", passed: project.designFinalPaid ?? false, failMsg: "Chưa thu 50% phí thiết kế còn lại — cần xác nhận trước khi chuyển bước" },
      ],
      body: (
        <div className="space-y-3">
          {/* Giai đoạn A: Báo giá phí thiết kế */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Giai đoạn A · Báo giá phí TK</span>
              {(project.designFee ?? 0) > 0
                ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Đã gửi</span>
                : <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">Chờ gửi</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-gray-400">Phí thiết kế:</span> <span className="font-bold text-gray-900">{fmtVND(project.designFee ?? 0)}</span></div>
              <div><span className="text-gray-400">KS thiết kế:</span> <span className="font-medium text-gray-800">{project.designer ?? "—"}</span></div>
            </div>
            {!((project.designFee ?? 0) > 0) && localLifecycle === "design_quoted" && (
              <button onClick={onOpenDesignFeeModal} className="mt-3 w-[180px] flex justify-center items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 transition rounded-lg shadow-sm">
                📝 Cập nhật Phí Thiết kế
              </button>
            )}
          </div>
          {/* Giai đoạn B: Tạm ứng 50% */}
            <div className={`rounded-lg border px-3 py-2.5 ${project.designDepositPaid ? "border-green-100 bg-green-50" : "border-orange-100 bg-orange-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Giai đoạn B · Tạm ứng 50%</span>
                {project.designDepositPaid
                  ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Đã thu</span>
                  : <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Chờ thu</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div><span className="text-gray-400">Tạm ứng (50%):</span> <span className={`font-bold ${project.designDepositPaid ? "text-green-600" : "text-orange-600"}`}>{fmtVND(project.designDepositAmount ?? 0)}</span></div>
                <div><span className="text-gray-400">Còn lại:</span> <span className="font-medium text-gray-700">{fmtVND((project.designFee ?? 0) - (project.designDepositAmount ?? 0))}</span></div>
              </div>
              {!project.designDepositPaid && localLifecycle === "awaiting_design_fee" && (
                <button onClick={onOpenAccountantModal} className="mt-3 w-full sm:w-auto flex justify-center items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 transition rounded-lg">
                  💳 Kế toán: Xác nhận thu tiền
                </button>
              )}
            </div>
          {/* Giai đoạn C: Thiết kế & duyệt */}
            <div className={`rounded-lg border px-3 py-2.5 ${project.drawingApproved ? "border-green-100 bg-green-50" : project.drawingCompleted ? "border-blue-100 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Giai đoạn C · KS thiết kế & KH duyệt</span>
                {project.drawingApproved
                  ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ KH đã duyệt</span>
                  : project.drawingCompleted
                    ? <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Chờ KH duyệt</span>
                    : <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">Chưa bắt đầu</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div><span className="text-gray-400">QS dự toán:</span> <span className="font-medium text-gray-800">{project.qs ?? "—"}</span></div>
                <div><span className="text-gray-400">File bản vẽ:</span> <span className={`font-medium ${project.drawingCompleted ? "text-blue-600 underline cursor-pointer" : "text-gray-400"}`}>{project.drawingCompleted ? "3 file đã upload" : "Chưa có"}</span></div>
              </div>
              {!project.drawingApproved && ["designing", "design_approved"].includes(localLifecycle) && (
                <button onClick={onOpenDesignModal} className="mt-3 w-full sm:w-auto flex justify-center items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition rounded-lg">
                  ✅ Xác nhận KH chốt bản vẽ
                </button>
              )}
            </div>
          {/* Giai đoạn C2: Thu 50% còn lại */}
          {project.drawingApproved && (
            <div className={`rounded-lg border px-3 py-2.5 ${project.designFinalPaid ? "border-green-100 bg-green-50" : "border-orange-100 bg-orange-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thanh toán lần 2 · Thu 50% còn lại</span>
                {project.designFinalPaid
                  ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Đã thu</span>
                  : <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Chờ thu</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div><span className="text-gray-400">Cần thu (50%):</span> <span className={`font-bold ${project.designFinalPaid ? "text-green-600" : "text-orange-600"}`}>{fmtVND((project.designFee ?? 0) - (project.designDepositAmount ?? 0))}</span></div>
                <div><span className="text-gray-400">Còn lại:</span> <span className="font-medium text-gray-700">{project.designFinalPaid ? fmtVND(0) : fmtVND((project.designFee ?? 0) - (project.designDepositAmount ?? 0))}</span></div>
              </div>
              {!project.designFinalPaid && (
                <button onClick={onOpenDesignFinalModal} className="mt-3 w-full sm:w-auto flex justify-center items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-orange-600 border border-orange-300 hover:bg-orange-50 transition rounded-lg">
                  💰 Xác nhận đã thu 50% còn lại
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      num: 4, title: "Báo giá & Ký hợp đồng",
      subtitle: project.contractType === "design_only"
        ? "KH chỉ lấy bản vẽ — thu nốt phí thiết kế & đóng hồ sơ"
        : "QS tóm tắt báo giá → Gửi KH → Chốt HĐ",
      date: project.contractDate ?? "",
      gates: project.contractType === "design_only"
        ? [{ label: "Đã thu đủ 100% phí thiết kế", passed: project.contractSigned ?? false }]
        : [],

      body: project.contractType === "design_only" ? (
        /* Nhánh A: Design Only */
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Nhánh A · Design Only</span>
            <span className="text-xs text-gray-400">KH chỉ lấy bản vẽ, không thi công</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div><span className="text-gray-400">Phí thiết kế:</span> <span className="font-bold text-gray-900">{fmtVND(project.designFee ?? 0)}</span></div>
            <div><span className="text-gray-400">Đã thu tạm ứng:</span> <span className="font-medium text-green-600">{fmtVND(project.designDepositAmount ?? 0)}</span></div>
            <div><span className="text-gray-400">Còn thu:</span> <span className="font-bold text-orange-600">{fmtVND((project.designFee ?? 0) - (project.designDepositAmount ?? 0))}</span></div>
            <div><span className="text-gray-400">Trạng thái:</span> <span className={`font-medium ${project.contractSigned ? "text-green-600" : "text-orange-600"}`}>{project.contractSigned ? "✓ Đã thu đủ" : "Chờ thu nốt"}</span></div>
          </div>
          {!project.contractSigned && localLifecycle === "design_only_closing" && (
            <button onClick={onOpenContractModal} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition rounded-lg">
              📄 Xác nhận Đã thanh lý HĐ & Thu nốt
            </button>
          )}
        </div>
      ) : (
        <ProjectQuotationStep
          project={project}
          localLifecycle={localLifecycle}
          updateProjectField={updateProjectField}
          showToast={showToast}
        />
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
        <div className="space-y-4">
          <ProjectConstructionStep project={project} showToast={showToast} />
          {!permitOk && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-start gap-2 text-xs text-orange-800">
                <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                <span>Bạn cần xác nhận đã có Giấy phép thi công trước khi tiếp tục.</span>
              </div>
              <button onClick={onOpenPermitModal}
                className="px-3 py-1.5 text-[10px] font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm">
                Cập nhật Giấy phép ngay
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      num: 6, title: "Bàn giao & Hoàn công",
      subtitle: "Bàn giao mặt bằng, bàn giao hồ sơ, thu đợt cuối",
      gates: [
        { label: "Công nợ KH = 0 ₫", passed: debt === 0, failMsg: `KH còn nợ ${fmtVND(debt)} — không thể bàn giao` },
        { label: "Biên bản nghiệm thu đã ký đủ 5 đợt", passed: true },
      ],
      body: (() => {
        const handoverItems = [
          { id: "h1", label: "Bàn giao chìa khóa & thẻ từ", done: true },
          { id: "h2", label: "Bàn giao bản vẽ hoàn công (PDF + bản cứng)", done: true },
          { id: "h3", label: "Bản vẽ as-built điện + nước", done: true },
          { id: "h4", label: "Hướng dẫn sử dụng thiết bị (TV, điều hòa, máy nước nóng)", done: false },
          { id: "h5", label: "Biên bản bàn giao có chữ ký KH", done: false },
          { id: "h6", label: "Hoàn công hành chính (nộp hồ sơ sửa nhà)", done: false },
        ]
        const done = handoverItems.filter(i => i.done).length
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Tiến độ bàn giao: <span className="font-semibold text-gray-800">{done}/{handoverItems.length} mục</span></span>
              <span className={`font-semibold ${done === handoverItems.length ? "text-green-600" : "text-orange-500"}`}>
                {done === handoverItems.length ? "✅ Hoàn thành" : "🔄 Đang thực hiện"}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(done / handoverItems.length) * 100}%` }} />
            </div>
            <div className="space-y-1 mt-2">
              {handoverItems.map(item => (
                <div key={item.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${item.done ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"}`}>
                  <span className={`text-sm ${item.done ? "text-green-500" : "text-gray-300"}`}>{item.done ? "✓" : "○"}</span>
                  <span className={`flex-1 ${item.done ? "text-gray-700" : "text-gray-500"}`}>{item.label}</span>
                  {!item.done && (
                    <button className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 px-2 py-0.5 border border-blue-200 rounded hover:bg-blue-50 transition">
                      Hoàn thành
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })(),
    },
    {
      num: 7, title: "Bảo hành",
      subtitle: "Theo dõi và xử lý các yêu cầu bảo hành sau bàn giao",
      body: (() => {
        const warrantyTickets = [
          { id: "wt1", title: "Bong tróc sơn góc phòng ngủ", severity: "low", status: "resolved", date: "15/06/2025" },
          { id: "wt2", title: "Rò rỉ nhẹ dưới bồn rửa bếp", severity: "medium", status: "in_progress", date: "20/07/2025" },
        ]
        const warrantyEnd = new Date("2026-05-31")
        const now = new Date("2026-03-24")
        const daysLeft = Math.max(0, Math.ceil((warrantyEnd.getTime() - now.getTime()) / 86400000))
        const pct = Math.round((daysLeft / 365) * 100)
        const sevColor: Record<string, string> = { low: "bg-blue-100 text-blue-700", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-700" }
        const stColor: Record<string, string> = { open: "bg-red-100 text-red-700", in_progress: "bg-yellow-100 text-yellow-700", resolved: "bg-green-100 text-green-700" }
        const stLabel: Record<string, string> = { open: "Mới", in_progress: "Đang xử lý", resolved: "Đã xử lý" }
        return (
          <div className="space-y-3">
            {/* Warranty countdown */}
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">Thời hạn bảo hành còn lại</span>
                <span className="font-bold text-orange-600">{daysLeft} ngày</span>
              </div>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Bắt đầu: 01/06/2025</span>
                <span>Kết thúc: 31/05/2026</span>
              </div>
            </div>

            {/* Ticket list */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Yêu cầu bảo hành ({warrantyTickets.length})</span>
                <button className="text-xs text-blue-600 font-semibold hover:text-blue-700 px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                  + Tạo yêu cầu
                </button>
              </div>
              {warrantyTickets.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-gray-400 text-[10px]">{t.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sevColor[t.severity]}`}>
                      {t.severity === "low" ? "Nhẹ" : t.severity === "medium" ? "TB" : "Nặng"}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stColor[t.status]}`}>
                      {stLabel[t.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })(),
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

  const [isLoaded, setIsLoaded] = useState(false)

  // Lifecycle state — all hooks before any early return
  const [localLifecycle, setLocalLifecycle] = useState<LifecycleStage>("lead_new")
  const [transitioning, setTransitioning] = useState(false)
  const [gateError, setGateError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; onConfirm: () => void } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warn" } | null>(null)

  // Progess update modal (Part 5)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressNote, setProgressNote] = useState("")

  // Dynamic Gantt Config (Part 7)
  const [showGanttConfigModal, setShowGanttConfigModal] = useState(false)
  const [localGanttGroups, setLocalGanttGroups] = useState<BOQSubGroup[]>([])

  // Contract Modal (Part 6)
  const [showContractModal, setShowContractModal] = useState(false)

  // Approval Modals (Part 9)
  const [showAccountantModal, setShowAccountantModal] = useState(false)
  const [showDesignApprovalModal, setShowDesignApprovalModal] = useState(false)
  const [showPermitModal, setShowPermitModal] = useState(false)
  const [showDesignFeeModal, setShowDesignFeeModal] = useState(false)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  
  // subGroupProgress: { [subGroupId]: actualProgress }
  const [subGroupProgress, setSubGroupProgress] = useState<Record<string, number>>({})
  const [draftProgress, setDraftProgress] = useState<Record<string, number>>({})

  const [accAmountInput, setAccAmountInput] = useState("")
  const [showDesignFinalModal, setShowDesignFinalModal] = useState(false)

  // Dynamic leads created via the "Thêm Lead" form — stored in localStorage
  const [dynamicProject, setDynamicProject] = useState<PipelineItem | null>(null)
  const [dynamicLoading, setDynamicLoading] = useState(true)
  const [surveyPhotos, setSurveyPhotos] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      // 1. Initial lifecycle from static data
      const p = PIPELINE_ITEMS.find(x => x.id === id)
      let initialLifecycle: LifecycleStage = "lead_new"
      if (p) initialLifecycle = (p.lifecycleStage as LifecycleStage | undefined) ?? stageToLifecycle(p.stage)

      // 2. Load dynamic lead overrides
      const storedLeads = localStorage.getItem("dynamic_leads")
      if (storedLeads) {
        const leads = JSON.parse(storedLeads) as PipelineItem[]
        const found = leads.find(l => l.id === id)
        if (found) {
          setDynamicProject(found)
          if (found.lifecycleStage) initialLifecycle = found.lifecycleStage as LifecycleStage
          if (found.surveyPhotos?.length) setSurveyPhotos(found.surveyPhotos)
        }
      }
      setLocalLifecycle(initialLifecycle)

      // 3. Load Gantt groups
      const storedGantt = localStorage.getItem(`gantt_${id}`)
      const gGroups = storedGantt ? JSON.parse(storedGantt) : BOQ_SUBGROUPS.filter(g => g.projectId === id)
      setLocalGanttGroups(gGroups)

      // 4. Initial progress mapping
      setSubGroupProgress(Object.fromEntries(gGroups.map((g: any) => [g.id, g.actualProgress])))

    } catch (e) { console.error("Load state failed", e) }
    
    setDynamicLoading(false)
    setIsLoaded(true)
  }, [id])

  const handleAddSurveyPhoto = (base64: string) => {
    setSurveyPhotos(prev => {
      const updated = [...prev, base64]
      try {
        const saved: PipelineItem[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
        const idx = saved.findIndex(l => l.id === id)
        if (idx >= 0) {
          saved[idx] = { ...saved[idx], surveyPhotoCount: updated.length, surveyPhotos: updated }
          localStorage.setItem("dynamic_leads", JSON.stringify(saved))
        }
      } catch { /* quota exceeded */ }
      return updated
    })
  }

  const staticProject = PIPELINE_ITEMS.find(p => p.id === id) ?? null
  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Đang đồng bộ dữ liệu...
      </div>
    )
  }

  const project = dynamicProject ?? staticProject

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
  // Subgroups for this project, merging live progress state
  const projectSubGroups: BOQSubGroup[] = localGanttGroups
    .map(g => ({ ...g, actualProgress: subGroupProgress[g.id] ?? g.actualProgress }))
  const today = new Date("2026-03-23T20:52:36+07:00")

  const onOpenAccountantModal = () => {
    setAccAmountInput((project.designFee ? project.designFee * 0.5 : 0).toLocaleString("vi-VN"))
    setShowAccountantModal(true)
  }

  const handleAccAmountChange = (v: string) => {
    const raw = v.replace(/[^0-9]/g, "")
    const num = Number(raw)
    setAccAmountInput(num.toLocaleString("vi-VN"))
  }

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateProjectField = (fields: Partial<PipelineItem>) => {
    if (dynamicProject) {
      setDynamicProject(prev => prev ? { ...prev, ...fields } : null)
    }
    try {
      const saved: PipelineItem[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      const idx = saved.findIndex(l => l.id === id)
      if (idx >= 0) {
        saved[idx] = { ...saved[idx], ...fields }
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
      } else if (!dynamicProject) {
        // If it's a static project being edited for the first time, clone it
        const base = PIPELINE_ITEMS.find(p => p.id === id)
        if (base) {
          const cloned = { ...base, ...fields }
          saved.push(cloned)
          localStorage.setItem("dynamic_leads", JSON.stringify(saved))
          setDynamicProject(cloned)
        }
      }
    } catch { /* ignore */ }
  }

  // Lifecycle-driven active step (overrides static STAGE_TO_STEP)
  const localStage    = LIFECYCLE_TO_STAGE[localLifecycle]
  const activeStep    = LIFECYCLE_STEP[localLifecycle]
  const timelineSteps = buildSteps(
    { ...project, stage: localStage },
    milestones, vos, surveyPhotos, handleAddSurveyPhoto,
    projectSubGroups, localLifecycle, today,
    () => setShowContractModal(true),
    onOpenAccountantModal,
    () => setShowDesignApprovalModal(true),
    () => setShowPermitModal(true),
    () => setShowDesignFeeModal(true),
    () => setShowDesignFinalModal(true),
    updateProjectField,
    showToast,
  )
  const progress      = project.progress ?? 0
  
  // Bug #2 Fix: totalPaid should sum construction + design payments
  const designPaid = (project.designDepositPaid ? (project.designDepositAmount ?? 0) : 0) + 
                     (project.designFinalPaid ? ((project.designFee ?? 0) - (project.designDepositAmount ?? 0)) : 0);
  const constructionPaid = (project.totalPaid ?? 0); // This is the value from static data/milestones
  const totalPaidTotal = constructionPaid + designPaid;
  
  const contractValue = project.contractValue ?? project.value
  const debt          = Math.max(0, contractValue - totalPaidTotal)

  // ── Transition logic ──────────────────────────────────────────────────────
  const doTransition = async (next: LifecycleStage) => {
    setTransitioning(true)
    setGateError(null)
    setConfirmDialog(null)
    await new Promise(r => setTimeout(r, 800))
    setLocalLifecycle(next)
    setTransitioning(false)
    showToast(LIFECYCLE_TOAST[next], "success")
    // Persist lifecycle change back to localStorage for dynamic leads
    try {
      const saved: PipelineItem[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      const idx = saved.findIndex(l => l.id === id)
      if (idx >= 0) {
        saved[idx] = { ...saved[idx], lifecycleStage: next }
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
      }
    } catch { /* quota exceeded or SSR */ }
  }

  const handleNextStep = () => {
    const idx = LIFECYCLE_ORDER.indexOf(localLifecycle)
    if (idx >= LIFECYCLE_ORDER.length - 1) return
    const next = LIFECYCLE_ORDER[idx + 1]
    const voCount = vos.filter(v => v.status === "pending").length

    // Gate: construction → done — warn if VOs pending
    if (localLifecycle === "construction" && voCount > 0) {
      setConfirmDialog({
        msg: `Còn ${voCount} VO chưa được duyệt. Vẫn tiếp tục chuyển Bàn giao?`,
        onConfirm: () => doTransition(next),
      });
      return;
    }

    // Gate: surveying -> design_quoted (Relaxed for testing)

    // Gate: design_quoted -> awaiting_design_fee (PM must have input the fee)
    if (localLifecycle === "design_quoted" && !((project.designFee ?? 0) > 0)) {
      setGateError("Vui lòng cập nhật Phí thiết kế trước khi chuyển sang bước thu tiền.");
      showToast("Chưa có phí thiết kế", "warn");
      setShowDesignFeeModal(true);
      return;
    }

    // Gate: awaiting_design_fee -> designing (Accountant must have confirmed 50%)
    if (localLifecycle === "awaiting_design_fee" && !project.designDepositPaid) {
      setGateError("Cần kế toán xác nhận đã thu 50% phí thiết kế trước khi bắt đầu vẽ.");
      showToast("Chưa thu tạm ứng 50%", "warn");
      return;
    }

    // Gate: construction → done — fail if still has debt
    if (localLifecycle === "construction" && debt > 0) {
      setGateError(`KH còn nợ ${fmtVND(debt)}. Cần thu đủ trước khi hoàn thành bàn giao`)
      showToast(`Không thể chuyển bước – KH còn nợ ${fmtVND(debt)}`, "error")
      return
    }

    doTransition(next)
  }

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
            {localLifecycle === "done" ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-lg">
                <Check className="w-3.5 h-3.5" /> Hoàn thành
              </span>
            ) : localLifecycle === "design_approved" ? (
              <>
                <button onClick={() => doTransition("design_only_closing")} disabled={transitioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition disabled:opacity-60">
                  {transitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Design Only
                </button>
                <button onClick={() => doTransition("quotation")} disabled={transitioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition disabled:opacity-60">
                  {transitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  Chốt thi công →
                </button>
              </>
            ) : (
              <button onClick={handleNextStep} disabled={transitioning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition disabled:opacity-60">
                {transitioning
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ChevronRight className="w-3.5 h-3.5" />}
                {transitioning ? "Đang chuyển..." : LIFECYCLE_NEXT_LABEL[localLifecycle]}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 pb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">{project.id.toUpperCase()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${stageBadge[localStage] ?? "bg-gray-100 text-gray-600"}`}>
                {stageText[localStage] ?? localStage}
              </span>
              {project.permitRequired !== false && (
                project.permitOk
                  ? <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-md"><CheckCircle className="w-3 h-3" /> GP thi công</span>
                  : <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md"><AlertTriangle className="w-3 h-3" /> Thiếu GP</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
              <button onClick={() => setShowEditProjectModal(true)} className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              KH: <span className="text-gray-700 font-medium">{project.client}</span>
              &nbsp;·&nbsp;{project.phone ?? ""}
              &nbsp;·&nbsp;PM: <span className="text-gray-700 font-medium">{project.pm ?? project.responsible}</span>
            </p>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex items-center gap-4 text-sm">
              <div><div className="text-xs text-gray-400">Giá trị HĐ</div><div className="font-bold text-gray-900">{fmtVND(project.contractValue ?? project.value)}</div></div>
              <div><div className="text-xs text-gray-400">Đã thu</div><div className="font-bold text-green-600">{fmtVND(totalPaidTotal)}</div></div>
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
              {t.key === "boq" && (() => {
                const editable = ["designing","design_approved","design_only_closing"].includes(localLifecycle)
                if (editable) return <span className="text-[10px] text-gray-400">🔓</span>
                return <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔒 Đã khóa</span>
              })()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Tab: Timeline ── */}
        {tab === "timeline" && (
          <div className="p-6 max-w-[1100px] mx-auto">
            <NextActionBanner lifecycle={localLifecycle} />

            {/* Gate error */}
            {gateError && (
              <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-red-700">Không thể chuyển bước</div>
                  <div className="text-xs text-red-600 mt-0.5">{gateError}</div>
                </div>
              </div>
            )}

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
                <TimelineSidebar
                  project={project}
                  milestones={milestones}
                  vos={vos}
                  subGroups={projectSubGroups}
                  localLifecycle={localLifecycle}
                  today={today}
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* ── Tab: BOQ ── */}
          {tab === "boq" && (
            <div className="max-w-5xl mx-auto">
              <ProjectBOQTab projectId={project.id} lifecycle={localLifecycle} />
            </div>
          )}

          {/* ── Tab: Dòng tiền ── */}
          {tab === "cashflow" && (
            <div className="max-w-3xl mx-auto">
              <ProjectCashflowTab project={project} showToast={showToast} />
            </div>
          )}

          {/* ── Tab: Tài liệu ── */}
          {tab === "files" && (
            <div className="max-w-4xl mx-auto">
              <ProjectFilesTab projectId={project.id} />
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {/* 1. Kế toán xác nhận */}
      {showAccountantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Thu tiền tạm ứng Thiết kế</h3>
              <button onClick={() => setShowAccountantModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Số tiền thực nhận (VNĐ)</label>
                <input type="text" 
                  value={accAmountInput} 
                  onChange={e => handleAccAmountChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 font-bold text-orange-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Ngày nhận</label>
                <input type="date" id="accDate" defaultValue="2025-01-20" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Chứng từ (Giấy báo có / Ủy nhiệm chi)</label>
                <input type="file" className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAccountantModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition">Hủy</button>
              <button onClick={() => {
                const num = Number(accAmountInput.replace(/[^0-9]/g, ""))
                const newTotalPaid = (project.totalPaid ?? 0) + num
                const newDebt = (project.contractValue ?? project.value) - newTotalPaid
                updateProjectField({ 
                  designDepositPaid: true, 
                  designDepositAmount: num,
                  totalPaid: newTotalPaid,
                  totalDebt: newDebt > 0 ? newDebt : 0
                })
                setShowAccountantModal(false)
                showToast("Đã xác nhận thanh toán!", "success")
              }} className="px-4 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Xác nhận Đã thu</button>
            </div>
          </div>
        </div>
      )}

      {/* 1b. Kế toán xác nhận thu 50% còn lại */}
      {showDesignFinalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Thu 50% phí thiết kế còn lại</h3>
              <button onClick={() => setShowDesignFinalModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Phí thiết kế:</span>
                  <span className="font-semibold text-gray-800">{fmtVND(project.designFee ?? 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Đã thu lần 1 (50%):</span>
                  <span className="font-semibold text-green-600">−{fmtVND(project.designDepositAmount ?? 0)}</span>
                </div>
                <div className="border-t border-orange-200 pt-1.5 flex justify-between text-xs">
                  <span className="text-gray-700 font-bold">Cần thu lần 2:</span>
                  <span className="font-bold text-orange-600">{fmtVND((project.designFee ?? 0) - (project.designDepositAmount ?? 0))}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">Xác nhận kế toán đã nhận đủ 50% phí thiết kế còn lại từ khách hàng.</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowDesignFinalModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition">Hủy</button>
              <button onClick={() => {
                const finalAmount = (project.designFee ?? 0) - (project.designDepositAmount ?? 0);
                const newTotalPaid = (project.totalPaid ?? 0) + finalAmount
                const newDebt = (project.contractValue ?? project.value) - newTotalPaid
                updateProjectField({ 
                  designFinalPaid: true,
                  totalPaid: newTotalPaid,
                  totalDebt: newDebt > 0 ? newDebt : 0
                })
                setShowDesignFinalModal(false)
                showToast("Đã xác nhận thu 50% còn lại!", "success")
              }} className="px-4 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Xác nhận Đã thu</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PM Xác nhận bản vẽ */}
      {showDesignApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Xác nhận KH chốt bản vẽ</h3>
              <button onClick={() => setShowDesignApprovalModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs">
                Chỉ thực hiện bước này khi Khách hàng đã chính thức chốt phương án thiết kế cuối cùng (không sửa thêm).
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Upload Bằng chứng (Zalo/Email/Biên bản)</label>
                <input type="file" title="Upload Bằng chứng" className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowDesignApprovalModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition">Hủy</button>
              <button onClick={() => {
                updateProjectField({ drawingApproved: true })
                setShowDesignApprovalModal(false)
                showToast("Đã cập nhật trạng thái chốt bản vẽ!", "success")
              }} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Lưu xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cập nhật Giấy phép */}
      {showPermitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Cập nhật Giấy phép Thi công</h3>
              <button onClick={() => setShowPermitModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Upload File Scand GP (PDF)</label>
                <input type="file" title="Upload permit" className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowPermitModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition">Hủy</button>
              <button onClick={() => {
                updateProjectField({ permitOk: true })
                setShowPermitModal(false)
                showToast("Đã cập nhật giấy phép!", "success")
              }} className="px-4 py-2 text-sm font-bold bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">Hoàn thành</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cập nhật tiến độ */}
      <ProgressModal 
        showProgressModal={showProgressModal}
        setShowProgressModal={setShowProgressModal}
        projectSubGroups={projectSubGroups}
        draftProgress={draftProgress}
        setDraftProgress={setDraftProgress}
        project={project}
        today={today}
        showToast={showToast}
        localLifecycle={localLifecycle}
        PAYMENT_MILESTONES={PAYMENT_MILESTONES}
        fmtVND={fmtVND}
        checkMilestone={checkMilestone}
        setSubGroupProgress={setSubGroupProgress}
        id={id}
        progressNote={progressNote}
        setProgressNote={setProgressNote}
      />

      {/* ── Contract Modal (Part 6) ── */}
      <ContractConfirmModal 
        showContractModal={showContractModal}
        setShowContractModal={setShowContractModal}
        today={today}
        project={project}
        id={id}
        dynamicProject={dynamicProject}
        setDynamicProject={setDynamicProject}
        staticProject={staticProject}
        showToast={showToast}
      />

      {/* ── Gantt Config Modal (Part 7) ── */}
      <GanttConfigModal 
        showGanttConfigModal={showGanttConfigModal}
        setShowGanttConfigModal={setShowGanttConfigModal}
        localGanttGroups={localGanttGroups}
        setLocalGanttGroups={setLocalGanttGroups}
        id={id}
        subGroupProgress={subGroupProgress}
        setSubGroupProgress={setSubGroupProgress}
        showToast={showToast}
      />

      {/* ── Design Fee Modal ── */}
      <DesignFeeModal 
        showDesignFeeModal={showDesignFeeModal}
        setShowDesignFeeModal={setShowDesignFeeModal}
        project={project}
        updateProjectField={updateProjectField}
        showToast={showToast}
      />

      {/* ── Edit Project Info Modal ── */}
      {showEditProjectModal && (
        <EditProjectInfoModal 
          project={project} 
          setShowEditProjectModal={setShowEditProjectModal} 
          updateProjectField={updateProjectField} 
          showToast={showToast} 
        />
      )}

      {/* ── Confirm dialog ── */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Xác nhận chuyển bước?</h3>
            <p className="text-sm text-gray-600 mb-5">{confirmDialog.msg}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Huỷ
              </button>
              <button onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition">
                Vẫn tiếp tục →
              </button>
            </div>
          </div>
        </div>
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

// ── Edit Project Info Modal ───────────────────────────────────────────────────
function EditProjectInfoModal({ project, setShowEditProjectModal, updateProjectField, showToast }: any) {
  const [formData, setFormData] = useState({
    name: project.name,
    client: project.client,
    phone: project.phone || "",
    address: project.address || "",
    pm: project.pm || project.responsible,
    designer: project.designer || "",
    qs: project.qs || "",
    value: project.value || 0,
    source: project.source || "",
    contractDate: project.contractDate || "",
    plannedCompletionDate: project.plannedCompletionDate || "",
  })
  const [valueInput, setValueInput] = useState((project.value || 0).toLocaleString("vi-VN"))
  const SOURCE_OPTIONS = ["Facebook", "Website", "Hotline", "Referral", "Walk-in"]
  const [isCustomSource, setIsCustomSource] = useState(!!formData.source && !SOURCE_OPTIONS.includes(formData.source))

  const handleSave = () => {
    updateProjectField({
      ...formData,
      contractValue: formData.value
    })
    showToast("Đã cập nhật thông tin dự án!", "success")
    setShowEditProjectModal(false)
  }

  const handleValueChange = (v: string) => {
    const raw = v.replace(/[^0-9]/g, "")
    const num = Number(raw)
    setFormData({ ...formData, value: num })
    setValueInput(num.toLocaleString("vi-VN"))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Chỉnh sửa thông tin dự án</h3>
              <p className="text-[10px] text-gray-400 font-medium">Cập nhật dữ liệu realtime</p>
            </div>
          </div>
          <button onClick={() => setShowEditProjectModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tên dự án / Căn hộ</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tên khách hàng</label>
              <input type="text" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Số điện thoại</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Địa chỉ</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
            </div>

            <div className="grid grid-cols-3 col-span-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">PM phụ trách</label>
                <input type="text" value={formData.pm} onChange={e => setFormData({...formData, pm: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Thiết kế</label>
                <input type="text" value={formData.designer} onChange={e => setFormData({...formData, designer: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Dự toán/QS</label>
                <input type="text" value={formData.qs} onChange={e => setFormData({...formData, qs: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Giá trị dự kiến (VNĐ)</label>
                <input type="text" value={valueInput} onChange={e => handleValueChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nguồn / Kênh</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={isCustomSource ? "Other" : formData.source} 
                    onChange={e => {
                      if (e.target.value === "Other") {
                        setIsCustomSource(true)
                        setFormData({ ...formData, source: "" })
                      } else {
                        setIsCustomSource(false)
                        setFormData({ ...formData, source: e.target.value })
                      }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm bg-white"
                  >
                    <option value="">-- Chọn nguồn --</option>
                    {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    <option value="Other">Khác...</option>
                  </select>
                  {isCustomSource && (
                    <input type="text" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                      placeholder="Nhập nguồn khác..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-1.5 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Ngày ký HĐ</label>
              <input type="date" value={formData.contractDate} onChange={e => setFormData({...formData, contractDate: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Ngày hoàn thành (Dự kiến)</label>
              <input type="date" value={formData.plannedCompletionDate} onChange={e => setFormData({...formData, plannedCompletionDate: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowEditProjectModal(false)} 
            className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm">
            Huỷ bỏ
          </button>
          <button onClick={handleSave} 
            className="px-6 py-2.5 text-xs font-bold text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-[0.98]">
            💾 Lưu thay đổi
          </button>
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

// ── Progress Modal ────────────────────────────────────────────────────────────
function ProgressModal({ 
  showProgressModal, setShowProgressModal, projectSubGroups, draftProgress, setDraftProgress, 
  project, today, showToast, localLifecycle, PAYMENT_MILESTONES, fmtVND, checkMilestone, 
  setSubGroupProgress, id, progressNote, setProgressNote 
}: any) {
  if (!showProgressModal) return null

  const handleSave = () => {
    const prevMilestones = PAYMENT_MILESTONES.filter((m: any) => m.projectId === project.id)
    const prevMet: Record<string, boolean> = {}
    prevMilestones.forEach((m: any) => {
      prevMet[m.id] = checkMilestone(m, projectSubGroups, localLifecycle)
    })

    // Apply new progress
    setSubGroupProgress((prev: any) => ({ ...prev, ...draftProgress }))

    // Compute new merged subgroups
    const nextSGs = projectSubGroups.map((g: any) => ({ ...g, actualProgress: draftProgress[g.id] ?? g.actualProgress }))

    // Check for newly met milestones
    prevMilestones.forEach((m: any) => {
      if (m.status === 'paid') return
      const wasMet = prevMet[m.id]
      const isMet = checkMilestone(m, nextSGs, localLifecycle)
      if (!wasMet && isMet) {
        setTimeout(() => showToast(`✓ Đợt ${m.order} đã đủ điều kiện thu ${fmtVND(m.amount)}!`, "success"), 50)
      }
    })

    // Persist to localStorage for dynamic leads
    try {
      const saved: any[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      const idx = saved.findIndex(l => l.id === id)
      if (idx >= 0) {
        saved[idx] = { ...saved[idx] }
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
      }
    } catch { /* ignore */ }

    setShowProgressModal(false)
    setProgressNote("")
  }

  const todayLabel = today.toLocaleDateString('vi-VN')
  const startDate = project.contractSignedDate ? new Date(project.contractSignedDate) : null
  const currentWeek = startDate
    ? Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <div className="text-sm font-bold text-gray-900">📱 Cập nhật tiến độ</div>
            <div className="text-xs text-gray-400 mt-0.5">{todayLabel}</div>
          </div>
          <button onClick={() => setShowProgressModal(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {projectSubGroups.filter((g: any) => g.actualProgress < 100).map((g: any) => {
            const val = draftProgress[g.id] ?? g.actualProgress
            const expectedPct = startDate && currentWeek > g.plannedStartWeek
              ? Math.min(100, Math.round((currentWeek - g.plannedStartWeek) / g.plannedDurationWeeks * 100))
              : 0
            const isBehind = val < expectedPct
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{g.name}</div>
                    <div className="text-[10px] text-gray-400">{g.contractor}</div>
                  </div>
                  <input
                    type="number" min={0} max={100}
                    value={val}
                    onChange={e => setDraftProgress((prev: any) => ({ ...prev, [g.id]: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                    className="w-14 text-center text-xs font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <input
                  type="range" min={0} max={100} value={val}
                  onChange={e => setDraftProgress((prev: any) => ({ ...prev, [g.id]: Number(e.target.value) }))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: isBehind ? '#DC2626' : '#2563EB' }}
                />
                <div className={`text-[10px] mt-0.5 ${isBehind ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                  Kỳ vọng hôm nay: {expectedPct}%{isBehind ? ' — ⚠ trễ hạn' : ''}
                </div>
              </div>
            )
          })}
          {projectSubGroups.every((g: any) => g.actualProgress >= 100) && (
            <div className="text-center py-4 text-sm text-gray-400">✔ Tất cả hạng mục đã hoàn thành 100%</div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Phần thô còn một số hạng mục hoàn thiện..."
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button onClick={() => setShowProgressModal(false)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Huỷ
          </button>
          <button onClick={handleSave}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-1.5">
            💾 Lưu tiến độ
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Contract Confirm Modal ───────────────────────────────────────────────────
function ContractConfirmModal({
  showContractModal, setShowContractModal, today, project, id, dynamicProject, 
  setDynamicProject, staticProject, showToast
}: any) {
  const [date, setDate] = useState(() => today.toISOString().slice(0, 10))
  const [val, setVal] = useState(project.value)
  const [valInput, setValInput] = useState((project.value || 0).toLocaleString("vi-VN"))
  const [file, setFile] = useState("")

  if (!showContractModal) return null

  const handleValChange = (v: string) => {
    const raw = v.replace(/[^0-9]/g, "")
    const num = Number(raw)
    setVal(num)
    setValInput(num.toLocaleString("vi-VN"))
  }

  const handleSave = () => {
    try {
      const saved: any[] = JSON.parse(localStorage.getItem("dynamic_leads") ?? "[]")
      const idx = saved.findIndex(l => l.id === id)
      if (idx >= 0) {
        saved[idx] = { ...saved[idx], contractSigned: true, contractSignedDate: date, contractValue: val }
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
        if (dynamicProject) {
          setDynamicProject(saved[idx])
        }
      } else if (staticProject) {
        saved.push({ ...staticProject, contractSigned: true, contractSignedDate: date, contractValue: val })
        localStorage.setItem("dynamic_leads", JSON.stringify(saved))
        setDynamicProject({ ...staticProject, contractSigned: true, contractSignedDate: date, contractValue: val })
      }
    } catch {}
    showToast("Xác nhận Ký Hợp đồng thành công!", "success")
    setShowContractModal(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-900 flex justify-between items-center">
          <span>📄 Xác nhận Ký hợp đồng</span>
          <button onClick={() => setShowContractModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Ngày ký HĐ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Giá trị chốt HĐ (VNĐ)</label>
            <input type="text" 
              value={valInput} 
              onChange={e => handleValChange(e.target.value)} 
              className="w-full text-sm font-bold text-orange-600 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Upload bản Scan Hợp đồng có chữ ký (PDF / Ảnh)</label>
            <input type="file" onChange={e => setFile(e.target.value)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={() => setShowContractModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition">Hủy</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition">💾 Lưu & Xác nhận</button>
        </div>
      </div>
    </div>
  )
}

// ── Gantt Config Modal ────────────────────────────────────────────────────────
function GanttConfigModal({
  showGanttConfigModal, setShowGanttConfigModal, localGanttGroups, setLocalGanttGroups, 
  id, subGroupProgress, setSubGroupProgress, showToast
}: any) {
  const [editingList, setEditingList] = useState<any[]>(() => JSON.parse(JSON.stringify(localGanttGroups)))
  
  if (!showGanttConfigModal) return null

  const handleAdd = () => {
    setEditingList([...editingList, {
      id: `sg-new-${Date.now()}`,
      projectId: id,
      name: "Hạng mục mới",
      contractor: "Nhà thầu nội bộ",
      plannedStartWeek: 1,
      plannedDurationWeeks: 2,
      actualProgress: 0,
    }])
  }

  const handleSave = () => {
    setLocalGanttGroups(editingList)
    localStorage.setItem(`gantt_${id}`, JSON.stringify(editingList))
    const mergedProg = { ...subGroupProgress }
    editingList.forEach(g => { if (!(g.id in mergedProg)) mergedProg[g.id] = g.actualProgress })
    setSubGroupProgress(mergedProg)
    setShowGanttConfigModal(false)
    showToast("Đã lưu cấu hình Gantt chart")
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-900 flex justify-between items-center shrink-0">
          <span>⚙️ Quản lý danh sách Hạng mục (Gantt)</span>
          <button onClick={() => setShowGanttConfigModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {editingList.length === 0 && <div className="text-sm text-gray-400 text-center py-4">Chưa có hạng mục nào.</div>}
          
          {editingList.map((sg, idx) => (
            <div key={sg.id} className="flex gap-2 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Tên hạng mục</label>
                    <input type="text" value={sg.name} onChange={e => { const updated = [...editingList]; updated[idx].name = e.target.value; setEditingList(updated) }} className="w-full text-xs font-bold border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none" placeholder="VD: Phần thô" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Nhà thầu phụ (NCC)</label>
                    <input type="text" value={sg.contractor} onChange={e => { const updated = [...editingList]; updated[idx].contractor = e.target.value; setEditingList(updated) }} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Bắt đầu từ tuần số (1-X)</label>
                    <input type="number" min={1} value={sg.plannedStartWeek} onChange={e => { const updated = [...editingList]; updated[idx].plannedStartWeek = Math.max(1, Number(e.target.value)); setEditingList(updated) }} className="w-full text-xs font-mono border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Thi công trong (Số tuần)</label>
                    <input type="number" min={1} value={sg.plannedDurationWeeks} onChange={e => { const updated = [...editingList]; updated[idx].plannedDurationWeeks = Math.max(1, Number(e.target.value)); setEditingList(updated) }} className="w-full text-xs font-mono border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none" />
                  </div>
                </div>
              </div>
              <button onClick={() => setEditingList(prev => prev.filter((_, i) => i !== idx))} className="shrink-0 h-8 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold self-end border border-red-200">Xóa</button>
            </div>
          ))}

          <button onClick={handleAdd} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-bold text-gray-500 flex items-center justify-center gap-2 hover:border-orange-400 hover:text-orange-500 transition">
            <Plus className="w-4 h-4" /> Thêm hạng mục
          </button>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={() => setShowGanttConfigModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800">💾 Lưu danh sách</button>
        </div>
      </div>
    </div>
  )
}

// ── Design Fee Modal ──────────────────────────────────────────────────────────
function DesignFeeModal({
  showDesignFeeModal, setShowDesignFeeModal, project, updateProjectField, showToast
}: any) {
  const [feeInput, setFeeInput] = useState((project.designFee || 0).toLocaleString("vi-VN"))
  const [designer, setDesigner] = useState(project.designer || "Trần Thị Bình")

  if (!showDesignFeeModal) return null

  const handleFeeChange = (v: string) => {
    const raw = v.replace(/[^0-9]/g, "")
    const num = Number(raw)
    setFeeInput(num.toLocaleString("vi-VN"))
  }

  const handleSave = () => {
    const numFee = Number(feeInput.replace(/[^0-9]/g, ""))
    if (!numFee || isNaN(numFee)) {
      alert("Vui lòng nhập phí thiết kế hợp lệ!")
      return
    }
    updateProjectField({ designFee: numFee, designer: designer })
    showToast("Đã cập nhật Báo giá Thiết kế!", "success")
    setShowDesignFeeModal(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-sm">📝 Báo giá Phí thiết kế</h3>
          <button onClick={() => setShowDesignFeeModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tổng phí thiết kế (VNĐ)</label>
            <input type="text" 
              value={feeInput} 
              onChange={e => handleFeeChange(e.target.value)}
              placeholder="Ví dụ: 25,000,000"
              className="w-full font-bold text-orange-600 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kỹ sư phụ trách</label>
            <select 
              value={designer} onChange={e => setDesigner(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all">
              <option value="Trần Thị Bình">Trần Thị Bình</option>
              <option value="Phạm Văn Đức">Phạm Văn Đức</option>
              <option value="Nguyễn Văn An">Nguyễn Văn An</option>
            </select>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={() => setShowDesignFeeModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition">Lưu Báo Giá</button>
        </div>
      </div>
    </div>
  )
}
