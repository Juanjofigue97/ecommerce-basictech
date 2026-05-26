import { create } from "zustand"

export interface SessionUser {
  id: string
  name: string
  email: string
}

export interface SessionTerminal {
  id: string
  name: string
}

export interface CashSession {
  id: string
  status: "OPEN" | "CLOSED"
  openedAt: string
  closedAt: string | null
  openingBalance: number
  closingBalance: number | null
  expectedBalance: number | null
  observations: string | null
  terminal: SessionTerminal
  user: SessionUser
  orderCount: number
}

export interface CashSessionDetail extends Omit<CashSession, "orderCount"> {
  paymentsByMethod: {
    CASH: number
    CREDIT_CARD: number
    DEBIT_CARD: number
    TRANSFER: number
  }
  totalTips: number
  totalEgresos: number
  totalIngresos: number
  totalSales: number
}

interface CashSessionsState {
  sessions: CashSession[]
  loading: boolean
  fetchSessions: (filters?: { terminalId?: string; userId?: string; status?: string }) => Promise<void>
  openSession: (data: {
    terminalId: string
    userId: string
    openingBalance: number
  }) => Promise<CashSession>
  closeSession: (
    id: string,
    data: { closingBalance: number | null; observations: string | null }
  ) => Promise<void>
  getSessionDetail: (id: string) => Promise<CashSessionDetail>
}

export const useCashSessionsStore = create<CashSessionsState>((set) => ({
  sessions: [],
  loading: false,

  fetchSessions: async (filters) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters?.terminalId) params.set("terminalId", filters.terminalId)
      if (filters?.userId) params.set("userId", filters.userId)
      if (filters?.status) params.set("status", filters.status)
      const res = await fetch(`/api/cash-sessions?${params}`)
      const data = await res.json()
      set({ sessions: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  openSession: async (data) => {
    const res = await fetch("/api/cash-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al abrir la sesión")
    const session: CashSession = await res.json()
    set((s) => ({ sessions: [session, ...s.sessions] }))
    return session
  },

  closeSession: async (id, data) => {
    const res = await fetch(`/api/cash-sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al cerrar la sesión")
    const updated: CashSession = await res.json()
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...updated, orderCount: sess.orderCount } : sess)),
    }))
  },

  getSessionDetail: async (id) => {
    const res = await fetch(`/api/cash-sessions/${id}`)
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al obtener la sesión")
    return res.json()
  },
}))
