"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useCashSessionsStore } from "@/stores/cash-sessions-store"
import { useTerminalsStore } from "@/stores/terminals-store"

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

export default function CashSessionsPage() {
  const { sessions, loading, fetchSessions } = useCashSessionsStore()
  const { terminals, fetchTerminals } = useTerminalsStore()
  const [terminalFilter, setTerminalFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchTerminals()
    fetchSessions()
  }, [fetchTerminals, fetchSessions])

  useEffect(() => {
    fetchSessions({
      terminalId: terminalFilter !== "all" ? terminalFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    })
  }, [terminalFilter, statusFilter, fetchSessions])

  const totalSales = sessions.reduce((s, sess) => {
    return s
  }, 0)

  const closedSessions = sessions.filter((s) => s.status === "CLOSED")
  const openSessions = sessions.filter((s) => s.status === "OPEN")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sesiones de Caja</h1>
          <p className="text-muted-foreground">Aperturas y cierres de terminales POS</p>
        </div>
        <Button asChild>
          <Link href="/admin/cash-sessions/new">
            <Plus className="mr-2 h-4 w-4" />Abrir Sesión
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={terminalFilter} onValueChange={setTerminalFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Terminales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las terminales</SelectItem>
            {terminals.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="OPEN">Abiertas</SelectItem>
            <SelectItem value="CLOSED">Cerradas</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-6 text-sm">
          <span className="text-muted-foreground">
            Abiertas: <strong className="text-foreground">{openSessions.length}</strong>
          </span>
          <span className="text-muted-foreground">
            Cerradas: <strong className="text-foreground">{closedSessions.length}</strong>
          </span>
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Fecha apertura", "Terminal", "Responsable", "Base", "Estado", ""].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
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
                  <TableHead>Fecha apertura</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Base inicial</TableHead>
                  <TableHead>Dinero real</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron sesiones
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => {
                    const diff =
                      session.closingBalance !== null && session.expectedBalance !== null
                        ? session.closingBalance - session.expectedBalance
                        : null
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="text-sm">{formatDate(session.openedAt)}</TableCell>
                        <TableCell className="font-medium">{session.terminal.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{session.user.name}</TableCell>
                        <TableCell>{formatCOP(session.openingBalance)}</TableCell>
                        <TableCell>
                          {session.closingBalance !== null
                            ? formatCOP(session.closingBalance)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {diff !== null ? (
                            <span className={diff >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                              {diff >= 0 ? "+" : ""}{formatCOP(diff)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.status === "OPEN" ? (
                            <Badge className="bg-green-600">Abierta</Badge>
                          ) : (
                            <Badge variant="secondary">Cerrada</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/cash-sessions/${session.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
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
