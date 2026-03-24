"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Plus, Download, Trash2, FileText, ChevronDown, ChevronRight, X, Upload } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

type FileCategory = "Hợp đồng" | "Khảo sát" | "Thiết kế" | "Thi công" | "Nghiệm thu"

interface FileRecord {
  id: string
  name: string
  size: number        // bytes
  type: string        // MIME
  extension: string
  category: FileCategory
  uploadedAt: string
  uploadedBy: string
  dataUrl?: string    // base64, only if < 5MB
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: FileCategory[] = ["Hợp đồng", "Khảo sát", "Thiết kế", "Thi công", "Nghiệm thu"]

const STEP_COLORS: Record<FileCategory, string> = {
  "Hợp đồng":   "bg-purple-50 text-purple-700 border-purple-200",
  "Khảo sát":   "bg-blue-50 text-blue-700 border-blue-200",
  "Thiết kế":   "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Thi công":   "bg-orange-50 text-orange-700 border-orange-200",
  "Nghiệm thu": "bg-green-50 text-green-700 border-green-200",
}

const MOCK_FILES: FileRecord[] = [
  { id: "m1",  name: "Hợp đồng thi công.pdf",           size: 2_516_582, type: "application/pdf", extension: "pdf",  category: "Hợp đồng",   uploadedAt: "01/02/2025", uploadedBy: "Admin" },
  { id: "m2",  name: "Phụ lục hợp đồng điều chỉnh.pdf", size:   943_718, type: "application/pdf", extension: "pdf",  category: "Hợp đồng",   uploadedAt: "15/02/2025", uploadedBy: "Admin" },
  { id: "m3",  name: "Ảnh khảo sát hiện trạng 01.jpg",  size: 3_250_176, type: "image/jpeg",       extension: "jpg",  category: "Khảo sát",   uploadedAt: "10/01/2025", uploadedBy: "KS Dũng" },
  { id: "m4",  name: "Ảnh khảo sát hiện trạng 02.jpg",  size: 2_936_832, type: "image/jpeg",       extension: "jpg",  category: "Khảo sát",   uploadedAt: "10/01/2025", uploadedBy: "KS Dũng" },
  { id: "m5",  name: "Bản vẽ kiến trúc mặt bằng.dwg",   size: 8_493_056, type: "application/octet-stream", extension: "dwg", category: "Thiết kế", uploadedAt: "05/02/2025", uploadedBy: "KS Hà" },
  { id: "m6",  name: "Bản vẽ điện M&E.pdf",             size: 3_354_214, type: "application/pdf", extension: "pdf",  category: "Thiết kế",   uploadedAt: "10/02/2025", uploadedBy: "KS Hà" },
  { id: "m7",  name: "Bảng vật liệu được duyệt.xlsx",   size:   838_860, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", category: "Thi công", uploadedAt: "20/02/2025", uploadedBy: "QS Nam" },
  { id: "m8",  name: "Ảnh tiến độ tuần 05.jpg",         size: 4_404_224, type: "image/jpeg",       extension: "jpg",  category: "Thi công",   uploadedAt: "08/03/2025", uploadedBy: "GS Mạnh" },
  { id: "m9",  name: "Biên bản nghiệm thu phần thô.pdf",size: 1_153_434, type: "application/pdf", extension: "pdf",  category: "Nghiệm thu", uploadedAt: "15/04/2025", uploadedBy: "PM Tuấn" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " MB"
  return (bytes / 1024).toFixed(0) + " KB"
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

function FileIcon({ ext, dataUrl, size }: { ext: string; dataUrl?: string; size?: string }) {
  if ((ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") && dataUrl) {
    return <img src={dataUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
  }
  const colors: Record<string, string> = {
    pdf: "bg-red-100 text-red-600", dwg: "bg-violet-100 text-violet-600",
    xlsx: "bg-green-100 text-green-600", docx: "bg-blue-100 text-blue-600",
    jpg: "bg-orange-100 text-orange-600", jpeg: "bg-orange-100 text-orange-600",
    png: "bg-orange-100 text-orange-600",
  }
  const labels: Record<string, string> = {
    pdf: "PDF", dwg: "DWG", xlsx: "XLS", docx: "DOC",
    jpg: "IMG", jpeg: "IMG", png: "IMG",
  }
  const color = colors[ext] ?? "bg-gray-100 text-gray-500"
  const label = labels[ext] ?? ext.toUpperCase().slice(0, 3)
  return (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${color}`}>
      {label}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectFilesTab({ projectId }: { projectId: string }) {
  const storageKey = `files_${projectId}`
  const [files, setFiles] = useState<FileRecord[]>([])
  const [collapsed, setCollapsed] = useState<Set<FileCategory>>(new Set())
  const [activeFilter, setActiveFilter] = useState<"all" | FileCategory>("all")
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dialogCategory, setDialogCategory] = useState<FileCategory>("Hợp đồng")
  const [deleteConfirm, setDeleteConfirm] = useState<FileRecord | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingCategoryRef = useRef<FileCategory>("Hợp đồng")

  // ── Load from localStorage (merge with mock on first load) ────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setFiles(JSON.parse(stored))
      } else {
        setFiles(MOCK_FILES)
      }
    } catch {
      setFiles(MOCK_FILES)
    }
  }, [storageKey])

  const persist = useCallback((next: FileRecord[]) => {
    setFiles(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* quota exceeded */ }
  }, [storageKey])

  const persistFn = useCallback((updater: (prev: FileRecord[]) => FileRecord[]) => {
    setFiles(prev => {
      const next = updater(prev)
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* quota exceeded */ }
      return next
    })
  }, [storageKey])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Upload handler ─────────────────────────────────────────────────────────
  const processUpload = useCallback(async (file: File, category: FileCategory) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast("❌ File quá lớn (tối đa 10MB)")
      return
    }

    setPendingFile(null)
    setUploading({ name: file.name, pct: 0 })

    // Fake progress 0 → 100% over 1.2s
    const STEPS = 24
    for (let i = 1; i <= STEPS; i++) {
      await new Promise(r => setTimeout(r, 1200 / STEPS))
      setUploading({ name: file.name, pct: Math.round((i / STEPS) * 100) })
    }

    let dataUrl: string | undefined
    if (file.size < 5 * 1024 * 1024) {
      dataUrl = await new Promise<string>(res => {
        const reader = new FileReader()
        reader.onload = e => res(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }

    const record: FileRecord = {
      id: uid(),
      name: file.name,
      size: file.size,
      type: file.type,
      extension: getExt(file.name),
      category,
      uploadedAt: new Date().toLocaleDateString("vi-VN"),
      uploadedBy: "Bạn",
      dataUrl,
    }

    persistFn(prev => [record, ...prev])

    setUploading(null)
    showToast(`✓ Đã tải lên ${file.name}`)
  }, [storageKey, persistFn])

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>, presetCategory?: FileCategory) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    if (presetCategory) {
      processUpload(file, presetCategory)
    } else {
      setPendingFile(file)
      setDialogCategory(pendingCategoryRef.current)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (rec: FileRecord) => {
    persistFn(prev => prev.filter(f => f.id !== rec.id))
    setDeleteConfirm(null)
    showToast(`Đã xoá ${rec.name}`)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const toggleCollapse = (cat: FileCategory) =>
    setCollapsed(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n })

  const displayed = activeFilter === "all" ? files : files.filter(f => f.category === activeFilter)
  const usedCats = CATEGORIES.filter(c => files.some(f => f.category === c))

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file"
        accept="image/*,.pdf,.dwg,.doc,.docx,.xlsx"
        className="hidden" onChange={e => handleFileChosen(e)} />

      {/* Filter + Upload bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setActiveFilter("all")}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${activeFilter === "all" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"}`}>
          Tất cả ({files.length})
        </button>
        {usedCats.map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${activeFilter === cat ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"}`}>
            {cat} ({files.filter(f => f.category === cat).length})
          </button>
        ))}
        <button onClick={() => { pendingCategoryRef.current = "Hợp đồng"; fileInputRef.current?.click() }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm transition">
          <Plus className="w-3.5 h-3.5" /> Tải lên
        </button>
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="bg-white border border-orange-200 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Upload className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
              <span className="font-medium truncate max-w-[280px]">{uploading.name}</span>
            </div>
            <span className="font-bold text-orange-600">{uploading.pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-75"
              style={{ width: `${uploading.pct}%` }} />
          </div>
        </div>
      )}

      {/* Category picker dialog */}
      {pendingFile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Chọn nhóm tài liệu</h3>
              <button onClick={() => setPendingFile(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4 truncate">{pendingFile.name}</p>
            <div className="space-y-2 mb-5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setDialogCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition ${dialogCategory === cat ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-700 hover:border-orange-300"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPendingFile(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Huỷ</button>
              <button onClick={() => processUpload(pendingFile, dialogCategory)}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">
                Tải lên →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Xoá file này?</h3>
            <p className="text-xs text-gray-600 mb-5 truncate">{deleteConfirm.name}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Huỷ</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files grouped by category */}
      {activeFilter === "all" ? (
        <div className="space-y-3">
          {usedCats.map(cat => {
            const catFiles = files.filter(f => f.category === cat)
            const isCollapsed = collapsed.has(cat)
            const badgeClass = STEP_COLORS[cat]
            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <button onClick={() => toggleCollapse(cat)}
                  className="w-full px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-bold text-gray-800">{cat}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>{catFiles.length} file</span>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-gray-50">
                    {catFiles.map(f => (
                      <FileRow key={f.id} file={f} onDelete={() => setDeleteConfirm(f)} />
                    ))}
                    <div className="px-5 py-2.5 bg-gray-50/60">
                      <button
                        onClick={() => {
                          pendingCategoryRef.current = cat
                          fileInputRef.current?.click()
                        }}
                        className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Thêm file vào {cat}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {usedCats.length === 0 && (
            <div className="py-16 flex flex-col items-center text-gray-400">
              <FileText className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Chưa có tài liệu nào</p>
              <button onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
                <Plus className="w-4 h-4" /> Tải lên file đầu tiên
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {displayed.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {displayed.map(f => (
                <FileRow key={f.id} file={f} onDelete={() => setDeleteConfirm(f)} />
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-gray-400">
              <FileText className="w-8 h-8 mb-2 text-gray-200" />
              <p className="text-sm">Chưa có file nào trong nhóm này</p>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </div>
  )
}

// ── File row ──────────────────────────────────────────────────────────────────

function FileRow({ file, onDelete }: { file: FileRecord; onDelete: () => void }) {
  const handleDownload = () => {
    if (!file.dataUrl) return
    const a = document.createElement("a")
    a.href = file.dataUrl
    a.download = file.name
    a.click()
  }

  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition group">
      <FileIcon ext={file.extension} dataUrl={file.dataUrl} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {fmtSize(file.size)} · {file.uploadedAt} · {file.uploadedBy}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {file.dataUrl && (
          <button onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
