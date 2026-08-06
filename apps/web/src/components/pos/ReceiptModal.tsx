"use client"

import { Printer, FileDown } from "lucide-react"
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
  storeLogo?: string | null
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

function loadImageAsDataUrl(src: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("no canvas context")); return }
      ctx.drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL("image/png"), width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject
    img.src = src
  })
}

interface Props {
  open: boolean
  onClose: () => void
  data: ReceiptData
}

export function ReceiptModal({ open, onClose, data }: Props) {
  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF({ unit: "mm", format: [80, 200], orientation: "portrait" })

    const margin = 5
    const pageWidth = 80
    let y = margin

    function line(text: string, align: "left" | "center" | "right" = "left", bold = false) {
      doc.setFont("courier", bold ? "bold" : "normal")
      if (align === "center") {
        doc.text(text, pageWidth / 2, y, { align: "center" })
      } else if (align === "right") {
        doc.text(text, pageWidth - margin, y, { align: "right" })
      } else {
        doc.text(text, margin, y)
      }
      y += 4.5
    }

    function row(left: string, right: string, bold = false) {
      doc.setFont("courier", bold ? "bold" : "normal")
      doc.text(left, margin, y)
      doc.text(right, pageWidth - margin, y, { align: "right" })
      y += 4.5
    }

    function dashes() {
      doc.setLineDashPattern([1, 1], 0)
      doc.line(margin, y - 1, pageWidth - margin, y - 1)
      y += 2
    }

    doc.setFontSize(9)

    if (data.storeLogo) {
      try {
        const { dataUrl, width, height } = await loadImageAsDataUrl(data.storeLogo)
        const maxWidth = 40
        const maxHeight = 20
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        const w = width * ratio
        const h = height * ratio
        doc.addImage(dataUrl, "PNG", (pageWidth - w) / 2, y, w, h)
        y += h + 2
      } catch {
        // logo failed to load — fall back to text-only header
      }
    }

    line(data.storeName ?? "GoalKit", "center", true)
    doc.setFontSize(7)
    line(formatDate(data.date), "center")
    line(data.orderNumber, "center", true)
    y += 1
    dashes()

    row("Cliente", data.customerName)
    if (data.terminal) row("Terminal", data.terminal)
    if (data.cashier) row("Cajero/a", data.cashier)
    y += 1
    dashes()

    for (const item of data.items) {
      const total = formatCOP(item.price * item.quantity)
      row(item.name.slice(0, 28), total)
      if (item.variantLabel) line(`  ${item.variantLabel}`)
      line(`  ${item.quantity} x ${formatCOP(item.price)}`)
    }
    y += 1
    dashes()

    row("Subtotal", formatCOP(data.subtotal))
    if (data.tip > 0) row("Propina", formatCOP(data.tip))
    y += 1
    row("TOTAL", formatCOP(data.total), true)
    y += 1
    dashes()

    row("Pago", METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod)
    if (data.receivedAmount != null && data.receivedAmount > 0)
      row("Recibido", formatCOP(data.receivedAmount))
    if (data.change != null && data.change > 0)
      row("Cambio", formatCOP(data.change), true)
    y += 1
    dashes()

    line("¡Gracias por tu compra!", "center")

    doc.save(`recibo-${data.orderNumber}.pdf`)
  }

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
            img { display: block; max-height: 40px; margin: 0 auto 4px; }
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
            {data.storeLogo && (
              // plain <img> (not next/image): this div's innerHTML is copied into a raw document.write() popup in handlePrint()
              <img src={data.storeLogo} alt="" className="mx-auto h-10 w-auto object-contain mb-1" />
            )}
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

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cerrar</Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
