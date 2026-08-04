import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { transformBrand } from "@/lib/transformers"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!brand) return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 })
    return NextResponse.json(transformBrand(brand))
  } catch {
    return NextResponse.json({ error: "Error al obtener la marca" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        logo: body.logo ?? null,
      },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json(transformBrand(brand))
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una marca con ese slug" },
        { status: 409 }
      )
    }
    console.error("Error updating brand:", error)
    return NextResponse.json({ error: "Error al actualizar la marca" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!brand) return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 })
    if (brand._count.products > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${brand._count.products} producto(s) asociado(s)` },
        { status: 409 }
      )
    }
    await prisma.brand.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar la marca" }, { status: 500 })
  }
}
