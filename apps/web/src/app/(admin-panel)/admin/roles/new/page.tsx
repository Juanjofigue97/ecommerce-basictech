"use client"

import { RoleForm } from "@/components/admin/RoleForm"
import { useRolesStore } from "@/stores/roles-store"

export default function NewRolePage() {
  const { createRole } = useRolesStore()

  return (
    <RoleForm
      title="Crear rol"
      description="Define un nuevo rol y los módulos a los que tendrá acceso"
      submitLabel="Crear rol"
      onSubmit={createRole}
    />
  )
}
