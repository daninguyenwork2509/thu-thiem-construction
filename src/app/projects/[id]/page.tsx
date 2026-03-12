"use client"
import { useState } from "react"
import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/app-store"
import { mockProjects, mockBoqLines, mockVOs, mockMilestones, fmtVND } from "@/lib/mock-data"
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, FileText, BarChart3, GitBranch, TrendingUp } from "lucide-react"
import Link from "next/link"
import GanttChart, { generateGanttTasks, type GanttTask } from "@/components/GanttChart"

const msColor: Record<string, string> = {
  paid: "bg-green-100 text-green-700", approved: "bg-blue-100 text-blue-700",
  pending_approval: "bg-yellow-100 text-yellow-700", draft: "bg-gray-100 text-gray-500",
  overdue: "bg-red-100 text-red-600",
}
const msLabel: Record<string, string> = {
  paid: "Đã thu", approved: "Đã duyệt", pending_approval: "Chờ duyệt", draft: "Nháp", overdue: "Quá hạn",
}
const voColor: Record<string, string> = {
  director_approved: "bg-green-100 text-green-700", customer_pending: "bg-yellow-100 text-yellow-700",
  pm_review: "bg-blue-100 text-blue-700", rejected: "bg-red-100 text-red-600", draft: "bg-gray-100 text-gray-500",
}
const voLabel: Record<string, string> = {
  director_approved: "GĐ duyệt", customer_pending: "Chờ KH", pm_review: "PM duyệt", rejected: "Từ chối", draft: "Nháp",
}

const TABS = [
  { key: "overview", label: "Tổng quan", icon: BarChart3 },
  { key: "gantt", label: "Tiến độ Gantt", icon: GitBranch },
  { key: "finance", label: "Tài chính", icon: TrendingUp },
]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()
  const [tab, setTab] = useState("overview")

  const project =
    state.projects.find(p => p.id === Number(id)) ??
    (mockProjects as typeof state.projects).find(p => p.id === Number(id))

  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>(() =>
    project ? generateGanttTasks(project.start_date, project.progress_pct) : []
  )

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-3">Không tìm thấy dự án #{id}</p>
        <Link href="/projects" className="text-orange-500 underline">Về danh sách</Link>
      </div>
    )
  }

  const boqLines = mockBoqLines.filter(b => b.project_id === project.id)
  const vos = mockVOs.filter(v => v.project_id === project.id)
  const milestones = mockMilestones.filter(m => m.project_id === project.id)
  const categories = [...new Set(boqLines.map(b => b.category))]
  const isNewProject = !mockProjects.find(p => p.id === project.id)

  const handleUpdateProgress = (taskId: number, pct: number) => {
    function updateInTree(tasks: GanttTask[]): GanttTask[] {
      return tasks.map(t => {
        if (t.id === taskId) return { ...t, progress: pct, status: pct === 100 ? "completed" : pct > 0 ? "in-progress" : "not-started" }
        if (t.children) return { ...t, children: updateInTree(t.children) }
        return t
      })
    }
    setGanttTasks(prev => updateInTree(prev))
  }

  const totalBOQ = boqLines.reduce((s, b) => s + b.qty * b.selling_price, 0)
  const totalPaid = milestones.filter(m => m.status === "paid").reduce((s, m) => s + m.payment_amount, 0)

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/projects" className="text-gray-400 hover:text-orange-500 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dự án
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">{project.project_code}</span>
        </div>
        <Link href={`/projects/${id}/boq`}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
          style={{ backgroundColor: "#E87625" }}>
          <FileText className="w-4 h-4" /> Bóc tách BOQ
        </Link>
      </div>

      {/* Project header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 font-mono">{project.project_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                project.project_status === "completed" ? "bg-green-100 text-green-700" :
                project.project_status === "under_construction" ? "bg-blue-100 text-blue-700" :
                "bg-yellow-100 text-yellow-700"}`}>
                {project.project_status === "completed" ? "Hoàn thành" :
                 project.project_status === "under_construction" ? "Đang thi công" : "Kiểm tra pháp lý"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="text-gray-500 text-sm mt-1">KH: {project.customer_name} · {project.customer_phone} · PM: {project.pm_name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {project.has_building_permit
              ? <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> GP thi công</span>
              : <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg"><AlertTriangle className="w-3 h-3" /> Thiếu GP</span>
            }
            {project.has_material_board
              ? <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> Bảng VL</span>
              : <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-1 rounded-lg"><Clock className="w-3 h-3" /> Thiếu bảng VL</span>
            }
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Tiến độ tổng thể</span>
            <span className="font-semibold">{project.progress_pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full">
            <div className="h-full rounded-full transition-all" style={{ width: `${project.progress_pct}%`, backgroundColor: "#E87625" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{project.start_date}</span>
            <span>{project.expected_end_date}</span>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div><div className="text-xs text-gray-400">Giá trị HĐ</div><div className="font-bold text-gray-900 mt-0.5">{fmtVND(project.contract_value)}</div></div>
          <div><div className="text-xs text-gray-400">Đã thu</div><div className="font-bold text-green-600 mt-0.5">{fmtVND(project.total_paid)}</div></div>
          <div><div className="text-xs text-gray-400">Còn nợ</div><div className={`font-bold mt-0.5 ${project.total_outstanding_debt > 0 ? "text-red-500" : "text-gray-400"}`}>{fmtVND(project.total_outstanding_debt)}</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <>
          {isNewProject && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-center gap-4">
              <FileText className="w-8 h-8 text-orange-500 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-orange-800">Dự án mới — chưa có BOQ</div>
                <div className="text-sm text-orange-600 mt-0.5">Tiến hành bóc tách khối lượng để lập dự toán.</div>
              </div>
              <Link href={`/projects/${id}/boq`} className="shrink-0 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: "#E87625" }}>
                Bóc tách BOQ
              </Link>
            </div>
          )}

          {boqLines.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Dự toán BOQ</h2>
                  <Link href={`/projects/${id}/boq`} className="text-xs text-orange-600 hover:underline">Chỉnh sửa</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {categories.map(cat => (
                    <div key={cat}>
                      <div className="px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</div>
                      {boqLines.filter(b => b.category === cat).map(line => (
                        <div key={line.id} className={`px-5 py-3 flex items-center gap-3 ${line.margin_warning ? "bg-red-50" : ""}`}>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${line.margin_warning ? "text-red-700" : "text-gray-800"}`}>
                              {line.item_name}
                              {line.margin_warning && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Margin thấp</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{line.qty} {line.uom} × {fmtVND(line.selling_price)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-gray-700">{fmtVND(line.qty * line.selling_price)}</div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${line.progress_pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-400">{line.progress_pct}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-800 text-sm">Mốc thanh toán</h3></div>
                  <div className="divide-y divide-gray-50">
                    {milestones.map(m => (
                      <div key={m.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Đợt {m.milestone_order}: {m.milestone_name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Đến hạn: {m.due_date}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${msColor[m.status]}`}>{msLabel[m.status]}</span>
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs">
                          <span className="text-gray-400">{m.payment_percent}% HĐ</span>
                          <span className={`font-semibold ${m.status === "paid" ? "text-green-600" : "text-gray-700"}`}>{fmtVND(m.payment_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {vos.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-800 text-sm">Phát sinh (VO)</h3></div>
                    <div className="divide-y divide-gray-50">
                      {vos.map(vo => (
                        <Link key={vo.id} href={`/vo/${vo.id}`} className="block px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{vo.title}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{vo.vo_code}</div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${voColor[vo.status]}`}>{voLabel[vo.status]}</span>
                          </div>
                          <div className="text-xs font-semibold text-orange-600 mt-1">{fmtVND(vo.selling_price_vat)}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Gantt */}
      {tab === "gantt" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Tiến độ thi công — Sơ đồ Gantt</h2>
              <p className="text-xs text-gray-500 mt-0.5">Nhấn vào số % để cập nhật tiến độ từng công việc</p>
            </div>
            <div className="text-xs text-gray-400">
              {project.start_date} → {project.expected_end_date}
            </div>
          </div>
          <div className="p-4">
            <GanttChart
              tasks={ganttTasks}
              projectStart={project.start_date}
              projectEnd={project.expected_end_date}
              onUpdateProgress={handleUpdateProgress}
            />
          </div>
        </div>
      )}

      {/* Tab: Finance */}
      {tab === "finance" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Giá trị hợp đồng", value: fmtVND(project.contract_value), color: "text-gray-900" },
              { label: "Đã thu", value: fmtVND(project.total_paid), color: "text-green-600" },
              { label: "Còn nợ", value: fmtVND(project.total_outstanding_debt), color: project.total_outstanding_debt > 0 ? "text-red-600" : "text-gray-400" },
              { label: "Giữ lại (" + project.retention_percent + "%)", value: fmtVND(project.contract_value * project.retention_percent / 100), color: "text-orange-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className={`text-lg font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Milestones detailed */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Chi tiết mốc thanh toán</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Đợt</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Tên mốc</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">% HĐ</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Số tiền</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Đến hạn</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {milestones.length > 0 ? milestones.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">Đợt {m.milestone_order}</td>
                    <td className="px-5 py-3 text-gray-900">{m.milestone_name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{m.payment_percent}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmtVND(m.payment_amount)}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{m.due_date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${msColor[m.status]}`}>{msLabel[m.status]}</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Chưa có mốc thanh toán</td></tr>
                )}
              </tbody>
              {milestones.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 font-bold text-gray-900">Tổng</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">100%</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtVND(project.contract_value)}</td>
                    <td />
                    <td className="px-4 py-3 text-center text-xs text-green-700 font-medium">{fmtVND(totalPaid)} đã thu</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* VO impact */}
          {vos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Phát sinh (VO) ảnh hưởng tài chính</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">VO</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Mô tả</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Giá trị</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vos.map(vo => (
                    <tr key={vo.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{vo.vo_code}</td>
                      <td className="px-5 py-3 text-gray-900">{vo.title}</td>
                      <td className="px-4 py-3 text-right font-semibold text-orange-700">{fmtVND(vo.selling_price_vat)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${voColor[vo.status]}`}>{voLabel[vo.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 font-bold text-gray-900">Tổng phát sinh</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-700">{fmtVND(vos.reduce((s, v) => s + v.selling_price_vat, 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
