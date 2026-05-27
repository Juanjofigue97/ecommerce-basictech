import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const slide = await prisma.heroSlide.update({ where: { id }, data: body })
    return NextResponse.json(slide)
  } catch (error) {
    console.error("Error updating hero slide:", error)
    return NextResponse.json({ error: "Error al actualizar el slide" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.heroSlide.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting hero slide:", error)
    return NextResponse.json({ error: "Error al eliminar el slide" }, { status: 500 })
  }
}
