import { create } from "zustand"

export interface AdminPayment {
  id: string
  method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "TRANSFER"
  amount: number
  tip: number
  receivedAmount: number | null
  change: number | null
  createdAt: string
  orderId: string
  orderNumber: string
  channel: string
  customer: { name: string; email: string }
  cashier: { name: string } | null
  terminal: { name: string } | null
}

interface PaymentsState {
  payments: AdminPayment[]
  total: number
  loading: boolean
  fetchPayments: (filters?: { method?: string; sessionId?: string; from?: string; to?: string }) => Promise<void>
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  payments: [],
  total: 0,
  loading: false,

  fetchPayments: async (filters) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters?.method) params.set("method", filters.method)
      if (filters?.sessionId) params.set("sessionId", filters.sessionId)
      if (filters?.from) params.set("from", filters.from)
      if (filters?.to) params.set("to", filters.to)
      const res = await fetch(`/api/admin/payments?${params}`)
      const data = await res.json()
      set({
        payments: Array.isArray(data.payments) ? data.payments : [],
        total: data.total ?? 0,
      })
    } finally {
      set({ loading: false })
    }
  },
}))
