"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Heart, ShoppingCart, Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Product } from "@/types"
import { useCartStore } from "@/stores/cart-store"
import { useFavoritesStore } from "@/stores/favorites-store"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=400&h=400&fit=crop"

function getValuesForAttr(product: Product, attrName: string): string[] {
  return [...new Set(
    product.variants!.flatMap(v =>
      v.values?.filter(vv => vv.attrName === attrName).map(vv => vv.value) ?? []
    )
  )]
}

function isValueAvailable(product: Product, attrName: string, value: string, selectedValues: Record<string, string>): boolean {
  return product.variants!.some(v =>
    v.values?.find(vv => vv.attrName === attrName)?.value === value &&
    Object.entries(selectedValues).every(([selAttr, selVal]) =>
      selAttr === attrName || v.values?.find(vv => vv.attrName === selAttr)?.value === selVal
    ) &&
    v.stock > 0
  )
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const formatPrice = useCurrency()
  const router = useRouter()
  const { data: session } = useSession()
  const isFavorite = useFavoritesStore((s) => s.isFavorite(product.id))
  const addFavorite = useFavoritesStore((s) => s.addFavorite)
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite)
  const fetchFavorites = useFavoritesStore((s) => s.fetchFavorites)
  const [added, setAdded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (session) fetchFavorites()
  }, [session, fetchFavorites])

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      router.push(`/login?callbackUrl=/products/${product.slug}`)
      return
    }
    if (isFavorite) {
      removeFavorite(product.id).catch(() => {})
    } else {
      addFavorite(product).catch(() => {})
    }
  }

  const hasVariantAttrs =
    (product.variantAttributeNames?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0

  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    if (!hasVariantAttrs) return {}
    const initial: Record<string, string> = {}
    for (const attrName of product.variantAttributeNames!) {
      const vals = getValuesForAttr(product, attrName)
      if (vals.length === 1) initial[attrName] = vals[0]
    }
    return initial
  })

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const productImage = product.images?.[0] || PLACEHOLDER_IMAGE

  const allSelected =
    hasVariantAttrs && product.variantAttributeNames!.every(attr => selectedValues[attr])

  const selectedVariant = allSelected
    ? product.variants!.find(v =>
        product.variantAttributeNames!.every(attrName =>
          v.values?.find(vv => vv.attrName === attrName)?.value === selectedValues[attrName]
        )
      ) ?? null
    : null

  const canConfirm = allSelected && (selectedVariant?.stock ?? 0) > 0

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset solo las selecciones que tengan más de una opción
      setSelectedValues(() => {
        const reset: Record<string, string> = {}
        for (const attrName of (product.variantAttributeNames ?? [])) {
          const vals = getValuesForAttr(product, attrName)
          if (vals.length === 1) reset[attrName] = vals[0]
        }
        return reset
      })
    }
    setOpen(next)
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasVariantAttrs) {
      addItem(product)
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
      return
    }
    setOpen(true)
  }

  const handleConfirmVariant = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canConfirm || !selectedVariant) return
    const label =
      selectedVariant.label ??
      product.variantAttributeNames!.map(a => selectedValues[a]).join(" / ")
    addItem(product, {
      variantId: selectedVariant.id,
      variantLabel: label,
      variantPrice: selectedVariant.price ?? undefined,
    })
    setOpen(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const maxQty = product.stock

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground">Nuevo</Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive">-{discountPercent}%</Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={cn(
            "absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80 transition-opacity",
            isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-destructive text-destructive")} />
          <span className="sr-only">
            {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          </span>
        </Button>

        {/* Image */}
        <Link href={`/products/${product.slug}`}>
          <div className="relative h-full w-full">
            <Image
              src={productImage}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        </Link>

        {/* Quick Add Button */}
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none translate-y-full opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                className="w-full"
                size="sm"
                onClick={handleQuickAdd}
                disabled={product.stock === 0 && !hasVariantAttrs}
                variant={added ? "secondary" : "default"}
              >
                {added ? (
                  <><Check className="mr-2 h-4 w-4" />Agregado</>
                ) : (
                  <><ShoppingCart className="mr-2 h-4 w-4" />Agregar</>
                )}
              </Button>
            </PopoverTrigger>

            {hasVariantAttrs && (
              <PopoverContent
                className="w-64 p-3"
                side="top"
                align="center"
                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              >
                <div className="space-y-3">
                  {product.variantAttributeNames!.map((attrName) => {
                    const vals = getValuesForAttr(product, attrName)
                    return (
                      <div key={attrName} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {attrName}
                          </span>
                          {selectedValues[attrName] && (
                            <span className="text-xs text-foreground">— {selectedValues[attrName]}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {vals.map((val) => {
                            const isSelected = selectedValues[attrName] === val
                            const available = isValueAvailable(product, attrName, val, selectedValues)
                            return (
                              <button
                                key={val}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (!available) return
                                  setSelectedValues(prev => ({ ...prev, [attrName]: val }))
                                }}
                                disabled={!available}
                                className={`rounded border px-2.5 py-1 text-xs font-medium transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : available
                                    ? "border-border hover:border-primary hover:text-primary"
                                    : "cursor-not-allowed border-border/40 text-muted-foreground/40 line-through"
                                }`}
                              >
                                {val}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  <Button
                    className="w-full"
                    size="sm"
                    disabled={!canConfirm}
                    onClick={handleConfirmVariant}
                  >
                    {canConfirm ? "Agregar al carrito" : "Seleccioná las opciones"}
                  </Button>
                </div>
              </PopoverContent>
            )}
          </Popover>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Brand + single-attr inline */}
        <p className="text-xs text-muted-foreground">
          {product.brand}
          {product.variantAttributeNames?.length === 1 && product.variants && product.variants.length > 0 && (() => {
            const attrName = product.variantAttributeNames[0]
            const distinctValues = [...new Set(
              product.variants.flatMap((v) => v.values?.filter((vv) => vv.attrName === attrName).map((vv) => vv.value) ?? [])
            )]
            return distinctValues.length > 0
              ? <span className="text-muted-foreground"> · {attrName}: {distinctValues.join(", ")}</span>
              : null
          })()}
        </p>

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 font-medium leading-tight line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Variant table for 2+ attributes */}
        {(product.variantAttributeNames?.length ?? 0) >= 2 && product.variants && product.variants.length > 0 && (
          <div className="mt-2 overflow-hidden rounded border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {product.variantAttributeNames!.map((name) => (
                    <th key={name} className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-muted-foreground">
                      {name}
                    </th>
                  ))}
                  <th className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-muted-foreground">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.variants.slice(0, 4).map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    {product.variantAttributeNames!.map((attrName) => {
                      const val = v.values?.find((vv) => vv.attrName === attrName)?.value ?? "—"
                      return (
                        <td key={attrName} className="px-2 py-1 font-medium uppercase">
                          {val}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1">
                      <span className={`rounded px-1.5 py-0.5 font-semibold ${
                        v.stock === 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {v.stock === 0 ? "0" : v.stock > 15 ? "15+" : v.stock}
                      </span>
                    </td>
                  </tr>
                ))}
                {product.variants.length > 4 && (
                  <tr>
                    <td colSpan={(product.variantAttributeNames?.length ?? 0) + 1} className="px-2 py-1 text-center text-muted-foreground">
                      +{product.variants.length - 4} más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating}</span>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        {/* Stock — only for products without variants */}
        {(!product.variants || product.variants.length === 0) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {product.stock > 0 ? (
              <span className="text-green-600 dark:text-green-400">
                {product.stock} disponibles
              </span>
            ) : (
              <span className="text-destructive">Agotado</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
