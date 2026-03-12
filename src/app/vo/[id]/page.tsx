import { mockVOs, mockProjects, fmtVND } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react"
import Link from "next/link"

const voStatusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  pm_review: "bg-blue-100 text-blue-700 border-blue-200",
  customer_pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  customer_approved: "bg-teal-100 text-teal-700 border-teal-200",
  director_approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
}
const voStatusLabel: Record<string, string> = {
  draft: "Nháp", pm_review: "PM đang duyệt",
  customer_pending: "Chờ KH xác nhận", customer_approved: "KH đồng ý",
  director_approved: "Giám đốc đã duyệt chi", rejected: "Từ chối",
}

const steps = ["draft", "pm_review", "customer_pending", "customer_approved", "director_approved"]
const stepLabels = ["Nháp", "PM duyệt", "Chờ KH", "KH đồng ý", "GĐ duyệt"]

export default async function VODetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vo = mockVOs.find(v => v.id === Number(id))
  if (!vo) return notFound()

  const project = mockProjects.find(p => p.id === vo.project_id)
  const currentStep = steps.indexOf(vo.status)

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/vo" className="text-gray-400 hover:text-orange-500 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Phát sinh (VO)
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">{vo.vo_code}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">{vo.vo_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${voStatusColor[vo.status]}`}>
                {voStatusLabel[vo.status]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{vo.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              📁 {project?.project_name} · 📅 {vo.request_date} · 👤 {vo.requested_by}
            </p>
          </div>

          {/* Action button based on status */}
          {vo.status === "draft" && (
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Send className="w-4 h-4" /> Gửi PM duyệt
            </button>
          )}
          {vo.status === "pm_review" && (
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> PM Duyệt & Gửi KH
            </button>
          )}
          {vo.status === "customer_pending" && (
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> [Demo] KH Đồng ý
              </button>
              <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
                <XCircle className="w-4 h-4" /> [Demo] KH Từ chối
              </button>
            </div>
          )}
          {vo.status === "customer_approved" && (
            <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> GĐ Duyệt chi
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center">
            {steps.map((step, i) => {
              const done = i < currentStep
              const active = i === currentStep
              const isRejected = vo.status === "rejected"
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex flex-col items-center`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                      ${isRejected && i >= currentStep ? "border-red-300 bg-red-50 text-red-400"
                        : done ? "border-green-500 bg-green-500 text-white"
                        : active ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-200 bg-white text-gray-400"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div className={`text-xs mt-1 text-center w-16 ${active ? "text-orange-600 font-medium" : done ? "text-green-600" : "text-gray-400"}`}>
                      {stepLabels[i]}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Price info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Giá phát sinh</h2>
          <div className="space-y-3">
            <Row label="Chi phí ước tính (nội bộ)" value={fmtVND(vo.estimated_cost)} />
            <Row label="Đơn giá bán" value={fmtVND(vo.selling_price)} />
            <Row label="VAT" value={vo.vat_rate} />
            <div className="pt-3 border-t border-gray-100">
              <Row label="Tổng cộng (VAT)" value={fmtVND(vo.selling_price_vat)} bold />
            </div>
          </div>
        </div>

        {/* Description + Customer response */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Mô tả</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{vo.description}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Phản hồi Khách hàng</h2>
            <div className="space-y-2">
              <Row label="Trạng thái" value={
                vo.customer_status === "approved" ? "✅ Đã đồng ý" :
                vo.customer_status === "rejected" ? "❌ Từ chối" : "⏳ Chờ phản hồi"
              } />
              {vo.guest_link_token && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Link gửi KH</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 flex-1 truncate">
                      /guest/vo/{vo.guest_link_token}
                    </code>
                    <button className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600">
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-gray-900 text-base" : "font-medium text-gray-700"}`}>{value}</span>
    </div>
  )
}
