import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET() {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    // Get all stats in parallel
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      revenueData,
      recentOrders,
      ordersByStatus,
      topOrderedRaw,
      outOfStockProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),

      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),

      prisma.order.groupBy({ by: ["status"], _count: true }),

      // Top 5 productos más pedidos por cantidad total
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Top 5 productos sin stock
      prisma.product.findMany({
        where: { stock: 0 },
        take: 5,
        orderBy: { name: "asc" },
        select: { id: true, name: true, stock: true, images: true },
      }),
    ])

    // Resolve product names for top ordered
    const topProductIds = topOrderedRaw
      .filter((r) => r.productId !== null)
      .map((r) => r.productId as string)

    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, images: true },
    })

    const productMap = new Map(topProductDetails.map((p) => [p.id, p]))

    const topOrderedProducts = topOrderedRaw
      .filter((r) => r.productId !== null)
      .map((r) => {
        const product = productMap.get(r.productId as string)
        return {
          id: r.productId as string,
          name: product?.name ?? "Producto eliminado",
          image: product?.images?.[0] ?? null,
          totalOrdered: r._sum.quantity ?? 0,
        }
      })

    // Transform orders by status
    const statusCounts = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count
        return acc
      },
      {} as Record<string, number>
    )

    // Transform recent orders
    const transformedRecentOrders = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.user?.name ?? "Cliente",
      email: order.user?.email ?? "",
      total: Number(order.total),
      status: order.status.toLowerCase(),
      createdAt: order.createdAt.toISOString(),
    }))

    return NextResponse.json({
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue: Number(revenueData._sum.total || 0),
      },
      ordersByStatus: {
        pending: statusCounts.pending || 0,
        processing: statusCounts.processing || 0,
        shipped: statusCounts.shipped || 0,
        delivered: statusCounts.delivered || 0,
        cancelled: statusCounts.cancelled || 0,
      },
      recentOrders: transformedRecentOrders,
      topOrderedProducts,
      outOfStockProducts: outOfStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0] ?? null,
      })),
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Error fetching dashboard stats" },
      { status: 500 }
    )
  }
}
