"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePaymentsStore } from "@/stores/payments-store"
import { ReceiptModal, type ReceiptData } from "@/components/pos/ReceiptModal"

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

const methodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta Crédito",
  DEBIT_CARD: "Tarjeta Débito",
  TRANSFER: "Transferencia",
}

const methodColors: Record<string, string> = {
  CASH: "bg-green-600",
  CREDIT_CARD: "bg-blue-600",
  DEBIT_CARD: "bg-violet-600",
  TRANSFER: "bg-orange-600",
}

export default function AdminPaymentsPage() {
  const { payments, total, loading, fetchPayments } = usePaymentsStore()
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments({
      method: methodFilter !== "all" ? methodFilter : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    })
  }, [methodFilter, fromDate, toDate, fetchPayments])

  async function openReceipt(orderId: string, payment: typeof payments[0]) {
    setLoadingReceipt(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const order = await res.json()
      setReceipt({
        orderNumber: payment.orderNumber,
        date: payment.createdAt,
        customerName: payment.customer.name,
        items: (order.items ?? []).map((i: { name: string; quantity: number; price: number }) => ({
          name: i.name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        subtotal: payment.amount - payment.tip,
        tip: payment.tip,
        total: payment.amount,
        paymentMethod: payment.method,
        receivedAmount: payment.receivedAmount ?? undefined,
        change: payment.change ?? undefined,
        terminal: payment.terminal?.name,
        cashier: payment.cashier?.name,
      })
    } finally {
      setLoadingReceipt(null)
    }
  }

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.orderNumber.toLowerCase().includes(q) ||
      p.customer.name.toLowerCase().includes(q) ||
      (p.terminal?.name ?? "").toLowerCase().includes(q)
    )
  })

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
  const totalTips = payments.reduce((s, p) => s + p.tip, 0)
  const cashPayments = payments.filter((p) => p.method === "CASH").length
  const cardPayments = payments.filter((p) => p.method === "CREDIT_CARD" || p.method === "DEBIT_CARD").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">Transacciones registradas en el POS</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchPayments({ method: methodFilter !== "all" ? methodFilter : undefined, from: fromDate || undefined, to: toDate || undefined })}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recaudado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCOP(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Propinas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCOP(totalTips)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Efectivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cashPayments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Tarjeta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cardPayments}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por pedido, cliente, terminal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los métodos</SelectItem>
            <SelectItem value="CASH">Efectivo</SelectItem>
            <SelectItem value="CREDIT_CARD">Tarjeta Crédito</SelectItem>
            <SelectItem value="DEBIT_CARD">Tarjeta Débito</SelectItem>
            <SelectItem value="TRANSFER">Transferencia</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-40"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-40"
          />
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate("") }}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {loading && payments.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Fecha", "Pedido", "Cliente", "Terminal", "Método", "Monto", "Propina"].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Propina</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {total === 0 ? "No hay pagos registrados aún" : "Sin resultados para la búsqueda"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {p.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{p.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{p.customer.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{p.terminal?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.cashier?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${methodColors[p.method] ?? ""} text-white`}>
                          {methodLabels[p.method] ?? p.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCOP(p.amount)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {p.tip > 0 ? formatCOP(p.tip) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={loadingReceipt === p.orderId}
                          onClick={() => openReceipt(p.orderId, p)}
                          title="Ver recibo"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {total > 0 && (
        <p className="text-sm text-muted-foreground text-right">
          {filtered.length} de {total} registros
        </p>
      )}

      {receipt && (
        <ReceiptModal
          open={!!receipt}
          onClose={() => setReceipt(null)}
          data={receipt}
        />
      )}
    </div>
  )
}
