"use client"
import { useState } from "react"
import {
  ClipboardCheck, CheckCircle2, XCircle, MinusCircle,
  ChevronDown, ChevronRight, AlertTriangle, Download,
  Plus, X, Camera
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
type ItemStatus = "pass" | "fail" | "na" | "pending"

interface CheckItem {
  id: number
  description: string
  status: ItemStatus
  note: string
  photo?: string
}

interface Section {
  id: number
  title: string
  items: CheckItem[]
}

interface Inspection {
  id: number
  project: string
  projectCode: string
  phase: string
  inspector: string
  date: string
  status: "draft" | "in_progress" | "completed" | "failed"
  sections: Section[]
}

// ── Mock data ────────────────────────────────────────────────────────────────
const INIT_INSPECTIONS: Inspection[] = [
  {
    id: 1,
    project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",
    projectCode: "PRJ-2025-0001",
    phase: "Phần thô",
    inspector: "Nguyễn Hữu Đức",
    date: "2026-03-10",
    status: "in_progress",
    sections: [
      {
        id: 1, title: "Móng & Kết cấu",
        items: [
          { id: 1,  description: "Kích thước móng đúng bản vẽ ±5mm",           status: "pass",    note: "" },
          { id: 2,  description: "Độ sâu chôn móng đạt yêu cầu thiết kế",       status: "pass",    note: "" },
          { id: 3,  description: "Thép chịu lực đúng chủng loại & mật độ",      status: "fail",    note: "Sai khoảng cách thép đai tại trục B-3" },
          { id: 4,  description: "Bê tông mác đạt M300 (kết quả mẫu thử)",      status: "pending", note: "" },
          { id: 5,  description: "Không có vết nứt kết cấu trên cột, dầm",      status: "pass",    note: "" },
        ]
      },
      {
        id: 2, title: "Tường xây & Trát",
        items: [
          { id: 6,  description: "Gạch xây đúng loại theo chỉ định",             status: "pass",    note: "" },
          { id: 7,  description: "Độ phẳng mặt tường ≤ 3mm/2m",                 status: "fail",    note: "Phòng ngủ 2 — lệch 6mm" },
          { id: 8,  description: "Trát vữa đủ dày, không phồng rộp",            status: "pending", note: "" },
          { id: 9,  description: "Góc tường vuông 90°",                          status: "pass",    note: "" },
        ]
      },
      {
        id: 3, title: "Cơ điện (Roughing)",
        items: [
          { id: 10, description: "Ống điện chôn tường đúng sơ đồ M&E",          status: "pass",    note: "" },
          { id: 11, description: "Ống cấp thoát nước âm sàn đúng vị trí",       status: "pass",    note: "" },
          { id: 12, description: "Hộp đế âm tường chắc chắn, đúng độ sâu",     status: "na",      note: "Khu vực chưa hoàn tất" },
        ]
      },
    ],
  },
  {
    id: 2,
    project: "Biệt thự Sông Long – Thủ Đức",
    projectCode: "PRJ-2024-0015",
    phase: "Hoàn thiện",
    inspector: "Trần Thị Mai",
    date: "2026-03-08",
    status: "completed",
    sections: [
      {
        id: 4, title: "Sơn nước",
        items: [
          { id: 13, description: "Bề mặt sơn phẳng đều, không vết chổi",        status: "pass", note: "" },
          { id: 14, description: "Màu sơn đúng mã KH đã duyệt",                 status: "pass", note: "" },
          { id: 15, description: "Số lớp sơn đủ (1 lót + 2 phủ)",              status: "pass", note: "" },
          { id: 16, description: "Cạnh góc tường sắc nét, thẳng",              status: "pass", note: "" },
        ]
      },
      {
        id: 5, title: "Sàn gỗ & Gạch ốp lát",
        items: [
          { id: 17, description: "Sàn gỗ khe đều ≤ 0.5mm, không cộm",          status: "pass", note: "" },
          { id: 18, description: "Gạch ốp tường thẳng hàng, khe đều ±1mm",     status: "pass", note: "" },
          { id: 19, description: "Góc ốp 45° khu vực góc toilet đẹp",          status: "pass", note: "" },
          { id: 20, description: "Không có viên gạch bị rỗng (gõ thử)",        status: "pass", note: "" },
        ]
      },
    ],
  },
  {
    id: 3,
    project: "Văn phòng Landmark 81 – Tầng 22",
    projectCode: "PRJ-2025-0002",
    phase: "MEP",
    inspector: "Lê Văn Khoa",
    date: "2026-03-12",
    status: "draft",
    sections: [
      {
        id: 6, title: "Hệ thống điện",
        items: [
          { id: 21, description: "Tủ điện lắp đúng vị trí bản vẽ",             status: "pending", note: "" },
          { id: 22, description: "CB phân nhánh đúng ampere theo thiết kế",     status: "pending", note: "" },
          { id: 23, description: "Test cách điện tất cả mạch vòng ≥ 1MΩ",      status: "pending", note: "" },
          { id: 24, description: "Nối đất bảo vệ PE < 1Ω",                     status: "pending", note: "" },
        ]
      },
      {
        id: 7, title: "Điều hòa & Thông gió",
        items: [
          { id: 25, description: "FCU lắp đúng vị trí, cao độ thiết kế",       status: "pending", note: "" },
          { id: 26, description: "Đường ống gas đồng đúng kích thước",          status: "pending", note: "" },
          { id: 27, description: "Thử rò rỉ gas áp 42 bar trong 24h",          status: "pending", note: "" },
          { id: 28, description: "Cân bằng lưu lượng gió VAV đạt thiết kế",    status: "pending", note: "" },
        ]
      },
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ItemStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pass:    { label: "Đạt",     icon: <CheckCircle2 className="w-4 h-4" />,  color: "text-green-700",  bg: "bg-green-100 border-green-300" },
  fail:    { label: "Không đạt", icon: <XCircle className="w-4 h-4" />,   color: "text-red-700",    bg: "bg-red-100 border-red-300"     },
  na:      { label: "N/A",     icon: <MinusCircle className="w-4 h-4" />,  color: "text-gray-500",   bg: "bg-gray-100 border-gray-300"   },
  pending: { label: "Chờ",     icon: <MinusCircle className="w-4 h-4" />,  color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
}

const INSP_STATUS: Record<string, { label: string; color: string }> = {
  draft:       { label: "Nháp",        color: "bg-gray-100 text-gray-600"    },
  in_progress: { label: "Đang kiểm",   color: "bg-blue-100 text-blue-700"    },
  completed:   { label: "Hoàn thành",  color: "bg-green-100 text-green-700"  },
  failed:      { label: "Không đạt",   color: "bg-red-100 text-red-700"      },
}

function calcScore(sections: Section[]) {
  const all   = sections.flatMap(s => s.items)
  const total = all.filter(i => i.status !== "na").length
  const pass  = all.filter(i => i.status === "pass").length
  const fail  = all.filter(i => i.status === "fail").length
  return { total, pass, fail, pct: total > 0 ? Math.round(pass / total * 100) : 0 }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function QAPage() {
  const [inspections, setInspections] = useState(INIT_INSPECTIONS)
  const [activeId, setActiveId]       = useState<number | null>(1)
  const [expanded, setExpanded]       = useState<Set<number>>(new Set([1]))
  const [showNew, setShowNew]         = useState(false)
  const [newForm, setNewForm]         = useState({ project: "", phase: "Phần thô", inspector: "" })

  const active = inspections.find(i => i.id === activeId)

  const toggleSection = (id: number) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const updateItem = (sectionId: number, itemId: number, field: "status" | "note", value: string) => {
    setInspections(prev => prev.map(insp =>
      insp.id !== activeId ? insp : {
        ...insp,
        sections: insp.sections.map(s =>
          s.id !== sectionId ? s : {
            ...s,
            items: s.items.map(it =>
              it.id !== itemId ? it : { ...it, [field]: value }
            )
          }
        )
      }
    ))
  }

  const handleCreate = () => {
    if (!newForm.project || !newForm.inspector) return
    const newInsp: Inspection = {
      id: Date.now(), project: newForm.project, projectCode: "PRJ-NEW",
      phase: newForm.phase, inspector: newForm.inspector,
      date: new Date().toISOString().slice(0, 10), status: "draft", sections: [],
    }
    setInspections(prev => [...prev, newInsp])
    setActiveId(newInsp.id)
    setShowNew(false)
    setNewForm({ project: "", phase: "Phần thô", inspector: "" })
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* ── Left panel: inspection list ── */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-500" /> QA / Nghiệm thu
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{inspections.length} đợt kiểm tra</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:opacity-90 shadow-sm"
            style={{ backgroundColor: "#E87625" }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {inspections.map(insp => {
            const score = calcScore(insp.sections)
            const isActive = insp.id === activeId
            return (
              <button key={insp.id} onClick={() => { setActiveId(insp.id); setExpanded(new Set(insp.sections.map(s => s.id))) }}
                className={`w-full text-left px-4 py-3.5 transition-colors ${isActive ? "bg-orange-50 border-l-2 border-orange-500" : "hover:bg-gray-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{insp.project}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{insp.phase} · {insp.date}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${INSP_STATUS[insp.status].color}`}>
                        {INSP_STATUS[insp.status].label}
                      </span>
                      {score.total > 0 && (
                        <span className={`text-[11px] font-bold ${score.pct >= 80 ? "text-green-600" : "text-red-600"}`}>
                          {score.pct}%
                        </span>
                      )}
                    </div>
                  </div>
                  {score.fail > 0 && (
                    <div className="shrink-0 flex items-center gap-1 text-red-500 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> {score.fail}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right panel: checklist detail ── */}
      <div className="flex-1 overflow-y-auto">
        {!active ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Chọn đợt kiểm tra để xem chi tiết
          </div>
        ) : (
          <div className="p-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{active.project}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {active.phase} · Kiểm tra viên: <strong>{active.inspector}</strong> · {active.date}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${INSP_STATUS[active.status].color}`}>
                    {INSP_STATUS[active.status].label}
                  </span>
                  {(() => {
                    const s = calcScore(active.sections)
                    return s.total > 0 ? (
                      <>
                        <span className="text-sm font-bold text-gray-700">{s.pass}/{s.total} đạt</span>
                        <span className={`text-sm font-bold ${s.pct >= 80 ? "text-green-600" : "text-red-600"}`}>({s.pct}%)</span>
                        {s.fail > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                            <AlertTriangle className="w-3 h-3" /> {s.fail} không đạt
                          </span>
                        )}
                      </>
                    ) : null
                  })()}
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100">
                <Download className="w-4 h-4" /> Xuất PDF
              </button>
            </div>

            {/* Score bar */}
            {(() => {
              const s = calcScore(active.sections)
              return s.total > 0 ? (
                <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Tỉ lệ đạt yêu cầu</span>
                    <span className={`font-bold text-base ${s.pct >= 80 ? "text-green-600" : "text-red-600"}`}>{s.pct}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${s.pass / s.total * 100}%` }} />
                    <div className="h-full bg-red-400 transition-all" style={{ width: `${s.fail / s.total * 100}%` }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> {s.pass} Đạt</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> {s.fail} Không đạt</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> {s.total - s.pass - s.fail} Chờ</span>
                  </div>
                </div>
              ) : null
            })()}

            {/* Sections */}
            <div className="space-y-3">
              {active.sections.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400 text-sm">
                  Chưa có hạng mục kiểm tra. Thêm section để bắt đầu.
                </div>
              ) : active.sections.map(section => {
                const isOpen  = expanded.has(section.id)
                const secFail = section.items.filter(i => i.status === "fail").length
                const secPass = section.items.filter(i => i.status === "pass").length
                return (
                  <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                      <span className="font-semibold text-gray-800 flex-1">{section.title}</span>
                      <div className="flex items-center gap-2 text-xs shrink-0">
                        <span className="text-green-600 font-semibold">{secPass} ✓</span>
                        {secFail > 0 && <span className="text-red-600 font-semibold">{secFail} ✗</span>}
                        <span className="text-gray-400">{section.items.length} hạng mục</span>
                      </div>
                    </button>

                    {/* Items */}
                    {isOpen && (
                      <div className="divide-y divide-gray-50">
                        {section.items.map((item, idx) => {
                          const cfg = STATUS_CONFIG[item.status]
                          return (
                            <div key={item.id}
                              className={`px-5 py-3 ${item.status === "fail" ? "bg-red-50/40" : ""}`}>
                              <div className="flex items-start gap-3">
                                <span className="text-xs text-gray-400 font-mono w-5 shrink-0 mt-0.5">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 leading-snug">{item.description}</p>
                                  {item.note && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> {item.note}
                                    </p>
                                  )}
                                </div>
                                {/* Status buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {(["pass", "fail", "na"] as ItemStatus[]).map(s => (
                                    <button key={s} onClick={() => updateItem(section.id, item.id, "status", s)}
                                      title={STATUS_CONFIG[s].label}
                                      className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                                        item.status === s
                                          ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} shadow-sm`
                                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-400"
                                      }`}>
                                      {STATUS_CONFIG[s].label}
                                    </button>
                                  ))}
                                  <button className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg hover:bg-gray-100"
                                    title="Thêm ảnh">
                                    <Camera className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {/* Note input for failed items */}
                              {item.status === "fail" && (
                                <div className="mt-2 ml-8">
                                  <input
                                    type="text"
                                    placeholder="Ghi chú lỗi..."
                                    value={item.note}
                                    onChange={e => updateItem(section.id, item.id, "note", e.target.value)}
                                    className="w-full text-xs border border-red-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── New inspection modal ── */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">Tạo đợt kiểm tra mới</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên dự án *</label>
                <input type="text" value={newForm.project}
                  onChange={e => setNewForm(f => ({ ...f, project: e.target.value }))}
                  placeholder="VD: Căn hộ Mỹ Khánh..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Giai đoạn</label>
                <select value={newForm.phase}
                  onChange={e => setNewForm(f => ({ ...f, phase: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                  {["Phần thô", "MEP", "Nội thất", "Hoàn thiện", "Nghiệm thu bàn giao"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kiểm tra viên *</label>
                <input type="text" value={newForm.inspector}
                  onChange={e => setNewForm(f => ({ ...f, inspector: e.target.value }))}
                  placeholder="Họ tên kỹ sư QA..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Hủy</button>
              <button onClick={handleCreate}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: "#E87625" }}>Tạo mới</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
