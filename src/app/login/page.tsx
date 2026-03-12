"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-store"
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      router.push("/")
    } else {
      setError(result.error ?? "Lỗi đăng nhập")
    }
  }

  const quickLogin = (em: string, pw: string) => {
    setEmail(em)
    setPassword(pw)
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a3a4a 100%)" }}>
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div>
          <Image src="/logo.svg" alt="Thủ Thiêm Construction" width={200} height={50} className="h-12 w-auto object-contain object-left brightness-0 invert" />
        </div>
        <div className="text-white space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Hệ thống quản lý<br />
            <span style={{ color: "#E87625" }}>dự án xây dựng</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm">
            Nền tảng quản lý toàn diện — từ CRM, BOQ, đến giám sát thi công và thanh toán.
          </p>
          <div className="pt-4 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { num: "50+", label: "Dự án hoàn thành" },
              { num: "8", label: "Vai trò hệ thống" },
              { num: "115", label: "Tính năng" },
              { num: "99.9%", label: "Uptime" },
            ].map(({ num, label }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{num}</div>
                <div className="text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-slate-600 text-sm">© 2026 Thủ Thiêm Construction. All rights reserved.</div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Mobile logo */}
            <div className="lg:hidden mb-6 flex justify-center">
              <Image src="/logo.svg" alt="Thủ Thiêm" width={160} height={40} className="h-10 w-auto object-contain" />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Đăng nhập</h2>
              <p className="text-gray-500 mt-1 text-sm">Nhập thông tin tài khoản để tiếp tục</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                    style={{ "--tw-ring-color": "#E87625" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "#E87625" }}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold text-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#E87625" }}>
                {loading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : <LogIn className="w-4 h-4" />}
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Demo quick logins */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Demo nhanh — chọn vai trò</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Admin / GĐ", email: "admin@thuthiem.vn", pw: "admin123" },
                  { label: "PM", email: "pm@thuthiem.vn", pw: "pm123" },
                  { label: "Sales", email: "sales@thuthiem.vn", pw: "sales123" },
                  { label: "QS", email: "qs@thuthiem.vn", pw: "qs123" },
                  { label: "Mua hàng", email: "purchasing@thuthiem.vn", pw: "pur123" },
                  { label: "Kế toán", email: "accountant@thuthiem.vn", pw: "acc123" },
                ].map(({ label, email: em, pw }) => (
                  <button key={em} type="button"
                    onClick={() => quickLogin(em, pw)}
                    className="text-xs py-1.5 px-2 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-lg text-gray-600 hover:text-orange-700 transition text-left truncate">
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Chọn vai trò rồi nhấn Đăng nhập</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
