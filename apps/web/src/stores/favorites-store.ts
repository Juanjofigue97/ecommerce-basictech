import { create } from "zustand"
import type { Product } from "@/types"

interface FavoritesState {
  productIds: Set<string>
  products: Product[]
  loading: boolean
  loaded: boolean
  error: string | null
  fetchFavorites: () => Promise<void>
  addFavorite: (product: Product) => Promise<void>
  removeFavorite: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  productIds: new Set(),
  products: [],
  loading: false,
  loaded: false,
  error: null,

  fetchFavorites: async () => {
    if (get().loaded) return
    set({ loading: true, error: null })
    try {
      const res = await fetch("/api/favorites")
      if (!res.ok) throw new Error("Error al cargar favoritos")
      const products: Product[] = await res.json()
      set({
        products,
        productIds: new Set(products.map((p) => p.id)),
        loading: false,
        loaded: true,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  addFavorite: async (product) => {
    set((state) => ({
      productIds: new Set(state.productIds).add(product.id),
      products: state.products.some((p) => p.id === product.id)
        ? state.products
        : [product, ...state.products],
    }))
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al agregar a favoritos")
    } catch (error) {
      set((state) => {
        const productIds = new Set(state.productIds)
        productIds.delete(product.id)
        return { productIds, products: state.products.filter((p) => p.id !== product.id) }
      })
      throw error
    }
  },

  removeFavorite: async (productId) => {
    const previousIds = get().productIds
    const previousProducts = get().products
    set((state) => {
      const productIds = new Set(state.productIds)
      productIds.delete(productId)
      return { productIds, products: state.products.filter((p) => p.id !== productId) }
    })
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al quitar de favoritos")
    } catch (error) {
      set({ productIds: previousIds, products: previousProducts })
      throw error
    }
  },

  isFavorite: (productId) => get().productIds.has(productId),
}))
