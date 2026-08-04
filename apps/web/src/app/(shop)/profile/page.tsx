"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCurrency } from "@/hooks/use-currency"
import { Loader2, Save, KeyRound } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/stores/user-store"

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
})

const passwordSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 text-center sm:text-left">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const formatPrice = useCurrency()
  const { data: session, status } = useSession()
  const { orders, fetchOrders } = useUserStore()

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState("")
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("")

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
      reset({ name: session.user.name ?? "", email: session.user.email ?? "" })
    }
  }, [session, fetchOrders, reset])

  async function onSaveProfile(data: ProfileForm) {
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al actualizar el perfil")
      }
      setSuccessMsg("Perfil actualizado correctamente")
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function onSavePassword(data: PasswordForm) {
    setSavingPassword(true)
    setPasswordMsg("")
    setPasswordErrorMsg("")
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al actualizar la contraseña")
      }
      setPasswordMsg("Contraseña actualizada")
      resetPwd()
    } catch (err) {
      setPasswordErrorMsg((err as Error).message)
    } finally {
      setSavingPassword(false)
    }
  }

  if (status === "loading") {
    return <ProfileSkeleton />
  }

  const user = session?.user

  const stats = {
    totalOrders: orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalSpent: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0),
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pedidos</CardDescription>
            <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos Entregados</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.delivered}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Gastado</CardDescription>
            <CardTitle className="text-2xl">{formatPrice(stats.totalSpent)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion Personal</CardTitle>
          <CardDescription>
            Administra tu informacion personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Guardar</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Cambiá tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwd(onSavePassword)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input id="password" type="password" {...regPwd("password")} />
                {pwdErrors.password && (
                  <p className="text-sm text-destructive">{pwdErrors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" {...regPwd("confirmPassword")} />
                {pwdErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{pwdErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            {passwordMsg && <p className="text-sm text-green-600">{passwordMsg}</p>}
            {passwordErrorMsg && <p className="text-sm text-destructive">{passwordErrorMsg}</p>}
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
              ) : (
                <><KeyRound className="mr-2 h-4 w-4" />Cambiar Contraseña</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
