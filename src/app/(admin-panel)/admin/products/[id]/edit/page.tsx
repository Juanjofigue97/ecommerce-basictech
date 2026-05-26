"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/ImageUpload"

interface UploadedImage { url: string; publicId: string }
interface Category { id: string; name: string }
interface Brand { id: string; name: string }
interface AttributeValue { id: string; value: string }
interface CategoryAttribute { id: string; name: string; slug: string; values: AttributeValue[] }
interface VariantLine {
  id?: string         // existing variant id (undefined = new)
  sku: string
  stock: number
  price: string
  attributeValueIds: Record<string, string>  // attributeId -> attributeValueId
}

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  price: z.number().min(0),
  comparePrice: z.number().optional(),
  stock: z.number().min(0).optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
  brandId: z.string().min(1, "La marca es requerida"),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

const emptyVariant = (): VariantLine => ({ sku: "", stock: 0, price: "", attributeValueIds: {} })

function generateSlug(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function EditProductPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [variants, setVariants] = useState<VariantLine[]>([])
  const [useVariants, setUseVariants] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { isNew: false, isFeatured: false, isActive: true, stock: 0 },
  })

  const watchedCategoryId = watch("categoryId")

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/brands").then((r) => r.json()),
    ]).then(([product, cats, brnds]) => {
      const categories = Array.isArray(cats) ? cats : (cats?.categories ?? [])
      const brands = Array.isArray(brnds) ? brnds : []
      setCategories(categories)
      setBrands(brands)

      reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
        stock: Number(product.stock),
        categoryId: product.categoryId,
        brandId: product.brandId,
        isNew: product.isNew ?? false,
        isFeatured: product.isFeatured ?? false,
        isActive: product.isActive ?? true,
      })

      if (product.images?.length > 0) {
        setImages(product.images.map((url: string) => ({
          url,
          publicId: url.split("/").pop()?.split(".")[0] ?? "",
        })))
      }

      // Load existing variants
      if (product.variants?.length > 0) {
        setUseVariants(true)
        setVariants(product.variants.map((v: {
          id: string; sku: string | null; stock: number; price: number | null;
          attributeValueIds: Record<string, string>
        }) => ({
          id: v.id,
          sku: v.sku ?? "",
          stock: v.stock,
          price: v.price != null ? String(v.price) : "",
          attributeValueIds: v.attributeValueIds ?? {},
        })))
      }

      setLoading(false)
    })
  }, [id, reset])

  // When category changes, load its attributes
  useEffect(() => {
    if (!watchedCategoryId) { setCategoryAttributes([]); return }
    fetch(`/api/categories/${watchedCategoryId}`)
      .then((r) => r.json())
      .then((data) => setCategoryAttributes(data.attributes ?? []))
  }, [watchedCategoryId])

  function addVariant() { setVariants((v) => [...v, emptyVariant()]) }
  function removeVariant(i: number) { setVariants((v) => v.filter((_, idx) => idx !== i)) }
  function updateVariant(i: number, field: "sku" | "stock" | "price", value: string | number) {
    setVariants((v) => v.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }
  function setAttributeValue(variantIdx: number, attributeId: string, valueId: string) {
    setVariants((v) => v.map((row, idx) =>
      idx === variantIdx
        ? { ...row, attributeValueIds: { ...row.attributeValueIds, [attributeId]: valueId } }
        : row
    ))
  }

  const totalVariantStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
  const hasAttributes = categoryAttributes.length > 0

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) { alert("Debes subir al menos una imagen"); return }
    if (useVariants && variants.length === 0) { alert("Agregá al menos una variante"); return }
    if (useVariants && hasAttributes) {
      const incomplete = variants.some((v) =>
        categoryAttributes.some((a) => !v.attributeValueIds[a.id])
      )
      if (incomplete) { alert("Todas las variantes deben tener todos los atributos seleccionados"); return }
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        ...data,
        images: images.map((img) => img.url),
      }
      if (useVariants && variants.length > 0) {
        body.variants = variants.map((v) => ({
          id: v.id,
          sku: v.sku.trim() || undefined,
          stock: Number(v.stock) || 0,
          price: v.price ? Number(v.price) : undefined,
          attributeValueIds: Object.values(v.attributeValueIds).filter(Boolean),
        }))
        delete body.stock
      } else {
        body.variants = []
      }

      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? "Error al actualizar el producto")
      }
      router.push("/admin/products")
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Producto</h1>
          <p className="text-muted-foreground">Modifica los datos del producto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del producto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  {...register("name", { onChange: (e) => setValue("slug", generateSlug(e.target.value)) })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input id="slug" {...register("slug")} />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" rows={4} {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={watch("brandId") ?? ""} onValueChange={(v) => setValue("brandId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.brandId && <p className="text-sm text-destructive">{errors.brandId.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio e Inventario</CardTitle>
            <CardDescription>Configura precio y disponibilidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Precio base</Label>
                <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice">Precio anterior (opcional)</Label>
                <Input id="comparePrice" type="number" step="0.01" {...register("comparePrice", { valueAsNumber: true })} />
              </div>
            </div>
            {!useVariants && (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" {...register("stock", { valueAsNumber: true })} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Variantes</CardTitle>
                <CardDescription>
                  {hasAttributes
                    ? `Atributos disponibles: ${categoryAttributes.map((a) => a.name).join(", ")}`
                    : watchedCategoryId
                    ? "Esta categoría no tiene atributos configurados"
                    : "Seleccioná una categoría para ver sus atributos"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="useVariants"
                  checked={useVariants}
                  onCheckedChange={(v) => {
                    setUseVariants(!!v)
                    if (v && variants.length === 0) setVariants([emptyVariant()])
                  }}
                />
                <Label htmlFor="useVariants" className="font-normal cursor-pointer whitespace-nowrap">Usar variantes</Label>
              </div>
            </div>
          </CardHeader>
          {useVariants && (
            <CardContent className="space-y-4">
              {!watchedCategoryId && (
                <p className="text-sm text-muted-foreground">Seleccioná una categoría primero.</p>
              )}
              {watchedCategoryId && !hasAttributes && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Esta categoría no tiene atributos.{" "}
                  <Link href="/admin/categories" className="underline">Configurar atributos</Link>
                </p>
              )}
              {watchedCategoryId && hasAttributes && (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {categoryAttributes.map((attr) => (
                            <th key={attr.id} className="px-3 py-2 text-left font-medium">{attr.name}</th>
                          ))}
                          <th className="px-3 py-2 text-right font-medium">Stock</th>
                          <th className="px-3 py-2 text-left font-medium">SKU (opc.)</th>
                          <th className="px-3 py-2 text-right font-medium">Precio propio (opc.)</th>
                          <th className="px-3 py-2 text-center font-medium">Estado</th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, i) => (
                          <tr key={i} className="border-t">
                            {categoryAttributes.map((attr) => (
                              <td key={attr.id} className="px-3 py-2 min-w-[130px]">
                                <Select
                                  value={v.attributeValueIds[attr.id] ?? ""}
                                  onValueChange={(val) => setAttributeValue(i, attr.id, val)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder={`${attr.name}...`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {attr.values.map((val) => (
                                      <SelectItem key={val.id} value={val.id}>{val.value}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            ))}
                            <td className="px-3 py-2">
                              <Input
                                type="number" min={0} value={v.stock}
                                onChange={(e) => updateVariant(i, "stock", Number(e.target.value))}
                                className="h-8 text-right w-20"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                placeholder="SKU-001" value={v.sku}
                                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                                className="h-8 w-28"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number" step="0.01" min={0} placeholder="—" value={v.price}
                                onChange={(e) => updateVariant(i, "price", e.target.value)}
                                className="h-8 text-right w-24"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              {v.id
                                ? <Badge variant="secondary" className="text-xs">Guardada</Badge>
                                : <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Nueva</Badge>
                              }
                            </td>
                            <td className="px-3 py-2">
                              <Button variant="ghost" size="icon" type="button" onClick={() => removeVariant(i)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {variants.length > 0 && (
                          <tr className="border-t bg-muted/50 font-semibold text-sm">
                            <td className="px-3 py-2" colSpan={categoryAttributes.length}>Total</td>
                            <td className="px-3 py-2 text-right">{totalVariantStock} uds.</td>
                            <td colSpan={4} />
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />Agregar variante
                  </Button>
                </>
              )}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
            <CardDescription>Imágenes del producto (máximo 5)</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload value={images} onChange={setImages} maxImages={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="isNew" checked={watch("isNew")} onCheckedChange={(c) => setValue("isNew", !!c)} />
              <Label htmlFor="isNew" className="font-normal">Marcar como producto nuevo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isFeatured" checked={watch("isFeatured")} onCheckedChange={(c) => setValue("isFeatured", !!c)} />
              <Label htmlFor="isFeatured" className="font-normal">Mostrar en productos destacados</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", !!c)} />
              <Label htmlFor="isActive" className="font-normal">Producto activo (visible en la tienda)</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
