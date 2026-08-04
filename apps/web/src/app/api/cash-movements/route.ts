import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}
    if (sessionId) where.sessionId = sessionId
    if (type) where.type = type.toUpperCase()

    const movements = await prisma.cashMovement.findMany({
      where,
      include: {
        session: {
          select: { id: true, terminal: { select: { id: true, name: true } } },
        },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: Number(m.amount),
        concept: m.concept,
        createdAt: m.createdAt.toISOString(),
        session: { id: m.session.id, terminal: m.session.terminal },
        user: m.user,
      }))
    )
  } catch {
    return NextResponse.json({ error: "Error al obtener los movimientos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()

    if (!body.sessionId) return NextResponse.json({ error: "La sesión es requerida" }, { status: 400 })
    if (!body.userId) return NextResponse.json({ error: "El usuario es requerido" }, { status: 400 })
    if (!body.concept?.trim()) return NextResponse.json({ error: "El concepto es requerido" }, { status: 400 })
    if (!body.type || !["INCOME", "EXPENSE"].includes(body.type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }
    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 })
    }

    const session = await prisma.cashSession.findUnique({ where: { id: body.sessionId } })
    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "No se puede registrar movimientos en una sesión cerrada" }, { status: 409 })
    }

    const movement = await prisma.cashMovement.create({
      data: {
        sessionId: body.sessionId,
        userId: body.userId,
        type: body.type,
        amount: body.amount,
        concept: body.concept.trim(),
      },
      include: {
        session: {
          select: { id: true, terminal: { select: { id: true, name: true } } },
        },
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        id: movement.id,
        type: movement.type,
        amount: Number(movement.amount),
        concept: movement.concept,
        createdAt: movement.createdAt.toISOString(),
        session: { id: movement.session.id, terminal: movement.session.terminal },
        user: movement.user,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Error al registrar el movimiento" }, { status: 500 })
  }
}
