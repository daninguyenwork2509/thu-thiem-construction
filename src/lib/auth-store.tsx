"use client"
import { createContext, useContext, useReducer, useEffect, type Dispatch } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "pm" | "sales" | "qs" | "purchasing" | "accountant" | "site" | "qa"

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: UserRole
  roleLabel: string
  avatarInitials: string
  department?: string
  phone?: string
  active: boolean
  lastLogin?: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}

type AuthAction =
  | { type: "LOGIN"; user: AuthUser }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; value: boolean }

// ── Mock Users ────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị / Giám đốc",
  pm: "Project Manager",
  sales: "Sales / CRM",
  qs: "Quantity Surveyor",
  purchasing: "Mua hàng",
  accountant: "Kế toán",
  site: "Quản lý công trình",
  qa: "QA/QC",
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  pm: "bg-blue-100 text-blue-700",
  sales: "bg-green-100 text-green-700",
  qs: "bg-purple-100 text-purple-700",
  purchasing: "bg-orange-100 text-orange-700",
  accountant: "bg-yellow-100 text-yellow-700",
  site: "bg-teal-100 text-teal-700",
  qa: "bg-pink-100 text-pink-700",
}

export const MOCK_USERS: (AuthUser & { password: string })[] = [
  { id: 1, email: "admin@thuthiem.vn", password: "admin123", fullName: "Nguyễn Văn An", role: "admin", roleLabel: ROLE_LABELS.admin, avatarInitials: "AN", department: "Ban Giám đốc", phone: "0901234567", active: true, lastLogin: "2026-03-12 08:30" },
  { id: 2, email: "pm@thuthiem.vn", password: "pm123", fullName: "Trần Thị Bình", role: "pm", roleLabel: ROLE_LABELS.pm, avatarInitials: "TB", department: "Phòng dự án", phone: "0912345678", active: true, lastLogin: "2026-03-12 09:00" },
  { id: 3, email: "sales@thuthiem.vn", password: "sales123", fullName: "Nguyễn Thu Hà", role: "sales", roleLabel: ROLE_LABELS.sales, avatarInitials: "TH", department: "Phòng kinh doanh", phone: "0923456789", active: true, lastLogin: "2026-03-11 14:20" },
  { id: 4, email: "qs@thuthiem.vn", password: "qs123", fullName: "Lê Minh Quân", role: "qs", roleLabel: ROLE_LABELS.qs, avatarInitials: "MQ", department: "Phòng kỹ thuật", phone: "0934567890", active: true, lastLogin: "2026-03-12 07:45" },
  { id: 5, email: "purchasing@thuthiem.vn", password: "pur123", fullName: "Phạm Thị Lan", role: "purchasing", roleLabel: ROLE_LABELS.purchasing, avatarInitials: "PL", department: "Phòng mua hàng", phone: "0945678901", active: true, lastLogin: "2026-03-10 16:00" },
  { id: 6, email: "accountant@thuthiem.vn", password: "acc123", fullName: "Hồ Thị Thảo", role: "accountant", roleLabel: ROLE_LABELS.accountant, avatarInitials: "HT", department: "Phòng tài chính", phone: "0956789012", active: true, lastLogin: "2026-03-12 08:00" },
  { id: 7, email: "site@thuthiem.vn", password: "site123", fullName: "Vũ Đình Mạnh", role: "site", roleLabel: ROLE_LABELS.site, avatarInitials: "DM", department: "Ban thi công", phone: "0967890123", active: true, lastLogin: "2026-03-12 06:30" },
  { id: 8, email: "qa@thuthiem.vn", password: "qa123", fullName: "Đặng Thị Hương", role: "qa", roleLabel: ROLE_LABELS.qa, avatarInitials: "DH", department: "Phòng QA/QC", phone: "0978901234", active: false, lastLogin: "2026-03-05 10:00" },
]

// ── Nav permissions per role ──────────────────────────────────────────────────

export const ROLE_NAV_PERMISSIONS: Record<UserRole, string[]> = {
  admin:      ["/", "/leads", "/projects", "/boq", "/contractors", "/materials", "/vo", "/payment", "/qa", "/documents", "/drawings", "/reports", "/settings"],
  pm:         ["/", "/projects", "/boq", "/contractors", "/materials", "/vo", "/payment", "/qa", "/documents", "/drawings", "/reports"],
  sales:      ["/", "/leads", "/projects", "/documents"],
  qs:         ["/", "/boq", "/projects", "/contractors", "/vo", "/drawings", "/documents"],
  purchasing: ["/", "/materials", "/contractors", "/documents"],
  accountant: ["/", "/payment", "/reports", "/documents"],
  site:       ["/", "/projects", "/vo", "/qa", "/drawings"],
  qa:         ["/", "/projects", "/qa", "/drawings", "/documents"],
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN": return { ...state, user: action.user, isLoading: false }
    case "LOGOUT": return { ...state, user: null, isLoading: false }
    case "SET_LOADING": return { ...state, isLoading: action.value }
    default: return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<{
  state: AuthState
  dispatch: Dispatch<AuthAction>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  can: (path: string) => boolean
} | null>(null)

const SESSION_KEY = "tt_auth_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, isLoading: true })

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        dispatch({ type: "LOGIN", user: JSON.parse(stored) })
      } else {
        dispatch({ type: "SET_LOADING", value: false })
      }
    } catch {
      dispatch({ type: "SET_LOADING", value: false })
    }
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", value: true })
    await new Promise(r => setTimeout(r, 600)) // simulate API delay
    const found = MOCK_USERS.find(u => u.email === email && u.password === password)
    if (!found) {
      dispatch({ type: "SET_LOADING", value: false })
      return { ok: false, error: "Email hoặc mật khẩu không đúng" }
    }
    if (!found.active) {
      dispatch({ type: "SET_LOADING", value: false })
      return { ok: false, error: "Tài khoản đã bị khóa. Liên hệ Admin." }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...user } = found
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    dispatch({ type: "LOGIN", user })
    return { ok: true }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    dispatch({ type: "LOGOUT" })
  }

  const can = (path: string) => {
    if (!state.user) return false
    const perms = ROLE_NAV_PERMISSIONS[state.user.role]
    return perms.includes(path) || perms.some(p => p !== "/" && path.startsWith(p))
  }

  return <AuthContext.Provider value={{ state, dispatch, login, logout, can }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
