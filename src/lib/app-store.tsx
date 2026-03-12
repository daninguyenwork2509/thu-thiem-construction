"use client"
import { createContext, useContext, useReducer, type Dispatch } from "react"
import { mockLeads, mockProjects } from "@/lib/mock-data"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: number
  customer_name: string
  phone_number: string
  source: string
  estimated_budget: number
  pipeline_status: string
  assigned_sales: string
  is_duplicate_phone: boolean
  created_date: string
  project_type?: string
  notes?: string
  converted?: boolean
}

export interface Project {
  id: number
  project_code: string
  project_name: string
  customer_name: string
  customer_phone: string
  pm_name: string
  contract_value: number
  total_paid: number
  total_outstanding_debt: number
  project_status: string
  start_date: string
  expected_end_date: string
  has_building_permit: boolean
  has_material_board: boolean
  retention_percent: number
  boq_count: number
  milestone_count: number
  vo_count: number
  allocation_count: number
  progress_pct: number
  from_lead_id?: number
}

// ── State + Actions ───────────────────────────────────────────────────────────

type AppState = { leads: Lead[]; projects: Project[] }

export type AppAction =
  | { type: 'ADD_LEAD'; lead: Lead }
  | { type: 'MOVE_LEAD'; id: number; stage: string }
  | { type: 'MARK_LEAD_CONVERTED'; id: number }
  | { type: 'ADD_PROJECT'; project: Project }

// ── Reducer ───────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_LEAD': {
      // Detect duplicate phone at dispatch time
      const isDup = state.leads.some(l => l.phone_number === action.lead.phone_number)
      return { ...state, leads: [...state.leads, { ...action.lead, is_duplicate_phone: isDup }] }
    }
    case 'MOVE_LEAD':
      return { ...state, leads: state.leads.map(l => l.id === action.id ? { ...l, pipeline_status: action.stage } : l) }
    case 'MARK_LEAD_CONVERTED':
      return { ...state, leads: state.leads.map(l => l.id === action.id ? { ...l, converted: true } : l) }
    case 'ADD_PROJECT':
      return { ...state, projects: [action.project, ...state.projects] }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(null)

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    leads: mockLeads as Lead[],
    projects: mockProjects as Project[],
  })
  return <AppStoreContext.Provider value={{ state, dispatch }}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider")
  return ctx
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _projectSeq = 3  // mock data has 3 projects already

export function generateProjectCode() {
  const year = new Date().getFullYear()
  const seq = String(++_projectSeq).padStart(4, "0")
  return `PRJ-${year}-${seq}`
}

let _leadSeq = mockLeads.length

export function generateLeadId() {
  return Date.now() + (++_leadSeq)
}

export function generateProjectId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

export const SALES_STAFF = ["Nguyễn Thu Hà", "Phạm Văn Đức", "Lê Thị Lan", "Trần Quốc Hùng"]
export const PM_STAFF = ["Trần Thị Bình", "Lê Minh Tuấn", "Nguyễn Văn Phong", "Hồ Thị Thảo"]
export const LEAD_SOURCES = ["Facebook", "Referral", "Website", "TikTok", "Zalo", "Triển lãm", "Khác"]
export const PROJECT_TYPES = ["Căn hộ", "Biệt thự", "Nhà phố", "Văn phòng", "Showroom", "Khác"]
export const PIPELINE_STAGES = [
  { key: "new", label: "🆕 Mới" },
  { key: "surveyed", label: "🔍 Khảo sát" },
  { key: "designing", label: "✏️ Thiết kế" },
  { key: "quoting", label: "💬 Báo giá" },
  { key: "won", label: "🏆 Chốt HĐ" },
]
