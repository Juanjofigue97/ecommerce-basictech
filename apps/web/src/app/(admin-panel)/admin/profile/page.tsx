"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Loader2, KeyRound, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
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

export default function AdminProfilePage() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("")

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => reset({ name: data.name, email: data.email, phone: data.phone ?? "" }))
  }, [session, reset])

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?"

  async function onSaveProfile(data: ProfileForm) {
    if (!session?.user?.id) return
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
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
    if (!session?.user?.id) return
    setSavingPassword(true)
    setPasswordMsg("")
    setPasswordErrorMsg("")
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Administrá tu información personal</p>
      </div>

      {/* Avatar + rol */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            {session?.user?.roleName && (
              <Badge className="mt-1">{session.user.roleName}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Información Personal
          </CardTitle>
          <CardDescription>Actualizá tu nombre, email y teléfono</CardDescription>
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
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} placeholder="+57 300 000 0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><Save className="mr-2 h-4 w-4" />Guardar</>}
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
          <CardDescription>Elegí una contraseña segura de al menos 6 caracteres</CardDescription>
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
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" {...regPwd("confirmPassword")} />
                {pwdErrors.confirmPassword && <p className="text-sm text-destructive">{pwdErrors.confirmPassword.message}</p>}
              </div>
            </div>
            {passwordMsg && <p className="text-sm text-green-600">{passwordMsg}</p>}
            {passwordErrorMsg && <p className="text-sm text-destructive">{passwordErrorMsg}</p>}
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><KeyRound className="mr-2 h-4 w-4" />Cambiar Contraseña</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
