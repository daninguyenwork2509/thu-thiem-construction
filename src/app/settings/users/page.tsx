"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, MOCK_USERS, ROLE_LABELS, ROLE_COLORS, type UserRole, type AuthUser } from "@/lib/auth-store"
import {
  Users, Plus, Search, Edit2, Trash2, Lock, Unlock,
  ChevronLeft, X, Save, Eye, EyeOff, ShieldCheck
} from "lucide-react"

const ROLES_LIST: { value: UserRole; label: string }[] = Object.entries(ROLE_LABELS).map(
  ([value, label]) => ({ value: value as UserRole, label })
)

interface UserFormData {
  fullName: string
  email: string
  phone: string
  department: string
  role: UserRole
  password: string
  active: boolean
}

const EMPTY_FORM: UserFormData = {
  fullName: "", email: "", phone: "", department: "", role: "pm", password: "", active: true
}

export default function UsersPage() {
  const { state } = useAuth()
  const router = useRouter()

  // Only admin can access
  if (state.user?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Bạn không có quyền truy cập trang này</p>
      </div>
    )
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [users, setUsers] = useState<(AuthUser & { password?: string })[]>(
    MOCK_USERS.map(({ password: _pw, ...u }) => u)
  )
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [search, setSearch] = useState("")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [filterRole, setFilterRole] = useState<UserRole | "">("")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [showModal, setShowModal] = useState(false)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [editUser, setEditUser] = useState<AuthUser | null>(null)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [showPw, setShowPw] = useState(false)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchQ = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchR = !filterRole || u.role === filterRole
    return matchQ && matchR
  })

  const openCreate = () => {
    setEditUser(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (u: AuthUser) => {
    setEditUser(u)
    setForm({ fullName: u.fullName, email: u.email, phone: u.phone ?? "", department: u.department ?? "", role: u.role, password: "", active: u.active })
    setShowModal(true)
  }

  const toggleActive = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  const deleteUser = (id: number) => {
    if (!confirm("Xác nhận xóa người dùng này?")) return
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const handleSave = () => {
    if (!form.fullName || !form.email || !form.role) return
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? {
        ...u, fullName: form.fullName, email: form.email,
        phone: form.phone, department: form.department, role: form.role,
        roleLabel: ROLE_LABELS[form.role], active: form.active,
        avatarInitials: form.fullName.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()
      } : u))
    } else {
      const newUser: AuthUser = {
        id: Date.now(), email: form.email, fullName: form.fullName,
        role: form.role, roleLabel: ROLE_LABELS[form.role],
        avatarInitials: form.fullName.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase(),
        department: form.department, phone: form.phone, active: form.active,
      }
      setUsers(prev => [...prev, newUser])
    }
    setShowModal(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/settings")} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Người dùng & Phân quyền
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý tài khoản và vai trò trong hệ thống</p>
        </div>
        <button onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Tổng người dùng", value: users.length, color: "text-blue-600" },
          { label: "Đang hoạt động", value: users.filter(u => u.active).length, color: "text-green-600" },
          { label: "Bị khóa", value: users.filter(u => !u.active).length, color: "text-red-600" },
          { label: "Vai trò khác nhau", value: new Set(users.map(u => u.role)).size, color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value as UserRole | "")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
          <option value="">Tất cả vai trò</option>
          {ROLES_LIST.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Người dùng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Vai trò</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Phòng ban</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Đăng nhập gần nhất</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: "#E87625" }}>
                      {u.avatarInitials}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{u.fullName}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                    {u.roleLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.department ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.lastLogin ?? "Chưa đăng nhập"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-green-500" : "bg-red-500"}`} />
                    {u.active ? "Hoạt động" : "Bị khóa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)} title="Chỉnh sửa"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(u.id)} title={u.active ? "Khóa tài khoản" : "Mở khóa"}
                      className={`p-1.5 rounded-lg transition ${u.active ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}>
                      {u.active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    {u.id !== state.user?.id && (
                      <button onClick={() => deleteUser(u.id)} title="Xóa"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm">Không tìm thấy người dùng</div>
        )}
      </div>

      {/* Permissions reference */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Phân quyền module theo vai trò</h3>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 pr-3 font-medium text-gray-600">Module</th>
                {ROLES_LIST.map(r => (
                  <th key={r.value} className="text-center px-2 py-1.5 font-medium text-gray-600 min-w-[70px]">{r.label.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { module: "Dashboard", perms: ["admin","pm","sales","qs","purchasing","accountant","site","qa"] },
                { module: "CRM / Lead", perms: ["admin","sales"] },
                { module: "Dự án", perms: ["admin","pm","sales","qs","site","qa"] },
                { module: "BOQ / Dự toán", perms: ["admin","pm","qs"] },
                { module: "Nhà thầu", perms: ["admin","pm","qs","purchasing"] },
                { module: "Vật tư", perms: ["admin","pm","purchasing"] },
                { module: "Phát sinh (VO)", perms: ["admin","pm","qs","site"] },
                { module: "Dòng tiền", perms: ["admin","accountant"] },
                { module: "Báo cáo", perms: ["admin","pm","accountant"] },
                { module: "Cài đặt", perms: ["admin"] },
              ].map(row => (
                <tr key={row.module} className="hover:bg-gray-50">
                  <td className="py-1.5 pr-3 font-medium text-gray-700">{row.module}</td>
                  {ROLES_LIST.map(r => (
                    <td key={r.value} className="text-center px-2 py-1.5">
                      {row.perms.includes(r.value) ? "✅" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phòng ban</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vai trò *</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {ROLES_LIST.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select value={form.active ? "1" : "0"} onChange={e => setForm(f => ({ ...f, active: e.target.value === "1" }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    <option value="1">Hoạt động</option>
                    <option value="0">Khóa</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{editUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                Hủy
              </button>
              <button onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium transition"
                style={{ backgroundColor: "#E87625" }}>
                <Save className="w-4 h-4" />
                {editUser ? "Lưu thay đổi" : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
