"use client"
import { useState } from "react"
import { X } from "lucide-react"
import { useAppStore, generateLeadId, SALES_STAFF, LEAD_SOURCES, PROJECT_TYPES, type Lead } from "@/lib/app-store"

interface Props {
  onClose: () => void
}

export default function LeadModal({ onClose }: Props) {
  const { dispatch } = useAppStore()
  const [form, setForm] = useState({
    customer_name: "",
    phone_number: "",
    source: "Facebook",
    estimated_budget: "",
    assigned_sales: SALES_STAFF[0],
    project_type: "Căn hộ",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.customer_name.trim()) e.customer_name = "Bắt buộc"
    if (!form.phone_number.trim()) e.phone_number = "Bắt buộc"
    else if (!/^0\d{9}$/.test(form.phone_number.trim())) e.phone_number = "SĐT không hợp lệ (10 số, bắt đầu 0)"
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const newLead: Lead = {
      id: generateLeadId(),
      customer_name: form.customer_name.trim(),
      phone_number: form.phone_number.trim(),
      source: form.source,
      estimated_budget: parseFloat(form.estimated_budget) || 0,
      pipeline_status: "new",
      assigned_sales: form.assigned_sales,
      is_duplicate_phone: false,
      created_date: new Date().toISOString().slice(0, 10),
      project_type: form.project_type,
      notes: form.notes.trim() || undefined,
    }
    dispatch({ type: 'ADD_LEAD', lead: newLead })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Thêm Lead mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Customer name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.customer_name}
              onChange={e => set("customer_name", e.target.value)}
              placeholder="Nguyễn Văn A"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.customer_name ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={e => set("phone_number", e.target.value)}
              placeholder="0901234567"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.phone_number ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number}</p>}
          </div>

          {/* 2-column row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn tiếp cận</label>
              <select value={form.source} onChange={e => set("source", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại công trình</label>
              <select value={form.project_type} onChange={e => set("project_type", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {PROJECT_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Budget + Sales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách dự kiến (VNĐ)</label>
              <input
                type="number"
                value={form.estimated_budget}
                onChange={e => set("estimated_budget", e.target.value)}
                placeholder="500000000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NV phụ trách</label>
              <select value={form.assigned_sales} onChange={e => set("assigned_sales", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {SALES_STAFF.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              placeholder="Khách hàng quan tâm phong cách hiện đại, dự kiến thi công Q3..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: "#E87625" }}>
            Thêm Lead
          </button>
        </div>
      </div>
    </div>
  )
}
