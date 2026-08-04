import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/api-auth"

interface Params {
  params: Promise<{ id: string; valueId: string }>
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { valueId } = await params
    const { value, slug } = await request.json()

    const attributeValue = await prisma.attributeValue.update({
      where: { id: valueId },
      data: { value, slug },
    })

    return NextResponse.json(attributeValue)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un valor con ese slug para este atributo" },
        { status: 409 }
      )
    }
    console.error("Error updating attribute value:", error)
    return NextResponse.json({ error: "Error updating attribute value" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { valueId } = await params

    const attrValue = await prisma.attributeValue.findUnique({
      where: { id: valueId },
      include: { _count: { select: { products: true } } },
    })

    if (!attrValue) {
      return NextResponse.json({ error: "Valor no encontrado" }, { status: 404 })
    }

    if (attrValue._count.products > 0) {
      return NextResponse.json(
        { error: "Este valor está siendo usado por productos" },
        { status: 400 }
      )
    }

    await prisma.attributeValue.delete({ where: { id: valueId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attribute value:", error)
    return NextResponse.json({ error: "Error deleting attribute value" }, { status: 500 })
  }
}
