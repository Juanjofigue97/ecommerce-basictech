"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CartItem as CartItemType } from "@/types"
import { useCurrency } from "@/hooks/use-currency"

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void
  onRemove: (productId: string, variantId?: string) => void
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity, variantId, variantLabel, variantPrice } = item
  const formatPrice = useCurrency()

  const unitPrice = variantPrice ?? product.price

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div className="flex-1 pr-2">
            <p className="text-xs text-muted-foreground">{product.brand}</p>
            <Link
              href={`/products/${product.slug}`}
              className="font-medium hover:text-primary transition-colors line-clamp-2"
            >
              {product.name}
            </Link>
            {variantLabel && (
              <Badge variant="secondary" className="mt-1 text-xs font-normal">
                {variantLabel}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(product.id, variantId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Quantity */}
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => onUpdateQuantity(product.id, quantity - 1, variantId)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-10 text-center text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => onUpdateQuantity(product.id, quantity + 1, variantId)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-semibold text-primary">
              {formatPrice(unitPrice * quantity)}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(unitPrice)} c/u
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
