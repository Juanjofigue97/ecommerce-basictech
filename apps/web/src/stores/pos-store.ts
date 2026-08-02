import { create } from "zustand"

export interface POSCartItem {
  productId: string
  variantId?: string
  name: string
  slug: string
  price: number
  quantity: number
  stock: number
  variantLabel?: string
}

interface POSState {
  terminalId: string | null
  sessionId: string | null
  cashierId: string | null
  customerId: string
  customerName: string
  items: POSCartItem[]
  delivery: string

  setContext: (terminalId: string, sessionId: string, cashierId: string) => void
  setCustomer: (id: string, name: string) => void
  addItem: (item: Omit<POSCartItem, "quantity">) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void
  clearCart: () => void
  setDelivery: (v: string) => void
}

const DEFAULT_CUSTOMER_ID = ""
const DEFAULT_CUSTOMER_NAME = "Consumidor Final"

function sameItem(a: POSCartItem, productId: string, variantId?: string) {
  return a.productId === productId && (a.variantId ?? undefined) === (variantId ?? undefined)
}

export const usePOSStore = create<POSState>((set) => ({
  terminalId: null,
  sessionId: null,
  cashierId: null,
  customerId: DEFAULT_CUSTOMER_ID,
  customerName: DEFAULT_CUSTOMER_NAME,
  items: [],
  delivery: "",

  setContext: (terminalId, sessionId, cashierId) =>
    set({ terminalId, sessionId, cashierId }),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),

  addItem: (item) =>
    set((s) => {
      const existing = s.items.find((i) => sameItem(i, item.productId, item.variantId))
      if (existing) {
        const maxQty = item.stock
        return {
          items: s.items.map((i) =>
            sameItem(i, item.productId, item.variantId)
              ? { ...i, quantity: Math.min(i.quantity + 1, maxQty) }
              : i
          ),
        }
      }
      return { items: [...s.items, { ...item, quantity: 1 }] }
    }),

  removeItem: (productId, variantId) =>
    set((s) => ({
      items: s.items.filter((i) => !sameItem(i, productId, variantId)),
    })),

  updateQuantity: (productId, variantId, qty) =>
    set((s) => ({
      items:
        qty <= 0
          ? s.items.filter((i) => !sameItem(i, productId, variantId))
          : s.items.map((i) =>
              sameItem(i, productId, variantId) ? { ...i, quantity: Math.min(qty, i.stock) } : i
            ),
    })),

  clearCart: () =>
    set({
      items: [],
      delivery: "",
      customerId: DEFAULT_CUSTOMER_ID,
      customerName: DEFAULT_CUSTOMER_NAME,
    }),

  setDelivery: (v) => set({ delivery: v }),
}))
