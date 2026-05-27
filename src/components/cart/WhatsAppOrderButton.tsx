"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"
import { useAdminStore } from "@/stores/admin-store"
import { useEffect } from "react"
import { formatCurrency } from "@/lib/format-currency"

function buildMessage(
  items: ReturnType<typeof useCartStore.getState>["items"],
  currency: string
): string {
  const fmt = (n: number) => formatCurrency(n, currency)

  const lines = items.map((item) => {
    const price = item.variantPrice ?? item.product.price
    const label = item.variantLabel ? ` (${item.variantLabel})` : ""
    return `• ${item.product.name}${label} x${item.quantity} — ${fmt(price * item.quantity)}`
  })

  const subtotal = items.reduce(
    (acc, item) => acc + (item.variantPrice ?? item.product.price) * item.quantity,
    0
  )

  return [
    "¡Hola! Me gustaría hacer el siguiente pedido:",
    "",
    ...lines,
    "",
    `*Total: ${fmt(subtotal)}*`,
    "",
    "¿Me pueden confirmar disponibilidad y forma de pago? ¡Gracias!",
  ].join("\n")
}

function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-().+]/g, "")
}

export function WhatsAppOrderButton() {
  const items = useCartStore((s) => s.items)
  const settings = useAdminStore((s) => s.settings)
  const fetchSettings = useAdminStore((s) => s.fetchSettings)

  useEffect(() => {
    if (!settings) fetchSettings()
  }, [settings, fetchSettings])

  if (!settings?.phone || items.length === 0) return null

  const handleClick = () => {
    const phone = cleanPhone(settings.phone)
    const text = buildMessage(items, settings.currency ?? "cop")
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      variant="outline"
      className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-600 dark:text-green-500 dark:hover:bg-green-950"
      size="lg"
      onClick={handleClick}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Pedir por WhatsApp
    </Button>
  )
}
