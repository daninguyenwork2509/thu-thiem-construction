"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, ROLE_COLORS } from "@/lib/auth-store"
import { ChevronLeft, Save, Eye, EyeOff, User } from "lucide-react"

export default function ProfilePage() {
  const { state } = useAuth()
  const router = useRouter()
  const user = state.user

  const [name, setName] = useState(user?.fullName ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/settings")} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: "#E87625" }}>
            {user.avatarInitials}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
              {user.roleLabel}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input value={user.email} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          Đổi mật khẩu
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
                placeholder="Để trống nếu không muốn đổi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${pw && pw2 && pw !== pw2 ? "border-red-400" : "border-gray-300"}`} />
            {pw && pw2 && pw !== pw2 && <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>}
          </div>
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium transition"
        style={{ backgroundColor: saved ? "#22c55e" : "#E87625" }}>
        <Save className="w-4 h-4" />
        {saved ? "Đã lưu!" : "Lưu thay đổi"}
      </button>
    </div>
  )
}
