"use client"
import { useState } from "react"
import {
  FolderOpen, Upload, Search, Download, Eye, MoreHorizontal,
  FileText, FileImage, File, FileCheck, X, Filter,
  Trash2, Share2, FolderKanban
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
type DocType = "contract" | "permit" | "drawing" | "minutes" | "report" | "photo" | "other"
type DocStatus = "active" | "superseded" | "draft"

interface Document {
  id: number
  name: string
  type: DocType
  project: string
  projectCode: string
  status: DocStatus
  version: string
  fileSize: string
  uploader: string
  uploadedAt: string
  tags: string[]
}

// ── Mock data ────────────────────────────────────────────────────────────────
const DOCS: Document[] = [
  { id: 1,  name: "Hợp đồng thi công căn hộ Mỹ Khánh",            type: "contract",  project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.2", fileSize: "2.4 MB",  uploader: "Nguyễn Hữu Đức",  uploadedAt: "2025-01-15", tags: ["HĐ chính"] },
  { id: 2,  name: "Phụ lục HĐ – Thay đổi nội thất tầng 2",        type: "contract",  project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0", fileSize: "890 KB",  uploader: "Trần Thị Mai",    uploadedAt: "2025-03-02", tags: ["Phụ lục"] },
  { id: 3,  name: "Giấy phép xây dựng – Sở Xây dựng TP.HCM",       type: "permit",    project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0", fileSize: "1.1 MB",  uploader: "Nguyễn Hữu Đức",  uploadedAt: "2024-12-10", tags: ["Pháp lý"] },
  { id: 4,  name: "Bản vẽ kiến trúc – Tầng điển hình",             type: "drawing",   project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "Rev C", fileSize: "8.7 MB",  uploader: "Lê Văn Khoa",     uploadedAt: "2025-02-20", tags: ["KT", "IFC"] },
  { id: 5,  name: "Biên bản nghiệm thu phần móng",                  type: "minutes",   project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0", fileSize: "450 KB",  uploader: "Trần Thị Mai",    uploadedAt: "2025-02-28", tags: ["BB nghiệm thu"] },
  { id: 6,  name: "Báo cáo tiến độ tháng 2/2025",                  type: "report",    project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0", fileSize: "1.8 MB",  uploader: "Nguyễn Hữu Đức",  uploadedAt: "2025-03-01", tags: ["Báo cáo T2"] },
  { id: 7,  name: "Ảnh hiện trạng công trình – 10/3/2025",          type: "photo",     project: "Căn hộ Mỹ Khánh – Phú Mỹ Hưng",  projectCode: "PRJ-2025-0001", status: "active",     version: "v1.0", fileSize: "24.5 MB", uploader: "Lê Văn Khoa",     uploadedAt: "2025-03-10", tags: ["Ảnh thi công"] },
  { id: 8,  name: "Hợp đồng thi công biệt thự Sông Long",          type: "contract",  project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "active",     version: "v2.1", fileSize: "3.1 MB",  uploader: "Trần Thị Mai",    uploadedAt: "2024-06-01", tags: ["HĐ chính"] },
  { id: 9,  name: "Bản vẽ M&E – Hệ thống điện tổng thể",           type: "drawing",   project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "superseded", version: "Rev A", fileSize: "5.2 MB",  uploader: "Lê Văn Khoa",     uploadedAt: "2024-08-15", tags: ["M&E", "Superseded"] },
  { id: 10, name: "Bản vẽ M&E – Hệ thống điện (cập nhật)",         type: "drawing",   project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "active",     version: "Rev C", fileSize: "5.8 MB",  uploader: "Lê Văn Khoa",     uploadedAt: "2024-11-20", tags: ["M&E", "IFC"] },
  { id: 11, name: "Biên bản bàn giao công trình hoàn thành",        type: "minutes",   project: "Biệt thự Sông Long – Thủ Đức",    projectCode: "PRJ-2024-0015", status: "active",     version: "v1.0", fileSize: "680 KB",  uploader: "Nguyễn Hữu Đức",  uploadedAt: "2025-01-30", tags: ["BB bàn giao"] },
  { id: 12, name: "Hợp đồng thuê mặt sàn văn phòng Landmark 81",   type: "contract",  project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002", status: "draft",      version: "Draft", fileSize: "1.5 MB",  uploader: "Trần Thị Mai",    uploadedAt: "2025-03-05", tags: ["Nháp"] },
  { id: 13, name: "Bản vẽ thiết kế nội thất văn phòng",            type: "drawing",   project: "Văn phòng Landmark 81 – Tầng 22", projectCode: "PRJ-2025-0002", status: "active",     version: "Rev B", fileSize: "12.3 MB", uploader: "Lê Văn Khoa",     uploadedAt: "2025-03-08", tags: ["ID", "IFR"] },
]

const TYPE_CONFIG: Record<DocType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  contract: { label: "Hợp đồng",    icon: <FileCheck className="w-4 h-4" />,  color: "text-blue-700",   bg: "bg-blue-50"   },
  permit:   { label: "Giấy phép",   icon: <FileText className="w-4 h-4" />,   color: "text-purple-700", bg: "bg-purple-50" },
  drawing:  { label: "Bản vẽ",      icon: <File className="w-4 h-4" />,        color: "text-orange-700", bg: "bg-orange-50" },
  minutes:  { label: "Biên bản",    icon: <FileText className="w-4 h-4" />,   color: "text-teal-700",   bg: "bg-teal-50"   },
  report:   { label: "Báo cáo",     icon: <FileText className="w-4 h-4" />,   color: "text-green-700",  bg: "bg-green-50"  },
  photo:    { label: "Ảnh",         icon: <FileImage className="w-4 h-4" />,   color: "text-pink-700",   bg: "bg-pink-50"   },
  other:    { label: "Khác",        icon: <File className="w-4 h-4" />,        color: "text-gray-700",   bg: "bg-gray-100"  },
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  active:     { label: "Hiệu lực",   color: "bg-green-100 text-green-700"  },
  superseded: { label: "Hết hiệu lực", color: "bg-gray-100 text-gray-500"  },
  draft:      { label: "Nháp",       color: "bg-yellow-100 text-yellow-700" },
}

const PROJECTS = ["Tất cả", ...Array.from(new Set(DOCS.map(d => d.projectCode)))]
const TYPES: Array<{ key: "all" | DocType; label: string }> = [
  { key: "all",      label: "Tất cả"    },
  { key: "contract", label: "Hợp đồng"  },
  { key: "permit",   label: "Giấy phép" },
  { key: "drawing",  label: "Bản vẽ"    },
  { key: "minutes",  label: "Biên bản"  },
  { key: "report",   label: "Báo cáo"   },
  { key: "photo",    label: "Ảnh"       },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs, setDocs]               = useState(DOCS)
  const [search, setSearch]           = useState("")
  const [typeFilter, setTypeFilter]   = useState<"all" | DocType>("all")
  const [projectFilter, setProjectFilter] = useState("Tất cả")
  const [showUpload, setShowUpload]   = useState(false)
  const [menuId, setMenuId]           = useState<number | null>(null)
  const [uploadForm, setUploadForm]   = useState({ name: "", type: "contract" as DocType, project: "PRJ-2025-0001", tags: "" })

  const filtered = docs.filter(d => {
    const matchSearch  = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchType    = typeFilter === "all" || d.type === typeFilter
    const matchProject = projectFilter === "Tất cả" || d.projectCode === projectFilter
    return matchSearch && matchType && matchProject
  })

  const handleUpload = () => {
    if (!uploadForm.name) return
    const newDoc: Document = {
      id: Date.now(), name: uploadForm.name, type: uploadForm.type,
      project: uploadForm.project, projectCode: uploadForm.project,
      status: "active", version: "v1.0", fileSize: "—",
      uploader: "Người dùng hiện tại", uploadedAt: new Date().toISOString().slice(0, 10),
      tags: uploadForm.tags.split(",").map(t => t.trim()).filter(Boolean),
    }
    setDocs(prev => [newDoc, ...prev])
    setShowUpload(false)
    setUploadForm({ name: "", type: "contract", project: "PRJ-2025-0001", tags: "" })
  }

  const handleDelete = (id: number) => {
    setDocs(prev => prev.filter(d => d.id !== id))
    setMenuId(null)
  }

  // Group by project
  const byProject = filtered.reduce<Record<string, Document[]>>((acc, d) => {
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
            <FolderOpen className="w-6 h-6 text-orange-500" />
            Tài liệu & Hồ sơ
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{docs.length} tài liệu · {docs.filter(d => d.status === "active").length} đang hiệu lực</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90"
          style={{ backgroundColor: "#E87625" }}>
          <Upload className="w-4 h-4" /> Tải lên tài liệu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Hợp đồng",  value: docs.filter(d => d.type === "contract").length,  color: "text-blue-600",   icon: <FileCheck className="w-5 h-5" /> },
          { label: "Bản vẽ",    value: docs.filter(d => d.type === "drawing").length,   color: "text-orange-600", icon: <File className="w-5 h-5" /> },
          { label: "Biên bản",  value: docs.filter(d => d.type === "minutes").length,   color: "text-teal-600",   icon: <FileText className="w-5 h-5" /> },
          { label: "Hết hiệu lực", value: docs.filter(d => d.status === "superseded").length, color: "text-gray-500", icon: <File className="w-5 h-5" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Tìm tài liệu, tag..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-400 mr-1" />
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                typeFilter === t.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          {PROJECTS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Document list */}
      {Object.keys(byProject).length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          Không tìm thấy tài liệu nào.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byProject).map(([project, projectDocs]) => (
            <div key={project} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Project header */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">{project}</span>
                <span className="text-xs text-gray-400">({projectDocs.length} tài liệu)</span>
              </div>

              {/* Docs table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left">Tên tài liệu</th>
                    <th className="px-3 py-2.5 text-left">Loại</th>
                    <th className="px-3 py-2.5 text-left">Trạng thái</th>
                    <th className="px-3 py-2.5 text-left">Phiên bản</th>
                    <th className="px-3 py-2.5 text-left">Người tải</th>
                    <th className="px-3 py-2.5 text-left">Ngày</th>
                    <th className="px-3 py-2.5 text-left">Kích thước</th>
                    <th className="px-3 py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projectDocs.map(doc => {
                    const tc = TYPE_CONFIG[doc.type]
                    return (
                      <tr key={doc.id}
                        className={`hover:bg-gray-50/60 transition-colors ${doc.status === "superseded" ? "opacity-60" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`${tc.bg} ${tc.color} p-1.5 rounded-lg shrink-0 mt-0.5`}>{tc.icon}</div>
                            <div>
                              <div className={`text-sm font-medium ${doc.status === "superseded" ? "line-through text-gray-400" : "text-gray-900"}`}>
                                {doc.name}
                              </div>
                              {doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {doc.tags.map(t => (
                                    <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-medium ${tc.color}`}>{tc.label}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[doc.status].color}`}>
                            {STATUS_CONFIG[doc.status].label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs font-mono text-gray-600">{doc.version}</td>
                        <td className="px-3 py-3 text-xs text-gray-600">{doc.uploader}</td>
                        <td className="px-3 py-3 text-xs text-gray-500">{doc.uploadedAt}</td>
                        <td className="px-3 py-3 text-xs text-gray-500">{doc.fileSize}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Tải về">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Chia sẻ">
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative">
                              <button onClick={() => setMenuId(menuId === doc.id ? null : doc.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                              {menuId === doc.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-1 w-36">
                                  <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
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

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setMenuId(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">Tải lên tài liệu mới</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {/* Drop zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Kéo thả file vào đây hoặc <span className="text-orange-500 font-medium">chọn file</span></p>
                <p className="text-xs text-gray-400 mt-1">PDF, DWG, DOC, XLS, JPG — tối đa 50MB</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên tài liệu *</label>
                <input type="text" value={uploadForm.name}
                  onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Hợp đồng thi công..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Loại tài liệu</label>
                  <select value={uploadForm.type}
                    onChange={e => setUploadForm(f => ({ ...f, type: e.target.value as DocType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {TYPES.filter(t => t.key !== "all").map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dự án</label>
                  <select value={uploadForm.project}
                    onChange={e => setUploadForm(f => ({ ...f, project: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {["PRJ-2025-0001", "PRJ-2024-0015", "PRJ-2025-0002"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tags (cách nhau bằng dấu phẩy)</label>
                <input type="text" value={uploadForm.tags}
                  onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="VD: HĐ chính, Pháp lý, IFC..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
              <button onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Hủy</button>
              <button onClick={handleUpload}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: "#E87625" }}>Tải lên</button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {menuId && <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />}
    </div>
  )
}
