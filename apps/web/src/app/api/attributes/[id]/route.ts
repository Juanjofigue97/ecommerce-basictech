import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        values: { orderBy: { value: "asc" } },
        _count: { select: { values: true } },
      },
    })

    if (!attribute) {
      return NextResponse.json({ error: "Atributo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(attribute)
  } catch (error) {
    console.error("Error fetching attribute:", error)
    return NextResponse.json({ error: "Error fetching attribute" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { name, slug } = await request.json()

    const attribute = await prisma.attribute.update({
      where: { id },
      data: { name, slug },
      include: {
        values: { orderBy: { value: "asc" } },
        _count: { select: { values: true } },
      },
    })

    return NextResponse.json(attribute)
  } catch (error) {
    console.error("Error updating attribute:", error)
    return NextResponse.json({ error: "Error updating attribute" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        values: { include: { _count: { select: { products: true } } } },
      },
    })

    if (!attribute) {
      return NextResponse.json({ error: "Atributo no encontrado" }, { status: 404 })
    }

    const usedByProducts = attribute.values.some((v) => v._count.products > 0)
    if (usedByProducts) {
      return NextResponse.json(
        { error: "No se puede eliminar un atributo que está en uso por productos" },
        { status: 400 }
      )
    }

    await prisma.attribute.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attribute:", error)
    return NextResponse.json({ error: "Error deleting attribute" }, { status: 500 })
  }
}
