import { create } from "zustand"

interface PublicStoreSettings {
  name: string
  description: string
}

interface SettingsState {
  settings: PublicStoreSettings | null
  fetchSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,

  fetchSettings: async () => {
    if (get().settings) return
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) return
      const data = await res.json()
      set({ settings: { name: data.name, description: data.description } })
    } catch {
      // silently fail — UI falls back to hardcoded values
    }
  },
}))
