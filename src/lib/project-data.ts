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

export const PIPELINE_ITEMS: PipelineItem[] = [
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
    deadline: "2026-03-31", priority: "high", tags: ["Pháp lý"], voCount: 1,
    pm: "Lê Minh Tuấn", designer: "Trần Thị Bình", qs: "Hoàng Văn Nam",
    address: "Tầng 22, Landmark 81, Q.Bình Thạnh", contractDate: "2026-01-15",
    startDate: "2026-03-01", totalPaid: 600_000_000, totalDebt: 900_000_000,
    marginPct: 23, permitOk: false },
  { id: "p1", type: "project", name: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", client: "Nguyễn Văn An", phone: "0912 222 333",
    value: 820_000_000, stage: "construction", responsible: "Trần Thị Bình", responsibleInitials: "BT", responsibleColor: "bg-orange-500",
    progress: 48, deadline: "2025-08-31", priority: "high", tags: ["Đúng tiến độ"], voCount: 3,
    pm: "Trần Thị Bình", designer: "Trần Thị Bình", qs: "Hoàng Văn Nam",
    address: "Căn hộ Mỹ Khánh, Phú Mỹ Hưng, Q.7", contractDate: "2025-02-01",
    startDate: "2025-02-05", totalPaid: 410_000_000, totalDebt: 410_000_000,
    marginPct: 22, permitOk: true },
  { id: "p4", type: "project", name: "Villa Thảo Điền – Q.2", client: "Lê Quang Vinh", phone: "0923 333 444",
    value: 3_500_000_000, stage: "construction", responsible: "Lê Minh Tuấn", responsibleInitials: "TL", responsibleColor: "bg-teal-500",
    progress: 32, deadline: "2026-06-30", priority: "medium", tags: ["Trễ 1 tuần"], voCount: 2,
    pm: "Lê Minh Tuấn", designer: "Nguyễn Thu Hà", qs: "Phạm Văn Đức",
    address: "Khu biệt thự Thảo Điền, Q.2", contractDate: "2025-10-01",
    startDate: "2025-10-15", totalPaid: 1_400_000_000, totalDebt: 2_100_000_000,
    marginPct: 25, permitOk: true },
  { id: "p5", type: "project", name: "Nhà phố Bình Thạnh – Q.BT", client: "Vũ Thị Mai", phone: "0934 444 555",
    value: 1_800_000_000, stage: "construction", responsible: "Trần Thị Bình", responsibleInitials: "BT", responsibleColor: "bg-orange-500",
    progress: 71, deadline: "2026-05-15", priority: "medium", tags: ["Đúng tiến độ"],
    pm: "Trần Thị Bình", designer: "Lê Văn Nam", qs: "Hoàng Văn Nam",
    address: "152 Bình Lợi, Q.Bình Thạnh", contractDate: "2025-11-01",
    startDate: "2025-11-15", totalPaid: 900_000_000, totalDebt: 900_000_000,
    marginPct: 21, permitOk: true },
  { id: "p6", type: "project", name: "Căn hộ Vinhomes Central", client: "Bùi Ngọc Anh", phone: "0945 555 666",
    value: 950_000_000, stage: "payment", responsible: "Hoàng Lan Anh", responsibleInitials: "AL", responsibleColor: "bg-green-500",
    deadline: "2026-04-10", priority: "high", tags: ["Quá hạn"], voCount: 1,
    pm: "Hoàng Lan Anh", designer: "Trần Thị Bình", qs: "Phạm Văn Đức",
    address: "Vinhomes Central Park, Q.Bình Thạnh", contractDate: "2025-09-01",
    startDate: "2025-09-15", totalPaid: 800_000_000, totalDebt: 150_000_000,
    marginPct: 19, permitOk: true },
  { id: "p7", type: "project", name: "Shophouse Ecopark – Hưng Yên", client: "Cty Đại Phát", phone: "0956 666 777",
    value: 2_100_000_000, stage: "payment", responsible: "Hoàng Lan Anh", responsibleInitials: "AL", responsibleColor: "bg-green-500",
    deadline: "2026-04-20", priority: "medium", tags: ["Đợt 4/5"],
    pm: "Hoàng Lan Anh", designer: "Lê Văn Nam", qs: "Nguyễn Thu Hà",
    address: "Khu đô thị Ecopark, Văn Giang, Hưng Yên", contractDate: "2025-07-01",
    startDate: "2025-07-15", totalPaid: 1_680_000_000, totalDebt: 420_000_000,
    marginPct: 24, permitOk: true },
  { id: "p3", type: "project", name: "Biệt thự Song Long – Thủ Đức", client: "Phạm Thị Hoa", phone: "0967 777 888",
    value: 2_200_000_000, stage: "handover", responsible: "Trần Thị Bình", responsibleInitials: "BT", responsibleColor: "bg-orange-500",
    progress: 100, deadline: "2024-11-30", priority: "low", tags: ["Hoàn thành"],
    pm: "Trần Thị Bình", designer: "Nguyễn Thu Hà", qs: "Hoàng Văn Nam",
    address: "Khu biệt thự Song Long, TP.Thủ Đức", contractDate: "2024-01-10",
    startDate: "2024-01-15", totalPaid: 2_200_000_000, totalDebt: 0,
    marginPct: 26, permitOk: true },
]

export const PIPELINE_VOS: VOItem[] = [
  { id: "vo1", projectId: "p1", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    title: "Thay đổi vật liệu sàn tầng 3", reason: "Khách hàng yêu cầu nâng cấp từ gạch 60x60 lên đá marble nhập",
    amount: 45_000_000, status: "approved", requestedBy: "Trần Thị Bình", date: "2026-02-15" },
  { id: "vo2", projectId: "p1", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    title: "Bổ sung điểm điện phòng làm việc", reason: "Phát sinh 4 ổ cắm + 2 đèn theo yêu cầu",
    amount: 12_000_000, status: "pending", requestedBy: "Vũ Đình Mạnh", date: "2026-03-01" },
  { id: "vo3", projectId: "p1", projectName: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    title: "Thêm vách ngăn phòng ngủ", reason: "Điều chỉnh layout theo yêu cầu gia chủ",
    amount: 28_000_000, status: "pending", requestedBy: "Trần Thị Bình", date: "2026-03-05" },
  { id: "vo4", projectId: "p4", projectName: "Villa Thảo Điền – Q.2",
    title: "Nâng cấp hệ thống điện NLMT", reason: "Chủ đầu tư bổ sung yêu cầu sau khi ký HĐ",
    amount: 180_000_000, status: "approved", requestedBy: "Lê Minh Tuấn", date: "2026-01-20" },
  { id: "vo5", projectId: "p4", projectName: "Villa Thảo Điền – Q.2",
    title: "Thay đổi thiết kế hồ bơi", reason: "Thay hồ bơi 5m thành 8m + jacuzzi",
    amount: 220_000_000, status: "pending", requestedBy: "Lê Minh Tuấn", date: "2026-02-28" },
  { id: "vo6", projectId: "p6", projectName: "Căn hộ Vinhomes Central",
    title: "Bổ sung hệ thống điều hòa âm trần", reason: "Yêu cầu nâng cấp từ điều hòa treo tường",
    amount: 65_000_000, status: "rejected", requestedBy: "Hoàng Lan Anh", date: "2026-02-10" },
  { id: "vo7", projectId: "p2", projectName: "Văn phòng Landmark 81 – T22",
    title: "Thêm phòng họp tầng 22", reason: "Cơ cấu tổ chức thay đổi, cần 1 phòng họp nhỏ bổ sung",
    amount: 95_000_000, status: "pending", requestedBy: "Lê Minh Tuấn", date: "2026-03-10" },
]

export const PROJECT_BOQ: BOQLine[] = [
  // p1 – Căn hộ Mỹ Khánh
  { id: 1, projectId: "p1", category: "Phần thô", item_name: "Đập tường cũ & xử lý mặt bằng", uom: "m²", qty: 45, cost_price: 180_000, selling_price: 250_000, progress_pct: 100, margin_warning: false },
  { id: 2, projectId: "p1", category: "Phần thô", item_name: "Xây tường ngăn mới (gạch nhẹ)", uom: "m²", qty: 32, cost_price: 320_000, selling_price: 420_000, progress_pct: 80, margin_warning: false },
  { id: 3, projectId: "p1", category: "Điện – M&E", item_name: "Hệ thống điện âm tường toàn căn", uom: "điểm", qty: 60, cost_price: 450_000, selling_price: 580_000, progress_pct: 60, margin_warning: false },
  { id: 4, projectId: "p1", category: "Điện – M&E", item_name: "Thi công điều hòa trung tâm", uom: "bộ", qty: 3, cost_price: 12_500_000, selling_price: 15_800_000, progress_pct: 0, margin_warning: false },
  { id: 5, projectId: "p1", category: "Nội thất", item_name: "Tủ bếp gỗ MDF Melamine", uom: "m dài", qty: 5.2, cost_price: 3_800_000, selling_price: 4_200_000, progress_pct: 0, margin_warning: true },
  { id: 6, projectId: "p1", category: "Nội thất", item_name: "Sàn gỗ công nghiệp 12mm", uom: "m²", qty: 68, cost_price: 420_000, selling_price: 560_000, progress_pct: 0, margin_warning: false },
  { id: 7, projectId: "p1", category: "Hoàn thiện", item_name: "Sơn nước nội thất", uom: "m²", qty: 180, cost_price: 55_000, selling_price: 78_000, progress_pct: 20, margin_warning: false },
  { id: 8, projectId: "p1", category: "Hoàn thiện", item_name: "Ốp gạch toilet (60×60)", uom: "m²", qty: 24, cost_price: 380_000, selling_price: 520_000, progress_pct: 40, margin_warning: false },
  // p2 – Văn phòng Landmark 81
  { id: 20, projectId: "p2", category: "Phần thô", item_name: "Cải tạo vách ngăn văn phòng", uom: "m²", qty: 120, cost_price: 280_000, selling_price: 380_000, progress_pct: 0, margin_warning: false },
  { id: 21, projectId: "p2", category: "Điện – M&E", item_name: "Hệ thống điện chiếu sáng văn phòng", uom: "điểm", qty: 150, cost_price: 380_000, selling_price: 520_000, progress_pct: 0, margin_warning: false },
  { id: 22, projectId: "p2", category: "Nội thất", item_name: "Vách kính cường lực phòng họp", uom: "m²", qty: 45, cost_price: 1_800_000, selling_price: 2_400_000, progress_pct: 0, margin_warning: false },
  { id: 23, projectId: "p2", category: "Hoàn thiện", item_name: "Sơn nội thất văn phòng", uom: "m²", qty: 500, cost_price: 52_000, selling_price: 72_000, progress_pct: 0, margin_warning: false },
  // p3 – Biệt thự Song Long
  { id: 30, projectId: "p3", category: "Phần thô", item_name: "Phần móng & kết cấu biệt thự", uom: "m³", qty: 85, cost_price: 2_800_000, selling_price: 3_800_000, progress_pct: 100, margin_warning: false },
  { id: 31, projectId: "p3", category: "Nội thất", item_name: "Nội thất cao cấp toàn biệt thự", uom: "trọn gói", qty: 1, cost_price: 680_000_000, selling_price: 820_000_000, progress_pct: 100, margin_warning: false },
  // p4 – Villa Thảo Điền
  { id: 40, projectId: "p4", category: "Phần thô", item_name: "Thi công phần thô biệt thự", uom: "m²", qty: 350, cost_price: 2_200_000, selling_price: 2_900_000, progress_pct: 80, margin_warning: false },
  { id: 41, projectId: "p4", category: "Hồ bơi", item_name: "Hồ bơi ngoài trời 8m×4m", uom: "trọn gói", qty: 1, cost_price: 185_000_000, selling_price: 250_000_000, progress_pct: 20, margin_warning: false },
  { id: 42, projectId: "p4", category: "Nội thất", item_name: "Nội thất cao cấp biệt thự", uom: "trọn gói", qty: 1, cost_price: 420_000_000, selling_price: 550_000_000, progress_pct: 0, margin_warning: false },
  // p5 – Nhà phố Bình Thạnh
  { id: 50, projectId: "p5", category: "Phần thô", item_name: "Kết cấu nhà phố 4 tầng", uom: "m²", qty: 220, cost_price: 3_500_000, selling_price: 4_500_000, progress_pct: 90, margin_warning: false },
  { id: 51, projectId: "p5", category: "Hoàn thiện", item_name: "Hoàn thiện nội ngoại thất", uom: "m²", qty: 800, cost_price: 680_000, selling_price: 900_000, progress_pct: 40, margin_warning: false },
  // p6 – Vinhomes Central
  { id: 60, projectId: "p6", category: "Phần thô", item_name: "Cải tạo căn hộ full", uom: "m²", qty: 95, cost_price: 1_200_000, selling_price: 1_600_000, progress_pct: 100, margin_warning: false },
  { id: 61, projectId: "p6", category: "Nội thất", item_name: "Bộ nội thất phòng khách + ngủ", uom: "trọn gói", qty: 1, cost_price: 350_000_000, selling_price: 420_000_000, progress_pct: 100, margin_warning: false },
]

// Stage → timeline step index (0-based)
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
