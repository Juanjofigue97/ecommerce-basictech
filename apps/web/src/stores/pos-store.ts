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
  // A wholesale-priced line is a distinct decision (Administrador-only, see
  // the checkout route) from a retail one on the same product — the two
  // never merge into a single cart row, even when everything else matches.
  wholesale?: boolean
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
  removeItem: (productId: string, variantId?: string, wholesale?: boolean) => void
  updateQuantity: (productId: string, variantId: string | undefined, qty: number, wholesale?: boolean) => void
  clearCart: () => void
  setDelivery: (v: string) => void
}

const DEFAULT_CUSTOMER_ID = ""
const DEFAULT_CUSTOMER_NAME = "Consumidor Final"

function sameItem(a: POSCartItem, productId: string, variantId?: string, wholesale?: boolean) {
  return (
    a.productId === productId &&
    (a.variantId ?? undefined) === (variantId ?? undefined) &&
    Boolean(a.wholesale) === Boolean(wholesale)
  )
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
      const existing = s.items.find((i) => sameItem(i, item.productId, item.variantId, item.wholesale))
      if (existing) {
        const maxQty = item.stock
        return {
          items: s.items.map((i) =>
            sameItem(i, item.productId, item.variantId, item.wholesale)
              ? { ...i, quantity: Math.min(i.quantity + 1, maxQty) }
              : i
          ),
        }
      }
      return { items: [...s.items, { ...item, quantity: 1 }] }
    }),

  removeItem: (productId, variantId, wholesale) =>
    set((s) => ({
      items: s.items.filter((i) => !sameItem(i, productId, variantId, wholesale)),
    })),

  updateQuantity: (productId, variantId, qty, wholesale) =>
    set((s) => ({
      items:
        qty <= 0
          ? s.items.filter((i) => !sameItem(i, productId, variantId, wholesale))
          : s.items.map((i) =>
              sameItem(i, productId, variantId, wholesale) ? { ...i, quantity: Math.min(qty, i.stock) } : i
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
