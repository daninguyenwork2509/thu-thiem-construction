import type { BOQAction, BOQData, L2Row, L3Row } from "./boq-types"
import { calcL3Volume, recalcL2, recalcL1, newId } from "./boq-types"

export function boqReducer(state: BOQData, action: BOQAction): BOQData {
  switch (action.type) {

    case 'TOGGLE_L1':
      return state.map(l1 =>
        l1.id === action.l1Id ? { ...l1, expanded: !l1.expanded } : l1
      )

    case 'TOGGLE_L2':
      return state.map(l1 =>
        l1.id !== action.l1Id ? l1 : recalcL1({
          ...l1,
          children: l1.children.map(l2 =>
            l2.id === action.l2Id ? { ...l2, expanded: !l2.expanded } : l2
          ),
        })
      )

    case 'UPDATE_L3_FIELD': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        const newChildren = l1.children.map(l2 => {
          if (l2.id !== action.l2Id) return l2
          const updatedL3s: L3Row[] = l2.children.map(l3 => {
            if (l3.id !== action.l3Id) return l3
            const numVal = action.field === 'description' ? undefined : parseFloat(action.value) || undefined
            const updated: L3Row = {
              ...l3,
              [action.field]: action.field === 'description' ? action.value : numVal,
            }
            // Recalculate volume only for numeric fields
            if (action.field !== 'description') {
              updated.calculatedVolume = calcL3Volume(updated)
              // Preserve deduction sign if the result was intended negative
              // (user explicitly typed a negative quantity)
              if ((updated.quantity ?? 1) < 0) {
                updated.calculatedVolume = -Math.abs(updated.calculatedVolume)
              }
            }
            return updated
          })
          return recalcL2({ ...l2, children: updatedL3s })
        })
        return recalcL1({ ...l1, children: newChildren })
      })
    }

    case 'UPDATE_L2_FIELD': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        const newChildren = l1.children.map(l2 => {
          if (l2.id !== action.l2Id) return l2
          const updated: L2Row = {
            ...l2,
            [action.field]: action.field === 'unitPrice'
              ? parseFloat(action.value) || 0
              : action.value,
          }
          return recalcL2(updated)
        })
        return recalcL1({ ...l1, children: newChildren })
      })
    }

    case 'UPDATE_L1_DESC':
      return state.map(l1 =>
        l1.id === action.l1Id ? { ...l1, description: action.value } : l1
      )

    case 'ADD_L3': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        const newChildren = l1.children.map(l2 => {
          if (l2.id !== action.l2Id) return l2
          const newRow: L3Row = {
            id: newId(), level: 3,
            description: 'Diễn giải mới...',
            calculatedVolume: 0,
          }
          return recalcL2({ ...l2, children: [...l2.children, newRow], expanded: true })
        })
        return recalcL1({ ...l1, children: newChildren })
      })
    }

    case 'REMOVE_L3': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        const newChildren = l1.children.map(l2 => {
          if (l2.id !== action.l2Id) return l2
          return recalcL2({
            ...l2,
            children: l2.children.filter(l3 => l3.id !== action.l3Id),
          })
        })
        return recalcL1({ ...l1, children: newChildren })
      })
    }

    case 'ADD_L2': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        const nextCode = String(l1.children.length + 1)
        const newRow: L2Row = {
          id: newId(), level: 2,
          itemCode: nextCode,
          description: 'Công tác mới...',
          unit: 'm²',
          unitPrice: 0,
          children: [],
          totalVolume: 0,
          totalPrice: 0,
          expanded: true,
        }
        return recalcL1({ ...l1, children: [...l1.children, newRow], expanded: true })
      })
    }

    case 'REMOVE_L2': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        return recalcL1({
          ...l1,
          children: l1.children.filter(l2 => l2.id !== action.l2Id),
        })
      })
    }

    case 'SET_COST_PRICE': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        const newChildren = l1.children.map(l2 => {
          if (l2.id !== action.l2Id) return l2
          return recalcL2({ ...l2, costPrice: action.costPrice })
        })
        return recalcL1({ ...l1, children: newChildren })
      })
    }

    case 'SET_L1_SUBCONTRACTOR': {
      return state.map(l1 => {
        if (l1.id !== action.l1Id) return l1
        return { ...l1, subcontractorId: action.subcontractorId, subcontractorName: action.subcontractorName }
      })
    }

    case 'IMPORT_BOQ':
      return action.data

    default:
      return state
  }
}
