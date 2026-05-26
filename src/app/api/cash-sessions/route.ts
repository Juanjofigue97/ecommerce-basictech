import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const terminalId = searchParams.get("terminalId")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (terminalId) where.terminalId = terminalId
    if (userId) where.userId = userId
    if (status) where.status = status.toUpperCase()

    const sessions = await prisma.cashSession.findMany({
      where,
      include: {
        terminal: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { openedAt: "desc" },
    })

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        status: s.status,
        openedAt: s.openedAt.toISOString(),
        closedAt: s.closedAt?.toISOString() ?? null,
        openingBalance: Number(s.openingBalance),
        closingBalance: s.closingBalance ? Number(s.closingBalance) : null,
        expectedBalance: s.expectedBalance ? Number(s.expectedBalance) : null,
        observations: s.observations,
        terminal: s.terminal,
        user: s.user,
        orderCount: s._count.orders,
      }))
    )
  } catch {
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.terminalId) return NextResponse.json({ error: "La terminal es requerida" }, { status: 400 })
    if (!body.userId) return NextResponse.json({ error: "El responsable es requerido" }, { status: 400 })

    const existing = await prisma.cashSession.findFirst({
      where: { terminalId: body.terminalId, status: "OPEN" },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Esta terminal ya tiene una sesión abierta" },
        { status: 409 }
      )
    }

    const session = await prisma.cashSession.create({
      data: {
        terminalId: body.terminalId,
        userId: body.userId,
        openingBalance: body.openingBalance ?? 0,
      },
      include: {
        terminal: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
    })

    return NextResponse.json(
      {
        id: session.id,
        status: session.status,
        openedAt: session.openedAt.toISOString(),
        closedAt: null,
        openingBalance: Number(session.openingBalance),
        closingBalance: null,
        expectedBalance: null,
        observations: null,
        terminal: session.terminal,
        user: session.user,
        orderCount: 0,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Error al abrir la sesión" }, { status: 500 })
  }
}
