import { create } from "zustand"

export interface Terminal {
  id: string
  name: string
  isActive: boolean
  sessionCount: number
  createdAt: string
}

interface TerminalsState {
  terminals: Terminal[]
  loading: boolean
  fetchTerminals: () => Promise<void>
  createTerminal: (data: { name: string; isActive?: boolean }) => Promise<Terminal>
  updateTerminal: (id: string, data: { name: string; isActive: boolean }) => Promise<Terminal>
  deleteTerminal: (id: string) => Promise<void>
}

export const useTerminalsStore = create<TerminalsState>((set) => ({
  terminals: [],
  loading: false,

  fetchTerminals: async () => {
    set({ loading: true })
    try {
      const res = await fetch("/api/terminals")
      const data = await res.json()
      set({ terminals: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  createTerminal: async (data) => {
    const res = await fetch("/api/terminals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear la terminal")
    const terminal: Terminal = await res.json()
    set((s) => ({ terminals: [...s.terminals, terminal] }))
    return terminal
  },

  updateTerminal: async (id, data) => {
    const res = await fetch(`/api/terminals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al actualizar la terminal")
    const terminal: Terminal = await res.json()
    set((s) => ({ terminals: s.terminals.map((t) => (t.id === id ? terminal : t)) }))
    return terminal
  },

  deleteTerminal: async (id) => {
    const res = await fetch(`/api/terminals/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al eliminar la terminal")
    set((s) => ({ terminals: s.terminals.filter((t) => t.id !== id) }))
  },
}))
