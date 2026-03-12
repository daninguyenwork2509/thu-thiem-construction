"use client"
import { useReducer, useState, useRef } from "react"
import { BOQ_INITIAL } from "@/lib/boq-initial-data"
import { boqReducer } from "@/lib/boq-reducer"
import type { L1Row, L2Row, L3Row } from "@/lib/boq-types"
import { MARGIN_THRESHOLD } from "@/lib/boq-types"
import SubcontractorModal from "@/components/SubcontractorModal"
import { exportBOQToExcel, importBOQFromFile } from "@/lib/boq-excel"
import {
  ChevronRight, ChevronDown, Plus, Trash2,
  Lock, Unlock, Download, Search, Calculator,
  AlertTriangle, CheckCircle, Wrench, FileCheck,
  FileSpreadsheet, Upload
} from "lucide-react"

const fmtN = (n: number, dec = 3) =>
  n === 0 ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: dec, minimumFractionDigits: dec === 0 ? 0 : undefined })
const fmtVND = (n: number) =>
  n === 0 ? "—" : n.toLocaleString("vi-VN") + " ₫"

// Total column count: 16
// 1=toggle, 2=code, 3=desc, 4=unit, 5-9=dims, 10=volume, 11=unitPrice, 12=totalPrice
// 13=costPrice[INTERNAL], 14=margin%[INTERNAL], 15=subcontractor[INTERNAL], 16=actions
const TOTAL_COLS = 16

// ── Inline editable cell ─────────────────────────────────────────────────────
function EditCell({
  value, onCommit, className = "", type = "text", placeholder = ""
}: {
  value: string | number | undefined
  onCommit: (v: string) => void
  className?: string
  type?: string
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(value !== undefined && value !== null ? String(value) : "")
    setEditing(true)
    setTimeout(() => ref.current?.select(), 0)
  }
  const commit = () => { setEditing(false); onCommit(draft) }

  if (editing) {
    return (
      <input ref={ref} type={type} value={draft} autoFocus
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className={`w-full bg-blue-50 border border-blue-400 rounded px-1.5 py-0.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
        placeholder={placeholder}
      />
    )
  }
  return (
    <span onClick={startEdit} title="Click để chỉnh sửa"
      className={`block cursor-text hover:bg-blue-50 rounded px-1.5 py-0.5 transition-colors min-h-[1.5rem] ${!value && value !== 0 ? "text-gray-300 italic text-xs" : ""} ${className}`}>
      {value !== undefined && value !== null && value !== "" ? String(value) : placeholder || "—"}
    </span>
  )
}

// ── Number input cell for L3 dims ────────────────────────────────────────────
function DimCell({ value, onCommit, isNeg }: { value: number | undefined; onCommit: (v: string) => void; isNeg?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  const startEdit = () => { setDraft(value !== undefined ? String(value) : ""); setEditing(true); setTimeout(() => ref.current?.select(), 0) }
  const commit = () => { setEditing(false); onCommit(draft) }

  if (editing) {
    return (
      <input ref={ref} type="number" step="any" value={draft} autoFocus
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className="w-full bg-blue-50 border border-blue-400 rounded px-1 py-0.5 text-xs text-right outline-none focus:ring-1 focus:ring-blue-300"
      />
    )
  }
  return (
    <span onClick={startEdit} title="Click để chỉnh sửa"
      className={`block text-right text-xs cursor-text hover:bg-blue-50 rounded px-1 py-0.5 transition-colors ${isNeg && value !== undefined ? "text-red-600 font-medium" : "text-gray-600"}`}>
      {value !== undefined ? fmtN(value) : "—"}
    </span>
  )
}

// ── Margin badge ──────────────────────────────────────────────────────────────
function MarginBadge({ pct, warning }: { pct: number | undefined; warning: boolean | undefined }) {
  if (pct === undefined) return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
      warning ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
    }`}>
      {warning && <AlertTriangle className="w-3 h-3" />}
      {pct}%
    </span>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function BOQTable() {
  const [data, dispatch] = useReducer(boqReducer, BOQ_INITIAL)
  const [isLocked, setIsLocked] = useState(false)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<L1Row | null>(null)
  const [showApproved, setShowApproved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Grand totals
  const grandTotal = data.reduce((s, l1) => s + l1.categoryTotalPrice, 0)
  const grandCost = data.reduce((s, l1) => s + (l1.categoryCostTotal ?? 0), 0)
  const vat = grandTotal * 0.1
  const grandTotalVAT = grandTotal + vat

  const totalWarnings = data.reduce((s, l1) => s + l1.children.filter(l2 => l2.marginWarning).length, 0)
  const allHaveCost = data.every(l1 => l1.children.every(l2 => l2.costPrice !== undefined && l2.costPrice > 0))
  const allHaveSubcontractor = data.every(l1 => l1.subcontractorId !== undefined)
  const canApprove = totalWarnings === 0 && allHaveCost && allHaveSubcontractor

  const handleExportExcel = () => {
    exportBOQToExcel(data)
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportLoading(true)
    try {
      const imported = await importBOQFromFile(file)
      dispatch({ type: 'IMPORT_BOQ', data: imported })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Lỗi import file")
    } finally {
      setImportLoading(false)
      // Reset input so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleExportPDF = async () => {
    // Call API to get sanitized data, then generate PDF client-side
    const res = await fetch("/api/boq/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    })
    const { sanitized } = await res.json()

    // Dynamic import to avoid SSR issues
    const jsPDF = (await import("jspdf")).default
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("DU TOAN BOQ - THU THIEM CONSTRUCTION", 14, 18)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Tai lieu danh cho khach hang - Ban chinh thuc", 14, 25)
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString("vi-VN")}`, 14, 30)

    const rows: (string | number)[][] = []
    for (const l1 of sanitized) {
      rows.push([l1.itemCode, l1.description.toUpperCase(), "", "", "", fmtVND(l1.categoryTotalPrice)])
      for (const l2 of l1.children) {
        rows.push([
          `  ${l2.itemCode}`,
          l2.description,
          l2.unit,
          l2.totalVolume > 0 ? l2.totalVolume.toFixed(3) : "0",
          fmtVND(l2.unitPrice),
          fmtVND(l2.totalPrice),
        ])
      }
    }

    autoTable(doc, {
      startY: 35,
      head: [["STT", "Dien giai / Hang muc", "DVT", "Khoi luong", "Don gia ban (VND)", "Thanh tien (VND)"]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 100 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 40, halign: "right" },
        5: { cellWidth: 40, halign: "right" },
      },
      didParseCell: (data) => {
        // Bold category rows (L1)
        if (data.row.index >= 0 && rows[data.row.index]?.[2] === "") {
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.fillColor = [239, 246, 255]
        }
      },
    })

    // Footer totals
    const finalY = (doc as any).lastAutoTable.finalY + 5
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(`Tong cong truoc VAT: ${fmtVND(grandTotal)}`, 14, finalY)
    doc.text(`VAT 10%: ${fmtVND(vat)}`, 14, finalY + 6)
    doc.setFontSize(12)
    doc.text(`TONG GIA TRI HOP DONG (co VAT): ${fmtVND(grandTotalVAT)}`, 14, finalY + 14)

    doc.save("Du_toan_BOQ_Thu_Thiem.pdf")
  }

  const renderL3 = (l3: L3Row, l2: L2Row, l1: L1Row) => {
    const isDeduction = l3.calculatedVolume < 0
    if (search && !l3.description.toLowerCase().includes(search.toLowerCase())) return null
    return (
      <tr key={l3.id} className={`group border-b border-gray-100 ${isDeduction ? "bg-red-50/60" : "bg-white hover:bg-blue-50/30"}`}>
        <td className="w-8" />
        <td className="px-2 py-1 text-xs text-gray-300 text-center w-10">·</td>
        <td className="px-2 py-1" style={{ paddingLeft: "3rem" }}>
          {isLocked
            ? <span className={`text-sm ${isDeduction ? "text-red-600 italic" : "text-gray-600"}`}>{isDeduction && "➖ "}{l3.description}</span>
            : <EditCell value={l3.description}
                onCommit={v => dispatch({ type: 'UPDATE_L3_FIELD', l1Id: l1.id, l2Id: l2.id, l3Id: l3.id, field: 'description', value: v })}
                className={isDeduction ? "text-red-600 italic" : "text-gray-600"}
              />
          }
        </td>
        <td className="px-2 py-1 text-xs text-gray-400 text-center w-16">{l2.unit}</td>
        {(['quantity', 'length', 'width', 'height', 'coefficient'] as const).map(field => (
          <td key={field} className="px-1 py-1 w-20">
            {isLocked
              ? <span className={`block text-right text-xs px-1 ${l3[field] !== undefined ? (field === 'quantity' && (l3[field] as number) < 0 ? "text-red-500 font-medium" : "text-gray-600") : "text-gray-300"}`}>
                  {l3[field] !== undefined ? fmtN(l3[field] as number) : "—"}
                </span>
              : <DimCell value={l3[field]} isNeg={field === 'quantity' && l3.quantity !== undefined && l3.quantity < 0}
                  onCommit={v => dispatch({ type: 'UPDATE_L3_FIELD', l1Id: l1.id, l2Id: l2.id, l3Id: l3.id, field, value: v })}
                />
            }
          </td>
        ))}
        <td className={`px-2 py-1 text-right text-sm font-medium w-20 ${isDeduction ? "text-red-600" : "text-gray-700"}`}>
          {fmtN(l3.calculatedVolume)}
        </td>
        {/* Public price cols — empty for L3 */}
        <td className="w-28" />
        <td className="w-32" />
        {/* Internal cols — empty for L3 */}
        <td className="w-28" />
        <td className="w-20" />
        <td className="w-36" />
        {/* Actions */}
        <td className="px-2 py-1 w-12">
          {!isLocked && (
            <button onClick={() => dispatch({ type: 'REMOVE_L3', l1Id: l1.id, l2Id: l2.id, l3Id: l3.id })}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-0.5 rounded hover:bg-red-50">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </td>
      </tr>
    )
  }

  const renderL2 = (l2: L2Row, l1: L1Row) => {
    if (search && !l2.description.toLowerCase().includes(search.toLowerCase()) &&
        !l2.children.some(l3 => l3.description.toLowerCase().includes(search.toLowerCase()))) return null

    const rowBg = l2.marginWarning
      ? "bg-red-50 hover:bg-red-100/60"
      : "bg-gray-50 hover:bg-indigo-50/40"

    return (
      <>
        <tr key={l2.id} className={`group border-b border-gray-200 transition-colors ${rowBg}`}>
          {/* Expand toggle */}
          <td className="px-1 py-2 w-8">
            <button onClick={() => dispatch({ type: 'TOGGLE_L2', l1Id: l1.id, l2Id: l2.id })}
              className="w-6 h-6 rounded flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors">
              {l2.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </td>
          {/* Code */}
          <td className="px-2 py-2 text-center w-10">
            {isLocked
              ? <span className="text-xs font-semibold text-indigo-600">{l2.itemCode}</span>
              : <EditCell value={l2.itemCode}
                  onCommit={v => dispatch({ type: 'UPDATE_L2_FIELD', l1Id: l1.id, l2Id: l2.id, field: 'itemCode', value: v })}
                  className="text-xs font-semibold text-indigo-600 text-center"
                />
            }
          </td>
          {/* Description */}
          <td className="px-2 py-2 pl-6">
            {isLocked
              ? <span className="text-sm font-semibold text-gray-800">{l2.description}</span>
              : <EditCell value={l2.description}
                  onCommit={v => dispatch({ type: 'UPDATE_L2_FIELD', l1Id: l1.id, l2Id: l2.id, field: 'description', value: v })}
                  className="text-sm font-semibold text-gray-800"
                />
            }
          </td>
          {/* Unit */}
          <td className="px-2 py-2 w-16 text-center">
            {isLocked
              ? <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">{l2.unit}</span>
              : <EditCell value={l2.unit}
                  onCommit={v => dispatch({ type: 'UPDATE_L2_FIELD', l1Id: l1.id, l2Id: l2.id, field: 'unit', value: v })}
                  className="text-xs font-medium text-indigo-700 text-center"
                />
            }
          </td>
          {/* Empty dim cols */}
          <td colSpan={5} />
          {/* Total volume */}
          <td className={`px-2 py-2 text-right font-bold text-sm w-20 ${l2.totalVolume < 0 ? "text-red-600" : "text-gray-800"}`}>
            {fmtN(l2.totalVolume)}
          </td>
          {/* Unit price (sell) */}
          <td className="px-2 py-2 text-right w-28">
            {isLocked
              ? <span className="text-sm text-gray-700">{fmtVND(l2.unitPrice)}</span>
              : <EditCell value={l2.unitPrice} type="number"
                  onCommit={v => dispatch({ type: 'UPDATE_L2_FIELD', l1Id: l1.id, l2Id: l2.id, field: 'unitPrice', value: v })}
                  className="text-sm text-right text-gray-700"
                />
            }
          </td>
          {/* Total price (sell) */}
          <td className="px-3 py-2 text-right w-32">
            <span className="text-sm font-bold text-indigo-700">{fmtVND(l2.totalPrice)}</span>
          </td>

          {/* ── INTERNAL: Cost price (trực tiếp chỉnh sửa) ── */}
          <td className="px-2 py-2 text-right w-28 border-l border-dashed border-slate-300">
            {isLocked
              ? (l2.costPrice
                  ? <span className="text-xs text-slate-600">{fmtVND(l2.costPrice)}</span>
                  : <span className="text-xs text-gray-300 italic">Chưa có</span>)
              : <EditCell value={l2.costPrice} type="number" placeholder="Nhập giá vốn"
                  onCommit={v => {
                    const n = parseFloat(v)
                    if (n > 0) dispatch({ type: 'SET_COST_PRICE', l1Id: l1.id, l2Id: l2.id, costPrice: n })
                  }}
                  className={`text-xs text-right ${l2.costPrice ? "text-slate-700" : "text-gray-300"}`}
                />
            }
          </td>

          {/* ── INTERNAL: Margin % ── */}
          <td className="px-2 py-2 text-center w-20">
            <MarginBadge pct={l2.marginPct} warning={l2.marginWarning} />
          </td>

          {/* ── INTERNAL: Thầu phụ (inherit từ L1) ── */}
          <td className="px-2 py-2 w-36">
            {l1.subcontractorName
              ? <span className="text-xs text-slate-500 italic truncate max-w-[120px] block" title={l1.subcontractorName}>
                  ↑ {l1.subcontractorName}
                </span>
              : <span className="text-xs text-gray-300 italic">Chưa gán</span>
            }
          </td>

          {/* Actions */}
          <td className="px-2 py-2 w-12">
            {!isLocked && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => dispatch({ type: 'ADD_L3', l1Id: l1.id, l2Id: l2.id })}
                  title="Thêm dòng diễn giải"
                  className="text-green-600 hover:text-green-700 p-0.5 rounded hover:bg-green-50">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => dispatch({ type: 'REMOVE_L2', l1Id: l1.id, l2Id: l2.id })}
                  title="Xóa công tác"
                  className="text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </td>
        </tr>
        {/* L3 children */}
        {l2.expanded && l2.children.map(l3 => renderL3(l3, l2, l1))}
        {/* Add detail row button */}
        {l2.expanded && !isLocked && (
          <tr className="border-b border-gray-100 bg-white">
            <td colSpan={TOTAL_COLS}>
              <button onClick={() => dispatch({ type: 'ADD_L3', l1Id: l1.id, l2Id: l2.id })}
                className="w-full text-left px-12 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm dòng diễn giải
              </button>
            </td>
          </tr>
        )}
      </>
    )
  }

  const renderL1 = (l1: L1Row) => {
    if (search && !l1.description.toLowerCase().includes(search.toLowerCase()) &&
        !l1.children.some(l2 =>
          l2.description.toLowerCase().includes(search.toLowerCase()) ||
          l2.children.some(l3 => l3.description.toLowerCase().includes(search.toLowerCase()))
        )) return null

    const l1Warnings = l1.children.filter(l2 => l2.marginWarning).length

    return (
      <>
        <tr key={l1.id} className="group border-b-2 border-blue-200 bg-blue-600 text-white">
          <td className="px-1 py-2.5 w-8">
            <button onClick={() => dispatch({ type: 'TOGGLE_L1', l1Id: l1.id })}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-blue-500 transition-colors">
              {l1.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </td>
          <td className="px-2 py-2.5 text-center font-bold text-white/90 w-10">{l1.itemCode}</td>
          <td className="px-2 py-2.5 font-bold text-base" colSpan={9}>
            {isLocked
              ? l1.description
              : <EditCell value={l1.description}
                  onCommit={v => dispatch({ type: 'UPDATE_L1_DESC', l1Id: l1.id, value: v })}
                  className="text-white font-bold"
                />
            }
          </td>
          {/* Category sell total */}
          <td className="px-3 py-2.5 text-right font-bold text-base w-32 text-yellow-300">
            {fmtVND(l1.categoryTotalPrice)}
          </td>
          {/* Category cost total */}
          <td className="px-2 py-2.5 text-right w-28 border-l border-dashed border-blue-400">
            <span className="text-xs text-blue-200">
              {l1.categoryCostTotal ? fmtVND(l1.categoryCostTotal) : "—"}
            </span>
          </td>
          {/* Warning count */}
          <td className="px-2 py-2.5 text-center w-20">
            {l1Warnings > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-300">
                <AlertTriangle className="w-3 h-3" />{l1Warnings}
              </span>
            )}
          </td>
          {/* Subcontractor assignment (L1 level) */}
          <td className="px-2 py-2.5 w-36">
            <div className="flex items-center gap-1">
              {l1.subcontractorName
                ? <span className="text-xs text-blue-200 truncate max-w-[90px]" title={l1.subcontractorName}>
                    {l1.subcontractorName}
                  </span>
                : <span className="text-xs text-blue-400/50 italic">Chưa gán thầu</span>
              }
              {!isLocked && (
                <button
                  onClick={() => setModal(l1)}
                  title="Gán thầu phụ cho hạng mục này"
                  className="ml-auto shrink-0 p-1 rounded text-blue-300 hover:text-orange-300 hover:bg-blue-500 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </td>
          <td className="px-2 py-2.5 w-12">
            {!isLocked && (
              <button onClick={() => dispatch({ type: 'ADD_L2', l1Id: l1.id })}
                title="Thêm công tác"
                className="opacity-0 group-hover:opacity-100 text-white/80 hover:text-white p-0.5 rounded hover:bg-blue-500 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </td>
        </tr>
        {l1.expanded && l1.children.map(l2 => renderL2(l2, l1))}
        {l1.expanded && !isLocked && (
          <tr className="border-b border-blue-100 bg-blue-50/40">
            <td colSpan={TOTAL_COLS}>
              <button onClick={() => dispatch({ type: 'ADD_L2', l1Id: l1.id })}
                className="w-full text-left px-6 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm công tác thi công
              </button>
            </td>
          </tr>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Tìm hạng mục..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {data.reduce((s, l1) => s + l1.children.length, 0)} công tác ·{" "}
            {data.reduce((s, l1) => s + l1.children.reduce((s2, l2) => s2 + l2.children.length, 0), 0)} dòng
          </span>
          {/* Margin shield status */}
          {totalWarnings > 0 ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> {totalWarnings} cảnh báo margin
            </span>
          ) : allHaveCost ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Margin OK
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsLocked(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isLocked ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}>
            {isLocked ? <><Lock className="w-3 h-3" /> Đã khóa</> : <><Unlock className="w-3 h-3" /> Mở chỉnh sửa</>}
          </button>

          {/* Import Excel */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportExcel}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            title="Import BOQ từ file Excel (định dạng cột: STT, Hạng Mục, ĐVT, Số lượng, Dài, Rộng, Cao, Hệ số, Khối lượng, Đơn giá, Thành Tiền)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
            <Upload className="w-3 h-3" />
            {importLoading ? "Đang đọc..." : "Import Excel"}
          </button>

          {/* Export Excel */}
          <button onClick={handleExportExcel}
            title="Xuất BOQ ra file Excel (toàn bộ dữ liệu nội bộ)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-medium transition-colors">
            <FileSpreadsheet className="w-3 h-3" /> Xuất Excel
          </button>

          {/* PDF Export (public — no cost data) */}
          <button onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors">
            <Download className="w-3 h-3" /> Xuất PDF (Khách)
          </button>

          {/* Approve BOQ */}
          <button
            disabled={!canApprove}
            onClick={() => setShowApproved(true)}
            title={!canApprove ? (totalWarnings > 0 ? "Còn cảnh báo margin — cần xử lý trước khi duyệt" : !allHaveSubcontractor ? "Cần gán thầu phụ cho tất cả hạng mục (L1)" : "Cần nhập giá vốn cho tất cả công tác (L2)") : "Duyệt BOQ"}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: canApprove ? "#E87625" : "#9ca3af" }}
          >
            <FileCheck className="w-3.5 h-3.5" /> Duyệt BOQ
          </button>
        </div>
      </div>

      {/* Import error banner */}
      {importError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <strong>Lỗi Import:</strong> {importError}
          </span>
          <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 text-xs underline">Đóng</button>
        </div>
      )}

      {/* Approved toast */}
      {showApproved && (
        <div className="bg-green-600 text-white px-4 py-2.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <strong>BOQ đã được duyệt!</strong> — Đang chuyển sang giai đoạn thi công.
          </span>
          <button onClick={() => setShowApproved(false)} className="text-white/80 hover:text-white text-xs underline">Đóng</button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "1280px" }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-white text-xs">
              <th className="px-1 py-2.5 w-8" />
              <th className="px-2 py-2.5 text-center w-10">STT</th>
              <th className="px-2 py-2.5 text-left">Diễn giải</th>
              <th className="px-2 py-2.5 text-center w-16">ĐVT</th>
              <th className="px-1 py-2.5 text-center w-20 text-yellow-300">Số lượng</th>
              <th className="px-1 py-2.5 text-center w-20">Dài</th>
              <th className="px-1 py-2.5 text-center w-20">Rộng</th>
              <th className="px-1 py-2.5 text-center w-20">Cao</th>
              <th className="px-1 py-2.5 text-center w-20">Hệ số</th>
              <th className="px-2 py-2.5 text-right w-20">KL</th>
              <th className="px-2 py-2.5 text-right w-28">Đơn giá bán</th>
              <th className="px-3 py-2.5 text-right w-32">Thành tiền</th>
              {/* Internal columns */}
              <th className="px-2 py-2.5 text-right w-28 border-l border-dashed border-slate-600 text-amber-300">Giá vốn</th>
              <th className="px-2 py-2.5 text-center w-20 text-amber-300">Margin%</th>
              <th className="px-2 py-2.5 text-left w-36 text-amber-300">Thầu phụ</th>
              <th className="px-2 py-2.5 w-12" />
            </tr>
            {/* Sub-header for internal section */}
            <tr className="bg-amber-700/20 border-b border-amber-700/30">
              <th colSpan={12} className="px-3 py-1 text-left text-xs text-slate-400 italic">
                ← Thông tin công khai (xuất PDF khách)
              </th>
              <th colSpan={3} className="px-3 py-1 text-center text-xs text-amber-600 font-semibold border-l border-dashed border-amber-600/40">
                🔒 NỘI BỘ — không xuất PDF khách
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map(l1 => renderL1(l1))}
          </tbody>
        </table>
      </div>

      {/* Footer totals */}
      <div className="border-t-2 border-gray-300 bg-white sticky bottom-0 z-10">
        <table className="w-full" style={{ minWidth: "1280px" }}>
          <tbody>
            <tr className="border-b border-gray-200">
              <td colSpan={11} className="px-4 py-2.5 font-bold text-gray-800 text-sm">
                <Calculator className="inline w-4 h-4 mr-1.5 text-gray-500" />
                Tổng cộng trước VAT
              </td>
              <td className="px-3 py-2.5 text-right w-32 font-bold text-gray-900">{fmtVND(grandTotal)}</td>
              <td className="px-2 py-2.5 text-right w-28 border-l border-dashed border-slate-200 text-xs text-slate-500 font-medium">
                {grandCost > 0 ? fmtVND(grandCost) : "—"}
              </td>
              <td colSpan={2} />
              <td className="w-12" />
            </tr>
            {grandCost > 0 && (
              <tr className="border-b border-gray-100 bg-slate-50">
                <td colSpan={11} className="px-4 py-1.5 text-xs text-slate-500">
                  Tổng lợi nhuận gộp (nội bộ): {((grandTotal - grandCost) / grandTotal * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-1.5 text-right w-32 text-xs font-semibold text-green-700">
                  {fmtVND(grandTotal - grandCost)}
                </td>
                <td colSpan={3} />
                <td className="w-12" />
              </tr>
            )}
            <tr className="border-b border-gray-200 bg-gray-50">
              <td colSpan={11} className="px-4 py-2 text-xs text-gray-500">VAT 10%</td>
              <td className="px-3 py-2 text-right w-32 text-xs text-gray-600">{fmtVND(vat)}</td>
              <td colSpan={3} />
              <td className="w-12" />
            </tr>
            <tr className="bg-blue-600 text-white">
              <td colSpan={11} className="px-4 py-3 font-bold text-base">
                TỔNG GIÁ TRỊ HỢP ĐỒNG (có VAT)
              </td>
              <td className="px-3 py-3 text-right w-32 font-bold text-xl text-yellow-300">
                {fmtVND(grandTotalVAT)}
              </td>
              <td colSpan={3} />
              <td className="w-12" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Subcontractor modal (L1 level) */}
      {modal && (
        <SubcontractorModal
          l1={modal}
          onClose={() => setModal(null)}
          onConfirm={(subcontractorId, subcontractorName) => {
            dispatch({ type: 'SET_L1_SUBCONTRACTOR', l1Id: modal.id, subcontractorId, subcontractorName })
          }}
        />
      )}
    </div>
  )
}
