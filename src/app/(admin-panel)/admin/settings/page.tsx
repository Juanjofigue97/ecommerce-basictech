"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdminStore } from "@/stores/admin-store"
import { useShallow } from "zustand/react/shallow"

const settingsSchema = z.object({
  name: z.string().min(1, { error: "El nombre es requerido" }),
  email: z.email({ error: "Email invalido" }),
  phone: z.string().min(1, { error: "El telefono es requerido" }),
  address: z.string().min(1, { error: "La direccion es requerida" }),
  description: z.string().min(1, { error: "La descripcion es requerida" }),
  timezone: z.string(),
  currency: z.string(),
  showOutOfStock: z.boolean(),
  showStockCount: z.boolean(),
  allowReviews: z.boolean(),
  shippingCost: z.number().min(0, { error: "Debe ser mayor o igual a 0" }),
  freeShippingFrom: z.number().min(0, { error: "Debe ser mayor o igual a 0" }),
  notifyNewOrders: z.boolean(),
  notifyFailedPayments: z.boolean(),
  notifyLowStock: z.boolean(),
  notifyNewUsers: z.boolean(),
  enableCards: z.boolean(),
  enableTransfer: z.boolean(),
  enableWallets: z.boolean(),
  enableCashOnDelivery: z.boolean(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-80" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
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
        timezone: settings.timezone,
        currency: settings.currency,
        showOutOfStock: settings.showOutOfStock,
        showStockCount: settings.showStockCount,
        allowReviews: settings.allowReviews,
        shippingCost: settings.shippingCost,
        freeShippingFrom: settings.freeShippingFrom,
        notifyNewOrders: settings.notifyNewOrders,
        notifyFailedPayments: settings.notifyFailedPayments,
        notifyLowStock: settings.notifyLowStock,
        notifyNewUsers: settings.notifyNewUsers,
        enableCards: settings.enableCards,
        enableTransfer: settings.enableTransfer,
        enableWallets: settings.enableWallets,
        enableCashOnDelivery: settings.enableCashOnDelivery,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: SettingsFormData) => {
    await saveSettings(data)
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="store">Tienda</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacion de la Tienda</CardTitle>
                <CardDescription>
                  Configura la informacion basica de tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <CardTitle>Zona Horaria y Moneda</CardTitle>
                <CardDescription>
                  Configura la zona horaria y moneda de tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Zona horaria</Label>
                    <Controller
                      name="timezone"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="america-bogota">America/Bogota (GMT-5)</SelectItem>
                            <SelectItem value="america-lima">America/Lima (GMT-5)</SelectItem>
                            <SelectItem value="america-mexico">America/Mexico_City (GMT-6)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuracion de Productos</CardTitle>
                <CardDescription>
                  Configura como se muestran los productos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar productos agotados</p>
                    <p className="text-sm text-muted-foreground">
                      Los productos sin stock se mostraran como "Agotado"
                    </p>
                  </div>
                  <Controller
                    name="showOutOfStock"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar cantidad en stock</p>
                    <p className="text-sm text-muted-foreground">
                      Muestra cuantas unidades quedan disponibles
                    </p>
                  </div>
                  <Controller
                    name="showStockCount"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Permitir resenas de productos</p>
                    <p className="text-sm text-muted-foreground">
                      Los clientes pueden dejar resenas en productos
                    </p>
                  </div>
                  <Controller
                    name="allowReviews"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Envio</CardTitle>
                <CardDescription>
                  Configura las opciones de envio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCost">Costo de envio estandar (COP)</Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      {...register("shippingCost", { valueAsNumber: true })}
                    />
                    {errors.shippingCost && (
                      <p className="text-sm text-destructive">{errors.shippingCost.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingFrom">Envio gratis desde (COP)</Label>
                    <Input
                      id="freeShippingFrom"
                      type="number"
                      step="0.01"
                      {...register("freeShippingFrom", { valueAsNumber: true })}
                    />
                    {errors.freeShippingFrom && (
                      <p className="text-sm text-destructive">{errors.freeShippingFrom.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones por Email</CardTitle>
                <CardDescription>
                  Configura que notificaciones recibir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nuevos pedidos</p>
                    <p className="text-sm text-muted-foreground">
                      Recibe un email cuando hay un nuevo pedido
                    </p>
                  </div>
                  <Controller
                    name="notifyNewOrders"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pagos fallidos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificacion cuando un pago falla
                    </p>
                  </div>
                  <Controller
                    name="notifyFailedPayments"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Stock bajo</p>
                    <p className="text-sm text-muted-foreground">
                      Alerta cuando un producto tiene poco stock
                    </p>
                  </div>
                  <Controller
                    name="notifyLowStock"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nuevos usuarios</p>
                    <p className="text-sm text-muted-foreground">
                      Notificacion cuando se registra un nuevo usuario
                    </p>
                  </div>
                  <Controller
                    name="notifyNewUsers"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Metodos de Pago</CardTitle>
                <CardDescription>
                  Habilita o deshabilita metodos de pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tarjetas de credito/debito</p>
                    <p className="text-sm text-muted-foreground">
                      Visa, Mastercard, American Express
                    </p>
                  </div>
                  <Controller
                    name="enableCards"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transferencia bancaria</p>
                    <p className="text-sm text-muted-foreground">
                      Bancolombia, Davivienda, BBVA, Nequi
                    </p>
                  </div>
                  <Controller
                    name="enableTransfer"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Billeteras digitales</p>
                    <p className="text-sm text-muted-foreground">
                      Nequi, Daviplata, PayPal
                    </p>
                  </div>
                  <Controller
                    name="enableWallets"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pago contra entrega</p>
                    <p className="text-sm text-muted-foreground">
                      El cliente paga al recibir el producto
                    </p>
                  </div>
                  <Controller
                    name="enableCashOnDelivery"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
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
