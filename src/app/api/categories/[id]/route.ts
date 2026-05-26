import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformCategory } from "@/lib/transformers"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 })
    }

    return NextResponse.json(transformCategory(category))
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json({ error: "Error fetching category" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        icon: body.icon,
      },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    })

    return NextResponse.json(transformCategory(category))
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Error updating category" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 })
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoria con productos asociados" },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 })
  }
}
