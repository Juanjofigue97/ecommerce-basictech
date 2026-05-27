"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2, ChevronDown } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { usePurchaseOrdersStore } from "@/stores/purchase-orders-store"
import { useCurrency } from "@/hooks/use-currency"
import type { ProductVariantItem } from "@/types"
import { CurrencyInput } from "@/components/ui/currency-input"

interface Supplier { id: string; name: string; nit: string }

interface ProductOption {
  id: string
  name: string
  price: number
  variants: ProductVariantItem[]
  variantAttributeNames: string[]
}

interface OrderLine {
  productId: string
  productName: string
  variantId: string | null
  variantLabel: string | null
  quantity: number
  unitCost: number
}

const schema = z.object({
  supplierId: z.string().min(1, "El proveedor es requerido"),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { createOrder } = usePurchaseOrdersStore()
  const formatPrice = useCurrency()
  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [lines, setLines] = useState<OrderLine[]>([])

  // Line builder state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({})
  const [lineQty, setLineQty] = useState(1)
  const [lineCost, setLineCost] = useState(0)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/suppliers?status=ACTIVE&limit=100").then((r) => r.json()),
      fetch("/api/products?limit=200").then((r) => r.json()),
    ]).then(([suppData, prodData]) => {
      setSuppliers(suppData.suppliers ?? [])
      setProducts(prodData.products ?? [])
    })
  }, [])

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null
  const hasVariants = (selectedProduct?.variantAttributeNames?.length ?? 0) > 0

  // Reset variant selections when product changes
  function handleProductChange(productId: string) {
    setSelectedProductId(productId)
    setVariantSelections({})
    const product = products.find((p) => p.id === productId)
    if (product) setLineCost(product.price)
  }

  // Cascading: available values for an attribute given previous selections
  function getAvailableValues(attrName: string, attrIndex: number): string[] {
    if (!selectedProduct) return []
    const prevAttrs = selectedProduct.variantAttributeNames.slice(0, attrIndex)
    const filtered = selectedProduct.variants.filter((v) =>
      prevAttrs.every((prev) => {
        const sel = variantSelections[prev]
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

  function handleVariantSelect(attrName: string, value: string, attrIndex: number) {
    const next: Record<string, string> = {}
    selectedProduct?.variantAttributeNames.slice(0, attrIndex).forEach((a) => {
      if (variantSelections[a]) next[a] = variantSelections[a]
    })
    next[attrName] = value
    setVariantSelections(next)
  }

  const allAttrsSelected = hasVariants &&
    selectedProduct!.variantAttributeNames.every((a) => variantSelections[a])

  const resolvedVariant = allAttrsSelected
    ? selectedProduct!.variants.find((v) =>
        selectedProduct!.variantAttributeNames.every((a) =>
          v.values?.some((val) => val.attrName === a && val.value === variantSelections[a])
        )
      ) ?? null
    : null

  const canAddLine =
    !!selectedProductId &&
    (!hasVariants || !!resolvedVariant) &&
    lineQty > 0 &&
    lineCost > 0

  function addLine() {
    if (!selectedProduct || !canAddLine) return
    const variantLabel = resolvedVariant
      ? (resolvedVariant.label ?? selectedProduct.variantAttributeNames.map((a) => variantSelections[a]).join(" / "))
      : null

    setLines((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantId: resolvedVariant?.id ?? null,
        variantLabel,
        quantity: lineQty,
        unitCost: lineCost,
      },
    ])
    setSelectedProductId("")
    setVariantSelections({})
    setLineQty(1)
    setLineCost(0)
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const orderTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0)

  async function onSubmit(data: FormData) {
    if (lines.length === 0) { alert("Agregá al menos un producto"); return }
    if (!session?.user) { alert("Sesión requerida"); return }
    setSaving(true)
    try {
      await createOrder({
        supplierId: data.supplierId,
        notes: data.notes,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId ?? undefined,
          quantity: l.quantity,
          unitCost: l.unitCost,
        })),
      })
      router.push("/admin/purchase-orders")
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/purchase-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Orden de Compra</h1>
          <p className="text-muted-foreground">Registra una compra a proveedor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Proveedor y notas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                <Select onValueChange={(v) => setValue("supplierId", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.nit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" {...register("notes")} placeholder="Observaciones opcionales" rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {/* Product selector */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <Select value={selectedProductId} onValueChange={handleProductChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input type="number" min={1} value={lineQty} onChange={(e) => setLineQty(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo unitario</Label>
                    <CurrencyInput value={lineCost} onChange={setLineCost} placeholder="$ 0" />
                  </div>
                </div>
              </div>

              {/* Variant selector — only shown when product has variants */}
              {selectedProduct && hasVariants && (
                <div className="space-y-3 pt-1 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ChevronDown className="h-3.5 w-3.5" />
                    Especificá la variante
                  </p>
                  {selectedProduct.variantAttributeNames.map((attrName, attrIndex) => {
                    const values = getAvailableValues(attrName, attrIndex)
                    const isDisabled = attrIndex > 0 && !variantSelections[selectedProduct.variantAttributeNames[attrIndex - 1]]
                    return (
                      <div key={attrName} className="space-y-1.5">
                        <Label className="text-xs">{attrName}</Label>
                        <div className="flex flex-wrap gap-2">
                          {values.map((value) => {
                            const isSelected = variantSelections[attrName] === value
                            return (
                              <button
                                key={value}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => handleVariantSelect(attrName, value, attrIndex)}
                                className={[
                                  "min-w-10 rounded border px-3 py-1 text-sm font-medium transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : isDisabled
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:border-primary hover:bg-muted",
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
                  {resolvedVariant && (
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="secondary" className="text-xs">
                        Stock actual: {resolvedVariant.stock} uds
                      </Badge>
                    </div>
                  )}
                  {hasVariants && !resolvedVariant && selectedProductId && (
                    <p className="text-xs text-muted-foreground">Seleccioná todas las opciones para continuar</p>
                  )}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addLine}
                disabled={!canAddLine}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />Agregar al pedido
              </Button>
            </div>

            {/* Lines table */}
            {lines.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Producto / Variante</th>
                      <th className="px-4 py-2 text-right font-medium">Cant.</th>
                      <th className="px-4 py-2 text-right font-medium">Costo unit.</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                      <th className="px-4 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">
                          <p className="font-medium">{line.productName}</p>
                          {line.variantLabel && (
                            <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">{line.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(line.unitCost)}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatPrice(line.quantity * line.unitCost)}</td>
                        <td className="px-4 py-2">
                          <Button variant="ghost" size="icon" type="button" onClick={() => removeLine(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50 font-semibold">
                      <td className="px-4 py-2" colSpan={3}>Total</td>
                      <td className="px-4 py-2 text-right">{formatPrice(orderTotal)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || lines.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Orden de Compra
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/purchase-orders">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
