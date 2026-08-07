"use client"

import { useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { CartItem } from "@/types"
import { CheckoutButton } from "./CheckoutButton"
import { WhatsAppOrderButton } from "./WhatsAppOrderButton"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/stores/settings-store"

interface CartSummaryProps {
  items: CartItem[]
}

export function CartSummary({ items }: CartSummaryProps) {
  const formatPrice = useCurrency()
  const settings = useSettingsStore((s) => s.settings)
  const fetchSettings = useSettingsStore((s) => s.fetchSettings)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const isWompi = settings?.paymentMethod === "wompi"
  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  )
  const total = subtotal

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Resumen del Pedido</h2>

      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isWompi && <CheckoutButton />}
        <WhatsAppOrderButton />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {isWompi
          ? "Pago seguro con Wompi. Impuestos incluidos."
          : "Coordinamos el pago por WhatsApp al confirmar tu pedido."}
      </p>
    </div>
  )
}
