import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const supplierId = searchParams.get("supplierId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, nit: true } },
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, images: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit ? Number(limit) : undefined,
        skip: offset ? Number(offset) : undefined,
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    const mapped = orders.map((o) => ({
      ...o,
      total: Number(o.total),
      items: o.items.map((i) => ({
        ...i,
        unitCost: Number(i.unitCost),
        total: Number(i.total),
      })),
    }))

    return NextResponse.json({ orders: mapped, total })
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    return NextResponse.json({ error: "Error fetching purchase orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items = body.items as { productId: string; quantity: number; unitCost: number }[]

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
    const orderNumber = `PO-${Date.now()}`

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        total,
        notes: body.notes,
        supplierId: body.supplierId,
        createdById: body.createdById,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true, nit: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
      },
    })

    return NextResponse.json(
      {
        ...order,
        total: Number(order.total),
        items: order.items.map((i) => ({
          ...i,
          unitCost: Number(i.unitCost),
          total: Number(i.total),
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating purchase order:", error)
    return NextResponse.json({ error: "Error creating purchase order" }, { status: 500 })
  }
}
