"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { IconPicker } from "@/components/admin/IconPicker"

interface Attribute {
  id: string
  name: string
  _count: { values: number }
}

const categorySchema = z.object({
  name: z.string().min(1, { error: "El nombre es requerido" }),
  slug: z.string().min(1, { error: "El slug es requerido" }),
  icon: z.string().min(1, { error: "El ícono es requerido" }),
})

type CategoryFormData = z.infer<typeof categorySchema>

function generateSlug(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function EditCategoryPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([])
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([])

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { icon: "Package" },
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/categories/${id}`).then((r) => r.json()),
      fetch("/api/attributes").then((r) => r.json()),
    ]).then(([cat, attrs]) => {
      if (!cat || cat.error) { router.push("/admin/categories"); return }
      reset({ name: cat.name, slug: cat.slug, icon: cat.icon })
      setSelectedAttributeIds((cat.attributes ?? []).map((a: { id: string }) => a.id))
      setAllAttributes(Array.isArray(attrs) ? attrs : [])
      setLoading(false)
    })
  }, [id, reset, router])

  function toggleAttribute(attrId: string) {
    setSelectedAttributeIds((prev) =>
      prev.includes(attrId) ? prev.filter((x) => x !== attrId) : [...prev, attrId]
    )
  }

  const onSubmit = async (data: CategoryFormData) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, attributeIds: selectedAttributeIds }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al actualizar la categoría")
      }
      router.push("/admin/categories")
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div><Skeleton className="h-7 w-48" /><Skeleton className="mt-1 h-4 w-64" /></div>
        </div>
        <Card className="max-w-2xl">
          <CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/categories"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Categoría</h1>
          <p className="text-muted-foreground">Actualiza los datos de la categoría</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Categoría</CardTitle>
            <CardDescription>Modifica los datos de la categoría</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej: Ropa deportiva"
                {...register("name", { onChange: (e) => setValue("slug", generateSlug(e.target.value)) })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" placeholder="ropa-deportiva" {...register("slug")} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Ícono</Label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
              />
              {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atributos</CardTitle>
            <CardDescription>
              Seleccioná los atributos disponibles para los productos de esta categoría.
              Estos atributos se usarán para crear variantes (ej. Talla, Color, Equipo).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allAttributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay atributos creados aún.{" "}
                <Link href="/admin/attributes" className="underline text-foreground">Crear atributos</Link>
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {allAttributes.map((attr) => {
                  const checked = selectedAttributeIds.includes(attr.id)
                  return (
                    <div
                      key={attr.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={`attr-${attr.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleAttribute(attr.id)}
                      />
                      <Label htmlFor={`attr-${attr.id}`} className="cursor-pointer flex-1 font-normal">
                        {attr.name}
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {attr._count.values} valor{attr._count.values !== 1 ? "es" : ""}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
            {selectedAttributeIds.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedAttributeIds.length} atributo{selectedAttributeIds.length !== 1 ? "s" : ""} seleccionado{selectedAttributeIds.length !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/categories">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
