"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { usePurchaseOrdersStore } from "@/stores/purchase-orders-store"
import { useCurrency } from "@/hooks/use-currency"

interface Supplier { id: string; name: string; nit: string }
interface Product { id: string; name: string; price: number }
interface OrderLine { productId: string; productName: string; quantity: number; unitCost: number }

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
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<OrderLine[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [lineQty, setLineQty] = useState(1)
  const [lineCost, setLineCost] = useState(0)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
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

  function addLine() {
    const product = products.find((p) => p.id === selectedProduct)
    if (!product || lineQty <= 0 || lineCost <= 0) return
    setLines((prev) => [...prev, { productId: product.id, productName: product.name, quantity: lineQty, unitCost: lineCost }])
    setSelectedProduct("")
    setLineQty(1)
    setLineCost(0)
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const orderTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0)

  async function onSubmit(data: FormData) {
    if (lines.length === 0) { alert("Agregá al menos un producto"); return }
    if (!session?.user?.id) { alert("Sesión requerida"); return }
    setSaving(true)
    try {
      await createOrder({
        supplierId: data.supplierId,
        createdById: session.user.id,
        notes: data.notes,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
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
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 items-end">
              <div className="space-y-2 sm:col-span-2">
                <Label>Producto</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" min={1} value={lineQty} onChange={(e) => setLineQty(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Costo unitario</Label>
                <Input type="number" min={0} step="0.01" value={lineCost} onChange={(e) => setLineCost(Number(e.target.value))} />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={addLine} disabled={!selectedProduct || lineQty <= 0 || lineCost <= 0}>
              <Plus className="mr-2 h-4 w-4" />Agregar producto
            </Button>

            {lines.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Producto</th>
                      <th className="px-4 py-2 text-right font-medium">Cant.</th>
                      <th className="px-4 py-2 text-right font-medium">Costo unit.</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                      <th className="px-4 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{line.productName}</td>
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
