import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { paymentService } from "@/services/payment"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const checksum = request.headers.get("x-event-checksum") ?? ""

    const event = paymentService.parseWebhookEvent(payload, checksum)

    if (!event) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: event.reference },
    })

    if (!order) {
      console.error("Order not found for reference:", event.reference)
      return NextResponse.json({ received: true })
    }

    // Idempotency: Wompi can redeliver the same event, and a PENDING order is
    // the only state that should still be mutated by a webhook.
    if (order.status !== "PENDING") {
      return NextResponse.json({ received: true })
    }

    if (event.type === "payment.completed") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PROCESSING", paymentSessionId: event.transactionId },
        })

        const items = await tx.orderItem.findMany({ where: { orderId: order.id } })

        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            })
            const siblingVariants = await tx.productVariant.findMany({
              where: { productId: item.productId, isActive: true },
              select: { stock: true },
            })
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: siblingVariants.reduce((s, v) => s + v.stock, 0) },
            })
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          }
        }
      })
    } else if (event.type === "payment.failed") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Wompi webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
