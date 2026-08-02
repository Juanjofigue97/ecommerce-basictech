"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { DollarSign, ShoppingCart, Users, Package, ArrowUpRight, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/admin/StatsCard"
import { useAdminStore } from "@/stores/admin-store"
import { useCurrency } from "@/hooks/use-currency"

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1 h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const statusLabels: Record<string, string> = {
  delivered: "Entregado",
  shipped: "Enviado",
  processing: "Procesando",
  cancelled: "Cancelado",
  pending: "Pendiente",
}

export default function AdminDashboard() {
  const { stats, recentOrders, topOrderedProducts, outOfStockProducts, loading, fetchDashboard } = useAdminStore()
  const formatPrice = useCurrency()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading && !stats) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administracion de BasicTechShop
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ingresos Totales"
          value={formatPrice(stats?.totalRevenue || 0)}
          change={0}
          icon={DollarSign}
        />
        <StatsCard
          title="Pedidos"
          value={(stats?.totalOrders || 0).toLocaleString()}
          change={0}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Clientes"
          value={(stats?.totalCustomers || 0).toLocaleString()}
          change={0}
          icon={Users}
        />
        <StatsCard
          title="Productos"
          value={(stats?.totalProducts || 0).toString()}
          change={0}
          icon={Package}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Los ultimos pedidos de tu tienda</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">
                Ver todos
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay pedidos recientes
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {order.customer.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "shipped"
                            ? "secondary"
                            : order.status === "cancelled"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Summary */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Resumen de Pedidos</CardTitle>
            <CardDescription>Estado de los pedidos en tu tienda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pendientes</span>
                <Badge variant="outline">{useAdminStore.getState().ordersByStatus?.pending || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Procesando</span>
                <Badge variant="secondary">{useAdminStore.getState().ordersByStatus?.processing || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enviados</span>
                <Badge variant="secondary">{useAdminStore.getState().ordersByStatus?.shipped || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Entregados</span>
                <Badge variant="default">{useAdminStore.getState().ordersByStatus?.delivered || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelados</span>
                <Badge variant="destructive">{useAdminStore.getState().ordersByStatus?.cancelled || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top ordered products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Productos más pedidos
              </CardTitle>
              <CardDescription>Top 5 por unidades vendidas</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                Ver todos
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topOrderedProducts.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {topOrderedProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={36}
                        height={36}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-sm font-medium">{product.name}</span>
                    <Badge variant="secondary">{product.totalOrdered} uds.</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Out of stock products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Sin stock
              </CardTitle>
              <CardDescription>Productos que necesitan reposición</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                Gestionar
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Todos los productos tienen stock</p>
            ) : (
              <div className="space-y-3">
                {outOfStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={36}
                        height={36}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-sm font-medium">{product.name}</span>
                    <Badge variant="destructive">Sin stock</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
