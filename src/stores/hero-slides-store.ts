import { create } from "zustand"

export interface HeroSlide {
  id: string
  badge: string | null
  title: string
  subtitle: string | null
  description: string | null
  image: string
  gradient: string
  ctaText: string
  ctaHref: string
  order: number
  isActive: boolean
}

interface HeroSlidesState {
  slides: HeroSlide[]
  loading: boolean
  fetchSlides: () => Promise<void>
  createSlide: (data: Omit<HeroSlide, "id">) => Promise<HeroSlide>
  updateSlide: (id: string, data: Partial<Omit<HeroSlide, "id">>) => Promise<HeroSlide>
  deleteSlide: (id: string) => Promise<void>
}

export const useHeroSlidesStore = create<HeroSlidesState>((set) => ({
  slides: [],
  loading: false,

  fetchSlides: async () => {
    set({ loading: true })
    try {
      const res = await fetch("/api/admin/hero-slides")
      const data = await res.json()
      set({ slides: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  createSlide: async (data) => {
    const res = await fetch("/api/admin/hero-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear el slide")
    const slide: HeroSlide = await res.json()
    set((s) => ({ slides: [...s.slides, slide].sort((a, b) => a.order - b.order) }))
    return slide
  },

  updateSlide: async (id, data) => {
    const res = await fetch(`/api/admin/hero-slides/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al actualizar el slide")
    const slide: HeroSlide = await res.json()
    set((s) => ({
      slides: s.slides.map((sl) => (sl.id === id ? slide : sl)).sort((a, b) => a.order - b.order),
    }))
    return slide
  },

  deleteSlide: async (id) => {
    const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error((await res.json()).error ?? "Error al eliminar el slide")
    set((s) => ({ slides: s.slides.filter((sl) => sl.id !== id) }))
  },
}))
