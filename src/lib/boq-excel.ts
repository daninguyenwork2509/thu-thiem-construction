import * as XLSX from "xlsx"
import type { BOQData, L1Row, L2Row, L3Row } from "./boq-types"
import { recalcL2, recalcL1, calcL3Volume, newId } from "./boq-types"

// ── Column layout (matches DL Dau Vao.pdf) ──────────────────────────────────
// 0=STT, 1=Hạng Mục, 2=ĐVT, 3=Số lượng, 4=Dài, 5=Rộng, 6=Cao,
// 7=Hệ số, 8=Khối lượng, 9=Đơn giá, 10=Thành Tiền, 11=Ghi chú
const HEADERS = ["STT", "Hạng Mục / Diễn giải", "ĐVT", "Số lượng", "Dài", "Rộng", "Cao", "Hệ số", "Khối lượng", "Đơn giá", "Thành Tiền", "Ghi chú"]

type AoaRow = (string | number | undefined)[]

// ── EXPORT ───────────────────────────────────────────────────────────────────
export function exportBOQToExcel(data: BOQData, filename = "Du_toan_BOQ_Thu_Thiem.xlsx") {
  const aoa: AoaRow[] = [HEADERS]

  const cellStyles: Record<string, { bold?: boolean; bg?: string }> = {}
  let rowIdx = 1 // 0-indexed, row 0 = header

  for (const l1 of data) {
    // L1 category row
    aoa.push([l1.itemCode, l1.description, "", "", "", "", "", "", "", "", l1.categoryTotalPrice, ""])
    cellStyles[`A${rowIdx + 1}`] = { bold: true, bg: "DBEAFE" }
    cellStyles[`B${rowIdx + 1}`] = { bold: true, bg: "DBEAFE" }
    cellStyles[`K${rowIdx + 1}`] = { bold: true, bg: "DBEAFE" }
    rowIdx++

    for (const l2 of l1.children) {
      // L2 work item row
      aoa.push([
        l2.itemCode,
        l2.description,
        l2.unit,
        "",
        "",
        "",
        "",
        "",
        l2.totalVolume || "",
        l2.unitPrice || "",
        l2.totalPrice || "",
        "",
      ])
      rowIdx++

      for (const l3 of l2.children) {
        // L3 dimension detail row
        aoa.push([
          "",
          l3.description,
          "",
          l3.quantity ?? "",
          l3.length ?? "",
          l3.width ?? "",
          l3.height ?? "",
          l3.coefficient ?? "",
          l3.calculatedVolume || "",
          "",
          "",
          "",
        ])
        rowIdx++
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Apply column widths
  ws["!cols"] = [
    { wch: 8 },   // STT
    { wch: 55 },  // Hạng Mục
    { wch: 8 },   // ĐVT
    { wch: 10 },  // Số lượng
    { wch: 10 },  // Dài
    { wch: 10 },  // Rộng
    { wch: 10 },  // Cao
    { wch: 8 },   // Hệ số
    { wch: 12 },  // Khối lượng
    { wch: 14 },  // Đơn giá
    { wch: 16 },  // Thành Tiền
    { wch: 18 },  // Ghi chú
  ]

  // Apply basic bold styles to L1 rows (requires xlsx-style or xlsxjs-style;
  // standard xlsx only supports cell.s via writeFile with bookType options)
  // We mark L1 rows with a simple approach — the bold is visual suggestion only in basic xlsx
  Object.entries(cellStyles).forEach(([cell]) => {
    if (ws[cell]) {
      ws[cell].s = { font: { bold: true }, fill: { fgColor: { rgb: "DBEAFE" } } }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "BOQ")
  XLSX.writeFile(wb, filename)
}

// ── IMPORT ───────────────────────────────────────────────────────────────────
function toNum(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
  return isNaN(n) ? undefined : n
}

function toStr(v: unknown): string {
  return v !== undefined && v !== null ? String(v).trim() : ""
}

const L1_CODE_RE = /^[A-Z]$/

export function importBOQFromFile(file: File): Promise<BOQData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer
        const wb = XLSX.read(buf, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" })

        const result: BOQData = []
        let curL1: L1Row | null = null
        let curL2: L2Row | null = null

        // Skip header rows until we find data (look for rows where col0 matches A-Z or is numeric)
        let dataStarted = false

        for (const raw of rows) {
          const row = raw as unknown[]
          const stt = toStr(row[0])
          const desc = toStr(row[1])
          const dvt = toStr(row[2])
          const donGia = toNum(row[9])

          // Skip empty rows
          if (!desc && !stt) continue

          // Skip header row
          if (desc.toLowerCase().includes("hạng mục") || desc.toLowerCase().includes("dien giai") || desc.toLowerCase().includes("diễn giải")) {
            dataStarted = false
            continue
          }

          // Detect L1: STT is single uppercase letter
          if (L1_CODE_RE.test(stt)) {
            dataStarted = true
            if (curL2) { curL2 = recalcL2(curL2) }
            if (curL1) {
              if (curL2) curL1.children.push(curL2)
              curL2 = null
              result.push(recalcL1(curL1))
            }
            curL1 = {
              id: newId(),
              level: 1,
              itemCode: stt,
              description: desc,
              children: [],
              categoryTotalPrice: 0,
              expanded: true,
            }
            curL2 = null
            continue
          }

          if (!dataStarted) continue

          // Detect L2: stt is numeric and has ĐVT or Đơn giá
          const sttNum = parseFloat(stt)
          if (!isNaN(sttNum) && curL1 && (dvt || donGia !== undefined)) {
            if (curL2) {
              curL1.children.push(recalcL2(curL2))
            }
            curL2 = {
              id: newId(),
              level: 2,
              itemCode: stt,
              description: desc,
              unit: dvt || "m²",
              unitPrice: donGia ?? 0,
              children: [],
              totalVolume: 0,
              totalPrice: 0,
              expanded: false,
            }
            continue
          }

          // Detect L3: stt is empty, has a description (dimension or sub-item)
          if (!stt && desc && curL2) {
            const qty = toNum(row[3])
            const len = toNum(row[4])
            const wid = toNum(row[5])
            const hei = toNum(row[6])
            const cof = toNum(row[7])
            const vol = toNum(row[8])

            const l3: L3Row = {
              id: newId(),
              level: 3,
              description: desc,
              quantity: qty,
              length: len,
              width: wid,
              height: hei,
              coefficient: cof,
              calculatedVolume: vol ?? calcL3Volume({
                id: "", level: 3, description: desc,
                quantity: qty, length: len, width: wid,
                height: hei, coefficient: cof,
                calculatedVolume: 0,
              }),
            }
            curL2.children.push(l3)
            continue
          }

          // Fallback: treat as L2 if we have a curL1 and no numeric stt but has ĐVT
          if (dvt && curL1) {
            if (curL2) curL1.children.push(recalcL2(curL2))
            curL2 = {
              id: newId(),
              level: 2,
              itemCode: stt || String(curL1.children.length + 1),
              description: desc,
              unit: dvt,
              unitPrice: donGia ?? 0,
              children: [],
              totalVolume: 0,
              totalPrice: 0,
              expanded: false,
            }
          }
        }

        // Flush last items
        if (curL2 && curL1) curL1.children.push(recalcL2(curL2))
        if (curL1) result.push(recalcL1(curL1))

        if (result.length === 0) {
          reject(new Error("Không tìm thấy dữ liệu BOQ trong file. Kiểm tra định dạng: STT hạng mục phải là chữ cái (A, B, C...)"))
          return
        }
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Không đọc được file"))
    reader.readAsArrayBuffer(file)
  })
}
