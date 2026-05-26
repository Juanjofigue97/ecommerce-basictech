"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useSuppliersStore } from "@/stores/suppliers-store"

const schema = z.object({
  nit: z.string().min(1, "El NIT es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["NATURAL", "JURIDICA"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
})

type FormData = z.infer<typeof schema>

export default function EditSupplierPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { updateSupplier } = useSuppliersStore()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "NATURAL", status: "ACTIVE" },
  })

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        reset({
          nit: data.nit,
          name: data.name,
          phone: data.phone ?? "",
          address: data.address ?? "",
          type: data.type,
          status: data.status,
        })
        setLoading(false)
      })
  }, [id, reset])

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      await updateSupplier(id, data)
      router.push("/admin/suppliers")
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/suppliers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Proveedor</h1>
          <p className="text-muted-foreground">Actualiza los datos del proveedor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle>Datos del Proveedor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nit">NIT *</Label>
                <Input id="nit" {...register("nit")} />
                {errors.nit && <p className="text-sm text-destructive">{errors.nit.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as FormData["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATURAL">Persona Natural</SelectItem>
                    <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nombre / Razón Social *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FormData["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea id="address" {...register("address")} rows={2} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/suppliers">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
