import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { paymentService } from "@/services/payment"

interface CartItem {
  id: string
  variantId?: string
  quantity: number
}

interface CheckoutBody {
  items: CartItem[]
  shippingAddressId?: string
}

const FREE_SHIPPING_THRESHOLD = 200_000
const STANDARD_SHIPPING = 15_000

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar una compra" },
        { status: 401 }
      )
    }

    const body: CheckoutBody = await request.json()
    const { items, shippingAddressId } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No hay productos en el carrito" }, { status: 400 })
    }
    for (const item of items) {
      if (!item.id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: "Cantidad inválida en el carrito" }, { status: 400 })
      }
    }

    const storeSettings = await prisma.storeSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    })

    if (storeSettings.paymentMethod !== "wompi") {
      return NextResponse.json(
        { error: "El pago en línea no está disponible por ahora. Hacé tu pedido por WhatsApp." },
        { status: 403 }
      )
    }

    // Resolve authoritative price, name and stock from the DB — never trust the client
    const productIds = [...new Set(items.map((i) => i.id))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stock: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const variantIds = items.map((i) => i.variantId).filter((id): id is string => Boolean(id))
    const variants = variantIds.length
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, label: true, price: true, stock: true },
        })
      : []
    const variantMap = new Map(variants.map((v) => [v.id, v]))

    let subtotal = 0
    const resolvedItems: {
      productId: string
      variantId: string | null
      name: string
      unitPrice: number
      quantity: number
    }[] = []

    for (const item of items) {
      const product = productMap.get(item.id)
      if (!product) {
        return NextResponse.json({ error: "Uno de los productos ya no existe" }, { status: 400 })
      }
      const variant = item.variantId ? variantMap.get(item.variantId) : null
      if (item.variantId && !variant) {
        return NextResponse.json({ error: "Una de las variantes ya no existe" }, { status: 400 })
      }

      const availableStock = variant ? variant.stock : product.stock
      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.name}"` },
          { status: 409 }
        )
      }

      const unitPrice = variant?.price != null ? Number(variant.price) : Number(product.price)
      const name = variant?.label ? `${product.name} - ${variant.label}` : product.name
      subtotal += unitPrice * item.quantity
      resolvedItems.push({
        productId: item.id,
        variantId: item.variantId ?? null,
        name,
        unitPrice,
        quantity: item.quantity,
      })
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING
    const total = subtotal + shipping
    const amountInCents = Math.round(total * 100)

    const reference = `BT-${Date.now()}`

    let addressId = shippingAddressId
    if (!addressId) {
      const defaultAddress = await prisma.address.findFirst({
        where: { userId: session.user.id, isDefault: true },
      })
      addressId = defaultAddress?.id
    }

    if (!addressId) {
      return NextResponse.json(
        { error: "Se requiere una dirección de envío" },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        name: session.user.name ?? session.user.email ?? "Cliente",
        email: session.user.email,
        source: "ONLINE",
        userId: session.user.id,
      },
    })

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        userId: session.user.id,
        addressId,
        orderNumber: reference,
        status: "PENDING",
        channel: "ONLINE",
        subtotal,
        shipping,
        total,
        paymentMethod: "Wompi",
        paymentSessionId: reference,
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.unitPrice,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const { url } = await paymentService.createCheckout({
      reference,
      amountInCents,
      currency: "COP",
      customerEmail: session.user.email!,
      redirectUrl: `${appUrl}/checkout/success?reference=${reference}`,
    })

    return NextResponse.json({ url, orderId: order.id })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return NextResponse.json({ error: "Error al procesar el checkout" }, { status: 500 })
  }
}
