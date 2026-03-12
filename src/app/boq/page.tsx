import BOQTable from "@/components/BOQTable"

export default function BOQPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Page header */}
      <div className="px-5 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dự toán BOQ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Căn hộ Mỹ Khánh – v1 ·{" "}
            <span className="text-green-600 font-medium">✓ Đã duyệt</span>
            {" · "}
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
              🔒 Chỉnh sửa thực tế (Admin unlock)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>💡 Click vào ô để chỉnh sửa</span>
          <span>·</span>
          <span>▶/◀ Expand/Collapse nhóm</span>
        </div>
      </div>

      {/* Full-height interactive table */}
      <div className="flex-1 overflow-hidden">
        <BOQTable />
      </div>
    </div>
  )
}
