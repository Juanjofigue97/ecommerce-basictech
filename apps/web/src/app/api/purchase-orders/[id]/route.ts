import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

interface Params {
  params: Promise<{ id: string }>
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ORDERED", "CANCELLED"],
  ORDERED: ["PARTIAL", "RECEIVED", "CANCELLED"],
  PARTIAL: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

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
  const { response: authError } = await requireAdmin()
  if (authError) return authError

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

    const isStatusChange = typeof body.status === "string" && body.status !== existing.status

    if (isStatusChange) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `No se puede pasar de "${existing.status}" a "${body.status}"` },
          { status: 400 }
        )
      }
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        if (isStatusChange) {
          // Atomic claim: only proceeds if status still matches what we read above.
          // A concurrent request that already changed the status will find 0 rows
          // and abort here, so stock is never incremented twice for the same receipt.
          const claim = await tx.purchaseOrder.updateMany({
            where: { id, status: existing.status },
            data: {
              status: body.status,
              notes: body.notes,
              receivedAt:
                body.status === "RECEIVED" || body.status === "PARTIAL" ? new Date() : undefined,
            },
          })
          if (claim.count === 0) {
            throw new Error("PO_CONFLICT")
          }

          if (body.status === "RECEIVED") {
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
          } else if (body.status === "PARTIAL" && body.itemsReceived) {
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
          }
        } else {
          await tx.purchaseOrder.update({ where: { id }, data: { notes: body.notes } })
        }

        return tx.purchaseOrder.findUniqueOrThrow({
          where: { id },
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
    } catch (txError) {
      if (txError instanceof Error && txError.message === "PO_CONFLICT") {
        return NextResponse.json(
          { error: "La orden ya fue actualizada por otra solicitud. Recargá la página e intentá de nuevo." },
          { status: 409 }
        )
      }
      throw txError
    }
  } catch (error) {
    console.error("Error updating purchase order:", error)
    return NextResponse.json({ error: "Error updating purchase order" }, { status: 500 })
  }
}
