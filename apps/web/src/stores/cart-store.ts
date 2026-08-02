import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product, CartItem } from "@/types"

interface AddItemOptions {
  quantity?: number
  variantId?: string
  variantLabel?: string
  variantPrice?: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, options?: AddItemOptions) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
}

function isSameItem(item: CartItem, productId: string, variantId?: string) {
  return item.product.id === productId && item.variantId === variantId
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, options = {}) => {
        const { quantity = 1, variantId, variantLabel, variantPrice } = options
        set((state) => {
          const existing = state.items.find((item) => isSameItem(item, product.id, variantId))
          if (existing) {
            return {
              items: state.items.map((item) =>
                isSameItem(item, product.id, variantId)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }
          return {
            items: [...state.items, { product, quantity, variantId, variantLabel, variantPrice }],
          }
        })
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter((item) => !isSameItem(item, productId, variantId)),
        }))
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            isSameItem(item, productId, variantId) ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + (item.variantPrice ?? item.product.price) * item.quantity,
          0
        ),

      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    { name: "basictech-cart" }
  )
)
