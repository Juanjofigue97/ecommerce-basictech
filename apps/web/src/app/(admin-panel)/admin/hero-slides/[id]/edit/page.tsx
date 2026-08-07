"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/ImageUpload"
import { useHeroSlidesStore } from "@/stores/hero-slides-store"
import { GRADIENT_OPTIONS } from "../../constants"

interface UploadedImage {
  url: string
  publicId: string
}

const schema = z.object({
  title: z.string().min(1, "El título es requerido"),
  subtitle: z.string().optional(),
  badge: z.string().optional(),
  description: z.string().optional(),
  gradient: z.string().min(1, "Selecciona un fondo"),
  ctaText: z.string().min(1, "El texto del botón es requerido"),
  ctaHref: z.string().min(1, "El enlace es requerido"),
  order: z.number().int().min(0),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function EditHeroSlidePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { updateSlide } = useHeroSlidesStore()
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [images, setImages] = useState<UploadedImage[]>([])

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    fetch(`/api/admin/hero-slides`)
      .then((r) => r.json())
      .then((slides: (FormData & { id: string; image: string })[]) => {
        const slide = slides.find((s) => s.id === id)
        if (slide) {
          reset({
            title: slide.title,
            subtitle: slide.subtitle ?? "",
            badge: slide.badge ?? "",
            description: slide.description ?? "",
            gradient: slide.gradient,
            ctaText: slide.ctaText,
            ctaHref: slide.ctaHref,
            order: slide.order,
            isActive: slide.isActive,
          })
          setImages(slide.image ? [{ url: slide.image, publicId: "" }] : [])
        }
        setLoadingData(false)
      })
  }, [id, reset])

  const gradient = watch("gradient")

  async function onSubmit(data: FormData) {
    if (!images[0]) {
      alert("Subí una imagen")
      return
    }
    setSaving(true)
    try {
      await updateSlide(id, {
        ...data,
        image: images[0].url,
        badge: data.badge || null,
        subtitle: data.subtitle || null,
        description: data.description || null,
      })
      router.push("/admin/hero-slides")
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/hero-slides"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Slide</h1>
          <p className="text-muted-foreground">Actualiza el contenido del slide</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Contenido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge (opcional)</Label>
                  <Input id="badge" placeholder="Nueva Colección" {...register("badge")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input id="title" {...register("title")} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input id="subtitle" {...register("subtitle")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input id="description" {...register("description")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Imagen y Fondo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagen *</Label>
                  <ImageUpload value={images} onChange={setImages} maxImages={1} />
                </div>
                <div className="space-y-2">
                  <Label>Color de fondo *</Label>
                  <Controller
                    name="gradient"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADIENT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded bg-gradient-to-br ${opt.value}`} />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Botón y Configuración</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ctaText">Texto del botón *</Label>
                    <Input id="ctaText" {...register("ctaText")} />
                    {errors.ctaText && <p className="text-sm text-destructive">{errors.ctaText.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaHref">Enlace del botón *</Label>
                    <Input id="ctaHref" {...register("ctaHref")} />
                    {errors.ctaHref && <p className="text-sm text-destructive">{errors.ctaHref.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="order">Orden</Label>
                    <Input
                      id="order"
                      type="number"
                      min={0}
                      {...register("order", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label>Slide activo</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Vista previa</p>
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient || GRADIENT_OPTIONS[0].value} aspect-video`}>
              {images[0] && (
                <div className="absolute inset-0">
                  <Image src={images[0].url} alt="" fill className="object-cover opacity-25" />
                </div>
              )}
              <div className="relative z-10 flex h-full flex-col justify-center p-6">
                <span className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-white w-fit">
                  {watch("badge") || "Badge"}
                </span>
                <h2 className="text-2xl font-bold text-white">
                  {watch("title") || "Título del slide"}
                  <span className="block text-primary">{watch("subtitle") || "Subtítulo"}</span>
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {watch("description") || "Descripción del slide"}
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    {watch("ctaText") || "Ver más"}
                  </span>
                  <span className="rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-white">
                    Ver Todo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/hero-slides">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
