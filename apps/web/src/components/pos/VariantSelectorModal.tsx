"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProductVariantItem } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  productId: string
  productName: string
  productSlug: string
  productPrice: number
  variants: ProductVariantItem[]
  variantAttributeNames: string[]
  onAdd: (item: {
    variantId: string
    variantLabel: string
    price: number
    stock: number
  }) => void
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n)
}

export function VariantSelectorModal({
  open,
  onClose,
  productName,
  productPrice,
  variants,
  variantAttributeNames,
  onAdd,
}: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return

    // Pre-selecciona el primer valor con stock para cada atributo en orden
    const initial: Record<string, string> = {}

    for (let idx = 0; idx < variantAttributeNames.length; idx++) {
      const attrName = variantAttributeNames[idx]
      const prevAttrs = variantAttributeNames.slice(0, idx)

      // Variantes que coinciden con las selecciones previas ya acumuladas
      const filtered = variants.filter((v) =>
        prevAttrs.every((prev) => {
          const sel = initial[prev]
          if (!sel) return true
          return v.values?.some((val) => val.attrName === prev && val.value === sel)
        }),
      )

      const values = Array.from(
        new Set(
          filtered.flatMap((v) => {
            const match = v.values?.find((val) => val.attrName === attrName)
            return match ? [match.value] : []
          }),
        ),
      )

      if (values.length === 0) continue

      // Elige el primero que tenga stock; si ninguno tiene, igual elige el primero
      const firstWithStock = values.find((value) => {
        const test = { ...initial, [attrName]: value }
        return variants.some(
          (v) =>
            Object.entries(test).every(([a, val]) =>
              v.values?.some((vv) => vv.attrName === a && vv.value === val),
            ) && v.stock > 0,
        )
      })

      initial[attrName] = firstWithStock ?? values[0]
    }

    setSelected(initial)
  }, [open, variants, variantAttributeNames])

  // Valores disponibles para un atributo dado lo que ya está seleccionado antes
  function getValues(attrName: string, attrIndex: number): string[] {
    const prevAttrs = variantAttributeNames.slice(0, attrIndex)
    const filtered = variants.filter((v) =>
      prevAttrs.every((prev) => {
        const sel = selected[prev]
        if (!sel) return true
        return v.values?.some((val) => val.attrName === prev && val.value === sel)
      })
    )
    const seen = new Set<string>()
    for (const v of filtered) {
      const match = v.values?.find((val) => val.attrName === attrName)
      if (match) seen.add(match.value)
    }
    return Array.from(seen)
  }

  // ¿Tiene stock esta combinación parcial o completa?
  function hasStock(attrName: string, value: string, attrIndex: number): boolean {
    const test: Record<string, string> = {}
    variantAttributeNames.slice(0, attrIndex).forEach((a) => {
      if (selected[a]) test[a] = selected[a]
    })
    test[attrName] = value

    return variants.some((v) => {
      const matches = Object.entries(test).every(([a, val]) =>
        v.values?.some((vv) => vv.attrName === a && vv.value === val)
      )
      return matches && v.stock > 0
    })
  }

  function handleSelect(attrName: string, value: string, attrIndex: number) {
    // Mantener selecciones previas + el nuevo valor
    const next: Record<string, string> = {}
    variantAttributeNames.slice(0, attrIndex).forEach((a) => {
      if (selected[a]) next[a] = selected[a]
    })
    next[attrName] = value

    // Para cada atributo posterior: conservar la selección actual si sigue disponible,
    // si no, elegir el primer valor con stock
    for (let idx = attrIndex + 1; idx < variantAttributeNames.length; idx++) {
      const attr = variantAttributeNames[idx]
      const prevAttrs = variantAttributeNames.slice(0, idx)

      const filtered = variants.filter((v) =>
        prevAttrs.every((prev) => {
          const sel = next[prev]
          if (!sel) return true
          return v.values?.some((val) => val.attrName === prev && val.value === sel)
        }),
      )

      const values = Array.from(
        new Set(
          filtered.flatMap((v) => {
            const match = v.values?.find((val) => val.attrName === attr)
            return match ? [match.value] : []
          }),
        ),
      )

      if (values.length === 0) continue

      const current = selected[attr]
      if (current && values.includes(current)) {
        next[attr] = current
      } else {
        const firstWithStock = values.find((v) => {
          const test = { ...next, [attr]: v }
          return variants.some(
            (vv) =>
              Object.entries(test).every(([a, val]) =>
                vv.values?.some((vvv) => vvv.attrName === a && vvv.value === val),
              ) && vv.stock > 0,
          )
        })
        next[attr] = firstWithStock ?? values[0]
      }
    }

    setSelected(next)
  }

  const allSelected = variantAttributeNames.every((a) => selected[a])

  const matchingVariant = allSelected
    ? variants.find((v) =>
        variantAttributeNames.every((a) =>
          v.values?.some((val) => val.attrName === a && val.value === selected[a])
        )
      )
    : null

  const variantPrice = matchingVariant?.price ?? productPrice
  const outOfStock = matchingVariant !== undefined && matchingVariant !== null && matchingVariant.stock === 0

  function handleAdd() {
    if (!matchingVariant || matchingVariant.stock === 0) return
    onAdd({
      variantId: matchingVariant.id,
      variantLabel: matchingVariant.label ?? variantAttributeNames.map((a) => selected[a]).join(" / "),
      price: variantPrice,
      stock: matchingVariant.stock,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {variantAttributeNames.map((attrName, attrIndex) => {
            const values = getValues(attrName, attrIndex)
            return (
              <div key={attrName} className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {attrName}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const isSelected = selected[attrName] === value
                    const available = hasStock(attrName, value, attrIndex)
                    return (
                      <button
                        key={value}
                        disabled={!available}
                        onClick={() => handleSelect(attrName, value, attrIndex)}
                        className={[
                          "min-w-[40px] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : available
                              ? "hover:border-primary hover:bg-muted"
                              : "cursor-not-allowed opacity-35 line-through",
                        ].join(" ")}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Stock indicator */}
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Stock disponible</span>
            {matchingVariant ? (
              <Badge variant={matchingVariant.stock > 0 ? "secondary" : "destructive"}>
                {matchingVariant.stock > 0 ? `${matchingVariant.stock} unidades` : "Sin stock"}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!allSelected || outOfStock}
              className="flex-1"
            >
              {!allSelected
                ? "Elegí las opciones"
                : outOfStock
                  ? "Sin stock"
                  : `Agregar · ${formatCOP(variantPrice)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
