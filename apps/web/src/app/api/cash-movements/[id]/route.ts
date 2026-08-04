import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const movement = await prisma.cashMovement.findUnique({
      where: { id },
      include: { session: { select: { status: true } } },
    })
    if (!movement) return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    if (movement.session.status === "CLOSED") {
      return NextResponse.json(
        { error: "No se puede eliminar un movimiento de una sesión cerrada" },
        { status: 409 }
      )
    }
    await prisma.cashMovement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar el movimiento" }, { status: 500 })
  }
}
