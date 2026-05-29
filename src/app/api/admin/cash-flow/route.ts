import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const terminalId = searchParams.get("terminalId")
    const type = searchParams.get("type") // SALE | INCOME | EXPENSE
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const dateFilter =
      from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
          }
        : undefined

    // ── Fetch payments (ventas POS) ──────────────────────────────────────────
    const fetchSales = type == null || type === "SALE"

    const paymentWhere: Record<string, unknown> = {}
    if (sessionId) paymentWhere.sessionId = sessionId
    if (terminalId) paymentWhere.session = { terminalId }
    if (dateFilter) paymentWhere.createdAt = dateFilter

    const paymentsRaw = fetchSales
      ? await prisma.payment.findMany({
          where: paymentWhere,
          include: {
            order: {
              select: {
                orderNumber: true,
                customer: { select: { name: true, email: true } },
                cashier: { select: { id: true, name: true } },
              },
            },
            session: {
              select: {
                id: true,
                status: true,
                terminal: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : []

    // ── Fetch cash movements (manuales) ─────────────────────────────────────
    const fetchManual = type == null || type === "INCOME" || type === "EXPENSE"

    const movementWhere: Record<string, unknown> = {}
    if (sessionId) movementWhere.sessionId = sessionId
    if (terminalId) movementWhere.session = { terminalId }
    if (type && type !== "SALE") movementWhere.type = type
    if (dateFilter) movementWhere.createdAt = dateFilter

    const movementsRaw = fetchManual
      ? await prisma.cashMovement.findMany({
          where: movementWhere,
          include: {
            session: {
              select: {
                id: true,
                status: true,
                terminal: { select: { id: true, name: true } },
              },
            },
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : []

    // ── Normalizar al shape unificado ────────────────────────────────────────
    type CashFlowEntry = {
      id: string
      type: "SALE" | "INCOME" | "EXPENSE"
      concept: string
      amount: number
      date: string
      terminal: { id: string; name: string } | null
      user: { id: string; name: string } | null
      sessionId: string | null
      canDelete: boolean
      orderId?: string
      orderNumber?: string
      paymentMethod?: string
      tip?: number
      customer?: { name: string; email: string | null }
    }

    const salesEntries: CashFlowEntry[] = paymentsRaw.map((p) => ({
      id: p.id,
      type: "SALE",
      concept: `Venta #${p.order.orderNumber}`,
      amount: Number(p.amount),
      date: p.createdAt.toISOString(),
      terminal: p.session?.terminal ?? null,
      user: p.order.cashier ?? null,
      sessionId: p.sessionId ?? null,
      canDelete: false,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      paymentMethod: p.method,
      tip: Number(p.tip),
      customer: p.order.customer,
    }))

    const manualEntries: CashFlowEntry[] = movementsRaw.map((m) => ({
      id: m.id,
      type: m.type as "INCOME" | "EXPENSE",
      concept: m.concept,
      amount: Number(m.amount),
      date: m.createdAt.toISOString(),
      terminal: m.session.terminal,
      user: m.user,
      sessionId: m.sessionId,
      canDelete: m.session.status === "OPEN",
    }))

    // ── Merge y ordenar por fecha desc ───────────────────────────────────────
    const entries = [...salesEntries, ...manualEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    // ── Totales ──────────────────────────────────────────────────────────────
    const totals = entries.reduce(
      (acc, e) => {
        if (e.type === "SALE") acc.sales += e.amount
        else if (e.type === "INCOME") acc.income += e.amount
        else acc.expense += e.amount
        return acc
      },
      { sales: 0, income: 0, expense: 0, net: 0 },
    )
    totals.net = totals.sales + totals.income - totals.expense

    return NextResponse.json({ entries, totals })
  } catch (error) {
    console.error("Error fetching cash flow:", error)
    return NextResponse.json({ error: "Error al obtener el flujo de caja" }, { status: 500 })
  }
}
