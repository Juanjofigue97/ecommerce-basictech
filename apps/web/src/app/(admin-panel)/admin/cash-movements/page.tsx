"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Plus, Trash2, Download, ShoppingCart, TrendingUp, TrendingDown, Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCashFlowStore, type CashFlowEntry } from "@/stores/cash-flow-store"
import { useCashMovementsStore } from "@/stores/cash-movements-store"
import { useCashSessionsStore } from "@/stores/cash-sessions-store"
import { downloadExcel, type ExportColumn } from "@/lib/export"

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta Crédito",
  DEBIT_CARD: "Tarjeta Débito",
  TRANSFER: "Transferencia",
}

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(iso))
}

export default function CashMovementsPage() {
  const { entries, totals, loading, fetchEntries } = useCashFlowStore()
  const { deleteMovement } = useCashMovementsStore()
  const { sessions, fetchSessions } = useCashSessionsStore()

  const [typeTab, setTypeTab] = useState("all")
  const [sessionId, setSessionId] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => { fetchSessions() }, [fetchSessions])

  useEffect(() => {
    fetchEntries({
      sessionId: sessionId !== "all" ? sessionId : undefined,
      type: typeTab !== "all" ? typeTab : undefined,
    })
  }, [typeTab, sessionId, fetchEntries])

  // Filtrado local para los tabs (re-fetch ya aplica el type al servidor,
  // pero lo mantenemos coherente visualmente al cambiar sin round-trip)
  const visibleEntries = entries.filter((e) => {
    if (typeTab !== "all" && e.type !== typeTab) return false
    return true
  })

  const exportColumns: ExportColumn<CashFlowEntry>[] = [
    { key: "date",          label: "Fecha",         format: (v) => formatDate(String(v)) },
    { key: "type",          label: "Tipo",          format: (v) => v === "SALE" ? "Venta POS" : v === "INCOME" ? "Ingreso" : "Egreso" },
    { key: "concept",       label: "Concepto" },
    { key: "paymentMethod", label: "Método",        format: (v) => v ? METHOD_LABELS[String(v)] ?? String(v) : "" },
    { key: "terminal.name", label: "Terminal" },
    { key: "user.name",     label: "Usuario" },
    { key: "amount",        label: "Monto",         format: (v) => Number(v) },
  ]

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError("")
    try {
      await deleteMovement(deleteId)
      setDeleteId(null)
      fetchEntries({
        sessionId: sessionId !== "all" ? sessionId : undefined,
        type: typeTab !== "all" ? typeTab : undefined,
      })
    } catch (e) {
      setDeleteError((e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flujo de Caja</h1>
          <p className="text-muted-foreground">Ventas POS, ingresos y egresos por sesión</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              downloadExcel({
                filename: "flujo-de-caja",
                sheetName: "Flujo de Caja",
                columns: exportColumns,
                data: visibleEntries,
              })
            }
            disabled={visibleEntries.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button asChild>
            <Link href="/admin/cash-movements/new">
              <Plus className="mr-2 h-4 w-4" />Nuevo Movimiento
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas POS</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCOP(totals.sales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos manuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCOP(totals.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCOP(totals.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance neto</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totals.net >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCOP(totals.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={sessionId} onValueChange={setSessionId}>
          <SelectTrigger className="w-full sm:w-70">
            <SelectValue placeholder="Todas las sesiones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sesiones</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.terminal.name} · {formatShortDate(s.openedAt)} · {s.status === "OPEN" ? "Abierta" : "Cerrada"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={typeTab} onValueChange={setTypeTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="SALE">Ventas POS</TabsTrigger>
            <TabsTrigger value="INCOME">Ingresos</TabsTrigger>
            <TabsTrigger value="EXPENSE">Egresos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tabla */}
      {loading && visibleEntries.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Fecha", "Tipo", "Concepto", "Método", "Terminal", "Usuario", "Monto", ""].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12.5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No hay registros para los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(e.date)}
                      </TableCell>
                      <TableCell>
                        {e.type === "SALE" && (
                          <Badge className="bg-blue-600 hover:bg-blue-600">Venta POS</Badge>
                        )}
                        {e.type === "INCOME" && (
                          <Badge className="bg-green-600 hover:bg-green-600">Ingreso</Badge>
                        )}
                        {e.type === "EXPENSE" && (
                          <Badge variant="destructive">Egreso</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-50 truncate" title={e.concept}>
                        {e.concept}
                        {e.type === "SALE" && e.customer && (
                          <span className="block text-xs text-muted-foreground font-normal">
                            {e.customer.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.paymentMethod ? METHOD_LABELS[e.paymentMethod] ?? e.paymentMethod : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{e.terminal?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.user?.name ?? "—"}</TableCell>
                      <TableCell className={`text-right font-medium whitespace-nowrap ${
                        e.type === "EXPENSE" ? "text-destructive" : "text-green-600"
                      }`}>
                        {e.type === "EXPENSE" ? "-" : "+"}{formatCOP(e.amount)}
                      </TableCell>
                      <TableCell>
                        {e.canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeleteId(e.id); setDeleteError("") }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de eliminación */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) { setDeleteId(null); setDeleteError("") } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo se pueden eliminar movimientos de sesiones abiertas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive px-1">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
