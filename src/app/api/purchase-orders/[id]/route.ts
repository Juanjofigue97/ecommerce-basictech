import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, stock: true } },
            variant: { select: { id: true, label: true, stock: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Orden de compra no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      ...order,
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        unitCost: Number(i.unitCost),
        total: Number(i.total),
      })),
    })
  } catch (error) {
    console.error("Error fetching purchase order:", error)
    return NextResponse.json({ error: "Error fetching purchase order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { variant: { select: { id: true } } } } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Orden de compra no encontrada" }, { status: 404 })
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede modificar una orden cancelada" },
        { status: 400 }
      )
    }

    // When marking as RECEIVED: update each item's quantityReceived and increment stock
    if (body.status === "RECEIVED" && existing.status !== "RECEIVED") {
      await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          const received: number = body.itemsReceived?.[item.id] ?? item.quantity
          await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { quantityReceived: received } })
          if (item.variantId) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: received } } })
            const variants = await tx.productVariant.findMany({ where: { productId: item.productId, isActive: true }, select: { stock: true } })
            await tx.product.update({ where: { id: item.productId }, data: { stock: variants.reduce((s, v) => s + v.stock, 0) } })
          } else {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: received } } })
          }
        }
      })
    }

    // When marking as PARTIAL: update only the diff per item
    if (body.status === "PARTIAL" && body.itemsReceived) {
      await prisma.$transaction(async (tx) => {
        for (const [itemId, qty] of Object.entries(body.itemsReceived as Record<string, number>)) {
          const item = existing.items.find((i) => i.id === itemId)
          if (!item) continue
          const diff = qty - item.quantityReceived
          if (diff <= 0) continue
          await tx.purchaseOrderItem.update({ where: { id: itemId }, data: { quantityReceived: qty } })
          if (item.variantId) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: diff } } })
            const variants = await tx.productVariant.findMany({ where: { productId: item.productId, isActive: true }, select: { stock: true } })
            await tx.product.update({ where: { id: item.productId }, data: { stock: variants.reduce((s, v) => s + v.stock, 0) } })
          } else {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: diff } } })
          }
        }
      })
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
        receivedAt:
          body.status === "RECEIVED" || body.status === "PARTIAL" ? new Date() : undefined,
      },
      include: {
        supplier: { select: { id: true, name: true, nit: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, stock: true } },
            variant: { select: { id: true, label: true, stock: true } },
          },
        },
      },
    })

    return NextResponse.json({
      ...order,
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        unitCost: Number(i.unitCost),
        total: Number(i.total),
      })),
    })
  } catch (error) {
    console.error("Error updating purchase order:", error)
    return NextResponse.json({ error: "Error updating purchase order" }, { status: 500 })
  }
}
