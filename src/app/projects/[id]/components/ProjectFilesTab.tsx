"use client"
import { useState } from "react"
import { Plus, Download, Camera, FileText, ChevronDown, ChevronRight } from "lucide-react"

interface DocFile {
  id: number
  name: string
  type: string
  size: string
  date: string
  step: string
}

const FILE_ICON: Record<string, string> = { pdf: "📄", dwg: "📐", xlsx: "📊", docx: "📝", jpg: "🖼️", png: "🖼️" }

const MOCK_FILES: DocFile[] = [
  { id: 1,  name: "Hợp đồng thi công.pdf",              type: "pdf",  size: "2.4 MB", date: "01/02/2025", step: "Hợp đồng" },
  { id: 2,  name: "Phụ lục hợp đồng điều chỉnh.pdf",    type: "pdf",  size: "0.9 MB", date: "15/02/2025", step: "Hợp đồng" },
  { id: 3,  name: "Ảnh khảo sát hiện trạng 01.jpg",     type: "jpg",  size: "3.1 MB", date: "10/01/2025", step: "Khảo sát" },
  { id: 4,  name: "Ảnh khảo sát hiện trạng 02.jpg",     type: "jpg",  size: "2.8 MB", date: "10/01/2025", step: "Khảo sát" },
  { id: 5,  name: "Ảnh khảo sát hiện trạng 03.jpg",     type: "jpg",  size: "3.4 MB", date: "10/01/2025", step: "Khảo sát" },
  { id: 6,  name: "Bản vẽ kiến trúc mặt bằng.dwg",      type: "dwg",  size: "8.1 MB", date: "05/02/2025", step: "Thiết kế" },
  { id: 7,  name: "Bản vẽ điện M&E.pdf",                type: "pdf",  size: "3.2 MB", date: "10/02/2025", step: "Thiết kế" },
  { id: 8,  name: "Bản vẽ nội thất phòng khách.dwg",    type: "dwg",  size: "6.5 MB", date: "12/02/2025", step: "Thiết kế" },
  { id: 9,  name: "Bảng vật liệu được duyệt.xlsx",      type: "xlsx", size: "0.8 MB", date: "20/02/2025", step: "Thi công" },
  { id: 10, name: "Ảnh tiến độ tuần 05.jpg",            type: "jpg",  size: "4.2 MB", date: "08/03/2025", step: "Thi công" },
  { id: 11, name: "Ảnh tiến độ tuần 08.jpg",            type: "jpg",  size: "3.9 MB", date: "29/03/2025", step: "Thi công" },
  { id: 12, name: "Biên bản nghiệm thu phần thô.pdf",   type: "pdf",  size: "1.1 MB", date: "15/04/2025", step: "Nghiệm thu" },
  { id: 13, name: "Ảnh before phòng khách.jpg",         type: "jpg",  size: "5.1 MB", date: "15/04/2025", step: "Nghiệm thu" },
  { id: 14, name: "Ảnh after phòng khách.jpg",          type: "jpg",  size: "4.8 MB", date: "15/04/2025", step: "Nghiệm thu" },
]

const STEP_ORDER = ["Hợp đồng", "Khảo sát", "Thiết kế", "Thi công", "Nghiệm thu"]
const STEP_COLORS: Record<string, string> = {
  "Hợp đồng":   "bg-purple-50 text-purple-700 border-purple-200",
  "Khảo sát":   "bg-blue-50 text-blue-700 border-blue-200",
  "Thiết kế":   "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Thi công":   "bg-orange-50 text-orange-700 border-orange-200",
  "Nghiệm thu": "bg-green-50 text-green-700 border-green-200",
}

export default function ProjectFilesTab() {
  const [files] = useState<DocFile[]>(MOCK_FILES)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState("all")

  const toggleStep = (step: string) => setCollapsed(p => { const n = new Set(p); n.has(step) ? n.delete(step) : n.add(step); return n })
  const filtered = activeFilter === "all" ? files : files.filter(f => f.step === activeFilter)
  const steps = STEP_ORDER.filter(s => files.some(f => f.step === s))

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setActiveFilter("all")}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${activeFilter === "all" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"}`}>
          Tất cả ({files.length})
        </button>
        {steps.map(step => (
          <button key={step} onClick={() => setActiveFilter(step)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${activeFilter === step ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"}`}>
            {step} ({files.filter(f => f.step === step).length})
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Tải lên
        </button>
      </div>

      {/* Files grouped by step */}
      {activeFilter === "all" ? (
        <div className="space-y-3">
          {steps.map(step => {
            const stepFiles = files.filter(f => f.step === step)
            const isCollapsed = collapsed.has(step)
            const badgeClass = STEP_COLORS[step] ?? "bg-gray-50 text-gray-600 border-gray-200"
            return (
              <div key={step} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <button onClick={() => toggleStep(step)}
                  className="w-full px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-bold text-gray-800">{step}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>{stepFiles.length} file</span>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-gray-50">
                    {stepFiles.map(f => (
                      <div key={f.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition group">
                        <span className="text-2xl shrink-0">{FILE_ICON[f.type] ?? "📎"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{f.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{f.size} · {f.date}</div>
                        </div>
                        <button className="shrink-0 p-1.5 text-gray-300 group-hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="px-5 py-2.5 bg-gray-50/60">
                      <button className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Thêm file vào {step}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-50">
            {filtered.map(f => (
              <div key={f.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition group">
                <span className="text-2xl shrink-0">{FILE_ICON[f.type] ?? "📎"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{f.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{f.size} · {f.date}</div>
                </div>
                <button className="shrink-0 p-1.5 text-gray-300 group-hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 flex flex-col items-center text-gray-400">
              <FileText className="w-8 h-8 mb-2 text-gray-200" />
              <p className="text-sm">Chưa có file nào trong giai đoạn này</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
