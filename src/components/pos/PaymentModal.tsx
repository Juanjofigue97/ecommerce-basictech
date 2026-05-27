"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { CurrencyInput } from "@/components/ui/currency-input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "TRANSFER"

interface Props {
  open: boolean
  onClose: () => void
  subtotal: number
  onConfirm: (data: {
    paymentMethod: PaymentMethod
    tip: number
    total: number
    receivedAmount?: number
  }) => Promise<void>
}

const TIP_OPTIONS = [0, 5, 10, 15, 20]

const METHOD_LABELS: Record<PaymentMethod, string> = {
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

export function PaymentModal({ open, onClose, subtotal, onConfirm }: Props) {
  const [withTip, setWithTip] = useState(false)
  const [tipPct, setTipPct] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [received, setReceived] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setWithTip(false)
      setTipPct(0)
      setMethod("CASH")
      setReceived("")
      setError("")
    }
  }, [open])

  const tipAmount = withTip ? Math.round((subtotal * tipPct) / 100) : 0
  const total = subtotal + tipAmount
  const receivedNum = received === "" ? 0 : Number(received)
  const change = method === "CASH" ? receivedNum - total : 0

  async function handleConfirm() {
    if (method === "CASH" && receivedNum < total) {
      setError("El dinero recibido es insuficiente")
      return
    }
    setLoading(true)
    setError("")
    try {
      await onConfirm({
        paymentMethod: method,
        tip: tipAmount,
        total,
        receivedAmount: method === "CASH" ? receivedNum : undefined,
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wide text-sm">Recibir Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Total</Label>
            <div className="flex items-center justify-end rounded-md border bg-muted/40 px-3 py-2 text-lg font-bold">
              {formatCOP(total)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Propina</Label>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">con propina</span>
                <Switch checked={withTip} onCheckedChange={setWithTip} />
              </div>
            </div>
            {withTip && (
              <div className="flex items-center gap-3">
                <Select value={String(tipPct)} onValueChange={(v) => setTipPct(Number(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIP_OPTIONS.map((p) => (
                      <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm font-medium">{formatCOP(tipAmount)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Medio de pago</Label>
            <Select value={method} onValueChange={(v) => { setMethod(v as PaymentMethod); setReceived("") }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {method === "CASH" && (
            <>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Dinero recibido
                </Label>
                <CurrencyInput
                  value={receivedNum}
                  onChange={(n) => setReceived(n > 0 ? String(n) : "")}
                  placeholder="$ 0"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Cambio
                </span>
                <span
                  className={`text-xl font-bold ${
                    change >= 0 ? "text-foreground" : "text-destructive"
                  }`}
                >
                  {formatCOP(Math.max(change, 0))}
                </span>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
