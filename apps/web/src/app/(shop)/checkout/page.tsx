"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, MapPin, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckoutButton } from "@/components/cart/CheckoutButton"
import { OrderSummary } from "@/components/checkout/OrderSummary"
import { useCartStore } from "@/stores/cart-store"
import { useUserStore } from "@/stores/user-store"

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const { addresses, loading, fetchAddresses } = useUserStore()
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [addressesSnapshot, setAddressesSnapshot] = useState(addresses)

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  // Pick a default selected address once addresses load, without setState-in-effect
  // (see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  if (addresses !== addressesSnapshot) {
    setAddressesSnapshot(addresses)
    if (addresses.length > 0 && !addresses.some((a) => a.id === selectedAddressId)) {
      setSelectedAddressId((addresses.find((a) => a.isDefault) ?? addresses[0]).id)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-2 mb-4">
          <Link href="/cart">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al Carrito
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Tu carrito está vacío.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de Envío
                </h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile/addresses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva dirección
                  </Link>
                </Button>
              </div>

              {loading && addresses.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No tenés direcciones guardadas. Agregá una para poder continuar.
                </p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        selectedAddressId === address.id
                          ? "border-primary ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressId"
                        className="mt-1"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                      <div className="text-sm">
                        <p className="font-medium">{address.label}</p>
                        <p className="text-muted-foreground">{address.name}</p>
                        <p className="text-muted-foreground">{address.address}</p>
                        <p className="text-muted-foreground">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-muted-foreground">{address.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <OrderSummary items={items} />
              <CheckoutButton addressId={selectedAddressId} disabled={!selectedAddressId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
