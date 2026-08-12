import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { select: { productId: true, variantId: true, quantity: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: "El apartado no existe" }, { status: 404 })
    }
    if (order.status !== "LAYAWAY") {
      return NextResponse.json({ error: "Solo se pueden cancelar apartados en curso" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // This restocks the held merchandise only — it does NOT touch or
      // refund existing Payment rows. That money was already collected and
      // reconciles with its cash session; refunding it, if the store
      // chooses to, is a manual/cash operation outside this system.
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
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
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Layaway cancel error:", error)
    return NextResponse.json({ error: "Error al cancelar el apartado" }, { status: 500 })
  }
}
