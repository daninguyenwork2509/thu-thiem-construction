// ─────────────────────────────────────────────────────────────────────────────
// Shared project data — dùng chung cho pipeline + project detail
// ─────────────────────────────────────────────────────────────────────────────

export type Stage = "lead" | "design" | "contract" | "construction" | "payment" | "handover"
export type Priority = "high" | "medium" | "low"
export type ItemType = "lead" | "project"
export type ProjectType = "renovation_apartment" | "renovation_office" | "signage" | "new_build" | "furniture_supply"

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  renovation_apartment: "Cải tạo căn hộ",
  renovation_office:    "Cải tạo văn phòng",
  signage:              "Bảng hiệu",
  new_build:            "Xây mới",
  furniture_supply:     "Cung cấp nội thất",
}

export type LifecycleStage =
  "lead_new" | "surveying" |
  "design_quoted" | "awaiting_design_fee" | "designing" | "design_approved" |
  "design_only_closing" | "design_only_done" |
  "quotation" | "contract_signed" | "construction" | "handover" | "done"

export interface PipelineItem {
  id: string
  type: ItemType
  projectType?: ProjectType
  lifecycleStage?: LifecycleStage
  name: string
  client: string
  phone?: string
  source?: string
  value: number
  stage: Stage
  responsible: string
  responsibleInitials: string
  responsibleColor: string
  progress?: number
  deadline?: string
  priority: Priority
  tags?: string[]
  note?: string
  voCount?: number
  // Extended project detail fields
  pm?: string
  designer?: string
  qs?: string
  address?: string
  contractDate?: string
  startDate?: string
  totalPaid?: number
  totalDebt?: number
  marginPct?: number
  permitRequired?: boolean   // false = không cần GP (ẩn badge hoàn toàn)
  permitOk?: boolean
  // Design fee fields
  designFee?: number
  designDepositPaid?: boolean
  designDepositAmount?: number
  designFinalPaid?: boolean
  drawingCompleted?: boolean
  drawingApproved?: boolean
  // Contract fields
  contractType?: "design_only" | "construction" | null
  contractValue?: number
  contractSigned?: boolean
  quotationSent?: boolean
  
  // Quotation & Contract logs
  quotationLog?: { actor: string; date: string; fileUrl: string }
  approvalLog?: { actor: string; date: string; evidenceUrl: string }
  contractLog?: { actor: string; date: string; fileUrl: string; signDate: string }

  // Survey photos
  surveyPhotoCount?: number
  surveyPhotos?: string[]
  budgetFlexibility?: "fixed" | "flexible" | "open" | null
  // Construction schedule
  contractSignedDate?: string      // "YYYY-MM-DD" — ngày ký HĐ
  plannedCompletionDate?: string   // "YYYY-MM-DD" — KH hoàn thành
  constructionStartDate?: string   // "YYYY-MM-DD" — ngày khởi công
}

// ─────────────────────────────────────────────────────────────────────────────
// BOQ SubGroup — Gantt + progress tracking
// ─────────────────────────────────────────────────────────────────────────────
export interface BOQSubGroup {
  id: string
  projectId: string
  name: string
  contractor: string
  plannedStartWeek: number       // 1-based, tính từ ngày ký HĐ
  plannedDurationWeeks: number   // số tuần thi công
  actualProgress: number         // % thực tế 0-100
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Milestone — with progress conditions
// ─────────────────────────────────────────────────────────────────────────────
export interface PaymentMilestone {
  id: string
  projectId: string
  order: number
  name: string
  percent: number
  amount: number
  status: "paid" | "pending" | "draft"
  dueDate?: string
  conditions?: {
    boqGroupProgress?: { groupName: string; minPercent: number }[]
    stageRequired?: string
  }
  conditionMet?: boolean   // computed at runtime
}

export interface VOItem {
  id: string
  projectId: string
  projectName: string
  title: string
  reason: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedBy: string
  date: string
}

export interface BOQLine {
  id: number
  projectId: string
  category: string
  item_name: string
  uom: string
  qty: number
  cost_price: number
  selling_price: number
  progress_pct: number
  margin_warning: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 DỰ ÁN MẪU
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_ITEMS: PipelineItem[] = [
  {
    // Dự án Test E2E mới tinh
    id: "PRJ-E2E-001",
    type: "project",
    projectType: "renovation_apartment", // default
    lifecycleStage: "construction",
    name: "Căn hộ Masteri Thảo Điền – Chị Mai",
    client: "Chị Mai",
    phone: "0901 234 567",
    value: 370000000,
    stage: "construction",
    responsible: "Lê Minh Tuấn",
    responsibleInitials: "TL",
    responsibleColor: "bg-teal-500",
    progress: 35,
    priority: "high",
    tags: ["Đang thi công"],
    voCount: 0,
    note: "Khách hàng muốn thiết kế lại toàn bộ căn 2PN, phong cách hiện đại.",
    pm: "Lê Minh Tuấn",
    designer: "Trần Thị Bình",
    qs: "Hoàng Văn Nam",
    address: "Khu dân cư Masteri Thảo Điền, Q2, TP.HCM",
    totalPaid: 111000000,
    totalDebt: 259000000,
    marginPct: 20,
    permitRequired: true,
    permitOk: true,
    designFee: 30000000, designDepositPaid: true, designDepositAmount: 15000000, designFinalPaid: true,
    drawingCompleted: true, drawingApproved: true, contractType: "construction",
    contractSigned: true, quotationSent: true,
    contractValue: 370000000,
    contractSignedDate: "2025-01-20",
    startDate: "2025-02-05",
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// VOs – chỉ PRJ-2025-001 có VO (3 VO chờ duyệt, tổng 18.5 triệu)
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_VOS: VOItem[] = []

// ─────────────────────────────────────────────────────────────────────────────
// BOQ – PRJ-2025-001 (đang thi công) + PRJ-2025-003 (dự toán Ecopark, chưa ký HĐ)
// PRJ-2025-002 chưa có BOQ (mới đang thiết kế)
// ─────────────────────────────────────────────────────────────────────────────

export const PROJECT_BOQ: BOQLine[] = []

// ─────────────────────────────────────────────────────────────────────────────
// Stage → timeline step index (0-based, for project detail timeline)
// ─────────────────────────────────────────────────────────────────────────────
export const STAGE_TO_STEP: Record<Stage, number> = {
  lead:         0,
  design:       2,
  contract:     3,
  construction: 4,
  payment:      5,
  handover:     7,
}

export function fmtVND(n: number) {
  return n.toLocaleString("vi-VN") + " ₫"
}

// ─────────────────────────────────────────────────────────────────────────────
// BOQ SubGroups — PRJ-2025-001 Gantt data
// ─────────────────────────────────────────────────────────────────────────────
export const BOQ_SUBGROUPS: BOQSubGroup[] = []

// ─────────────────────────────────────────────────────────────────────────────
// Payment Milestones — PRJ-2025-001 (with progress conditions)
// ─────────────────────────────────────────────────────────────────────────────
export const PAYMENT_MILESTONES: PaymentMilestone[] = []

export type ItemStatus = "approved" | "pending" | "draft" | "done"
export interface ContractorRef { id: string; name: string }
export interface ContractorPendingChange {
  from: ContractorRef; to: ContractorRef
  reason: string; requestedBy: string; status: "pending" | "approved"
}
export interface BOQItemV2 {
  id: string
  name: string
  note?: string
  unit: string
  quantity: number
  unitPriceSell: number
  unitPriceCost: number
  progress: number // 0-100
  status: ItemStatus
  contractorOverride?: ContractorRef | null
  pendingContractorChange?: ContractorPendingChange
  // Tracking details
  completedDate?: string
  timeliness?: "early" | "on_time" | "late"
  defectNote?: string
}
export interface BOQSubGroupV2 {
  id: string
  name: string
  contractor: ContractorRef | null
  pendingChange?: ContractorPendingChange
  contractedValue?: number
  
  // Timeline per SubGroup
  startDate?: string
  endDate?: string
  durationDays?: number
  progress?: number // 0 - 100

  items: BOQItemV2[]
}
export interface BOQGroupV2 { id: string; name: string; subGroups: BOQSubGroupV2[] }

export function getSeedBOQ(projectId: string): BOQGroupV2[] {
  if (projectId === "PRJ-E2E-001") {
    const sp = (cost: number, markup: number) => Math.round(cost * (1 + markup / 100))
    return [
      {
        id: "g1", name: "I. Phá dỡ",
        subGroups: [
          {
            id: "sg1", name: "Phá dỡ", contractor: { id: "minh-phat", name: "Đội Minh Phát" },
            startDate: "2026-03-25", endDate: "2026-03-28", durationDays: 3, progress: 100,
            items: [
              { id: "i1", name: "Phá dỡ tường gạch cũ", unit: "m³", quantity: 8, unitPriceCost: 350000, unitPriceSell: sp(350000, 25), progress: 100, status: "approved" },
              { id: "i2", name: "Phá dỡ nền gạch cũ", unit: "m²", quantity: 85, unitPriceCost: 45000, unitPriceSell: sp(45000, 25), progress: 100, status: "approved" },
              { id: "i3", name: "Vận chuyển xà bần", unit: "chuyến", quantity: 5, unitPriceCost: 1500000, unitPriceSell: sp(1500000, 20), progress: 100, status: "approved" },
            ]
          }
        ]
      },
      {
        id: "g2", name: "II. Phần thô",
        subGroups: [
          {
            id: "sg2", name: "Xây tô", contractor: { id: "minh-phat", name: "Đội Minh Phát" },
            startDate: "2026-03-30", endDate: "2026-04-10", durationDays: 11, progress: 40,
            items: [
              { id: "i4", name: "Xây tường gạch 100mm", unit: "m²", quantity: 35, unitPriceCost: 280000, unitPriceSell: sp(280000, 22), progress: 100, status: "approved" },
              { id: "i5", name: "Tô trát tường", unit: "m²", quantity: 180, unitPriceCost: 85000, unitPriceSell: sp(85000, 22), progress: 100, status: "approved" },
              { id: "i6", name: "Chống thấm toilet (2 phòng)", unit: "m²", quantity: 12, unitPriceCost: 250000, unitPriceSell: sp(250000, 25), progress: 100, status: "approved" },
              { id: "i7", name: "Đổ sàn bê tông nâng nền toilet", unit: "m³", quantity: 1.5, unitPriceCost: 3500000, unitPriceSell: sp(3500000, 22), progress: 100, status: "approved" },
            ]
          },
          {
            id: "sg3", name: "Điện nước", contractor: { id: "dien-hung", name: "Cty TNHH Điện Hưng" },
            startDate: "2026-04-05", endDate: "2026-04-15", durationDays: 10, progress: 10,
            items: [
              { id: "i8", name: "Hệ thống ống nước cấp-thoát", unit: "gói", quantity: 1, unitPriceCost: 25000000, unitPriceSell: sp(25000000, 20), progress: 100, status: "approved" },
              { id: "i9", name: "Hệ thống điện âm tường", unit: "gói", quantity: 1, unitPriceCost: 35000000, unitPriceSell: sp(35000000, 20), progress: 100, status: "approved" },
            ]
          }
        ]
      },
      {
        id: "g3", name: "III. Hoàn thiện",
        subGroups: [
          {
            id: "sg4", name: "Hoàn thiện (gạch, sơn, trần, cửa)", contractor: { id: "thanh-binh", name: "Đội Thanh Bình" },
            startDate: "2026-04-16", endDate: "2026-04-30", durationDays: 14, progress: 0,
            items: [
              { id: "i10", name: "Lát gạch nền 600×600", unit: "m²", quantity: 65, unitPriceCost: 180000, unitPriceSell: sp(180000, 22), progress: 60, status: "approved" },
              { id: "i11", name: "Ốp gạch toilet 300×600", unit: "m²", quantity: 40, unitPriceCost: 200000, unitPriceSell: sp(200000, 22), progress: 40, status: "approved" },
              { id: "i12", name: "Sơn nước nội thất (3 lớp)", unit: "m²", quantity: 280, unitPriceCost: 45000, unitPriceSell: sp(45000, 25), progress: 0, status: "pending" },
              { id: "i13", name: "Trần thạch cao phẳng", unit: "m²", quantity: 85, unitPriceCost: 180000, unitPriceSell: sp(180000, 22), progress: 40, status: "approved" },
              { id: "i14", name: "Cửa phòng gỗ công nghiệp", unit: "bộ", quantity: 4, unitPriceCost: 3800000, unitPriceSell: sp(3800000, 20), progress: 0, status: "pending" },
            ]
          }
        ]
      },
      {
        id: "g4", name: "IV. Nội thất",
        subGroups: [
          {
            id: "sg5", name: "Nội thất gỗ", contractor: { id: "phuoc-loc", name: "Xưởng Phước Lộc" },
            startDate: "2026-05-01", endDate: "2026-05-15", durationDays: 14, progress: 0,
            items: [
              { id: "i15", name: "Tủ bếp trên + dưới (acrylic)", unit: "md", quantity: 5.5, unitPriceCost: 8500000, unitPriceSell: sp(8500000, 18), progress: 0, status: "draft" },
              { id: "i16", name: "Tủ quần áo âm tường", unit: "bộ", quantity: 2, unitPriceCost: 25000000, unitPriceSell: sp(25000000, 18), progress: 0, status: "draft" },
              { id: "i17", name: "Kệ TV + bàn console", unit: "bộ", quantity: 1, unitPriceCost: 12000000, unitPriceSell: sp(12000000, 18), progress: 0, status: "draft" },
            ]
          }
        ]
      },
      {
        id: "g5", name: "V. Thiết bị vệ sinh",
        subGroups: [
          {
            id: "sg6", name: "Thiết bị vệ sinh", contractor: { id: "toto", name: "Đại lý TOTO" },
            startDate: "2026-05-10", endDate: "2026-05-12", durationDays: 2, progress: 0,
            items: [
              { id: "i18", name: "Bộ thiết bị VS phòng master", unit: "bộ", quantity: 1, unitPriceCost: 18000000, unitPriceSell: sp(18000000, 15), progress: 0, status: "draft" },
              { id: "i19", name: "Bộ thiết bị VS phòng phụ", unit: "bộ", quantity: 1, unitPriceCost: 12000000, unitPriceSell: sp(12000000, 15), progress: 0, status: "draft" },
            ]
          }
        ]
      }
    ]
  }

  return [{ id: "g-default", name: "Phần thô", subGroups: [{ id: "sg-default", name: "Công việc chung", contractor: null, items: [] }] }]
}
