"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/ImageUpload"
import { useAdminStore } from "@/stores/admin-store"
import { useShallow } from "zustand/react/shallow"

interface UploadedImage {
  url: string
  publicId: string
}

const settingsSchema = z.object({
  name: z.string().min(1, { error: "El nombre es requerido" }),
  email: z.email({ error: "Email invalido" }),
  phone: z.string().min(1, { error: "El telefono es requerido" }),
  address: z.string().min(1, { error: "La direccion es requerida" }),
  description: z.string().min(1, { error: "La descripcion es requerida" }),
  currency: z.string(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-80" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { settings, loading, settingsSaving, fetchSettings, saveSettings } = useAdminStore(
    useShallow((s) => ({
      settings: s.settings,
      loading: s.loading,
      settingsSaving: s.settingsSaving,
      fetchSettings: s.fetchSettings,
      saveSettings: s.saveSettings,
    }))
  )

  const [logoImages, setLogoImages] = useState<UploadedImage[]>([])
  const [logoSettingsSnapshot, setLogoSettingsSnapshot] = useState(settings)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Sync logoImages from freshly-loaded settings without setState-in-effect
  // (see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  if (settings !== logoSettingsSnapshot) {
    setLogoSettingsSnapshot(settings)
    setLogoImages(settings?.logo ? [{ url: settings.logo, publicId: "" }] : [])
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        description: settings.description,
        currency: settings.currency,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: SettingsFormData) => {
    setSuccessMsg("")
    setErrorMsg("")
    try {
      await saveSettings({ ...data, logo: logoImages[0]?.url ?? null })
      setSuccessMsg("Configuración guardada correctamente")
    } catch (err) {
      setErrorMsg((err as Error).message)
    }
  }

  if (loading && !settings) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra la configuracion de tu tienda
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacion de la Tienda</CardTitle>
            <CardDescription>
              Configura la informacion basica de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo de la tienda</Label>
              <p className="text-xs text-muted-foreground">
                Se muestra en el encabezado de la tienda, junto al nombre.
              </p>
              <ImageUpload value={logoImages} onChange={setLogoImages} maxImages={1} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la tienda</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de contacto</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono / WhatsApp</Label>
                <Input id="phone" placeholder="+57 300 000 0000" {...register("phone")} />
                <p className="text-xs text-muted-foreground">
                  Este numero recibe los pedidos enviados por WhatsApp desde el carrito.
                </p>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Direccion</Label>
                <Input id="address" {...register("address")} />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Input id="description" {...register("description")} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moneda</CardTitle>
            <CardDescription>
              Moneda usada para mostrar precios en toda la tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label>Moneda</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cop">Pesos colombianos (COP)</SelectItem>
                      <SelectItem value="pen">Soles (S/)</SelectItem>
                      <SelectItem value="usd">Dolares ($)</SelectItem>
                      <SelectItem value="eur">Euros (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={settingsSaving}>
            {settingsSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
