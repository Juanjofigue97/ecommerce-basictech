import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

interface CheckoutItem {
  productId: string
  variantId?: string
  quantity: number
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const { terminalId, sessionId, customerId, items, paymentMethod, tip, receivedAmount, delivery } = body

    if (!terminalId || !sessionId || !customerId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }
    if (!items?.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const rawItems = items as CheckoutItem[]
    for (const item of rawItems) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: "Cantidad inválida en el carrito" }, { status: 400 })
      }
    }

    const session = await prisma.cashSession.findUnique({ where: { id: sessionId } })
    if (!session || session.status === "CLOSED") {
      return NextResponse.json({ error: "La sesión de caja está cerrada" }, { status: 409 })
    }

    // Resolve authoritative price/name from the DB — never trust client-supplied prices
    const productIds = [...new Set(rawItems.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const variantIds = rawItems.map((i) => i.variantId).filter((id): id is string => Boolean(id))
    const variants = variantIds.length
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, label: true, price: true },
        })
      : []
    const variantMap = new Map(variants.map((v) => [v.id, v]))

    let subtotal = 0
    const resolvedItems = rawItems.map((item) => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error(`ITEM_NOT_FOUND`)
      const variant = item.variantId ? variantMap.get(item.variantId) : null
      if (item.variantId && !variant) throw new Error(`ITEM_NOT_FOUND`)
      const unitPrice = variant?.price != null ? Number(variant.price) : Number(product.price)
      const name = variant?.label ? `${product.name} - ${variant.label}` : product.name
      subtotal += unitPrice * item.quantity
      return { ...item, unitPrice, name }
    })

    const tipAmount = Number(tip) > 0 ? Number(tip) : 0
    const total = subtotal + tipAmount

    if (paymentMethod === "CASH" && receivedAmount != null && Number(receivedAmount) < total) {
      return NextResponse.json({ error: "El monto recibido es insuficiente" }, { status: 400 })
    }

    const count = await prisma.order.count()
    const orderNumber = `POS-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`

    const result = await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: the session could have just closed
      const freshSession = await tx.cashSession.findUnique({ where: { id: sessionId } })
      if (!freshSession || freshSession.status === "CLOSED") {
        throw new Error("SESSION_CLOSED")
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: "POS",
          status: "CONFIRMED",
          subtotal,
          shipping: 0,
          tip: tipAmount,
          total,
          paymentMethod,
          notes: delivery || null,
          customerId,
          cashierId: freshSession.userId,
          terminalId,
          sessionId,
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              name: item.name,
              price: item.unitPrice,
              quantity: item.quantity,
              total: item.unitPrice * item.quantity,
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
          tip: tipAmount,
          receivedAmount: receivedAmount ?? null,
          change: receivedAmount != null ? receivedAmount - total : null,
        },
      })

      for (const item of resolvedItems) {
        if (item.variantId) {
          const decremented = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (decremented.count === 0) {
            throw new Error(`OUT_OF_STOCK:${item.name}`)
          }
          const siblingVariants = await tx.productVariant.findMany({
            where: { productId: item.productId, isActive: true },
            select: { stock: true },
          })
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: siblingVariants.reduce((s, v) => s + v.stock, 0) },
          })
        } else {
          const decremented = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (decremented.count === 0) {
            throw new Error(`OUT_OF_STOCK:${item.name}`)
          }
        }
      }

      return order
    })

    return NextResponse.json({ orderId: result.id, orderNumber: result.orderNumber }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${error.message.split(":")[1]}"` },
        { status: 409 }
      )
    }
    if (error instanceof Error && error.message === "SESSION_CLOSED") {
      return NextResponse.json({ error: "La sesión de caja está cerrada" }, { status: 409 })
    }
    if (error instanceof Error && error.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Uno de los productos ya no existe" }, { status: 400 })
    }
    console.error("POS checkout error:", error)
    return NextResponse.json({ error: "Error al procesar la venta" }, { status: 500 })
  }
}
