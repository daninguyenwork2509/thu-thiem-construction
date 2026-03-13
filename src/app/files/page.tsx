"use client"
import { useState } from "react"
import {
  FolderOpen, Upload, Search, Download, Eye, MoreHorizontal,
  FileText, FileImage, File, FileCheck, X, Filter, Trash2, Share2,
  FolderKanban, Layers, Plus, History, ChevronRight, ChevronDown
} from "lucide-react"

// ══════════════════════════════════════════════════════════════════
// DOCUMENTS DATA
// ══════════════════════════════════════════════════════════════════
type DocType   = "contract" | "permit" | "drawing" | "minutes" | "report" | "photo" | "other"
type DocStatus = "active" | "superseded" | "draft"
interface Document { id: number; name: string; type: DocType; project: string; projectCode: string; status: DocStatus; version: string; fileSize: string; uploader: string; uploadedAt: string; tags: string[] }

const DOCS: Document[] = [
  { id: 1,  name: "Hợp đồng thi công căn hộ Mỹ Khánh",         type: "contract", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.2",  fileSize: "2.4 MB",  uploader: "Nguyễn Hữu Đức", uploadedAt: "2025-01-15", tags: ["HĐ chính"]       },
  { id: 2,  name: "Phụ lục HĐ – Thay đổi nội thất tầng 2",     type: "contract", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0",  fileSize: "890 KB",  uploader: "Trần Thị Mai",   uploadedAt: "2025-03-02", tags: ["Phụ lục"]        },
  { id: 3,  name: "Giấy phép xây dựng – Sở Xây dựng TP.HCM",    type: "permit",   project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0",  fileSize: "1.1 MB",  uploader: "Nguyễn Hữu Đức", uploadedAt: "2024-12-10", tags: ["Pháp lý"]        },
  { id: 4,  name: "Bản vẽ kiến trúc – Tầng điển hình",           type: "drawing",  project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "Rev C", fileSize: "8.7 MB",  uploader: "Lê Văn Khoa",    uploadedAt: "2025-02-20", tags: ["KT", "IFC"]      },
  { id: 5,  name: "Biên bản nghiệm thu phần móng",               type: "minutes",  project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0",  fileSize: "450 KB",  uploader: "Trần Thị Mai",   uploadedAt: "2025-02-28", tags: ["BB nghiệm thu"]  },
  { id: 6,  name: "Báo cáo tiến độ tháng 2/2025",               type: "report",   project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0",  fileSize: "1.8 MB",  uploader: "Nguyễn Hữu Đức", uploadedAt: "2025-03-01", tags: ["Báo cáo T2"]     },
  { id: 7,  name: "Ảnh hiện trạng công trình – 10/3/2025",       type: "photo",    project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0",  fileSize: "24.5 MB", uploader: "Lê Văn Khoa",    uploadedAt: "2025-03-10", tags: ["Ảnh thi công"]   },
  { id: 8,  name: "Hợp đồng thi công biệt thự Sông Long",       type: "contract", project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "active",     version: "v2.1",  fileSize: "3.1 MB",  uploader: "Trần Thị Mai",   uploadedAt: "2024-06-01", tags: ["HĐ chính"]       },
  { id: 9,  name: "Bản vẽ M&E – Hệ thống điện (cũ)",            type: "drawing",  project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "superseded", version: "Rev A", fileSize: "5.2 MB",  uploader: "Lê Văn Khoa",    uploadedAt: "2024-08-15", tags: ["M&E", "Superseded"] },
  { id: 10, name: "Bản vẽ M&E – Hệ thống điện (cập nhật)",      type: "drawing",  project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "active",     version: "Rev C", fileSize: "5.8 MB",  uploader: "Lê Văn Khoa",    uploadedAt: "2024-11-20", tags: ["M&E", "IFC"]     },
  { id: 11, name: "Biên bản bàn giao công trình hoàn thành",     type: "minutes",  project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "active",     version: "v1.0",  fileSize: "680 KB",  uploader: "Nguyễn Hữu Đức", uploadedAt: "2025-01-30", tags: ["BB bàn giao"]    },
  { id: 12, name: "Hợp đồng thuê mặt sàn VP Landmark 81",       type: "contract", project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002", status: "draft",      version: "Draft", fileSize: "1.5 MB",  uploader: "Trần Thị Mai",   uploadedAt: "2025-03-05", tags: ["Nháp"]           },
  { id: 13, name: "Bản vẽ thiết kế nội thất văn phòng",         type: "drawing",  project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002", status: "active",     version: "Rev B", fileSize: "12.3 MB", uploader: "Lê Văn Khoa",    uploadedAt: "2025-03-08", tags: ["ID", "IFR"]      },
]

const TYPE_CONFIG: Record<DocType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  contract: { label: "Hợp đồng",  icon: <FileCheck className="w-4 h-4" />, color: "text-blue-700",   bg: "bg-blue-50"   },
  permit:   { label: "Giấy phép", icon: <FileText className="w-4 h-4" />,  color: "text-purple-700", bg: "bg-purple-50" },
  drawing:  { label: "Bản vẽ",    icon: <File className="w-4 h-4" />,       color: "text-orange-700", bg: "bg-orange-50" },
  minutes:  { label: "Biên bản",  icon: <FileText className="w-4 h-4" />,  color: "text-teal-700",   bg: "bg-teal-50"   },
  report:   { label: "Báo cáo",   icon: <FileText className="w-4 h-4" />,  color: "text-green-700",  bg: "bg-green-50"  },
  photo:    { label: "Ảnh",       icon: <FileImage className="w-4 h-4" />, color: "text-pink-700",   bg: "bg-pink-50"   },
  other:    { label: "Khác",      icon: <File className="w-4 h-4" />,       color: "text-gray-700",   bg: "bg-gray-100"  },
}
const STATUS_DOC: Record<DocStatus, { label: string; color: string }> = {
  active:     { label: "Hiệu lực",     color: "bg-green-100 text-green-700"  },
  superseded: { label: "Hết hiệu lực", color: "bg-gray-100 text-gray-500"    },
  draft:      { label: "Nháp",         color: "bg-yellow-100 text-yellow-700" },
}
const DOC_TYPES: Array<{ key: "all" | DocType; label: string }> = [
  { key: "all", label: "Tất cả" }, { key: "contract", label: "Hợp đồng" },
  { key: "permit", label: "Giấy phép" }, { key: "drawing", label: "Bản vẽ" },
  { key: "minutes", label: "Biên bản" }, { key: "report", label: "Báo cáo" }, { key: "photo", label: "Ảnh" },
]

// ══════════════════════════════════════════════════════════════════
// DRAWINGS DATA
// ══════════════════════════════════════════════════════════════════
type Discipline    = "KT" | "KC" | "ME" | "ID" | "HL"
type DrawingStatus = "IFC" | "IFR" | "IFA" | "Superseded" | "Draft"
interface Revision { rev: string; date: string; by: string; note: string; status: DrawingStatus }
interface Drawing  { id: number; code: string; title: string; discipline: Discipline; project: string; projectCode: string; scale: string; currentRev: string; currentStatus: DrawingStatus; revisions: Revision[] }

const DRAWINGS: Drawing[] = [
  { id: 1, code: "PRJ2501-KT-A-001", title: "Mặt bằng tổng thể – Tầng điển hình",           discipline: "KT", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", scale: "1:50",   currentRev: "Rev C", currentStatus: "IFC",  revisions: [{ rev: "Rev A", date: "2024-11-10", by: "Lê Văn Khoa",    note: "Phát hành lần đầu",              status: "Superseded" }, { rev: "Rev B", date: "2025-01-15", by: "Lê Văn Khoa",    note: "Cập nhật cầu thang bộ",          status: "Superseded" }, { rev: "Rev C", date: "2025-02-20", by: "Nguyễn Hữu Đức", note: "IFC – Đã KH duyệt",              status: "IFC"        }] },
  { id: 2, code: "PRJ2501-KT-A-002", title: "Mặt đứng & Mặt cắt – Phối cảnh ngoại thất",   discipline: "KT", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", scale: "1:100",  currentRev: "Rev B", currentStatus: "IFR",  revisions: [{ rev: "Rev A", date: "2024-12-01", by: "Lê Văn Khoa",    note: "Phát hành IFR lần đầu",          status: "Superseded" }, { rev: "Rev B", date: "2025-03-01", by: "Lê Văn Khoa",    note: "Cập nhật thiết kế mái",          status: "IFR"        }] },
  { id: 3, code: "PRJ2501-KC-S-001", title: "Bản vẽ kết cấu móng – Chi tiết thép",          discipline: "KC", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", scale: "1:25",   currentRev: "Rev B", currentStatus: "IFC",  revisions: [{ rev: "Rev A", date: "2024-11-20", by: "Trần Thị Mai",   note: "Phát hành lần đầu",              status: "Superseded" }, { rev: "Rev B", date: "2025-01-08", by: "Trần Thị Mai",   note: "Sửa mật độ thép đai",            status: "IFC"        }] },
  { id: 4, code: "PRJ2501-ME-E-001", title: "Sơ đồ đơn tuyến tủ điện MDB",                 discipline: "ME", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", scale: "N.T.S",  currentRev: "Rev A", currentStatus: "IFC",  revisions: [{ rev: "Rev A", date: "2025-01-25", by: "Lê Văn Khoa",    note: "IFC – Duyệt điện lực",           status: "IFC"        }] },
  { id: 5, code: "PRJ2501-ME-P-001", title: "Bố trí cấp thoát nước tầng điển hình",        discipline: "ME", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", scale: "1:50",   currentRev: "Rev C", currentStatus: "IFC",  revisions: [{ rev: "Rev A", date: "2024-12-05", by: "Trần Thị Mai",   note: "Phát hành lần đầu",              status: "Superseded" }, { rev: "Rev B", date: "2025-01-20", by: "Trần Thị Mai",   note: "Điều chỉnh ống đứng",            status: "Superseded" }, { rev: "Rev C", date: "2025-02-15", by: "Nguyễn Hữu Đức", note: "IFC – Xây dựng chấp thuận",      status: "IFC"        }] },
  { id: 6, code: "PRJ2501-ID-I-001", title: "Nội thất phòng khách – Layout & 3D",           discipline: "ID", project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", scale: "1:30",   currentRev: "Rev A", currentStatus: "Draft", revisions: [{ rev: "Rev A", date: "2025-03-05", by: "Lê Văn Khoa",    note: "Nháp – chờ KH duyệt",            status: "Draft"      }] },
  { id: 7, code: "PRJ2415-KT-A-001", title: "Mặt bằng tổng thể biệt thự – 3 tầng",         discipline: "KT", project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", scale: "1:100",  currentRev: "Rev D", currentStatus: "IFC",  revisions: [{ rev: "Rev D", date: "2024-05-20", by: "Lê Văn Khoa",    note: "IFC – Final hoàn công",          status: "IFC"        }] },
  { id: 8, code: "PRJ2502-ID-I-001", title: "Bản vẽ nội thất văn phòng – Layout tổng",     discipline: "ID", project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002", scale: "1:50",   currentRev: "Rev B", currentStatus: "IFR",  revisions: [{ rev: "Rev A", date: "2025-02-01", by: "Lê Văn Khoa",    note: "Phát hành IFR",                  status: "Superseded" }, { rev: "Rev B", date: "2025-03-08", by: "Lê Văn Khoa",    note: "Cập nhật theo ý KH",             status: "IFR"        }] },
]

const DISC_CONFIG: Record<Discipline, { label: string; color: string; bg: string }> = {
  KT: { label: "Kiến trúc",  color: "text-blue-700",   bg: "bg-blue-50"   },
  KC: { label: "Kết cấu",   color: "text-orange-700", bg: "bg-orange-50" },
  ME: { label: "M&E",        color: "text-green-700",  bg: "bg-green-50"  },
  ID: { label: "Nội thất",  color: "text-purple-700", bg: "bg-purple-50" },
  HL: { label: "Hoàn lực",  color: "text-gray-700",   bg: "bg-gray-100"  },
}
const STATUS_DWG: Record<DrawingStatus, { label: string; color: string }> = {
  IFC:        { label: "IFC",        color: "bg-green-100 text-green-700"  },
  IFR:        { label: "IFR",        color: "bg-blue-100 text-blue-700"    },
  IFA:        { label: "IFA",        color: "bg-yellow-100 text-yellow-700" },
  Superseded: { label: "Superseded", color: "bg-gray-100 text-gray-500"    },
  Draft:      { label: "Draft",      color: "bg-orange-100 text-orange-700" },
}

// ══════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════
export default function FilesPage() {
  const [tab, setTab] = useState<"documents" | "drawings">("documents")

  return (
    <div className="flex flex-col h-full">
      {/* Page header + tabs */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-orange-500" /> Hồ sơ & Tài liệu
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Tài liệu hợp đồng, bản vẽ kỹ thuật, biên bản nghiệm thu</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm transition"
            style={{ backgroundColor: "#E87625" }}>
            <Upload className="w-4 h-4" /> Tải lên
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {[
            { key: "documents" as const, label: "Tài liệu & Hợp đồng", icon: FileText, count: DOCS.length },
            { key: "drawings"  as const, label: "Bản vẽ kỹ thuật",     icon: Layers,   count: DRAWINGS.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "documents" ? <DocumentsTab /> : <DrawingsTab />}
      </div>
    </div>
  )
}

// ── Documents Tab ─────────────────────────────────────────────────
function DocumentsTab() {
  const [docs, setDocs]         = useState(DOCS)
  const [search, setSearch]     = useState("")
  const [typeFilter, setType]   = useState<"all" | DocType>("all")
  const [projFilter, setProj]   = useState("Tất cả")
  const [menuId, setMenuId]     = useState<number | null>(null)

  const projects = ["Tất cả", ...Array.from(new Set(DOCS.map(d => d.projectCode)))]
  const filtered = docs.filter(d => {
    const s = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const t = typeFilter === "all" || d.type === typeFilter
    const p = projFilter === "Tất cả" || d.projectCode === projFilter
    return s && t && p
  })
  const byProject = filtered.reduce<Record<string, Document[]>>((acc, d) => {
    if (!acc[d.project]) acc[d.project] = []
    acc[d.project].push(d)
    return acc
  }, {})

  return (
    <div className="space-y-4 max-w-[1300px]">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Hợp đồng",     value: docs.filter(d => d.type === "contract").length, color: "text-blue-600",   icon: <FileCheck className="w-4 h-4" /> },
          { label: "Bản vẽ",       value: docs.filter(d => d.type === "drawing").length,  color: "text-orange-600", icon: <File className="w-4 h-4" /> },
          { label: "Biên bản",     value: docs.filter(d => d.type === "minutes").length,  color: "text-teal-600",   icon: <FileText className="w-4 h-4" /> },
          { label: "Hết hiệu lực", value: docs.filter(d => d.status === "superseded").length, color: "text-gray-400", icon: <File className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            <div className={s.color}>{s.icon}</div>
            <div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Tìm tài liệu, tag..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:border-orange-400" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-400 mr-1" />
          {DOC_TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                typeFilter === t.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{t.label}</button>
          ))}
        </div>
        <select value={projFilter} onChange={e => setProj(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      {Object.keys(byProject).length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
          Không tìm thấy tài liệu nào.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byProject).map(([project, pdocs]) => (
            <div key={project} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">{project}</span>
                <span className="text-xs text-gray-400">({pdocs.length} tài liệu)</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                    {["Tên tài liệu", "Loại", "Trạng thái", "Phiên bản", "Người tải", "Ngày", "Kích thước", ""].map(h => (
                      <th key={h} className={`px-4 py-2.5 ${h === "Tên tài liệu" ? "text-left" : h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pdocs.map(doc => {
                    const tc = TYPE_CONFIG[doc.type]
                    return (
                      <tr key={doc.id} className={`hover:bg-gray-50/60 transition-colors ${doc.status === "superseded" ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`${tc.bg} ${tc.color} p-1.5 rounded-lg shrink-0 mt-0.5`}>{tc.icon}</div>
                            <div>
                              <div className={`text-sm font-medium ${doc.status === "superseded" ? "line-through text-gray-400" : "text-gray-900"}`}>{doc.name}</div>
                              {doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {doc.tags.map(t => <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: tc.color.replace("text-", "") }}>{tc.label}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_DOC[doc.status].color}`}>{STATUS_DOC[doc.status].label}</span></td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-600">{doc.version}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{doc.uploader}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{doc.uploadedAt}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{doc.fileSize}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Xem"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Tải về"><Download className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Chia sẻ"><Share2 className="w-3.5 h-3.5" /></button>
                            <div className="relative">
                              <button onClick={() => setMenuId(menuId === doc.id ? null : doc.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                              {menuId === doc.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 w-36">
                                  <button onClick={() => { setDocs(d => d.filter(x => x.id !== doc.id)); setMenuId(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition">
                                    <Trash2 className="w-3.5 h-3.5" /> Xoá tài liệu
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {menuId && <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />}
    </div>
  )
}

// ── Drawings Tab ──────────────────────────────────────────────────
function DrawingsTab() {
  const [search, setSearch]     = useState("")
  const [discFilter, setDisc]   = useState<"all" | Discipline>("all")
  const [projFilter, setProj]   = useState("Tất cả")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const projects = ["Tất cả", ...Array.from(new Set(DRAWINGS.map(d => d.projectCode)))]
  const filtered = DRAWINGS.filter(d => {
    const s = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    const di = discFilter === "all" || d.discipline === discFilter
    const p  = projFilter === "Tất cả" || d.projectCode === projFilter
    return s && di && p
  })
  const byProject = filtered.reduce<Record<string, Drawing[]>>((acc, d) => {
    if (!acc[d.project]) acc[d.project] = []
    acc[d.project].push(d)
    return acc
  }, {})

  const toggleExpand = (id: number) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const DISCIPLINES: Array<{ key: "all" | Discipline; label: string }> = [
    { key: "all", label: "Tất cả" }, { key: "KT", label: "Kiến trúc" },
    { key: "KC", label: "Kết cấu" }, { key: "ME", label: "M&E" },
    { key: "ID", label: "Nội thất" }, { key: "HL", label: "Hoàn lực" },
  ]

  return (
    <div className="space-y-4 max-w-[1300px]">
      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {(["KT","KC","ME","ID","HL"] as Discipline[]).map(d => (
          <div key={d} className={`${DISC_CONFIG[d].bg} rounded-xl border border-gray-200 p-3 text-center`}>
            <div className={`text-xl font-bold ${DISC_CONFIG[d].color}`}>{DRAWINGS.filter(dr => dr.discipline === d).length}</div>
            <div className="text-xs text-gray-500">{DISC_CONFIG[d].label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Tìm bản vẽ, mã số..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:border-orange-400" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {DISCIPLINES.map(t => (
            <button key={t.key} onClick={() => setDisc(t.key)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                discFilter === t.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{t.label}</button>
          ))}
        </div>
        <select value={projFilter} onChange={e => setProj(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {Object.entries(byProject).map(([project, drawings]) => (
          <div key={project} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-800 text-sm">{project}</span>
              <span className="text-xs text-gray-400">({drawings.length} bản vẽ)</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                  {["Mã số", "Tên bản vẽ", "Bộ môn", "Tỉ lệ", "Rev hiện tại", "Trạng thái", ""].map(h => (
                    <th key={h} className={`px-4 py-2.5 ${h === "Tên bản vẽ" || h === "Mã số" ? "text-left" : h === "" ? "text-right" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drawings.map(dwg => {
                  const dc   = DISC_CONFIG[dwg.discipline]
                  const sc   = STATUS_DWG[dwg.currentStatus]
                  const open = expanded.has(dwg.id)
                  return (
                    <>
                      <tr key={dwg.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{dwg.code}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{dwg.title}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${dc.bg} ${dc.color}`}>{dwg.discipline} — {dc.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-mono text-gray-600">{dwg.scale}</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-gray-700">{dwg.currentRev}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toggleExpand(dwg.id)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition flex items-center gap-1 text-xs">
                              <History className="w-3.5 h-3.5" />
                              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"><Download className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                      {open && dwg.revisions.map(rev => (
                        <tr key={rev.rev} className="bg-blue-50/30">
                          <td className="pl-10 pr-4 py-2 text-xs font-mono text-gray-500">{rev.rev}</td>
                          <td className="px-4 py-2 text-xs text-gray-600 italic">{rev.note}</td>
                          <td className="px-4 py-2 text-center text-xs text-gray-500">{rev.by}</td>
                          <td className="px-4 py-2 text-center text-xs text-gray-400">{rev.date}</td>
                          <td />
                          <td className="px-4 py-2 text-center">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_DWG[rev.status].color}`}>{rev.status}</span>
                          </td>
                          <td />
                        </tr>
                      ))}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
