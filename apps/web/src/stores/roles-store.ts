import { create } from "zustand"

export interface RoleItem {
  id: string
  name: string
  isSystem: boolean
  userCount: number
  permissionCount: number
  permissions: string[]
  createdAt: string
}

export interface PermissionItem {
  id: string
  key: string
  name: string
}

interface RolesState {
  roles: RoleItem[]
  permissions: PermissionItem[]
  loading: boolean
  error: string | null

  fetchRoles: () => Promise<void>
  fetchPermissions: () => Promise<void>
  createRole: (data: { name: string; permissions: string[] }) => Promise<void>
  updateRole: (id: string, data: { name: string; permissions: string[] }) => Promise<void>
  deleteRole: (id: string) => Promise<void>
}

export const useRolesStore = create<RolesState>((set, get) => ({
  roles: [],
  permissions: [],
  loading: false,
  error: null,

  fetchRoles: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch("/api/admin/roles")
      if (!res.ok) throw new Error("Error al cargar roles")
      const roles = await res.json()
      set({ roles, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchPermissions: async () => {
    try {
      const res = await fetch("/api/admin/permissions")
      if (!res.ok) throw new Error("Error al cargar permisos")
      const permissions = await res.json()
      set({ permissions })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  createRole: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al crear rol")
      }
      await get().fetchRoles()
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  updateRole: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`/api/admin/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al actualizar rol")
      }
      await get().fetchRoles()
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  deleteRole: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al eliminar rol")
      }
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },
}))
