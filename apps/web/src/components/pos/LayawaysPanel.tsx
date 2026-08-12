"use client"

import { useEffect, useState } from "react"
import { Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { CurrencyInput } from "@/components/ui/currency-input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type PosPaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "TRANSFER"

interface LayawayRow {
  id: string
  status: string
  customer: { name: string }
  total: number
  totalPaid: number
  deliverNow: boolean
  holdUntil: string | null
  terminalId: string | null
}

const METHOD_LABELS: Record<PosPaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta crédito",
  DEBIT_CARD: "Tarjeta débito",
  TRANSFER: "Transferencia",
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n)
}

function daysRemaining(holdUntil: string): number {
  return Math.ceil((new Date(holdUntil).getTime() - Date.now()) / 86400000)
}

interface Props {
  terminalId: string
  sessionId: string | null
}

export function LayawaysPanel({ terminalId, sessionId }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<LayawayRow[]>([])
  const [loading, setLoading] = useState(false)
  const [collectingId, setCollectingId] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PosPaymentMethod>("CASH")
  const [received, setReceived] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  function fetchRows() {
    setLoading(true)
    fetch("/api/admin/orders?status=layaway&limit=200")
      .then((r) => r.json())
      .then((d) => {
        const all: LayawayRow[] = Array.isArray(d.orders) ? d.orders : []
        setRows(all.filter((o) => o.terminalId === terminalId && o.status === "layaway"))
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open) fetchRows()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function startCollecting(row: LayawayRow) {
    setCollectingId(row.id)
    setAmount(0)
    setReceived(0)
    setMethod("CASH")
    setError("")
  }

  async function submitPayment(row: LayawayRow) {
    if (!sessionId) return
    if (amount <= 0) {
      setError("Indica un monto válido")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/pos/layaways/${row.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          amount,
          method,
          receivedAmount: method === "CASH" ? received : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al registrar el abono")
      setCollectingId(null)
      fetchRows()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="flex items-center gap-2 text-sm" onClick={() => setOpen(true)}>
        <Clock className="h-4 w-4" />
        Apartados
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Apartados de esta terminal</SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay apartados en curso en esta terminal
              </p>
            ) : (
              rows.map((row) => {
                const remaining = row.total - row.totalPaid
                const days = row.holdUntil ? daysRemaining(row.holdUntil) : null
                return (
                  <div key={row.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{row.customer.name}</p>
                        <p className="text-xs text-muted-foreground">Saldo: {formatCOP(remaining)}</p>
                      </div>
                      {row.deliverNow ? (
                        <span className="text-xs text-muted-foreground">Entregado</span>
                      ) : days != null ? (
                        <Badge variant={days <= 0 ? "destructive" : "secondary"} className="text-[10px]">
                          {days <= 0 ? "Vencido" : `${days} días`}
                        </Badge>
                      ) : null}
                    </div>

                    {collectingId === row.id ? (
                      <div className="space-y-2 border-t pt-2">
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <CurrencyInput value={amount} onChange={setAmount} placeholder="Monto del abono" />
                        <Select value={method} onValueChange={(v) => setMethod(v as PosPaymentMethod)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(METHOD_LABELS) as PosPaymentMethod[]).map((m) => (
                              <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {method === "CASH" && (
                          <CurrencyInput value={received} onChange={setReceived} placeholder="Recibido" />
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-xs"
                            onClick={() => setCollectingId(null)}
                            disabled={submitting}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => submitPayment(row)}
                            disabled={submitting || !sessionId}
                          >
                            {submitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => startCollecting(row)}>
                        Cobrar
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
