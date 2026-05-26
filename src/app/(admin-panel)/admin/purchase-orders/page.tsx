"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Plus, MoreHorizontal, Eye, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { usePurchaseOrdersStore } from "@/stores/purchase-orders-store"
import { useCurrency } from "@/hooks/use-currency"

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ORDERED: { label: "Ordenado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  PARTIAL: { label: "Parcial", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  RECEIVED: { label: "Recibido", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  CANCELLED: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
}

export default function AdminPurchaseOrdersPage() {
  const { orders, total, loading, fetchOrders } = usePurchaseOrdersStore()
  const formatPrice = useCurrency()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPending = orders.filter((o) => o.status === "ORDERED" || o.status === "PARTIAL").length
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          <p className="text-muted-foreground">Gestiona las compras a proveedores</p>
        </div>
        <Button asChild>
          <Link href="/admin/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Órdenes", value: total, display: String(total) },
          { label: "Pendientes de recibir", value: totalPending, display: String(totalPending) },
          { label: "Monto total", value: totalAmount, display: formatPrice(totalAmount) },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.display}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por número o proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="ORDERED">Ordenado</SelectItem>
            <SelectItem value="PARTIAL">Parcial</SelectItem>
            <SelectItem value="RECEIVED">Recibido</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && orders.length === 0 ? (
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow>
            {["N° Orden", "Proveedor", "Ítems", "Total", "Estado", "Fecha", ""].map((h) => <TableHead key={h}>{h}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {[1,2,3,4,5].map((i) => <TableRow key={i}>{[...Array(7)].map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}
          </TableBody></Table>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Orden</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Ítems</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron órdenes
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const status = statusConfig[order.status] ?? statusConfig.DRAFT
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{order.supplier.nit}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length} producto{order.items.length !== 1 ? "s" : ""}</TableCell>
                        <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                        <TableCell>
                          <Badge className={status.className}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("es-PE")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/purchase-orders/${order.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />Ver detalle
                                </Link>
                              </DropdownMenuItem>
                              {order.status === "ORDERED" && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/purchase-orders/${order.id}`}>
                                    <CheckCircle className="mr-2 h-4 w-4" />Marcar recibido
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {order.status === "DRAFT" && (
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
