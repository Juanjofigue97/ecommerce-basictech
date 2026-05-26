"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Product } from "@/types"
import { useCartStore } from "@/stores/cart-store"
import { useCurrency } from "@/hooks/use-currency"

interface ProductCardProps {
  product: Product
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=400&h=400&fit=crop"

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const formatPrice = useCurrency()
  const [added, setAdded] = useState(false)

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const productImage = product.images?.[0] || PLACEHOLDER_IMAGE

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

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
          className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
          <span className="sr-only">Agregar a favoritos</span>
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
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            variant={added ? "secondary" : "default"}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Agregado
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar
              </>
            )}
          </Button>
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
