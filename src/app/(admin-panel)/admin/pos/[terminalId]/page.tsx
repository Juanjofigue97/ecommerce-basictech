"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search, ArrowLeft, UserRound, Minus, Plus, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePOSStore } from "@/stores/pos-store"
import { CustomerModal } from "@/components/pos/CustomerModal"
import { PaymentModal } from "@/components/pos/PaymentModal"
import type { Product } from "@/types"

interface Category {
  id: string
  name: string
  slug: string
}

interface ActiveSession {
  id: string
  userId: string
  terminal: { id: string; name: string }
  user: { id: string; name: string }
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n)
}

export default function POSPage() {
  const { terminalId } = useParams<{ terminalId: string }>()
  const router = useRouter()

  const {
    terminalId: ctxTerminalId, sessionId, customerId, customerName,
    items, delivery,
    setContext, setCustomer, addItem, removeItem, updateQuantity, clearCart, setDelivery,
  } = usePOSStore()

  const [session, setSession] = useState<ActiveSession | null>(null)
  const [sessionError, setSessionError] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [showCustomer, setShowCustomer] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")
  const [, setDefaultCustomerId] = useState("")

  // Load active session for this terminal
  useEffect(() => {
    fetch(`/api/cash-sessions?terminalId=${terminalId}&status=OPEN`)
      .then((r) => r.json())
      .then((data: ActiveSession[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          setSessionError("Esta terminal no tiene una sesión activa. Abre una sesión primero.")
          return
        }
        const s = data[0]
        setSession(s)
        if (ctxTerminalId !== terminalId) {
          setContext(terminalId, s.id, s.userId)
          clearCart()
        }
      })
      .catch(() => setSessionError("Error al cargar la sesión"))
  }, [terminalId, ctxTerminalId, setContext, clearCart])

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]))
  }, [])

  // Load default "Consumidor Final" customer
  useEffect(() => {
    fetch("/api/customers?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.customers) ? d.customers : []
        const consumidorFinal = list.find((c: { name: string; id: string }) =>
          c.name.toLowerCase().includes("consumidor final")
        )
        if (consumidorFinal && !customerId) {
          setCustomer(consumidorFinal.id, consumidorFinal.name)
          setDefaultCustomerId(consumidorFinal.id)
        }
      })
      .catch(() => {})
  }, [customerId, setCustomer])

  // Fetch products (debounced on search)
  const fetchProducts = useCallback(() => {
    setLoadingProducts(true)
    const params = new URLSearchParams({ limit: "300" })
    if (search) params.set("search", search)
    if (categoryFilter !== "all") params.set("category", categoryFilter)
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [search, categoryFilter])

  useEffect(() => {
    const t = setTimeout(fetchProducts, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchProducts])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  async function handleCheckout(paymentData: {
    paymentMethod: string
    tip: number
    total: number
    receivedAmount?: number
  }) {
    if (!session || !sessionId) throw new Error("Sin sesión activa")
    if (!customerId) throw new Error("Selecciona un cliente")

    const res = await fetch("/api/pos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalId,
        sessionId,
        customerId,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        paymentMethod: paymentData.paymentMethod,
        subtotal,
        tip: paymentData.tip,
        total: paymentData.total,
        receivedAmount: paymentData.receivedAmount,
        delivery: delivery || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? "Error al procesar la venta")
    }

    clearCart()
    fetchProducts()
  }

  if (sessionError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground text-center max-w-sm">{sessionError}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/pos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Volver
          </Button>
          <Button onClick={() => router.push("/admin/cash-sessions/new")}>
            Abrir sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-4 lg:-m-6 flex flex-col" style={{ height: "100svh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">
          {session?.terminal.name ?? "Caja"}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex items-center gap-2 text-sm"
          onClick={() => setShowCustomer(true)}
        >
          <UserRound className="h-4 w-4" />
          {customerName}
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Products */}
        <div className="flex flex-1 flex-col overflow-hidden border-r">
          {/* Search + filters */}
          <div className="shrink-0 border-b p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearch("")}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                  categoryFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.slug)}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                    categoryFilter === c.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron productos
              </div>
            ) : (
              <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                {products.map((product) => {
                  const outOfStock = product.stock === 0
                  return (
                    <button
                      key={product.id}
                      disabled={outOfStock}
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          name: product.name,
                          slug: product.slug,
                          price: product.price,
                          stock: product.stock,
                        })
                      }
                      className={`relative flex flex-col items-start rounded border p-2 text-left text-sm transition-all ${
                        outOfStock
                          ? "bg-destructive/10 border-destructive/20 cursor-not-allowed opacity-70"
                          : "bg-card hover:border-primary hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      {outOfStock && (
                        <Badge variant="destructive" className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0">
                          Sin stock
                        </Badge>
                      )}
                      <span className="text-xs text-primary font-mono leading-tight truncate w-full">
                        {product.slug}
                      </span>
                      <span className="font-medium leading-tight mt-0.5 line-clamp-2 text-xs">
                        {product.name}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground font-medium">
                        {formatCOP(product.price)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Cart */}
        <div className="flex w-[320px] shrink-0 flex-col bg-card">
          {/* Cart header */}
          <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
            <span className="font-semibold text-sm">Productos agregados</span>
            <span className="font-bold text-base">{formatCOP(subtotal)}</span>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No se encontraron productos agregados
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Nombre</th>
                    <th className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Cantidad</th>
                    <th className="text-right px-3 py-1.5 text-xs font-medium text-muted-foreground">Precio</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.productId}-${item.variantId ?? ""}`} className="border-b">
                      <td className="px-3 py-2">
                        <div className="text-xs font-mono text-muted-foreground">{item.slug}</div>
                        <div className="font-medium leading-tight text-xs">{item.name}</div>
                        {item.variantLabel && (
                          <div className="text-xs text-muted-foreground">{item.variantLabel}</div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            className="flex h-5 w-5 items-center justify-center rounded border bg-background hover:bg-muted"
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            className="flex h-5 w-5 items-center justify-center rounded border bg-background hover:bg-muted"
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">
                        {formatCOP(item.price * item.quantity)}
                      </td>
                      <td className="pr-1">
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.productId, item.variantId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Delivery + actions */}
          <div className="shrink-0 border-t p-3 space-y-2">
            {checkoutError && (
              <p className="text-xs text-destructive">{checkoutError}</p>
            )}
            <Input
              placeholder="Domicilio"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => { clearCart(); setCheckoutError("") }}
                disabled={items.length === 0}
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  if (!items.length) { setCheckoutError("Agrega productos primero"); return }
                  if (!customerId) { setCheckoutError("Selecciona un cliente"); return }
                  setCheckoutError("")
                  setShowPayment(true)
                }}
              >
                Facturar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CustomerModal
        open={showCustomer}
        onClose={() => setShowCustomer(false)}
        onSelect={setCustomer}
        currentCustomerId={customerId}
      />

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        subtotal={subtotal}
        onConfirm={handleCheckout}
      />
    </div>
  )
}
