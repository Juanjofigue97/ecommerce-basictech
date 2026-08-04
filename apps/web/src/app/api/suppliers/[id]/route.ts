import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/api-auth"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        _count: { select: { purchaseOrders: true } },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...supplier,
      purchaseOrders: supplier.purchaseOrders.map((o) => ({
        ...o,
        total: Number(o.total),
      })),
    })
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json({ error: "Error fetching supplier" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        nit: body.nit,
        name: body.name,
        phone: body.phone,
        address: body.address,
        type: body.type,
        status: body.status,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un proveedor con ese NIT" }, { status: 409 })
    }
    console.error("Error updating supplier:", error)
    return NextResponse.json({ error: "Error updating supplier" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true } } },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    if (supplier._count.purchaseOrders > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un proveedor con órdenes de compra asociadas" },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Error deleting supplier" }, { status: 500 })
  }
}
