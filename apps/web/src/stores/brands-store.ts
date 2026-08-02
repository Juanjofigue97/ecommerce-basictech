import { create } from "zustand"

export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string | null
  productCount: number
}

interface BrandsState {
  brands: Brand[]
  loading: boolean
  fetchBrands: () => Promise<void>
  createBrand: (data: { name: string; slug: string; logo?: string }) => Promise<Brand>
  updateBrand: (id: string, data: { name: string; slug: string; logo?: string }) => Promise<Brand>
  deleteBrand: (id: string) => Promise<void>
}

export const useBrandsStore = create<BrandsState>((set) => ({
  brands: [],
  loading: false,

  fetchBrands: async () => {
    set({ loading: true })
    try {
      const res = await fetch("/api/brands")
      const data = await res.json()
      set({ brands: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  createBrand: async (data) => {
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear la marca")
    const brand: Brand = await res.json()
    set((s) => ({ brands: [...s.brands, brand] }))
    return brand
  },

  updateBrand: async (id, data) => {
    const res = await fetch(`/api/brands/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al actualizar la marca")
    const brand: Brand = await res.json()
    set((s) => ({ brands: s.brands.map((b) => (b.id === id ? brand : b)) }))
    return brand
  },

  deleteBrand: async (id) => {
    const res = await fetch(`/api/brands/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al eliminar la marca")
    set((s) => ({ brands: s.brands.filter((b) => b.id !== id) }))
  },
}))
