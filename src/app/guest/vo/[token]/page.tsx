import { mockVOs, fmtVND } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { CheckCircle, XCircle, Phone, Calendar, FileText } from "lucide-react"
import Image from "next/image"

export default async function GuestVOPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const vo = mockVOs.find(v => v.guest_link_token === token)
  if (!vo) return notFound()

  const isPending = vo.customer_status === "pending"
  const isApproved = vo.customer_status === "approved"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-lg">
        {/* Header branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/20 mb-4">
            <Image src="/logo.svg" alt="Thủ Thiêm Construction" width={180} height={45} className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">Xác nhận Phát sinh</h1>
          <p className="text-slate-400 text-sm mt-1">Vui lòng xem xét và xác nhận hạng mục phát sinh bên dưới</p>
        </div>

        {/* VO Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Status banner */}
          {isApproved && (
            <div className="bg-green-500 text-white text-center py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Quý khách đã xác nhận đồng ý
            </div>
          )}
          {vo.customer_status === "rejected" && (
            <div className="bg-red-500 text-white text-center py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Quý khách đã từ chối hạng mục này
            </div>
          )}

          <div className="p-6">
            {/* VO info */}
            <div className="mb-5">
              <div className="text-xs text-gray-400 font-mono mb-1">{vo.vo_code}</div>
              <h2 className="text-xl font-bold text-gray-900">{vo.title}</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {vo.request_date}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {vo.requested_by}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <FileText className="w-3.5 h-3.5" /> Mô tả công việc
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{vo.description}</p>
            </div>

            {/* Pricing */}
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Chi phí phát sinh
              </div>
              <div className="divide-y divide-gray-50">
                <PriceRow label="Đơn giá dịch vụ" value={fmtVND(vo.selling_price)} />
                <PriceRow label={`Thuế VAT (${vo.vat_rate})`} value={fmtVND(vo.selling_price_vat - vo.selling_price)} />
                <div className="px-4 py-3 flex items-center justify-between bg-orange-50">
                  <span className="font-bold text-gray-900">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-orange-600">{fmtVND(vo.selling_price_vat)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {isPending ? (
              <div className="space-y-3">
                <button className="w-full text-white font-semibold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg"
                  style={{ backgroundColor: "#E87625" }}>
                  <CheckCircle className="w-5 h-5" />
                  Tôi đồng ý — Xác nhận hạng mục
                </button>
                <button className="w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-400 font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Từ chối hạng mục này
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Bằng cách nhấn "Đồng ý", quý khách xác nhận chấp thuận hạng mục phát sinh và chi phí tương ứng.
                </p>
              </div>
            ) : isApproved ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-6 py-3 rounded-xl font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Đã xác nhận đồng ý
                </div>
                <p className="text-sm text-gray-400 mt-3">Cảm ơn quý khách! Chúng tôi sẽ tiến hành thực hiện ngay.</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-6 py-3 rounded-xl font-medium">
                  <XCircle className="w-5 h-5" />
                  Đã từ chối
                </div>
                <p className="text-sm text-gray-400 mt-3">Chúng tôi đã ghi nhận. PM sẽ liên hệ lại với quý khách.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-500 text-xs">
          <p>Liên hệ hỗ trợ: <span className="text-orange-400">0901 234 567</span></p>
          <p className="mt-1">© 2025 Thủ Thiêm Construction. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}
