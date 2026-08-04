import { create } from "zustand"

export interface Supplier {
  id: string
  nit: string
  name: string
  phone: string | null
  address: string | null
  type: string
  status: string
  createdAt: string
  updatedAt: string
  _count: { purchaseOrders: number }
}

interface SuppliersState {
  suppliers: Supplier[]
  total: number
  loading: boolean
  error: string | null
  fetchSuppliers: (params?: { search?: string; type?: string; status?: string; limit?: number; offset?: number }) => Promise<void>
  createSupplier: (data: Partial<Supplier>) => Promise<Supplier>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<Supplier>
  deleteSupplier: (id: string) => Promise<void>
}

export const useSuppliersStore = create<SuppliersState>((set) => ({
  suppliers: [],
  total: 0,
  loading: false,
  error: null,

  fetchSuppliers: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const sp = new URLSearchParams()
      if (params.search) sp.set("search", params.search)
      if (params.type) sp.set("type", params.type)
      if (params.status) sp.set("status", params.status)
      if (params.limit) sp.set("limit", params.limit.toString())
      if (params.offset) sp.set("offset", params.offset.toString())

      const res = await fetch(`/api/suppliers?${sp}`)
      if (!res.ok) throw new Error("Error fetching suppliers")
      const data = await res.json()
      set({ suppliers: data.suppliers, total: data.total, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createSupplier: async (data) => {
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error creating supplier")
    return res.json()
  },

  updateSupplier: async (id, data) => {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error updating supplier")
    return res.json()
  },

  deleteSupplier: async (id) => {
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Error deleting supplier")
    }
  },
}))
