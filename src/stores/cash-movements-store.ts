import { create } from "zustand"

export interface CashMovement {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  concept: string
  createdAt: string
  session: {
    id: string
    terminal: { id: string; name: string }
  }
  user: { id: string; name: string }
}

interface CashMovementsState {
  movements: CashMovement[]
  loading: boolean
  fetchMovements: (filters?: { sessionId?: string; type?: string }) => Promise<void>
  createMovement: (data: {
    sessionId: string
    userId: string
    type: "INCOME" | "EXPENSE"
    amount: number
    concept: string
  }) => Promise<CashMovement>
  deleteMovement: (id: string) => Promise<void>
}

export const useCashMovementsStore = create<CashMovementsState>((set) => ({
  movements: [],
  loading: false,

  fetchMovements: async (filters) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters?.sessionId) params.set("sessionId", filters.sessionId)
      if (filters?.type) params.set("type", filters.type)
      const res = await fetch(`/api/cash-movements?${params}`)
      const data = await res.json()
      set({ movements: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  createMovement: async (data) => {
    const res = await fetch("/api/cash-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al registrar el movimiento")
    const movement: CashMovement = await res.json()
    set((s) => ({ movements: [movement, ...s.movements] }))
    return movement
  },

  deleteMovement: async (id) => {
    const res = await fetch(`/api/cash-movements/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al eliminar el movimiento")
    set((s) => ({ movements: s.movements.filter((m) => m.id !== id) }))
  },
}))
