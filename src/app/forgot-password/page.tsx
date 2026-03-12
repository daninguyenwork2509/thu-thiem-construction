"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react"
import { MOCK_USERS } from "@/lib/auth-store"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const exists = MOCK_USERS.some(u => u.email === email)
    setLoading(false)
    if (!exists) {
      setError("Email không tồn tại trong hệ thống")
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a3a4a 100%)" }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Thủ Thiêm" width={160} height={40} className="h-10 w-auto object-contain" />
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Email đã được gửi!</h2>
              <p className="text-gray-500 text-sm">
                Link đặt lại mật khẩu đã được gửi đến <strong>{email}</strong>.<br />
                Vui lòng kiểm tra hộp thư (bao gồm cả Spam).
              </p>
              <div className="pt-2">
                <Link href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: "#E87625" }}>
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Nhập email của bạn để nhận link đặt lại mật khẩu.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" required autoFocus
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold text-sm transition disabled:opacity-70"
                  style={{ backgroundColor: "#E87625" }}>
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : <Send className="w-4 h-4" />}
                  {loading ? "Đang gửi..." : "Gửi link đặt lại"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
