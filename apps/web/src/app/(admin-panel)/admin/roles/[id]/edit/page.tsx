"use client"

import { useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { RoleForm } from "@/components/admin/RoleForm"
import { useRolesStore } from "@/stores/roles-store"

export default function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { roles, fetchRoles, updateRole } = useRolesStore()

  useEffect(() => {
    if (roles.length === 0) fetchRoles()
  }, [roles.length, fetchRoles])

  const role = roles.find((r) => r.id === id)

  if (roles.length > 0 && !role) {
    router.push("/admin/roles")
    return null
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (role.isSystem) {
    router.push("/admin/roles")
    return null
  }

  return (
    <RoleForm
      title={`Editar rol: ${role.name}`}
      description="Modifica el nombre y los permisos de este rol"
      submitLabel="Guardar cambios"
      defaultValues={{ name: role.name, permissions: role.permissions }}
      onSubmit={(data) => updateRole(id, data)}
    />
  )
}
