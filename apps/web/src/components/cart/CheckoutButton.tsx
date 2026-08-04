"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, CreditCard, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"

interface CheckoutButtonProps {
  addressId?: string
  disabled?: boolean
}

export function CheckoutButton({ addressId, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const items = useCartStore((state) => state.items)
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleCheckout = async () => {
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
  )
}
