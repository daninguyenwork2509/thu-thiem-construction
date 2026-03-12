"use client"
import { useState } from "react"
import type { L1Row } from "@/lib/boq-types"
import { matchSubcontractors, getAllSubcontractors } from "@/lib/subcontractor-data"
import { X, Star, Phone, CheckCircle, HardHat, List } from "lucide-react"

const fmtVND = (n: number) => n.toLocaleString("vi-VN") + " ₫"

interface Props {
  l1: L1Row
  onClose: () => void
  onConfirm: (subcontractorId: number, subcontractorName: string) => void
}

export default function SubcontractorModal({ l1, onClose, onConfirm }: Props) {
  const matched = matchSubcontractors(l1.description)
  const subs = matched.length > 0 ? matched : getAllSubcontractors()

  const [selectedId, setSelectedId] = useState<number | null>(l1.subcontractorId ?? null)

  const handleConfirm = () => {
    if (!selectedId) return
    const sub = subs.find(s => s.id === selectedId) ?? getAllSubcontractors().find(s => s.id === selectedId)
    if (!sub) return
    onConfirm(selectedId, sub.name)
    onClose()
  }

  const totalItems = l1.children.length
  const coveredCost = l1.categoryCostTotal ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HardHat className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">Gán Thầu Phụ cho Hạng mục</h2>
            </div>
            <p className="text-sm text-gray-500">
              Hạng mục: <span className="font-semibold text-blue-700">{l1.itemCode}. {l1.description}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5 italic">Logic: 1 Hạng mục = 1 Thầu phụ chịu toàn bộ trách nhiệm</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope summary bar */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">Giá trị hợp đồng hạng mục:</span>
            <span className="font-bold text-blue-700 ml-1.5">{fmtVND(l1.categoryTotalPrice)}</span>
          </div>
          <div>
            <span className="text-gray-500">Số công tác:</span>
            <span className="font-medium text-gray-700 ml-1.5">{totalItems} mục</span>
          </div>
          {coveredCost > 0 && (
            <div>
              <span className="text-gray-500">Tổng giá vốn đã nhập:</span>
              <span className="font-medium text-slate-700 ml-1.5">{fmtVND(coveredCost)}</span>
            </div>
          )}
        </div>

        {/* Scope detail (L2 items) */}
        <div className="px-6 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <List className="w-3.5 h-3.5" />
            Phạm vi giao khoán (các công tác thuộc hạng mục này)
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {l1.children.map(l2 => (
              <span key={l2.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {l2.itemCode}. {l2.description} <span className="text-slate-400">({fmtVND(l2.totalPrice)})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Subcontractor list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">
            {matched.length > 0
              ? `${matched.length} thầu phụ phù hợp hạng mục "${l1.description}"`
              : "Tất cả thầu phụ (không có match tự động)"}
          </p>

          <div className="space-y-2">
            {subs.map(sub => {
              const isSelected = selectedId === sub.id

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedId(sub.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-orange-400 bg-orange-50 shadow-sm ring-1 ring-orange-200"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{sub.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">{sub.specialty}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#E87625" }} />}
                        {l1.subcontractorId === sub.id && !isSelected && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Đang gán</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {sub.rating}/5
                        </span>
                        <span>{sub.completedJobs} công trình hoàn thành</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {sub.contactPhone} ({sub.contactName})
                        </span>
                      </div>
                      {sub.notes && (
                        <p className="text-xs text-amber-600 mt-1.5 italic">{sub.notes}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="shrink-0 w-24 text-center">
                        <div className="text-xs text-orange-500 font-semibold">Được chọn</div>
                        <div className="text-xs text-gray-400 mt-0.5">nhận toàn bộ gói</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl gap-4">
          <div className="text-sm flex-1 min-w-0 text-gray-500 text-xs italic">
            Sau khi gán thầu, hãy nhập giá vốn từng công tác (L2) trực tiếp trong bảng để tính Margin.
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: selectedId ? "#E87625" : "#9ca3af" }}
            >
              Xác nhận gán thầu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
