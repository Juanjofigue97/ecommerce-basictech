"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, UserCog } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRolesStore } from "@/stores/roles-store"

const roleSchema = z.object({
  name: z.string().min(1, "El nombre del rol es requerido"),
  permissions: z.array(z.string()),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleFormProps {
  defaultValues?: RoleFormData
  onSubmit: (data: RoleFormData) => Promise<void>
  submitLabel: string
  title: string
  description: string
}

export function RoleForm({
  defaultValues,
  onSubmit,
  submitLabel,
  title,
  description,
}: RoleFormProps) {
  const router = useRouter()
  const { permissions, fetchPermissions } = useRolesStore()

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: defaultValues ?? { name: "", permissions: [] },
  })

  const selectedPermissions = watch("permissions")

  const togglePermission = (key: string) => {
    const current = selectedPermissions ?? []
    setValue(
      "permissions",
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    )
  }

  const handleFormSubmit = async (data: RoleFormData) => {
    await onSubmit(data)
    router.push("/admin/roles")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/roles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Configuración del rol
          </CardTitle>
          <CardDescription>
            Define el nombre y los módulos a los que tendrá acceso este rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del rol</Label>
              <Input
                id="name"
                placeholder="Ej: Cajero, Vendedor, Digitadora..."
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label>Selecciona los permisos que va a tener el rol</Label>
                <p className="text-sm text-muted-foreground mt-1">Módulos</p>
              </div>
              <div className="grid gap-3">
                {permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center gap-2">
                    <Checkbox
                      id={permission.key}
                      checked={selectedPermissions?.includes(permission.key) ?? false}
                      onCheckedChange={() => togglePermission(permission.key)}
                    />
                    <Label
                      htmlFor={permission.key}
                      className="font-normal cursor-pointer"
                    >
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/roles">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
