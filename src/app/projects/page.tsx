"use client"
import { useState } from "react"
import Link from "next/link"
import { FolderKanban, Plus, FileText } from "lucide-react"
import { useAppStore } from "@/lib/app-store"
import ProjectModal from "@/components/ProjectModal"

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)

const statusColor: Record<string, string> = {
  under_construction: "bg-blue-100 text-blue-700 border-blue-200",
  legal_check: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  inspecting: "bg-purple-100 text-purple-700 border-purple-200",
}
const statusLabel: Record<string, string> = {
  under_construction: "Đang thi công", legal_check: "Kiểm tra pháp lý",
  completed: "Hoàn thành", draft: "Nháp", inspecting: "Nghiệm thu",
}

function Stat({ label, value, color = "text-gray-800" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className={`font-semibold text-sm ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}

export default function ProjectsPage() {
  const { state } = useAppStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-orange-500" />
            Dự án
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{state.projects.length} dự án đang theo dõi</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" /> Tạo dự án
        </button>
      </div>

      <div className="grid gap-4">
        {state.projects.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-orange-200 transition-all">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">{p.project_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[p.project_status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {statusLabel[p.project_status] ?? p.project_status}
                  </span>
                  {!p.has_building_permit && p.project_status !== "draft" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">⚠ Thiếu GP thi công</span>
                  )}
                  {p.from_lead_id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">🔄 Từ Lead</span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mt-1 truncate">{p.project_name}</h2>
                <div className="text-sm text-gray-500 mt-0.5">
                  👤 {p.customer_name} · PM: {p.pm_name} · 📞 {p.customer_phone}
                </div>
              </div>
              <div className="flex gap-6 text-center shrink-0">
                <Stat label="Hợp đồng" value={fmtVND(p.contract_value)} />
                <Stat label="Đã thu" value={fmtVND(p.total_paid)} color="text-green-600" />
                <Stat label="Còn nợ" value={fmtVND(p.total_outstanding_debt)} color={p.total_outstanding_debt > 0 ? "text-red-500" : "text-gray-400"} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Tiến độ thi công</span><span>{p.progress_pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.progress_pct}%`, backgroundColor: "#E87625" }} />
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500 shrink-0">
                <span>📋 <b>{p.boq_count}</b> BOQ</span>
                <span>⚡ <b>{p.vo_count}</b> VO</span>
                <span>💰 <b>{p.milestone_count}</b> Mốc</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/projects/${p.id}/boq`}
                  className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#E87625" }}>
                  <FileText className="w-3.5 h-3.5" /> Bóc tách BOQ
                </Link>
                <Link href={`/projects/${p.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  Chi tiết
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && <ProjectModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}
