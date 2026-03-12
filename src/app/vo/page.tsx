import { mockVOs, mockProjects, fmtVND } from "@/lib/mock-data"
import Link from "next/link"
import { AlertCircle, Plus } from "lucide-react"

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pm_review: "bg-blue-100 text-blue-700",
  customer_pending: "bg-yellow-100 text-yellow-700",
  customer_approved: "bg-teal-100 text-teal-700",
  director_approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}
const statusLabel: Record<string, string> = {
  draft: "Nháp", pm_review: "PM duyệt",
  customer_pending: "Chờ KH", customer_approved: "KH đồng ý",
  director_approved: "GĐ duyệt", rejected: "Từ chối",
}

export default function VOPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            Phát sinh (VO)
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{mockVOs.length} lệnh phát sinh</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Tạo VO mới
        </button>
      </div>

      <div className="grid gap-4">
        {mockVOs.map(vo => {
          const project = mockProjects.find(p => p.id === vo.project_id)
          return (
            <Link key={vo.id} href={`/vo/${vo.id}`}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-orange-200 transition-all">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-gray-400">{vo.vo_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[vo.status]}`}>
                      {statusLabel[vo.status]}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{vo.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    📁 {project?.project_name} · 📅 {vo.request_date} · 👤 {vo.requested_by}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-gray-900">{fmtVND(vo.selling_price_vat)}</div>
                  <div className="text-xs text-gray-400">Tổng có VAT ({vo.vat_rate})</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
