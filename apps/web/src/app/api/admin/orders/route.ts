import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: Record<string, unknown> = {}

    if (status && status !== "all") {
      if (status.toLowerCase() === "layaway") {
        // "layaway" isn't a literal OrderStatus — it's a view over every
        // order that is (or ever was) a layaway, regardless of its current
        // status (LAYAWAY, later CONFIRMED once paid off, or CANCELLED).
        where.isLayaway = true
      } else {
        where.status = status.toUpperCase()
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true },
          },
          customer: {
            select: { name: true, phone: true, email: true },
          },
          address: true,
          items: {
            include: {
              product: {
                select: { images: true },
              },
            },
          },
          payments: {
            select: { amount: true },
          },
          terminal: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ])

    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        // POS orders are linked via customerId/customer, not userId — prefer
        // that when present, fall back to the online-order shape (order.user).
        name: order.customer?.name ?? order.user?.name ?? "Cliente",
        email: order.customer?.email ?? order.user?.email ?? "",
        phone: order.customer?.phone ?? "",
      },
      status: order.status.toLowerCase(),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      channel: order.channel,
      isLayaway: order.isLayaway,
      deliverNow: order.deliverNow,
      holdUntil: order.holdUntil ? order.holdUntil.toISOString() : null,
      totalPaid: order.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      terminal: order.terminal ? { name: order.terminal.name } : null,
      terminalId: order.terminalId,
      shippingAddress: order.address ? {
        name: order.address.name,
        address: order.address.address,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode,
      } : null,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
        image: item.product.images[0] || "",
      })),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      orders: transformedOrders,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching admin orders:", error)
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    )
  }
}
