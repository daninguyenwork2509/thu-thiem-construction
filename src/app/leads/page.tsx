"use client"
import { useState } from "react"
import { Users, Plus, ArrowRight, Rocket } from "lucide-react"
import { useAppStore, PIPELINE_STAGES, type Lead } from "@/lib/app-store"
import LeadModal from "@/components/LeadModal"
import ProjectModal from "@/components/ProjectModal"

const fmtVND = (n: number) =>
  n ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫" : "—"

const sourceIcon: Record<string, string> = {
  Facebook: "📘", Referral: "🤝", Website: "🌐", TikTok: "🎵", Zalo: "💬",
  "Triển lãm": "🏛", Khác: "📌",
}

const stageColors: Record<string, string> = {
  new: "bg-gray-50 border-gray-200",
  surveyed: "bg-blue-50 border-blue-200",
  designing: "bg-purple-50 border-purple-200",
  quoting: "bg-yellow-50 border-yellow-200",
  won: "bg-green-50 border-green-200",
}

export default function LeadsPage() {
  const { state, dispatch } = useAppStore()
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)

  const STAGE_KEYS = PIPELINE_STAGES.map(s => s.key)
  const nextStage = (current: string) => {
    const idx = STAGE_KEYS.indexOf(current)
    return idx < STAGE_KEYS.length - 1 ? STAGE_KEYS[idx + 1] : null
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            CRM — Pipeline Khách hàng
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {state.leads.filter(l => !l.converted).length} lead đang theo dõi
          </p>
        </div>
        <button
          onClick={() => setShowLeadModal(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" /> Thêm Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const leads = state.leads.filter(l => l.pipeline_status === stage.key && !l.converted)
          return (
            <div key={stage.key}
              className={`shrink-0 w-64 rounded-xl border ${stageColors[stage.key]} flex flex-col`}>

              {/* Column header */}
              <div className="px-3 py-3 flex items-center justify-between">
                <div className="font-semibold text-sm text-gray-700">{stage.label}</div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-white text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200">
                    {leads.length}
                  </span>
                  <button
                    onClick={() => setShowLeadModal(true)}
                    title="Thêm lead vào giai đoạn này"
                    className="text-gray-400 hover:text-gray-600 w-5 h-5 flex items-center justify-center rounded hover:bg-white/80">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
                {leads.length === 0 && (
                  <div className="text-center text-gray-300 text-xs py-8">Không có lead</div>
                )}

                {leads.map(lead => {
                  const next = nextStage(lead.pipeline_status)
                  return (
                    <div key={lead.id}
                      className={`bg-white rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow ${lead.is_duplicate_phone ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}`}>
                      {lead.is_duplicate_phone && (
                        <div className="text-xs text-red-600 font-medium mb-1.5 flex items-center gap-1">⚠️ SĐT bị trùng!</div>
                      )}
                      <div className="font-semibold text-gray-900 text-sm">{lead.customer_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">📞 {lead.phone_number}</div>
                      {lead.project_type && (
                        <div className="text-xs text-gray-500 mt-0.5">🏠 {lead.project_type}</div>
                      )}
                      {lead.estimated_budget > 0 && (
                        <div className="text-xs font-medium text-orange-600 mt-1.5">
                          💰 {fmtVND(lead.estimated_budget)}
                        </div>
                      )}
                      {lead.notes && (
                        <div className="text-xs text-gray-400 italic mt-1 line-clamp-2">{lead.notes}</div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {sourceIcon[lead.source] ?? "📌"} {lead.source}
                        </span>
                        <span className="text-xs text-gray-500">{lead.assigned_sales.split(" ").pop()}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2 flex gap-1">
                        {/* Convert to project button — only for "won" */}
                        {lead.pipeline_status === "won" ? (
                          <button
                            onClick={() => setConvertLead(lead)}
                            className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-white py-1.5 rounded-md transition-colors hover:opacity-90"
                            style={{ backgroundColor: "#E87625" }}>
                            <Rocket className="w-3 h-3" />
                            Tạo Dự án
                          </button>
                        ) : next ? (
                          <button
                            onClick={() => dispatch({ type: 'MOVE_LEAD', id: lead.id, stage: next })}
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 py-1 rounded-md transition-colors">
                            <ArrowRight className="w-3 h-3" />
                            {PIPELINE_STAGES.find(s => s.key === next)?.label.split(" ").slice(1).join(" ")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Converted section */}
        {state.leads.filter(l => l.converted).length > 0 && (
          <div className="shrink-0 w-52 rounded-xl border bg-slate-50 border-slate-200 flex flex-col opacity-60">
            <div className="px-3 py-3 flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">✅ Đã chuyển dự án</span>
              <span className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">
                {state.leads.filter(l => l.converted).length}
              </span>
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              {state.leads.filter(l => l.converted).map(l => (
                <div key={l.id} className="bg-white rounded-lg border border-slate-200 p-2.5">
                  <div className="text-xs font-medium text-slate-600">{l.customer_name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">🏠 {l.project_type}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLeadModal && <LeadModal onClose={() => setShowLeadModal(false)} />}
      {convertLead && <ProjectModal fromLead={convertLead} onClose={() => setConvertLead(null)} />}
    </div>
  )
}
