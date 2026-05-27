"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export interface ReceiptData {
  orderNumber: string
  date: string
  customerName: string
  items: { name: string; variantLabel?: string; quantity: number; price: number }[]
  subtotal: number
  tip: number
  total: number
  paymentMethod: string
  receivedAmount?: number
  change?: number
  terminal?: string
  cashier?: string
  storeName?: string
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta Crédito",
  DEBIT_CARD: "Tarjeta Débito",
  TRANSFER: "Transferencia",
}

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

interface Props {
  open: boolean
  onClose: () => void
  data: ReceiptData
}

export function ReceiptModal({ open, onClose, data }: Props) {
  function handlePrint() {
    const content = document.getElementById("receipt-printable")
    if (!content) return
    const win = window.open("", "", "width=420,height=700")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Recibo ${data.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 300px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .separator { border-top: 1px dashed #000; margin: 6px 0; }
            .total-row { font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wide">Recibo</DialogTitle>
        </DialogHeader>

        {/* Receipt content */}
        <div id="receipt-printable" className="font-mono text-xs space-y-1">
          {/* Header */}
          <div className="text-center space-y-0.5 pb-2">
            <p className="font-bold text-base">{data.storeName ?? "GoalKit"}</p>
            <p className="text-muted-foreground">{formatDate(data.date)}</p>
            <p className="font-semibold">{data.orderNumber}</p>
          </div>

          <Separator className="border-dashed" />

          {/* Customer / terminal */}
          <div className="py-1 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{data.customerName}</span>
            </div>
            {data.terminal && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terminal</span>
                <span>{data.terminal}</span>
              </div>
            )}
            {data.cashier && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cajero/a</span>
                <span>{data.cashier}</span>
              </div>
            )}
          </div>

          <Separator className="border-dashed" />

          {/* Items */}
          <div className="py-1 space-y-1">
            {data.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="truncate max-w-[160px]">{item.name}</span>
                  <span className="font-medium">{formatCOP(item.price * item.quantity)}</span>
                </div>
                {item.variantLabel && (
                  <span className="text-muted-foreground pl-2">{item.variantLabel}</span>
                )}
                <div className="text-muted-foreground pl-2">
                  {item.quantity} × {formatCOP(item.price)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="border-dashed" />

          {/* Totals */}
          <div className="py-1 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCOP(data.subtotal)}</span>
            </div>
            {data.tip > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Propina</span>
                <span>{formatCOP(data.tip)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-0.5">
              <span>TOTAL</span>
              <span>{formatCOP(data.total)}</span>
            </div>
          </div>

          <Separator className="border-dashed" />

          {/* Payment */}
          <div className="py-1 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago</span>
              <span>{METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod}</span>
            </div>
            {data.receivedAmount != null && data.receivedAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recibido</span>
                <span>{formatCOP(data.receivedAmount)}</span>
              </div>
            )}
            {data.change != null && data.change > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Cambio</span>
                <span>{formatCOP(data.change)}</span>
              </div>
            )}
          </div>

          <Separator className="border-dashed" />
          <p className="text-center text-muted-foreground pt-1">¡Gracias por tu compra!</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cerrar</Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
