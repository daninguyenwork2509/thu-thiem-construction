import { NextRequest, NextResponse } from "next/server"
import type { BOQData, L2Row } from "@/lib/boq-types"

// ── SECURITY RULE: Never expose cost / margin / subcontractor data to PDF ─────
// This API strips all internal fields before returning sanitized data.
// Client calls this endpoint, receives clean data, then generates the PDF.

function sanitizeL2(l2: L2Row) {
  // Destructure and discard all internal fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { costPrice, marginPct, marginWarning, ...publicFields } = l2
  return publicFields
}

export async function POST(req: NextRequest) {
  try {
    const { data }: { data: BOQData } = await req.json()

    const sanitized = data.map(l1 => ({
      id: l1.id,
      level: l1.level,
      itemCode: l1.itemCode,
      description: l1.description,
      categoryTotalPrice: l1.categoryTotalPrice,
      // categoryCostTotal is intentionally excluded
      children: l1.children.map(sanitizeL2),
    }))

    return NextResponse.json({
      sanitized,
      exportedAt: new Date().toISOString(),
      note: "Internal cost/margin data has been stripped. This payload is safe for customer delivery.",
    })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
