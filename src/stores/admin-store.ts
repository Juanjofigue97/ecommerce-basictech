import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

interface DashboardStats {
  totalProducts: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
}

interface OrdersByStatus {
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  email: string
  total: number
  status: string
  createdAt: string
}

interface AdminOrder {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  status: string
  subtotal: number
  shipping: number
  total: number
  paymentMethod: string
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  items: {
    name: string
    quantity: number
    price: number
    total: number
    image: string
  }[]
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface AdminUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: string
  createdAt: string
  orders: number
  totalSpent: number
}

export interface StoreSettings {
  id: string
  name: string
  email: string
  phone: string
  address: string
  description: string
  timezone: string
  currency: string
  showOutOfStock: boolean
  showStockCount: boolean
  allowReviews: boolean
  shippingCost: number
  freeShippingFrom: number
  notifyNewOrders: boolean
  notifyFailedPayments: boolean
  notifyLowStock: boolean
  notifyNewUsers: boolean
  enableCards: boolean
  enableTransfer: boolean
  enableWallets: boolean
  enableCashOnDelivery: boolean
  updatedAt: string
}

interface AdminState {
  // Dashboard
  stats: DashboardStats | null
  ordersByStatus: OrdersByStatus | null
  recentOrders: RecentOrder[]

  // Orders
  orders: AdminOrder[]
  ordersTotal: number

  // Users
  users: AdminUser[]

  // Settings
  settings: StoreSettings | null
  settingsSaving: boolean

  loading: boolean
  error: string | null

  // Actions
  fetchDashboard: () => Promise<void>
  fetchOrders: (params?: { status?: string; limit?: number; offset?: number }) => Promise<void>
  fetchUsers: (params?: { role?: string; status?: string }) => Promise<void>
  updateOrderStatus: (id: string, status: string) => Promise<void>
  fetchSettings: () => Promise<void>
  saveSettings: (data: Partial<StoreSettings>) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  ordersByStatus: null,
  recentOrders: [],
  orders: [],
  ordersTotal: 0,
  users: [],
  settings: null,
  settingsSaving: false,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch("/api/admin/dashboard")
      if (!response.ok) throw new Error("Error fetching dashboard")
      const data = await response.json()
      set({
        stats: data.stats,
        ordersByStatus: data.ordersByStatus,
        recentOrders: data.recentOrders,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const searchParams = new URLSearchParams()
      if (params.status) searchParams.set("status", params.status)
      if (params.limit) searchParams.set("limit", params.limit.toString())
      if (params.offset) searchParams.set("offset", params.offset.toString())

      const response = await fetch(`/api/admin/orders?${searchParams}`)
      if (!response.ok) throw new Error("Error fetching orders")
      const data = await response.json()
      set({
        orders: data.orders,
        ordersTotal: data.total,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const searchParams = new URLSearchParams()
      if (params.role) searchParams.set("role", params.role)
      if (params.status) searchParams.set("status", params.status)

      const response = await fetch(`/api/users?${searchParams}`)
      if (!response.ok) throw new Error("Error fetching users")
      const users = await response.json()
      set({ users, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Error updating order")

      await get().fetchOrders()
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch("/api/admin/settings")
      if (!response.ok) throw new Error("Error fetching settings")
      const settings = await response.json()
      set({ settings, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  saveSettings: async (data) => {
    set({ settingsSaving: true, error: null })
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Error saving settings")
      const settings = await response.json()
      set({ settings, settingsSaving: false })
    } catch (error) {
      set({ error: (error as Error).message, settingsSaving: false })
      throw error
    }
  },
}))
