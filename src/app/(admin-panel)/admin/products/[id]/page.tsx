"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, Pencil, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCurrency } from "@/hooks/use-currency"

interface Variant {
  id: string
  label: string | null
  sku: string | null
  stock: number
  price: number | null
}

interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  stock: number
  images: string[]
  isNew: boolean
  isFeatured: boolean
  isActive: boolean
  brand: string
  category: string
  categoryId: string
  brandId: string
  variants: Variant[]
}

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const formatPrice = useCurrency()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
  if (!product) return (
    <div className="text-center py-12 text-muted-foreground">Producto no encontrado</div>
  )

  const hasVariants = product.variants.length > 0
  const totalStock = hasVariants
    ? product.variants.reduce((s, v) => s + v.stock, 0)
    : product.stock
  const outOfStock = hasVariants
    ? product.variants.filter((v) => v.stock === 0)
    : []
  const lowStock = hasVariants
    ? product.variants.filter((v) => v.stock > 0 && v.stock <= 5)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {!product.isActive && <Badge variant="destructive">Inactivo</Badge>}
            {product.isNew && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Nuevo</Badge>}
            {product.isFeatured && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Destacado</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">{product.brand} · {product.category}</p>
        </div>
        <Button asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: images + description */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-3">
              {product.images.length > 0 ? (
                <>
                  <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  {product.images.length > 1 && (
                    <div className="flex gap-2 justify-center flex-wrap">
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                            selectedImage === i ? "border-primary" : "border-transparent"
                          }`}
                        >
                          <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-48 items-center justify-center bg-muted rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {product.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Descripción</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Variant stock table */}
          {hasVariants && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Stock por Variante</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {outOfStock.length > 0 && (
                      <span className="text-destructive mr-3">{outOfStock.length} agotada{outOfStock.length !== 1 ? "s" : ""}</span>
                    )}
                    {lowStock.length > 0 && (
                      <span className="text-yellow-600">{lowStock.length} con stock bajo</span>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Variante</th>
                      <th className="px-4 py-2 text-left font-medium">SKU</th>
                      <th className="px-4 py-2 text-right font-medium">Precio</th>
                      <th className="px-4 py-2 text-right font-medium">Stock</th>
                      <th className="px-4 py-2 text-center font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className="border-t">
                        <td className="px-4 py-2 font-medium">{v.label ?? "—"}</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{v.sku ?? "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {v.price != null ? formatPrice(v.price) : <span className="text-muted-foreground text-xs">Base</span>}
                        </td>
                        <td className={`px-4 py-2 text-right font-semibold ${
                          v.stock === 0 ? "text-destructive" : v.stock <= 5 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {v.stock}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {v.stock === 0 ? (
                            <Badge variant="destructive" className="text-xs">Agotado</Badge>
                          ) : v.stock <= 5 ? (
                            <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Stock bajo</Badge>
                          ) : (
                            <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">En stock</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50 font-semibold">
                      <td className="px-4 py-2" colSpan={3}>Total</td>
                      <td className="px-4 py-2 text-right">{totalStock}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: info cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Precio</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
              {product.comparePrice && (
                <p className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Inventario</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {hasVariants ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variantes</span>
                    <span>{product.variants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock total</span>
                    <span className="font-semibold">{totalStock}</span>
                  </div>
                  <Separator />
                  {product.variants.map((v) => (
                    <div key={v.id} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{v.label ?? "—"}</span>
                      <span className={`font-medium ${
                        v.stock === 0 ? "text-destructive" : v.stock <= 5 ? "text-yellow-600" : ""
                      }`}>
                        {v.stock} uds.
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock</span>
                  <span className={`font-semibold ${product.stock === 0 ? "text-destructive" : ""}`}>
                    {product.stock} uds.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalles</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoría</span>
                <span className="capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marca</span>
                <span>{product.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs">{product.slug}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
