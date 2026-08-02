import { create } from "zustand"

export interface CashFlowEntry {
  id: string
  type: "SALE" | "INCOME" | "EXPENSE"
  concept: string
  amount: number
  date: string
  terminal: { id: string; name: string } | null
  user: { id: string; name: string } | null
  sessionId: string | null
  canDelete: boolean
  orderId?: string
  orderNumber?: string
  paymentMethod?: string
  tip?: number
  customer?: { name: string; email: string }
}

export interface CashFlowTotals {
  sales: number
  income: number
  expense: number
  net: number
}

interface CashFlowFilters {
  sessionId?: string
  terminalId?: string
  type?: string
  from?: string
  to?: string
}

interface CashFlowState {
  entries: CashFlowEntry[]
  totals: CashFlowTotals
  loading: boolean
  fetchEntries: (filters?: CashFlowFilters) => Promise<void>
}

export const useCashFlowStore = create<CashFlowState>((set) => ({
  entries: [],
  totals: { sales: 0, income: 0, expense: 0, net: 0 },
  loading: false,

  fetchEntries: async (filters) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters?.sessionId) params.set("sessionId", filters.sessionId)
      if (filters?.terminalId) params.set("terminalId", filters.terminalId)
      if (filters?.type) params.set("type", filters.type)
      if (filters?.from) params.set("from", filters.from)
      if (filters?.to) params.set("to", filters.to)
      const res = await fetch(`/api/admin/cash-flow?${params}`)
      const data = await res.json()
      set({
        entries: Array.isArray(data.entries) ? data.entries : [],
        totals: data.totals ?? { sales: 0, income: 0, expense: 0, net: 0 },
      })
    } finally {
      set({ loading: false })
    }
  },
}))
