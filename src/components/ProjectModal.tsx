"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Rocket } from "lucide-react"
import {
  useAppStore, generateProjectCode, generateProjectId,
  PM_STAFF, type Lead, type Project
} from "@/lib/app-store"

interface Props {
  onClose: () => void
  fromLead?: Lead   // pre-fill fields from a won lead
}

export default function ProjectModal({ onClose, fromLead }: Props) {
  const { dispatch } = useAppStore()
  const router = useRouter()

  const [form, setForm] = useState({
    project_name: fromLead
      ? `${fromLead.project_type ?? "Công trình"} ${fromLead.customer_name}`
      : "",
    customer_name: fromLead?.customer_name ?? "",
    customer_phone: fromLead?.phone_number ?? "",
    contract_value: fromLead?.estimated_budget ? String(fromLead.estimated_budget) : "",
    pm_name: PM_STAFF[0],
    start_date: new Date().toISOString().slice(0, 10),
    expected_end_date: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.project_name.trim()) e.project_name = "Bắt buộc"
    if (!form.customer_name.trim()) e.customer_name = "Bắt buộc"
    if (!form.customer_phone.trim()) e.customer_phone = "Bắt buộc"
    if (!form.contract_value || parseFloat(form.contract_value) <= 0) e.contract_value = "Nhập giá trị hợp đồng"
    if (!form.start_date) e.start_date = "Bắt buộc"
    return e
  }

  const handleCreate = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const newId = generateProjectId()
    const contractVal = parseFloat(form.contract_value)

    const newProject: Project = {
      id: newId,
      project_code: generateProjectCode(),
      project_name: form.project_name.trim(),
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      pm_name: form.pm_name,
      contract_value: contractVal,
      total_paid: 0,
      total_outstanding_debt: contractVal,
      project_status: "draft",
      start_date: form.start_date,
      expected_end_date: form.expected_end_date || "",
      has_building_permit: false,
      has_material_board: false,
      retention_percent: 5,
      boq_count: 0,
      milestone_count: 0,
      vo_count: 0,
      allocation_count: 0,
      progress_pct: 0,
      from_lead_id: fromLead?.id,
    }

    dispatch({ type: 'ADD_PROJECT', project: newProject })

    // Mark lead as converted if created from lead
    if (fromLead) {
      dispatch({ type: 'MARK_LEAD_CONVERTED', id: fromLead.id })
    }

    onClose()
    // Navigate to BOQ editor for the new project
    router.push(`/projects/${newId}/boq`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-orange-500" />
              {fromLead ? `Tạo dự án từ Lead — ${fromLead.customer_name}` : "Tạo dự án mới"}
            </h2>
            {fromLead && (
              <p className="text-xs text-orange-600 mt-0.5 bg-orange-50 px-2 py-0.5 rounded inline-block">
                🏆 Lead đã chốt HĐ → tạo dự án → bóc tách BOQ
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Project name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án <span className="text-red-500">*</span></label>
            <input type="text" value={form.project_name} onChange={e => set("project_name", e.target.value)}
              placeholder="Căn hộ Nguyễn Văn A – Quận 7"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.project_name ? "border-red-400" : "border-gray-300"}`} />
            {errors.project_name && <p className="text-xs text-red-500 mt-1">{errors.project_name}</p>}
          </div>

          {/* Customer row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng <span className="text-red-500">*</span></label>
              <input type="text" value={form.customer_name} onChange={e => set("customer_name", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.customer_name ? "border-red-400" : "border-gray-300"}`} />
              {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT <span className="text-red-500">*</span></label>
              <input type="tel" value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.customer_phone ? "border-red-400" : "border-gray-300"}`} />
              {errors.customer_phone && <p className="text-xs text-red-500 mt-1">{errors.customer_phone}</p>}
            </div>
          </div>

          {/* Contract value + PM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị HĐ (VNĐ) <span className="text-red-500">*</span></label>
              <input type="number" value={form.contract_value} onChange={e => set("contract_value", e.target.value)}
                placeholder="800000000"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.contract_value ? "border-red-400" : "border-gray-300"}`} />
              {errors.contract_value && <p className="text-xs text-red-500 mt-1">{errors.contract_value}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PM phụ trách</label>
              <select value={form.pm_name} onChange={e => set("pm_name", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {PM_STAFF.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khởi công <span className="text-red-500">*</span></label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.start_date ? "border-red-400" : "border-gray-300"}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày dự kiến hoàn thành</label>
              <input type="date" value={form.expected_end_date} onChange={e => set("expected_end_date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>Bước tiếp theo:</strong> Sau khi tạo dự án, hệ thống sẽ chuyển thẳng đến trang{" "}
            <strong>Bóc tách BOQ</strong> để nhập khối lượng và gán thầu phụ.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            Hủy
          </button>
          <button onClick={handleCreate}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: "#E87625" }}>
            <Rocket className="w-3.5 h-3.5" />
            Tạo dự án → Bóc tách BOQ
          </button>
        </div>
      </div>
    </div>
  )
}
