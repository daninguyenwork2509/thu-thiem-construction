"use client"
import { useState } from "react"
import { ArrowLeft, Send, Camera, CheckCircle } from "lucide-react"
import Link from "next/link"
import { mockProjects } from "@/lib/mock-data"

export default function NewVOPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    project_id: "1",
    title: "",
    description: "",
    estimated_cost: "",
  })

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-900/50 border border-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Đã gửi PM!</h2>
          <p className="text-slate-400 text-sm mb-6">Lệnh phát sinh đã được tạo và gửi cho PM xem xét.</p>
          <Link href="/site" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Về trang chính
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/site" className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="font-semibold">Tạo lệnh phát sinh (VO)</div>
          <div className="text-xs text-slate-400">Điền thông tin và gửi PM duyệt</div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
        {/* Project select */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Dự án</label>
          <select
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            {mockProjects.filter(p => p.project_status === "under_construction").map(p => (
              <option key={p.id} value={String(p.id)}>{p.project_name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tiêu đề phát sinh *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="VD: Thêm đèn LED phòng ngủ master..."
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Mô tả chi tiết</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Mô tả nội dung công việc phát sinh, vật liệu cần dùng..."
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        {/* Estimated cost */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Chi phí ước tính (VNĐ)</label>
          <input
            type="number"
            value={form.estimated_cost}
            onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))}
            placeholder="VD: 5000000"
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          <p className="text-xs text-slate-500 mt-1">PM sẽ định giá bán lại. Đây chỉ là chi phí sơ bộ.</p>
        </div>

        {/* Photo attach */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Ảnh đính kèm</label>
          <button className="w-full border-2 border-dashed border-slate-600 hover:border-slate-400 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors">
            <Camera className="w-8 h-8" />
            <span className="text-sm">Chụp / Chọn ảnh từ máy</span>
            <span className="text-xs">Hỗ trợ JPG, PNG — tối đa 10MB</span>
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={() => setSubmitted(true)}
          disabled={!form.title}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Send className="w-4 h-4" />
          Gửi PM xem xét
        </button>

        <p className="text-center text-xs text-slate-500">
          VO sẽ được lưu offline nếu mất mạng và tự đồng bộ khi có kết nối.
        </p>
      </div>
    </div>
  )
}
