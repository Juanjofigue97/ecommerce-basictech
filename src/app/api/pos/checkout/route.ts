import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { terminalId, sessionId, customerId, items, paymentMethod, subtotal, tip, total, receivedAmount, delivery } = body

    if (!terminalId || !sessionId || !customerId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }
    if (!items?.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const session = await prisma.cashSession.findUnique({ where: { id: sessionId } })
    if (!session || session.status === "CLOSED") {
      return NextResponse.json({ error: "La sesión de caja está cerrada" }, { status: 409 })
    }

    const count = await prisma.order.count()
    const orderNumber = `POS-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: "POS",
          status: "CONFIRMED",
          subtotal,
          shipping: 0,
          tip: tip ?? 0,
          total,
          paymentMethod,
          notes: delivery || null,
          customerId,
          cashierId: session.userId,
          terminalId,
          sessionId,
          items: {
            create: items.map((item: { productId: string; variantId?: string; name: string; price: number; quantity: number }) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })),
          },
        },
      })

      await tx.payment.create({
        data: {
          orderId: order.id,
          sessionId,
          method: paymentMethod,
          amount: total,
          tip: tip ?? 0,
          receivedAmount: receivedAmount ?? null,
          change: receivedAmount != null ? receivedAmount - total : null,
        },
      })

      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return order
    })

    return NextResponse.json({ orderId: result.id, orderNumber: result.orderNumber }, { status: 201 })
  } catch (error) {
    console.error("POS checkout error:", error)
    return NextResponse.json({ error: "Error al procesar la venta" }, { status: 500 })
  }
}
