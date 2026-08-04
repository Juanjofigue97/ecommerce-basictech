import { create } from "zustand"

export interface PurchaseOrderItem {
  id: string
  quantity: number
  quantityReceived: number
  unitCost: number
  total: number
  productId: string
  product: { id: string; name: string; images: string[] }
  variantId: string | null
  variant: { id: string; label: string | null; stock: number } | null
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  notes: string | null
  receivedAt: string | null
  createdAt: string
  updatedAt: string
  supplierId: string
  supplier: { id: string; name: string; nit: string }
  createdBy: { id: string; name: string }
  items: PurchaseOrderItem[]
}

interface PurchaseOrdersState {
  orders: PurchaseOrder[]
  total: number
  loading: boolean
  error: string | null
  fetchOrders: (params?: { status?: string; supplierId?: string; limit?: number; offset?: number }) => Promise<void>
  createOrder: (data: { supplierId: string; notes?: string; items: { productId: string; variantId?: string; quantity: number; unitCost: number }[] }) => Promise<PurchaseOrder>
  updateOrder: (id: string, data: { status: string; notes?: string; itemsReceived?: Record<string, number> }) => Promise<PurchaseOrder>
}

export const usePurchaseOrdersStore = create<PurchaseOrdersState>((set) => ({
  orders: [],
  total: 0,
  loading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const sp = new URLSearchParams()
      if (params.status) sp.set("status", params.status)
      if (params.supplierId) sp.set("supplierId", params.supplierId)
      if (params.limit) sp.set("limit", params.limit.toString())
      if (params.offset) sp.set("offset", params.offset.toString())

      const res = await fetch(`/api/purchase-orders?${sp}`)
      if (!res.ok) throw new Error("Error fetching purchase orders")
      const data = await res.json()
      set({ orders: data.orders, total: data.total, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createOrder: async (data) => {
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error creating purchase order")
    return res.json()
  },

  updateOrder: async (id, data) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error updating purchase order")
    return res.json()
  },
}))
