import { create } from "zustand"

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  document: string | null
  source: string
  status: string
  createdAt: string
  updatedAt: string
  userId: string | null
  user: { id: string; email: string; name: string } | null
  _count: { orders: number }
}

interface CustomersState {
  customers: Customer[]
  total: number
  loading: boolean
  error: string | null
  fetchCustomers: (params?: { search?: string; source?: string; status?: string; limit?: number; offset?: number }) => Promise<void>
  createCustomer: (data: Partial<Customer>) => Promise<Customer>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  total: 0,
  loading: false,
  error: null,

  fetchCustomers: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const sp = new URLSearchParams()
      if (params.search) sp.set("search", params.search)
      if (params.source) sp.set("source", params.source)
      if (params.status) sp.set("status", params.status)
      if (params.limit) sp.set("limit", params.limit.toString())
      if (params.offset) sp.set("offset", params.offset.toString())

      const res = await fetch(`/api/customers?${sp}`)
      if (!res.ok) throw new Error("Error fetching customers")
      const data = await res.json()
      set({ customers: data.customers, total: data.total, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createCustomer: async (data) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error creating customer")
    return res.json()
  },

  updateCustomer: async (id, data) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error updating customer")
    return res.json()
  },

  deleteCustomer: async (id) => {
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Error deleting customer")
    }
  },
}))
