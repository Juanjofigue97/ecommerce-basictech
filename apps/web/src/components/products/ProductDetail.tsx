"use client"

import { useState } from "react"
import { Heart, ShoppingCart, Star, Minus, Plus, Truck, RotateCcw, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Product } from "@/types"
import { useCartStore } from "@/stores/cart-store"
import { useCurrency } from "@/hooks/use-currency"

interface ProductVariant {
  id: string
  label: string | null
  sku: string | null
  stock: number
  price: number | null
  attributeValueIds: Record<string, string>
}

interface VariantAttribute {
  id: string
  name: string
  values: { id: string; value: string }[]
}

interface ProductDetailProps {
  product: Product
  variants?: ProductVariant[]
  variantAttributes?: VariantAttribute[]
}

export function ProductDetail({ product, variants = [], variantAttributes = [] }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const attr of variantAttributes) {
      if (attr.values.length === 1) {
        initial[attr.id] = attr.values[0].id
      }
    }
    return initial
  })
  const addItem = useCartStore((state) => state.addItem)
  const formatPrice = useCurrency()

  const hasVariants = variantAttributes.length > 0

  // Find the variant that matches all selected attribute values
  const selectedVariant: ProductVariant | null = hasVariants
    ? (variants.find((v) =>
        variantAttributes.every((attr) => v.attributeValueIds[attr.id] === selectedValues[attr.id])
      ) ?? null)
    : null

  const allAttributesSelected = hasVariants
    ? variantAttributes.every((attr) => selectedValues[attr.id])
    : true

  // Active price and stock
  const activePrice = selectedVariant?.price ?? product.price
  const activeStock = hasVariants
    ? (allAttributesSelected ? (selectedVariant?.stock ?? 0) : null)
    : product.stock

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  function selectValue(attrId: string, valueId: string) {
    setSelectedValues((prev) => ({ ...prev, [attrId]: valueId }))
    setQuantity(1)
  }

  // Check if a value is available (has at least one variant with it that has stock > 0)
  function isValueAvailable(attrId: string, valueId: string) {
    return variants.some(
      (v) =>
        v.attributeValueIds[attrId] === valueId &&
        // All other already-selected attributes must match too
        Object.entries(selectedValues).every(
          ([selAttrId, selValueId]) => selAttrId === attrId || v.attributeValueIds[selAttrId] === selValueId
        ) &&
        v.stock > 0
    )
  }

  const canAddToCart = hasVariants
    ? allAttributesSelected && (selectedVariant?.stock ?? 0) > 0
    : product.stock > 0

  const handleAddToCart = () => {
    if (!canAddToCart) return
    addItem(product, {
      quantity,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label ?? undefined,
      variantPrice: selectedVariant?.price ?? undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const maxQty = activeStock ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Badges */}
      <div className="flex gap-2">
        {product.isNew && <Badge className="bg-primary text-primary-foreground">Nuevo</Badge>}
        {hasDiscount && <Badge variant="destructive">-{discountPercent}%</Badge>}
      </div>

      <p className="text-sm text-muted-foreground">{product.brand}</p>
      <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          ))}
        </div>
        <span className="text-sm font-medium">{product.rating}</span>
        <span className="text-sm text-muted-foreground">(128 reseñas)</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">{formatPrice(activePrice)}</span>
        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice!)}</span>
        )}
        {selectedVariant?.price != null && (
          <span className="text-xs text-muted-foreground">Precio de esta variante</span>
        )}
      </div>

      {/* Variant selectors */}
      {hasVariants && (
        <div className="space-y-4">
          {variantAttributes.map((attr) => (
            <div key={attr.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{attr.name}</span>
                {selectedValues[attr.id] && (
                  <span className="text-sm text-muted-foreground">
                    — {attr.values.find((v) => v.id === selectedValues[attr.id])?.value}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val) => {
                  const isSelected = selectedValues[attr.id] === val.id
                  const available = isValueAvailable(attr.id, val.id)
                  return (
                    <button
                      key={val.id}
                      onClick={() => selectValue(attr.id, val.id)}
                      disabled={!available}
                      className={`relative min-w-[3rem] rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : available
                          ? "border-border hover:border-primary hover:text-primary"
                          : "cursor-not-allowed border-border/50 text-muted-foreground/50 line-through"
                      }`}
                    >
                      {val.value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock status */}
      <p className="text-sm">
        {hasVariants && !allAttributesSelected ? (
          <span className="text-muted-foreground">Seleccioná todas las opciones para ver disponibilidad</span>
        ) : activeStock === null || activeStock === undefined ? null
        : activeStock > 0 ? (
          <span className="text-green-600 dark:text-green-400">{activeStock} unidades disponibles</span>
        ) : (
          <span className="text-destructive">Agotado</span>
        )}
      </p>

      <Separator />

      {/* Description */}
      <div>
        <h3 className="font-semibold mb-2">Descripción</h3>
        <p className="text-sm text-muted-foreground">{product.description}</p>
      </div>

      <Separator />

      {/* Quantity & Add to Cart */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Cantidad:</span>
          <div className="flex items-center rounded-md border">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-medium">{quantity}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 gap-2">
          <Button className="flex-1" size="lg" disabled={!canAddToCart || added} onClick={handleAddToCart}>
            {added ? (
              <><Check className="mr-2 h-4 w-4" />Agregado</>
            ) : (
              <><ShoppingCart className="mr-2 h-4 w-4" />
              {hasVariants && !allAttributesSelected ? "Seleccioná las opciones" : "Agregar al Carrito"}</>
            )}
          </Button>
          <Button variant="outline" size="lg"><Heart className="h-4 w-4" /></Button>
        </div>
      </div>

      <Separator />

      {/* Benefits */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Envío gratis", sub: "En pedidos +200" },
          { icon: RotateCcw, title: "Devoluciones", sub: "30 días para devolver" },
          { icon: ShieldCheck, title: "Garantía", sub: "1 año de garantía" },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 text-sm">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
          </div>
        ))}
      </div>

      {/* Specs */}
      {Object.keys(product.specs).length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3">Especificaciones</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
