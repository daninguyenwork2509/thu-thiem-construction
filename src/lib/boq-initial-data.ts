import type { BOQData } from "./boq-types"
import { recalcL2, recalcL1 } from "./boq-types"

export const initialBOQData: BOQData = [
  {
    id: "cat_A", level: 1, itemCode: "A",
    description: "Phần xây dựng",
    expanded: true,
    categoryTotalPrice: 0,
    subcontractorId: 1, subcontractorName: "Đội thợ Minh Phúc",  // gán cấp L1
    children: [
      {
        id: "task_1", level: 2, itemCode: "1",
        description: "Tháo dỡ tường 100 hiện hữu",
        unit: "m²", unitPrice: 150_000,
        costPrice: 120_000,                 // margin = 20% ✓
        expanded: true,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d1_1", level: 3, description: "Phòng số 9", length: 2.75, height: 2.8, coefficient: 1.05, calculatedVolume: 8.085 },
          { id: "d1_2", level: 3, description: "Tường ngăn phòng bếp", length: 4.87, height: 2.8, coefficient: 1.05, calculatedVolume: 14.318 },
          { id: "d1_3", level: 3, description: "Tường ngang hành lang", length: 3.20, height: 2.8, coefficient: 1.05, calculatedVolume: 9.408 },
          { id: "d1_4", level: 3, description: "Trừ cửa đi (2 cái)", quantity: -2, length: 0.9, height: 2.1, calculatedVolume: -3.780 },
        ],
      },
      {
        id: "task_2", level: 2, itemCode: "2",
        description: "Xây tường gạch 100 mới (vữa xi măng)",
        unit: "m²", unitPrice: 320_000,
        costPrice: 295_000,                 // margin = 7.8% ⚠ WARNING
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d2_1", level: 3, description: "Phòng ngủ 1 — vách ngăn WC", length: 3.50, height: 2.7, calculatedVolume: 9.450 },
          { id: "d2_2", level: 3, description: "Phòng ngủ 2 — vách tủ âm tường", length: 1.80, height: 2.7, calculatedVolume: 4.860 },
          { id: "d2_3", level: 3, description: "Trừ lỗ cửa sổ", quantity: -1, length: 1.2, height: 1.4, calculatedVolume: -1.680 },
        ],
      },
      {
        id: "task_3", level: 2, itemCode: "3",
        description: "Đổ bê tông nền dày 10cm (mác 200)",
        unit: "m³", unitPrice: 2_800_000,
        costPrice: 2_300_000,               // margin = 17.9% ✓
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d3_1", level: 3, description: "Khu vực phòng khách + bếp", length: 8.40, width: 4.20, height: 0.10, calculatedVolume: 3.528 },
          { id: "d3_2", level: 3, description: "Hành lang nội bộ", length: 6.00, width: 1.20, height: 0.10, calculatedVolume: 0.720 },
        ],
      },
    ],
  },
  {
    id: "cat_B", level: 1, itemCode: "B",
    description: "Phần hoàn thiện & Sơn nước",
    expanded: true,
    categoryTotalPrice: 0,
    subcontractorId: 4, subcontractorName: "Thợ Sơn Quốc Bảo",   // gán cấp L1
    children: [
      {
        id: "task_4", level: 2, itemCode: "4",
        description: "Trát tường vữa xi măng cát vàng",
        unit: "m²", unitPrice: 85_000,
        costPrice: 75_000,                  // margin = 11.8% ⚠ WARNING
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d4_1", level: 3, description: "Tường phòng khách 4 mặt", length: 24.80, height: 2.7, calculatedVolume: 66.960 },
          { id: "d4_2", level: 3, description: "Tường phòng ngủ 1", length: 14.40, height: 2.7, calculatedVolume: 38.880 },
          { id: "d4_3", level: 3, description: "Tường phòng ngủ 2", length: 13.60, height: 2.7, calculatedVolume: 36.720 },
          { id: "d4_4", level: 3, description: "Trừ cửa đi (4 cái)", quantity: -4, length: 0.9, height: 2.1, calculatedVolume: -7.560 },
          { id: "d4_5", level: 3, description: "Trừ cửa sổ (6 cái)", quantity: -6, length: 1.2, height: 1.4, calculatedVolume: -10.080 },
        ],
      },
      {
        id: "task_5", level: 2, itemCode: "5",
        description: "Sơn nước nội thất (2 nước lót + 2 nước phủ)",
        unit: "m²", unitPrice: 65_000,
        costPrice: 50_000,                  // margin = 23.1% ✓
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d5_1", level: 3, description: "Tường tổng hợp (đã tính trừ lỗ cửa)", length: 1, width: 124.920, calculatedVolume: 124.920 },
          { id: "d5_2", level: 3, description: "Trần thạch cao phẳng toàn bộ", length: 68.40, width: 1, calculatedVolume: 68.400 },
        ],
      },
      {
        id: "task_6", level: 2, itemCode: "6",
        description: "Ốp gạch toilet (60×60 nhập khẩu)",
        unit: "m²", unitPrice: 520_000,
        costPrice: 455_000,                 // margin = 12.5% ⚠ WARNING
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d6_1", level: 3, description: "Toilet chính — tường 4 mặt", length: 10.80, height: 2.4, calculatedVolume: 25.920 },
          { id: "d6_2", level: 3, description: "Toilet phụ — tường 4 mặt", length: 8.60, height: 2.4, calculatedVolume: 20.640 },
          { id: "d6_3", level: 3, description: "Trừ khu vực vách kính", quantity: -1, length: 1.2, height: 2.1, calculatedVolume: -2.520 },
        ],
      },
    ],
  },
  {
    id: "cat_C", level: 1, itemCode: "C",
    description: "Hệ thống Điện — M&E",
    expanded: false,
    categoryTotalPrice: 0,
    subcontractorId: 2, subcontractorName: "Công ty Điện Hoàng Long",  // gán cấp L1
    children: [
      {
        id: "task_7", level: 2, itemCode: "7",
        description: "Hệ thống điện chiếu sáng âm trần",
        unit: "điểm", unitPrice: 450_000,
        costPrice: 370_000,                 // margin = 17.8% ✓
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d7_1", level: 3, description: "Phòng khách — đèn downlight Philips 9W", quantity: 8, calculatedVolume: 8 },
          { id: "d7_2", level: 3, description: "Phòng ngủ 1 — đèn LED panel 12W", quantity: 4, calculatedVolume: 4 },
          { id: "d7_3", level: 3, description: "Phòng ngủ 2 — đèn LED panel 12W", quantity: 4, calculatedVolume: 4 },
          { id: "d7_4", level: 3, description: "Bếp + ăn — đèn track light", quantity: 6, calculatedVolume: 6 },
        ],
      },
      {
        id: "task_8", level: 2, itemCode: "8",
        description: "Hệ thống ổ cắm & công tắc (Simon series)",
        unit: "điểm", unitPrice: 380_000,
        costPrice: 310_000,                 // margin = 18.4% ✓
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d8_1", level: 3, description: "Ổ cắm đôi 3 chấu toàn căn", quantity: 18, calculatedVolume: 18 },
          { id: "d8_2", level: 3, description: "Công tắc đơn 1 chiều", quantity: 8, calculatedVolume: 8 },
          { id: "d8_3", level: 3, description: "Công tắc đôi 2 chiều (cầu thang)", quantity: 2, calculatedVolume: 2 },
        ],
      },
      {
        id: "task_9", level: 2, itemCode: "9",
        description: "Lắp đặt điều hòa không khí (đi ống đồng + drain)",
        unit: "bộ", unitPrice: 3_200_000,
        costPrice: 2_800_000,               // margin = 12.5% ⚠ WARNING
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d9_1", level: 3, description: "Phòng khách — 18.000 BTU", quantity: 1, calculatedVolume: 1 },
          { id: "d9_2", level: 3, description: "Phòng ngủ 1 — 12.000 BTU", quantity: 1, calculatedVolume: 1 },
          { id: "d9_3", level: 3, description: "Phòng ngủ 2 — 12.000 BTU", quantity: 1, calculatedVolume: 1 },
        ],
      },
    ],
  },
  {
    id: "cat_D", level: 1, itemCode: "D",
    description: "Nội thất & Đồ mộc",
    expanded: false,
    categoryTotalPrice: 0,
    subcontractorId: 3, subcontractorName: "Đội Nội Thất An Khang",  // gán cấp L1
    children: [
      {
        id: "task_10", level: 2, itemCode: "10",
        description: "Tủ bếp (MDF Melamine phủ Acrylic bóng gương)",
        unit: "m dài", unitPrice: 4_200_000,
        costPrice: 3_600_000,               // margin = 14.3% ⚠ WARNING
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d10_1", level: 3, description: "Tủ bếp dưới — hướng bồn rửa", length: 2.40, calculatedVolume: 2.400 },
          { id: "d10_2", level: 3, description: "Tủ bếp dưới — hướng bếp nấu", length: 1.80, calculatedVolume: 1.800 },
          { id: "d10_3", level: 3, description: "Tủ bếp trên — toàn bộ", length: 4.20, calculatedVolume: 4.200 },
        ],
      },
      {
        id: "task_11", level: 2, itemCode: "11",
        description: "Sàn gỗ công nghiệp (Egger 8mm AC4)",
        unit: "m²", unitPrice: 480_000,
        costPrice: 390_000,                 // margin = 18.75% ✓
        expanded: false,
        totalVolume: 0, totalPrice: 0,
        children: [
          { id: "d11_1", level: 3, description: "Phòng ngủ 1", length: 4.80, width: 3.60, calculatedVolume: 17.280 },
          { id: "d11_2", level: 3, description: "Phòng ngủ 2", length: 4.20, width: 3.40, calculatedVolume: 14.280 },
          { id: "d11_3", level: 3, description: "Hành lang", length: 6.00, width: 1.20, calculatedVolume: 7.200 },
        ],
      },
    ],
  },
]

// Use recalcL2/recalcL1 so marginPct and marginWarning are computed correctly on load
function recalcAll(data: BOQData): BOQData {
  return data.map(l1 => {
    const l1c = { ...l1, children: l1.children.map(l2 => recalcL2(l2)) }
    return recalcL1(l1c)
  })
}

export const BOQ_INITIAL: BOQData = recalcAll(initialBOQData)
