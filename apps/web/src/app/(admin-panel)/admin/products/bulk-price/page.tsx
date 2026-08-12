"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProductCombobox } from "@/components/admin/product-combobox"

interface Product {
  id: string
  name: string
  brand: string
  price: number
}

interface PriceRow {
  id: string
  name: string
  brand: string
  currentPrice: number
  newPrice: number
}

type AdjustMode = "set" | "percent" | "fixed"

export default function BulkPriceUpdatePage() {
  const router = useRouter()
  const formatPrice = useCurrency()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<PriceRow[]>([])

  const [adjustMode, setAdjustMode] = useState<AdjustMode>("set")
  const [adjustValue, setAdjustValue] = useState(0)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products")
        const data = await res.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const selectedIds = rows.map((r) => r.id)

  function handleSelectProduct(id: string) {
    setRows((prev) => {
      const exists = prev.some((r) => r.id === id)
      if (exists) {
        return prev.filter((r) => r.id !== id)
      }
      const product = products.find((p) => p.id === id)
      if (!product) return prev
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          currentPrice: product.price,
          newPrice: product.price,
        },
      ]
    })
  }

  function handleRemoveRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function handleNewPriceChange(id: string, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, newPrice: value } : r))
    )
  }

  function handleApplyToAll() {
    setRows((prev) =>
      prev.map((r) => {
        let computed = r.currentPrice
        if (adjustMode === "set") {
          computed = adjustValue
        } else if (adjustMode === "percent") {
          computed = r.currentPrice * (1 + adjustValue / 100)
        } else if (adjustMode === "fixed") {
          computed = r.currentPrice + adjustValue
        }
        return { ...r, newPrice: Math.round(computed) }
      })
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/products/bulk-price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: rows.map((r) => ({ id: r.id, price: r.newPrice })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || "Error al actualizar los precios")
        return
      }
      router.push("/admin/products")
    } catch (error) {
      console.error("Error saving bulk prices:", error)
      setSaveError("Error al actualizar los precios")
    } finally {
      setSaving(false)
    }
  }

  const comboboxProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar precios masivamente</h1>
          <p className="text-muted-foreground">
            Busca productos, ajusta sus precios en lote y guarda los cambios
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar productos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando productos...
            </div>
          ) : (
            <ProductCombobox
              products={comboboxProducts}
              selectedIds={selectedIds}
              onSelect={handleSelectProduct}
            />
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ajuste masivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="space-y-2">
                  <Label>Modo de ajuste</Label>
                  <Select
                    value={adjustMode}
                    onValueChange={(v) => setAdjustMode(v as AdjustMode)}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Fijar precio</SelectItem>
                      <SelectItem value="percent">Ajustar por porcentaje</SelectItem>
                      <SelectItem value="fixed">Ajustar monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  {adjustMode === "percent" ? (
                    <Input
                      type="number"
                      value={adjustValue}
                      onChange={(e) => setAdjustValue(Number(e.target.value))}
                      placeholder="%"
                      className="w-[160px]"
                    />
                  ) : (
                    <CurrencyInput
                      value={adjustValue}
                      onChange={setAdjustValue}
                      className="w-[160px]"
                    />
                  )}
                </div>

                <Button type="button" variant="outline" onClick={handleApplyToAll}>
                  Aplicar a todos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos seleccionados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Precio actual</TableHead>
                    <TableHead>Nuevo precio</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.brand}</p>
                      </TableCell>
                      <TableCell>{formatPrice(row.currentPrice)}</TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={row.newPrice}
                          onChange={(v) => handleNewPriceChange(row.id, v)}
                          className="w-[160px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveRow(row.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={rows.length === 0 || saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancelar</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
