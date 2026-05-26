import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { paymentService } from "@/services/payment"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
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

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING
    const total = subtotal + shipping
    const amountInCents = Math.round(total * 100)

    const reference = `BT-${Date.now()}`

    const productIds = items.map((i) => i.id)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })

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

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        addressId,
        orderNumber: reference,
        status: "PENDING",
        subtotal,
        shipping,
        total,
        paymentMethod: "Wompi",
        paymentSessionId: reference,
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.id)
            return {
              productId: item.id,
              name: product?.name ?? item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            }
          }),
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
