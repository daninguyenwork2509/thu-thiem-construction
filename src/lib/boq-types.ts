export interface L3Row {
  id: string
  level: 3
  description: string
  quantity?: number
  length?: number
  width?: number
  height?: number
  coefficient?: number
  calculatedVolume: number
}

export interface L2Row {
  id: string
  level: 2
  itemCode: string
  description: string
  unit: string
  unitPrice: number        // Đơn giá BÁN — hiển thị cho khách
  children: L3Row[]
  totalVolume: number
  totalPrice: number
  expanded: boolean

  // ── Giá vốn (INTERNAL — không xuất PDF khách) ──
  costPrice?: number       // Đơn giá VỐN từ thầu phụ
  marginPct?: number       // (unitPrice - costPrice) / unitPrice * 100
  marginWarning?: boolean  // true nếu marginPct < MARGIN_THRESHOLD (15%)
}

export interface L1Row {
  id: string
  level: 1
  itemCode: string
  description: string
  children: L2Row[]
  categoryTotalPrice: number
  categoryCostTotal?: number
  expanded: boolean

  // ── Thầu phụ (INTERNAL — gán ở cấp hạng mục L1, 1 hạng mục = 1 thầu) ──
  subcontractorId?: number
  subcontractorName?: string
}

export type BOQData = L1Row[]

export const MARGIN_THRESHOLD = 15  // 15%

// ── Calculation helpers ──────────────────────────────────────────────────────

export function calcL3Volume(row: L3Row): number {
  const q = row.quantity ?? 1
  const l = row.length ?? 1
  const w = row.width ?? 1
  const h = row.height ?? 1
  const c = row.coefficient ?? 1
  const raw = q * l * w * h * c
  return parseFloat(raw.toFixed(3))
}

export function calcMargin(unitPrice: number, costPrice: number | undefined): number | undefined {
  if (!costPrice || costPrice <= 0 || unitPrice <= 0) return undefined
  return parseFloat(((unitPrice - costPrice) / unitPrice * 100).toFixed(1))
}

export function recalcL2(l2: L2Row): L2Row {
  const totalVolume = parseFloat(
    l2.children.reduce((s, r) => s + r.calculatedVolume, 0).toFixed(3)
  )
  const totalPrice = parseFloat((totalVolume * l2.unitPrice).toFixed(0))
  const marginPct = calcMargin(l2.unitPrice, l2.costPrice)
  const marginWarning = marginPct !== undefined ? marginPct < MARGIN_THRESHOLD : false
  return { ...l2, totalVolume, totalPrice, marginPct, marginWarning }
}

export function recalcL1(l1: L1Row): L1Row {
  const categoryTotalPrice = l1.children.reduce((s, l2) => s + l2.totalPrice, 0)
  const categoryCostTotal = l1.children.reduce((s, l2) => {
    if (l2.costPrice && l2.totalVolume > 0) return s + l2.costPrice * l2.totalVolume
    return s
  }, 0)
  return { ...l1, categoryTotalPrice, categoryCostTotal }
}

// ── Reducer actions ──────────────────────────────────────────────────────────

export type BOQAction =
  | { type: 'TOGGLE_L1'; l1Id: string }
  | { type: 'TOGGLE_L2'; l1Id: string; l2Id: string }
  | { type: 'UPDATE_L3_FIELD'; l1Id: string; l2Id: string; l3Id: string; field: keyof Omit<L3Row, 'id' | 'level' | 'calculatedVolume'>; value: string }
  | { type: 'UPDATE_L2_FIELD'; l1Id: string; l2Id: string; field: 'description' | 'unit' | 'unitPrice' | 'itemCode'; value: string }
  | { type: 'SET_COST_PRICE'; l1Id: string; l2Id: string; costPrice: number }
  | { type: 'SET_L1_SUBCONTRACTOR'; l1Id: string; subcontractorId: number; subcontractorName: string }
  | { type: 'ADD_L3'; l1Id: string; l2Id: string }
  | { type: 'REMOVE_L3'; l1Id: string; l2Id: string; l3Id: string }
  | { type: 'ADD_L2'; l1Id: string }
  | { type: 'REMOVE_L2'; l1Id: string; l2Id: string }
  | { type: 'UPDATE_L1_DESC'; l1Id: string; value: string }
  | { type: 'IMPORT_BOQ'; data: BOQData }

let _idCounter = 1000
export const newId = () => `new_${_idCounter++}`
