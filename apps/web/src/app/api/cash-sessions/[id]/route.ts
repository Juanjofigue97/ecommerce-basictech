import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params

    const session = await prisma.cashSession.findUnique({
      where: { id },
      include: {
        terminal: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        payments: true,
        movements: true,
        orders: { select: { total: true, tip: true } },
      },
    })

    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })

    const paymentsByMethod = {
      CASH: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      TRANSFER: 0,
    }
    for (const p of session.payments) {
      paymentsByMethod[p.method] = (paymentsByMethod[p.method] ?? 0) + Number(p.amount)
    }

    const totalTips = session.payments.reduce((s, p) => s + Number(p.tip), 0)
    const totalEgresos = session.movements
      .filter((m) => m.type === "EXPENSE")
      .reduce((s, m) => s + Number(m.amount), 0)
    const totalIngresos = session.movements
      .filter((m) => m.type === "INCOME")
      .reduce((s, m) => s + Number(m.amount), 0)
    const totalSales = session.orders.reduce((s, o) => s + Number(o.total), 0)
    const expectedBalance =
      Number(session.openingBalance) + paymentsByMethod.CASH + totalIngresos - totalEgresos

    return NextResponse.json({
      id: session.id,
      status: session.status,
      openedAt: session.openedAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
      openingBalance: Number(session.openingBalance),
      closingBalance: session.closingBalance ? Number(session.closingBalance) : null,
      expectedBalance: session.expectedBalance
        ? Number(session.expectedBalance)
        : expectedBalance,
      observations: session.observations,
      terminal: session.terminal,
      user: session.user,
      paymentsByMethod,
      totalTips,
      totalEgresos,
      totalIngresos,
      totalSales,
    })
  } catch {
    return NextResponse.json({ error: "Error al obtener la sesión" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.cashSession.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    if (existing.status === "CLOSED") {
      return NextResponse.json({ error: "La sesión ya está cerrada" }, { status: 409 })
    }

    const payments = await prisma.payment.findMany({ where: { sessionId: id } })
    const movements = await prisma.cashMovement.findMany({ where: { sessionId: id } })

    const cashIn = payments
      .filter((p) => p.method === "CASH")
      .reduce((s, p) => s + Number(p.amount), 0)
    const ingresos = movements
      .filter((m) => m.type === "INCOME")
      .reduce((s, m) => s + Number(m.amount), 0)
    const egresos = movements
      .filter((m) => m.type === "EXPENSE")
      .reduce((s, m) => s + Number(m.amount), 0)
    const expectedBalance = Number(existing.openingBalance) + cashIn + ingresos - egresos

    const session = await prisma.cashSession.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingBalance: body.closingBalance ?? null,
        expectedBalance,
        observations: body.observations ?? null,
      },
      include: {
        terminal: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({
      id: session.id,
      status: session.status,
      openedAt: session.openedAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
      openingBalance: Number(session.openingBalance),
      closingBalance: session.closingBalance ? Number(session.closingBalance) : null,
      expectedBalance: session.expectedBalance ? Number(session.expectedBalance) : null,
      observations: session.observations,
      terminal: session.terminal,
      user: session.user,
    })
  } catch {
    return NextResponse.json({ error: "Error al cerrar la sesión" }, { status: 500 })
  }
}
