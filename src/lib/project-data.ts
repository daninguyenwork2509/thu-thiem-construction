// ─────────────────────────────────────────────────────────────────────────────
// Shared project data — dùng chung cho pipeline + project detail
// ─────────────────────────────────────────────────────────────────────────────

export type Stage = "lead" | "design" | "contract" | "construction" | "payment" | "handover"
export type Priority = "high" | "medium" | "low"
export type ItemType = "lead" | "project"

export interface PipelineItem {
  id: string
  type: ItemType
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
  permitOk?: boolean
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
    // Dự án 1 – Đang thi công
    id: "PRJ-2025-001",
    type: "project",
    name: "Căn hộ Vinhomes Central Park – Tầng 12",
    client: "Chị Lan Anh",
    phone: "0901 234 567",
    value: 820_000_000,
    stage: "construction",
    responsible: "Lê Minh Tuấn",
    responsibleInitials: "TL",
    responsibleColor: "bg-teal-500",
    progress: 48,
    deadline: "2025-05-31",
    priority: "high",
    tags: ["Nội thất trễ", "3 VO chờ duyệt"],
    voCount: 3,
    note: "Phong cách Nhật tối giản. Không đục kết cấu chịu lực. Thi công sau 18h vì KH WFH.",
    pm: "Lê Minh Tuấn",
    designer: "Trần Thị Bình",
    qs: "Hoàng Văn Nam",
    address: "Tầng 12, Vinhomes Central Park, Q. Bình Thạnh, TP.HCM",
    contractDate: "2025-02-01",
    startDate: "2025-02-05",
    totalPaid: 492_000_000,   // Đợt 1 (328M) + Đợt 2 (164M)
    totalDebt: 328_000_000,   // Đợt 3 (164M) + Đợt 4 (164M) chưa thu
    marginPct: 22,
    permitOk: false,           // Căn hộ tái cải tạo không cần GP TC
  },
  {
    // Dự án 2 – Đang thiết kế
    id: "PRJ-2025-002",
    type: "project",
    name: "Văn phòng FPT – Châu Thành, An Giang",
    client: "Cty FPT Telecom",
    phone: "0908 765 432",
    value: 259_000_000,        // ngân sách KH (chưa ký HĐ)
    stage: "design",
    responsible: "Phạm Văn Đức",
    responsibleInitials: "ĐP",
    responsibleColor: "bg-blue-500",
    progress: 0,
    deadline: "2025-04-30",
    priority: "medium",
    tags: ["Đang vẽ bản vẽ"],
    voCount: 0,
    note: "Thi công theo bộ nhận diện FPT. Không làm ngoài giờ hành chính. Bao gồm bảng hiệu + nội thất + điện mạng.",
    pm: "Phạm Văn Đức",
    designer: "Nguyễn Thu Hà",
    qs: "Hoàng Văn Nam",
    address: "Châu Thành, An Giang",
    contractDate: undefined,
    startDate: undefined,
    totalPaid: 0,
    totalDebt: 0,
    marginPct: 0,
    permitOk: false,
  },
  {
    // Dự án 3 – Chờ ký hợp đồng
    id: "PRJ-2025-003",
    type: "project",
    name: "Bảng hiệu chuỗi Shophouse Ecopark – Hưng Yên",
    client: "Cty Đại Phát",
    phone: "0912 888 999",
    value: 2_100_000_000,      // ngân sách KH (chưa ký HĐ)
    stage: "contract",
    responsible: "Lê Văn Nam",
    responsibleInitials: "NL",
    responsibleColor: "bg-purple-500",
    progress: 0,
    deadline: "2025-04-30",
    priority: "high",
    tags: ["Chờ phản hồi KH"],
    voCount: 0,
    note: "12 shophouse, mỗi cái 1 bảng hiệu chính + 1 biển vẫy. Alu chữ nổi, đèn LED âm. Hoàn thành trước 30/04.",
    pm: "Lê Văn Nam",
    designer: "Trần Thị Bình",
    qs: "Hoàng Văn Nam",
    address: "Khu đô thị Ecopark, Văn Giang, Hưng Yên",
    contractDate: undefined,
    startDate: undefined,
    totalPaid: 0,
    totalDebt: 0,
    marginPct: 0,
    permitOk: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// VOs – chỉ PRJ-2025-001 có VO (3 VO chờ duyệt, tổng 18.5 triệu)
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_VOS: VOItem[] = [
  {
    id: "vo1", projectId: "PRJ-2025-001",
    projectName: "Căn hộ Vinhomes Central Park – Tầng 12",
    title: "Bổ sung điểm điện phòng làm việc",
    reason: "Phát sinh 4 ổ cắm + 2 đèn LED theo yêu cầu KH",
    amount: 6_000_000, status: "pending", requestedBy: "Trần Thị Bình", date: "2025-03-15",
  },
  {
    id: "vo2", projectId: "PRJ-2025-001",
    projectName: "Căn hộ Vinhomes Central Park – Tầng 12",
    title: "Thay đổi vật liệu sàn phòng ngủ",
    reason: "KH nâng cấp từ gỗ công nghiệp lên sàn gỗ tự nhiên",
    amount: 7_500_000, status: "pending", requestedBy: "Lê Minh Tuấn", date: "2025-03-18",
  },
  {
    id: "vo3", projectId: "PRJ-2025-001",
    projectName: "Căn hộ Vinhomes Central Park – Tầng 12",
    title: "Thêm vách kính phòng tắm master",
    reason: "KH muốn thêm vách kính cường lực 10mm phòng tắm chính",
    amount: 5_000_000, status: "pending", requestedBy: "Trần Thị Bình", date: "2025-03-20",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// BOQ – chỉ PRJ-2025-001 có BOQ (đang thi công)
// PRJ-2025-002 và PRJ-2025-003 chưa ký HĐ nên chưa có BOQ
// ─────────────────────────────────────────────────────────────────────────────

export const PROJECT_BOQ: BOQLine[] = [
  // PRJ-2025-001 – Căn hộ Vinhomes (renovation apartment, 820M)
  { id: 1,  projectId: "PRJ-2025-001", category: "Phần thô",    item_name: "Đập tường cũ & xử lý mặt bằng",    uom: "m²",     qty: 45,  cost_price: 180_000,    selling_price: 250_000,    progress_pct: 100, margin_warning: false },
  { id: 2,  projectId: "PRJ-2025-001", category: "Phần thô",    item_name: "Xây tường ngăn mới (gạch nhẹ)",     uom: "m²",     qty: 32,  cost_price: 320_000,    selling_price: 420_000,    progress_pct: 80,  margin_warning: false },
  { id: 3,  projectId: "PRJ-2025-001", category: "Điện – M&E",  item_name: "Hệ thống điện âm tường toàn căn",   uom: "điểm",   qty: 60,  cost_price: 450_000,    selling_price: 580_000,    progress_pct: 40,  margin_warning: false },
  { id: 4,  projectId: "PRJ-2025-001", category: "Điện – M&E",  item_name: "Thi công điều hòa trung tâm",       uom: "bộ",     qty: 3,   cost_price: 12_500_000, selling_price: 15_800_000, progress_pct: 0,   margin_warning: false },
  { id: 5,  projectId: "PRJ-2025-001", category: "Nội thất",    item_name: "Tủ bếp gỗ MDF Melamine",            uom: "m dài",  qty: 5.2, cost_price: 3_800_000,  selling_price: 4_200_000,  progress_pct: 0,   margin_warning: true  },
  { id: 6,  projectId: "PRJ-2025-001", category: "Nội thất",    item_name: "Sàn gỗ công nghiệp 12mm",           uom: "m²",     qty: 68,  cost_price: 420_000,    selling_price: 560_000,    progress_pct: 0,   margin_warning: false },
  { id: 7,  projectId: "PRJ-2025-001", category: "Hoàn thiện",  item_name: "Sơn nước nội thất",                 uom: "m²",     qty: 180, cost_price: 55_000,     selling_price: 78_000,     progress_pct: 20,  margin_warning: false },
  { id: 8,  projectId: "PRJ-2025-001", category: "Hoàn thiện",  item_name: "Ốp gạch toilet (60×60)",            uom: "m²",     qty: 24,  cost_price: 380_000,    selling_price: 520_000,    progress_pct: 40,  margin_warning: false },
]

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
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "") + " tỷ"
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + " tr"
  return n.toLocaleString("vi-VN") + " ₫"
}
