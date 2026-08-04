"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, KeyRound, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRolesStore } from "@/stores/roles-store"

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
})

const passwordSchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

interface UserData {
  id: string
  name: string
  email: string
  phone: string | null
  roleId: string | null
  roleName: string | null
  status: string
}

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { roles, fetchRoles } = useRolesStore()

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [pwdMsg, setPwdMsg] = useState("")
  const [pwdErrorMsg, setPwdErrorMsg] = useState("")
  const [deleteError, setDeleteError] = useState("")

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    fetchRoles()
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data: UserData) => {
        setUser(data)
        reset({
          name: data.name,
          email: data.email,
          phone: data.phone ?? "",
          roleId: data.roleId ?? "none",
          status: data.status as ProfileForm["status"],
        })
      })
      .finally(() => setLoading(false))
  }, [id, fetchRoles, reset])

  async function onSave(data: ProfileForm) {
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          roleId: data.roleId === "none" ? null : data.roleId,
          status: data.status,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al actualizar el usuario")
      }
      const updated = await res.json()
      setUser(updated)
      setSuccessMsg("Usuario actualizado correctamente")
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function onSavePassword(data: PasswordForm) {
    setSavingPwd(true)
    setPwdMsg("")
    setPwdErrorMsg("")
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al actualizar la contraseña")
      }
      setPwdMsg("Contraseña actualizada")
      resetPwd()
    } catch (err) {
      setPwdErrorMsg((err as Error).message)
    } finally {
      setSavingPwd(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al eliminar el usuario")
      }
      router.push("/admin/users")
    } catch (err) {
      setDeleteError((err as Error).message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <p className="text-muted-foreground">Usuario no encontrado.</p>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{user.name}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => { setDeleteError(""); setShowDelete(true) }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </div>

      {/* Info personal */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Editá los datos de la cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} placeholder="+57 300 000 0000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={watch("roleId") ?? "none"}
                  onValueChange={(v) => setValue("roleId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin rol (cliente)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin rol (cliente)</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as ProfileForm["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

            <Button type="submit" disabled={saving}>
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                : <><Save className="mr-2 h-4 w-4" />Guardar Cambios</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Establecé una nueva contraseña para este usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwd(onSavePassword)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input id="password" type="password" {...regPwd("password")} />
                {pwdErrors.password && <p className="text-sm text-destructive">{pwdErrors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar</Label>
                <Input id="confirmPassword" type="password" {...regPwd("confirmPassword")} />
                {pwdErrors.confirmPassword && <p className="text-sm text-destructive">{pwdErrors.confirmPassword.message}</p>}
              </div>
            </div>
            {pwdMsg && <p className="text-sm text-green-600">{pwdMsg}</p>}
            {pwdErrorMsg && <p className="text-sm text-destructive">{pwdErrorMsg}</p>}
            <Button type="submit" disabled={savingPwd}>
              {savingPwd
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                : <><KeyRound className="mr-2 h-4 w-4" />Cambiar Contraseña</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cuenta de <strong>{user.name}</strong> permanentemente.
              {deleteError && (
                <span className="mt-2 block font-medium text-destructive">{deleteError}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
