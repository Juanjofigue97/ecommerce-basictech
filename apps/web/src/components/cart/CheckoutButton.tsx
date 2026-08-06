"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, CreditCard, LogIn, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCartStore } from "@/stores/cart-store"
import { useSettingsStore } from "@/stores/settings-store"

interface CheckoutButtonProps {
  addressId?: string
  disabled?: boolean
}

export function CheckoutButton({ addressId, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [unavailableOpen, setUnavailableOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const { data: session, status } = useSession()
  const router = useRouter()
  const settings = useSettingsStore((state) => state.settings)
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const isManual = settings?.paymentMethod === "manual"

  const handleCheckout = async () => {
    if (isManual) {
      setUnavailableOpen(true)
      return
    }

    if (!session) {
      router.push("/login?callbackUrl=/cart")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.product.id,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          shippingAddressId: addressId,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? "No checkout URL returned")
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      alert("Error al procesar el pago. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || status === "loading"

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={isLoading || items.length === 0 || disabled}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : isManual ? (
          <>
            <Ban className="mr-2 h-4 w-4" />
            Pago no disponible
          </>
        ) : !session ? (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar sesión para pagar
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar con Wompi
          </>
        )}
      </Button>

      <Dialog open={unavailableOpen} onOpenChange={setUnavailableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago no disponible</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Por ahora solo podés hacer tu pedido por WhatsApp. Usá el botón de abajo para
            coordinar tu compra.
          </p>
          <Button onClick={() => setUnavailableOpen(false)} className="w-full">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
