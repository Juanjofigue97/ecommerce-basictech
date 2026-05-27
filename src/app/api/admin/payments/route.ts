import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get("method")
    const sessionId = searchParams.get("sessionId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: Record<string, unknown> = {}
    if (method && method !== "all") where.method = method
    if (sessionId) where.sessionId = sessionId
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              channel: true,
              customer: { select: { name: true, email: true } },
              cashier: { select: { name: true } },
              terminal: { select: { name: true } },
            },
          },
          session: {
            select: {
              terminal: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ])

    const result = payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      tip: Number(p.tip),
      receivedAmount: p.receivedAmount != null ? Number(p.receivedAmount) : null,
      change: p.change != null ? Number(p.change) : null,
      createdAt: p.createdAt.toISOString(),
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      channel: p.order.channel,
      customer: p.order.customer,
      cashier: p.order.cashier,
      terminal: p.session?.terminal ?? p.order.terminal,
    }))

    return NextResponse.json({ payments: result, total, limit, offset })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Error fetching payments" }, { status: 500 })
  }
}
