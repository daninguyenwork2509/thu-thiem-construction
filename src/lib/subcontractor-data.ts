export interface Subcontractor {
  id: number
  name: string
  specialty: string
  specialtyTags: string[]   // tags để match với category
  contactPhone: string
  contactName: string
  rating: number            // 0–5
  completedJobs: number
  status: "ACTIVE" | "INACTIVE"
  notes?: string
}

export const SUBCONTRACTORS: Subcontractor[] = [
  {
    id: 1, name: "Đội thợ Minh Phúc", specialty: "Phần thô & Xây tô",
    specialtyTags: ["xây dựng", "tháo dỡ", "xây tô", "bê tông", "phần thô"],
    contactPhone: "0901 111 222", contactName: "Anh Phúc",
    rating: 4.5, completedJobs: 38, status: "ACTIVE",
    notes: "Đội quen, thường xuyên hợp tác từ 2022",
  },
  {
    id: 2, name: "Công ty Điện Hoàng Long", specialty: "M&E & Điện",
    specialtyTags: ["m&e", "điện", "điều hòa", "cơ điện", "ống nước"],
    contactPhone: "0902 333 444", contactName: "Kỹ sư Long",
    rating: 4.8, completedJobs: 52, status: "ACTIVE",
  },
  {
    id: 3, name: "Đội Nội Thất An Khang", specialty: "Nội thất gỗ",
    specialtyTags: ["nội thất", "gỗ", "tủ bếp", "sàn gỗ", "đồ mộc"],
    contactPhone: "0903 555 666", contactName: "Anh Khang",
    rating: 4.3, completedJobs: 24, status: "ACTIVE",
    notes: "Giá cạnh tranh, cần kiểm tra chất lượng kỹ",
  },
  {
    id: 4, name: "Thợ Sơn Quốc Bảo", specialty: "Hoàn thiện & Sơn",
    specialtyTags: ["sơn", "hoàn thiện", "trát tường", "ốp lát", "sơn nước"],
    contactPhone: "0904 777 888", contactName: "Anh Bảo",
    rating: 4.6, completedJobs: 61, status: "ACTIVE",
  },
  {
    id: 5, name: "Gạch Ốp Lát Tiến Thành", specialty: "Ốp lát & Gạch",
    specialtyTags: ["ốp lát", "gạch", "toilet", "sàn gạch", "hoàn thiện"],
    contactPhone: "0905 999 000", contactName: "Anh Thành",
    rating: 4.4, completedJobs: 45, status: "ACTIVE",
  },
  {
    id: 6, name: "Đội thợ Thanh Hùng", specialty: "Phần thô & Xây tô",
    specialtyTags: ["xây dựng", "tháo dỡ", "xây tô", "phần thô"],
    contactPhone: "0906 111 333", contactName: "Anh Hùng",
    rating: 3.9, completedJobs: 15, status: "ACTIVE",
    notes: "Mới hợp tác, cần theo dõi chặt",
  },
  {
    id: 7, name: "Điện lạnh Bảo Châu", specialty: "M&E & Điện",
    specialtyTags: ["điện", "m&e", "điều hòa", "cơ điện"],
    contactPhone: "0907 444 555", contactName: "Kỹ sư Châu",
    rating: 4.2, completedJobs: 33, status: "ACTIVE",
  },
]

// Match subcontractors based on BOQ category description
export function matchSubcontractors(categoryDescription: string): Subcontractor[] {
  const desc = categoryDescription.toLowerCase()
  return SUBCONTRACTORS.filter(sub =>
    sub.status === "ACTIVE" &&
    sub.specialtyTags.some(tag => desc.includes(tag))
  ).sort((a, b) => b.rating - a.rating)
}

// All active subcontractors (fallback)
export function getAllSubcontractors(): Subcontractor[] {
  return SUBCONTRACTORS.filter(s => s.status === "ACTIVE")
    .sort((a, b) => b.rating - a.rating)
}
