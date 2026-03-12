"use client"
import { useState } from "react"
import {
  Layers, Plus, Search, Download, History,
  ChevronDown, ChevronRight, X, Filter, Eye
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
type Discipline = "KT" | "KC" | "ME" | "ID" | "HL"
type DrawingStatus = "IFC" | "IFR" | "IFA" | "Superseded" | "Draft"

interface Revision {
  rev: string
  date: string
  by: string
  note: string
  status: DrawingStatus
}

interface Drawing {
  id: number
  code: string
  title: string
  discipline: Discipline
  project: string
  projectCode: string
  scale: string
  currentRev: string
  currentStatus: DrawingStatus
  revisions: Revision[]
}

// ── Mock data ────────────────────────────────────────────────────────────────
const DRAWINGS: Drawing[] = [
  {
    id: 1, code: "PRJ2501-KT-A-001", title: "Mặt bằng tổng thể – Tầng điển hình",
    discipline: "KT", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", projectCode: "PRJ-2025-0001",
    scale: "1:50", currentRev: "Rev C", currentStatus: "IFC",
    revisions: [
      { rev: "Rev A", date: "2024-11-10", by: "Lê Văn Khoa",   note: "Phát hành lần đầu",                status: "Superseded" },
      { rev: "Rev B", date: "2025-01-15", by: "Lê Văn Khoa",   note: "Cập nhật vị trí cầu thang bộ",    status: "Superseded" },
      { rev: "Rev C", date: "2025-02-20", by: "Nguyễn Hữu Đức", note: "IFC – Đã KH duyệt",              status: "IFC"        },
    ]
  },
  {
    id: 2, code: "PRJ2501-KT-A-002", title: "Mặt đứng & Mặt cắt – Phối cảnh ngoại thất",
    discipline: "KT", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", projectCode: "PRJ-2025-0001",
    scale: "1:100", currentRev: "Rev B", currentStatus: "IFR",
    revisions: [
      { rev: "Rev A", date: "2024-12-01", by: "Lê Văn Khoa",   note: "Phát hành IFR lần đầu",           status: "Superseded" },
      { rev: "Rev B", date: "2025-03-01", by: "Lê Văn Khoa",   note: "Cập nhật thiết kế mái",           status: "IFR"        },
    ]
  },
  {
    id: 3, code: "PRJ2501-KC-S-001", title: "Bản vẽ kết cấu móng – Chi tiết thép",
    discipline: "KC", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", projectCode: "PRJ-2025-0001",
    scale: "1:25", currentRev: "Rev B", currentStatus: "IFC",
    revisions: [
      { rev: "Rev A", date: "2024-11-20", by: "Trần Thị Mai",   note: "Phát hành lần đầu",               status: "Superseded" },
      { rev: "Rev B", date: "2025-01-08", by: "Trần Thị Mai",   note: "Sửa mật độ thép đai theo TK",    status: "IFC"        },
    ]
  },
  {
    id: 4, code: "PRJ2501-ME-E-001", title: "Sơ đồ đơn tuyến tủ điện MDB",
    discipline: "ME", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", projectCode: "PRJ-2025-0001",
    scale: "N.T.S", currentRev: "Rev A", currentStatus: "IFC",
    revisions: [
      { rev: "Rev A", date: "2025-01-25", by: "Lê Văn Khoa",   note: "IFC – Duyệt điện lực",            status: "IFC"        },
    ]
  },
  {
    id: 5, code: "PRJ2501-ME-P-001", title: "Bố trí cấp thoát nước tầng điển hình",
    discipline: "ME", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", projectCode: "PRJ-2025-0001",
    scale: "1:50", currentRev: "Rev C", currentStatus: "IFC",
    revisions: [
      { rev: "Rev A", date: "2024-12-05", by: "Trần Thị Mai",   note: "Phát hành lần đầu",               status: "Superseded" },
      { rev: "Rev B", date: "2025-01-20", by: "Trần Thị Mai",   note: "Điều chỉnh vị trí ống đứng",     status: "Superseded" },
      { rev: "Rev C", date: "2025-02-15", by: "Nguyễn Hữu Đức", note: "IFC – Xây dựng chấp thuận",      status: "IFC"        },
    ]
  },
  {
    id: 6, code: "PRJ2501-ID-I-001", title: "Nội thất phòng khách – Phối cảnh 3D & layout",
    discipline: "ID", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng", projectCode: "PRJ-2025-0001",
    scale: "1:30", currentRev: "Rev A", currentStatus: "Draft",
    revisions: [
      { rev: "Rev A", date: "2025-03-05", by: "Lê Văn Khoa",   note: "Nháp – chờ KH duyệt",             status: "Draft"      },
    ]
  },
  {
    id: 7, code: "PRJ2415-KT-A-001", title: "Mặt bằng tổng thể biệt thự – 3 tầng",
    discipline: "KT", project: "Biệt thự Sông Long – Thủ Đức", projectCode: "PRJ-2024-0015",
    scale: "1:100", currentRev: "Rev D", currentStatus: "IFC",
    revisions: [
      { rev: "Rev A", date: "2023-08-01", by: "Nguyễn Hữu Đức", note: "Phát hành lần đầu",               status: "Superseded" },
      { rev: "Rev B", date: "2023-11-15", by: "Nguyễn Hữu Đức", note: "Điều chỉnh mặt bằng sân vườn",   status: "Superseded" },
      { rev: "Rev C", date: "2024-02-10", by: "Lê Văn Khoa",   note: "Bổ sung bể bơi",                  status: "Superseded" },
      { rev: "Rev D", date: "2024-05-20", by: "Lê Văn Khoa",   note: "IFC – Final hoàn công",           status: "IFC"        },
    ]
  },
  {
    id: 8, code: "PRJ2502-KT-A-001", title: "Mặt bằng văn phòng tầng 22 – Layout tổng thể",
    discipline: "KT", project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002",
    scale: "1:75", currentRev: "Rev B", currentStatus: "IFR",
    revisions: [
      { rev: "Rev A", date: "2025-02-01", by: "Lê Văn Khoa",   note: "Phát hành IFR",                   status: "Superseded" },
      { rev: "Rev B", date: "2025-03-08", by: "Nguyễn Hữu Đức", note: "Cập nhật theo góp ý KH",         status: "IFR"        },
    ]
  },
  {
    id: 9, code: "PRJ2502-ME-H-001", title: "Bố trí điều hòa & thông gió tầng 22",
    discipline: "ME", project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002",
    scale: "1:50", currentRev: "Rev A", currentStatus: "IFA",
    revisions: [
      { rev: "Rev A", date: "2025-03-10", by: "Trần Thị Mai",   note: "Gửi IFA chờ phê duyệt",          status: "IFA"        },
    ]
  },
]

// ── Configs ───────────────────────────────────────────────────────────────────
const DISCIPLINE_CONFIG: Record<Discipline, { label: string; color: string; bg: string }> = {
  KT: { label: "Kiến trúc",  color: "text-blue-700",   bg: "bg-blue-100"   },
  KC: { label: "Kết cấu",    color: "text-orange-700", bg: "bg-orange-100" },
  ME: { label: "M&E",        color: "text-purple-700", bg: "bg-purple-100" },
  ID: { label: "Nội thất",   color: "text-pink-700",   bg: "bg-pink-100"   },
  HL: { label: "Hoàn lộ",    color: "text-gray-700",   bg: "bg-gray-100"   },
}

const STATUS_CONFIG: Record<DrawingStatus, { color: string; desc: string }> = {
  IFC:        { color: "bg-green-100 text-green-800 border-green-300",   desc: "Issued for Construction" },
  IFR:        { color: "bg-blue-100 text-blue-800 border-blue-300",      desc: "Issued for Review"       },
  IFA:        { color: "bg-yellow-100 text-yellow-800 border-yellow-300", desc: "Issued for Approval"   },
  Superseded: { color: "bg-gray-100 text-gray-500 border-gray-200",      desc: "Hết hiệu lực"           },
  Draft:      { color: "bg-slate-100 text-slate-600 border-slate-200",   desc: "Bản nháp"               },
}

const DISCIPLINES: Array<{ key: "all" | Discipline; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "KT",  label: "Kiến trúc" },
  { key: "KC",  label: "Kết cấu" },
  { key: "ME",  label: "M&E" },
  { key: "ID",  label: "Nội thất" },
]

const STATUSES: Array<{ key: "all" | DrawingStatus; label: string }> = [
  { key: "all",   label: "Tất cả"  },
  { key: "IFC",   label: "IFC"     },
  { key: "IFR",   label: "IFR"     },
  { key: "IFA",   label: "IFA"     },
  { key: "Draft", label: "Nháp"    },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function DrawingsPage() {
  const [drawings]                        = useState(DRAWINGS)
  const [search, setSearch]               = useState("")
  const [discFilter, setDiscFilter]       = useState<"all" | Discipline>("all")
  const [statusFilter, setStatusFilter]   = useState<"all" | DrawingStatus>("all")
  const [projectFilter, setProjectFilter] = useState("Tất cả")
  const [expanded, setExpanded]           = useState<Set<number>>(new Set())
  const [showNew, setShowNew]             = useState(false)

  const toggle = (id: number) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const PROJECTS = ["Tất cả", ...Array.from(new Set(drawings.map(d => d.projectCode)))]

  const filtered = drawings.filter(d => {
    const matchSearch  = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    const matchDisc    = discFilter === "all" || d.discipline === discFilter
    const matchStatus  = statusFilter === "all" || d.currentStatus === statusFilter
    const matchProject = projectFilter === "Tất cả" || d.projectCode === projectFilter
    return matchSearch && matchDisc && matchStatus && matchProject
  })

  // Group by project
  const byProject = filtered.reduce<Record<string, Drawing[]>>((acc, d) => {
    if (!acc[d.project]) acc[d.project] = []
    acc[d.project].push(d)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-500" />
            Bản vẽ & Hồ sơ thiết kế
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {drawings.length} bản vẽ ·&nbsp;
            {drawings.filter(d => d.currentStatus === "IFC").length} IFC ·&nbsp;
            {drawings.filter(d => d.currentStatus === "IFR").length} IFR
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90"
          style={{ backgroundColor: "#E87625" }}>
          <Plus className="w-4 h-4" /> Thêm bản vẽ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["IFC", "IFR", "IFA", "Draft", "Superseded"] as DrawingStatus[]).map(s => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
            <div className="text-xl font-bold text-gray-800">
              {drawings.filter(d => d.currentStatus === s).length}
            </div>
            <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full border inline-block ${STATUS_CONFIG[s].color}`}>
              {s}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{STATUS_CONFIG[s].desc}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Tìm mã bản vẽ, tiêu đề..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-400 mr-1" />
          {DISCIPLINES.map(d => (
            <button key={d.key} onClick={() => setDiscFilter(d.key as "all" | Discipline)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                discFilter === d.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{d.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key as "all" | DrawingStatus)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                statusFilter === s.key ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{s.label}</button>
          ))}
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          {PROJECTS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Drawing list */}
      {Object.keys(byProject).length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 text-sm">
          Không tìm thấy bản vẽ nào.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byProject).map(([project, projectDrawings]) => (
            <div key={project} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Project header */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">{project}</span>
                <span className="text-xs text-gray-400">({projectDrawings.length} bản vẽ)</span>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left w-8"></th>
                    <th className="px-3 py-2.5 text-left">Mã bản vẽ</th>
                    <th className="px-3 py-2.5 text-left">Tiêu đề</th>
                    <th className="px-3 py-2.5 text-left">Bộ môn</th>
                    <th className="px-3 py-2.5 text-left">Tỉ lệ</th>
                    <th className="px-3 py-2.5 text-left">Rev hiện tại</th>
                    <th className="px-3 py-2.5 text-left">Trạng thái</th>
                    <th className="px-3 py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {projectDrawings.map(drw => {
                    const isOpen = expanded.has(drw.id)
                    const dc = DISCIPLINE_CONFIG[drw.discipline]
                    const sc = STATUS_CONFIG[drw.currentStatus]
                    return (
                      <>
                        <tr key={drw.id}
                          className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${isOpen ? "bg-orange-50/20" : ""}`}>
                          <td className="px-5 py-3">
                            <button onClick={() => toggle(drw.id)} className="text-gray-400 hover:text-gray-600">
                              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{drw.code}</td>
                          <td className="px-3 py-3">
                            <span className="text-sm font-medium text-gray-900">{drw.title}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${dc.bg} ${dc.color}`}>
                              {drw.discipline} — {dc.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-500 font-mono">{drw.scale}</td>
                          <td className="px-3 py-3 text-xs font-semibold text-gray-700">{drw.currentRev}</td>
                          <td className="px-3 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${sc.color}`}
                              title={sc.desc}>
                              {drw.currentStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Tải về">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => toggle(drw.id)}
                                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Lịch sử">
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Revision history row */}
                        {isOpen && (
                          <tr key={`${drw.id}-rev`}>
                            <td colSpan={8} className="px-0 py-0">
                              <div className="bg-slate-50 border-b border-gray-200 px-10 py-3">
                                <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5" /> Lịch sử phiên bản
                                </div>
                                <div className="space-y-1.5">
                                  {[...drw.revisions].reverse().map((rev, i) => (
                                    <div key={rev.rev}
                                      className={`flex items-center gap-4 text-xs py-1.5 px-3 rounded-lg ${i === 0 ? "bg-white border border-gray-200 shadow-sm" : "text-gray-400"}`}>
                                      <span className={`font-semibold font-mono w-12 ${i === 0 ? "text-gray-800" : ""}`}>{rev.rev}</span>
                                      <span className={`w-24 ${i === 0 ? "text-gray-600" : ""}`}>{rev.date}</span>
                                      <span className={`w-32 ${i === 0 ? "text-gray-600" : ""}`}>{rev.by}</span>
                                      <span className={`flex-1 ${i === 0 ? "text-gray-700" : ""}`}>{rev.note}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[rev.status].color}`}>
                                        {rev.status}
                                      </span>
                                      {i === 0 && (
                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-600 transition-colors">
                                          <Download className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* New drawing modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">Thêm bản vẽ mới</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mã bản vẽ</label>
                <input type="text" placeholder="VD: PRJ2501-KT-A-005"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu đề bản vẽ *</label>
                <input type="text" placeholder="VD: Mặt bằng tầng 3..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bộ môn</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {DISCIPLINES.filter(d => d.key !== "all").map(d => <option key={d.key} value={d.key}>{d.key} – {d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tỉ lệ</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {["1:25", "1:50", "1:75", "1:100", "1:200", "N.T.S"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái phát hành</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                  {(["Draft", "IFR", "IFA", "IFC"] as DrawingStatus[]).map(s => (
                    <option key={s} value={s}>{s} — {STATUS_CONFIG[s].desc}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Hủy</button>
              <button onClick={() => setShowNew(false)}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: "#E87625" }}>Thêm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
