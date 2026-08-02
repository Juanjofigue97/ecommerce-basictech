"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { usePurchaseOrdersStore, type PurchaseOrder } from "@/stores/purchase-orders-store"
import { useCurrency } from "@/hooks/use-currency"

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ORDERED: { label: "Ordenado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  PARTIAL: { label: "Parcial", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  RECEIVED: { label: "Recibido", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  CANCELLED: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
}

const nextStatuses: Record<string, string[]> = {
  DRAFT: ["ORDERED", "CANCELLED"],
  ORDERED: ["PARTIAL", "RECEIVED", "CANCELLED"],
  PARTIAL: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { updateOrder } = usePurchaseOrdersStore()
  const formatPrice = useCurrency()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    fetch(`/api/purchase-orders/${id}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false) })
  }, [id])

  async function handleUpdateStatus() {
    if (!newStatus || !order) return
    setUpdating(true)
    try {
      const updated = await updateOrder(id, { status: newStatus })
      setOrder(updated)
      setNewStatus("")
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!order) return <div className="text-center py-12 text-muted-foreground">Orden no encontrada</div>

  const status = statusConfig[order.status] ?? statusConfig.DRAFT
  const available = nextStatuses[order.status] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/purchase-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            Creado el {new Date(order.createdAt).toLocaleDateString("es-PE")} por {order.createdBy.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Productos</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                    <th className="px-4 py-3 text-right font-medium">Solicitado</th>
                    <th className="px-4 py-3 text-right font-medium">Recibido</th>
                    <th className="px-4 py-3 text-right font-medium">Costo unit.</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.product.name}</p>
                        {item.variant?.label && (
                          <p className="text-xs text-muted-foreground">{item.variant.label}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={item.quantityReceived >= item.quantity ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {item.quantityReceived}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatPrice(item.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="px-4 py-3" colSpan={4}>Total</td>
                    <td className="px-4 py-3 text-right">{formatPrice(order.total)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">{order.notes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Proveedor</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.supplier.name}</p>
              <p className="text-muted-foreground">NIT: {order.supplier.nit}</p>
            </CardContent>
          </Card>

          {available.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Cambiar Estado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger>
                  <SelectContent>
                    {available.map((s) => (
                      <SelectItem key={s} value={s}>{statusConfig[s]?.label ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newStatus === "RECEIVED" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    El stock de cada producto se actualizará automáticamente.
                  </p>
                )}
                <Button className="w-full" onClick={handleUpdateStatus} disabled={!newStatus || updating}>
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar Estado
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos</span>
                <span>{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unidades pedidas</span>
                <span>{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unidades recibidas</span>
                <span>{order.items.reduce((s, i) => s + i.quantityReceived, 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
