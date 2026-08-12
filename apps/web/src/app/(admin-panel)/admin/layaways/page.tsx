"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useCurrency } from "@/hooks/use-currency"
import { AlertTriangle, Clock, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LayawayOrder {
  id: string
  orderNumber: string
  customer: { name: string; email: string; phone: string }
  status: string
  total: number
  totalPaid: number
  deliverNow: boolean
  holdUntil: string | null
  terminal: { name: string } | null
  terminalId: string | null
  items: { name: string; quantity: number }[]
  createdAt: string
}

type FilterTab = "todos" | "en_curso" | "vencidos" | "completados" | "cancelados"

const FILTER_LABELS: Record<FilterTab, string> = {
  todos: "Todos",
  en_curso: "En curso",
  vencidos: "Vencidos",
  completados: "Completados",
  cancelados: "Cancelados",
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  layaway: { label: "En curso", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  confirmed: { label: "Completado", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

function isExpired(order: LayawayOrder): boolean {
  return (
    order.status === "layaway" &&
    !order.deliverNow &&
    !!order.holdUntil &&
    new Date(order.holdUntil).getTime() < Date.now()
  )
}

function daysRemaining(holdUntil: string): number {
  return Math.ceil((new Date(holdUntil).getTime() - Date.now()) / 86400000)
}

function productsLabel(items: { name: string; quantity: number }[]): string {
  if (items.length === 0) return "—"
  if (items.length === 1) return items[0].name
  return `${items[0].name} y ${items.length - 1} más`
}

export default function AdminLayawaysPage() {
  const formatPrice = useCurrency()
  const [orders, setOrders] = useState<LayawayOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>("todos")
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  function fetchLayaways() {
    setLoading(true)
    fetch("/api/admin/orders?status=layaway&limit=200")
      .then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d.orders) ? d.orders : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLayaways()
  }, [])

  const vencidosCount = useMemo(() => orders.filter(isExpired).length, [orders])
  const porVencerCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "layaway" &&
          !o.deliverNow &&
          o.holdUntil &&
          !isExpired(o) &&
          daysRemaining(o.holdUntil) <= 3
      ).length,
    [orders]
  )

  const filteredOrders = useMemo(() => {
    switch (tab) {
      case "en_curso":
        return orders.filter((o) => o.status === "layaway" && !isExpired(o))
      case "vencidos":
        return orders.filter(isExpired)
      case "completados":
        return orders.filter((o) => o.status === "confirmed")
      case "cancelados":
        return orders.filter((o) => o.status === "cancelled")
      default:
        return orders
    }
  }, [orders, tab])

  async function handleCancel() {
    if (!cancelId) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/pos/layaways/${cancelId}/cancel`, { method: "POST" })
      if (res.ok) {
        fetchLayaways()
      }
    } catch (error) {
      console.error("Error cancelando apartado:", error)
    } finally {
      setCancelling(false)
      setCancelId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Apartados</h1>
        <p className="text-muted-foreground">
          Ventas con abono donde el producto se entrega ahora o se guarda en tienda
        </p>
      </div>

      {/* Urgent alerts */}
      {(vencidosCount > 0 || porVencerCount > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {vencidosCount > 0 && (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="flex items-center gap-3 p-4">
                <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  {vencidosCount} {vencidosCount === 1 ? "apartado vencido" : "apartados vencidos"} — el plazo de guarda ya pasó
                </p>
              </CardContent>
            </Card>
          )}
          {porVencerCount > 0 && (
            <Card className="border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {porVencerCount} {porVencerCount === 1 ? "apartado por vencer" : "apartados por vencer"} en los próximos 3 días
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {FILTER_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Mobile cards */}
      {!loading && (
        <div className="sm:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No hay apartados en esta vista</p>
          ) : (
            filteredOrders.map((order) => {
              const remaining = order.total - order.totalPaid
              const badge = STATUS_BADGE[order.status]
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{productsLabel(order.items)}</p>
                      </div>
                      {badge && <Badge className={badge.className}>{badge.label}</Badge>}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo</span>
                      <span className="font-semibold">{formatPrice(remaining)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Días restantes</span>
                      <HoldBadge order={order} />
                    </div>
                    {order.status === "layaway" && (
                      <div className="flex gap-2 pt-2">
                        {order.terminalId && (
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <Link href={`/admin/pos/${order.terminalId}`} title="Cobrá el saldo desde el POS">
                              Cobrar abono
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => setCancelId(order.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Producto(s)</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Abonado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Días restantes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[220px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay apartados en esta vista
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const remaining = order.total - order.totalPaid
                    const badge = STATUS_BADGE[order.status]
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-medium">{order.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{productsLabel(order.items)}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>{formatPrice(order.totalPaid)}</TableCell>
                        <TableCell className="font-medium">{formatPrice(remaining)}</TableCell>
                        <TableCell>
                          <HoldBadge order={order} />
                        </TableCell>
                        <TableCell>
                          {badge && <Badge className={badge.className}>{badge.label}</Badge>}
                        </TableCell>
                        <TableCell>
                          {order.status === "layaway" && (
                            <div className="flex gap-2">
                              {order.terminalId && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/admin/pos/${order.terminalId}`} title="Cobrá el saldo desde el POS">
                                    Cobrar abono
                                  </Link>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCancelId(order.id)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={() => !cancelling && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar apartado</AlertDialogTitle>
            <AlertDialogDescription>
              El producto se devolverá al inventario. Los abonos que ya se cobraron{" "}
              <strong>no se devuelven automáticamente</strong> — si corresponde un reembolso, hazlo manualmente
              fuera del sistema. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Cancelar apartado"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function HoldBadge({ order }: { order: LayawayOrder }) {
  if (order.deliverNow) {
    return <span className="text-xs text-muted-foreground">Entregado</span>
  }
  if (!order.holdUntil) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const days = daysRemaining(order.holdUntil)
  if (days <= 0) {
    return <Badge variant="destructive">Vencido</Badge>
  }
  if (days <= 3) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
        {days} {days === 1 ? "día" : "días"}
      </Badge>
    )
  }
  return (
    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
      <Clock className="mr-1 h-3 w-3" />
      {days} días
    </Badge>
  )
}
