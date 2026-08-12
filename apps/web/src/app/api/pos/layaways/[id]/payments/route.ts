import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

type PosPaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "TRANSFER"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { sessionId, amount, method, receivedAmount } = body as {
      sessionId: string
      amount: number
      method: PosPaymentMethod
      receivedAmount?: number
    }

    if (!sessionId || !method) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: { select: { amount: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: "El apartado no existe" }, { status: 404 })
    }
    if (order.status !== "LAYAWAY") {
      return NextResponse.json({ error: "Este apartado ya no admite más abonos" }, { status: 400 })
    }

    const cashSession = await prisma.cashSession.findUnique({ where: { id: sessionId } })
    if (!cashSession || cashSession.status === "CLOSED") {
      return NextResponse.json({ error: "La sesión de caja está cerrada" }, { status: 409 })
    }

    const totalPaidSoFar = order.payments.reduce((s, p) => s + Number(p.amount), 0)
    const remaining = Number(order.total) - totalPaidSoFar

    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "El monto del abono es inválido" }, { status: 400 })
    }
    if (amountNum > remaining) {
      return NextResponse.json(
        {
          error: `El abono no puede superar el saldo pendiente (${new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          }).format(remaining)})`,
        },
        { status: 400 }
      )
    }

    if (method === "CASH" && receivedAmount != null && Number(receivedAmount) < amountNum) {
      return NextResponse.json({ error: "El monto recibido es insuficiente" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const freshSession = await tx.cashSession.findUnique({ where: { id: sessionId } })
      if (!freshSession || freshSession.status === "CLOSED") {
        throw new Error("SESSION_CLOSED")
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          sessionId,
          method,
          amount: amountNum,
          tip: 0,
          receivedAmount: receivedAmount ?? null,
          change: receivedAmount != null ? receivedAmount - amountNum : null,
        },
      })

      const newTotalPaid = totalPaidSoFar + amountNum
      const isFullyPaid = newTotalPaid >= Number(order.total)

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: isFullyPaid ? "CONFIRMED" : "LAYAWAY" },
      })

      return { updated, newTotalPaid }
    })

    return NextResponse.json({
      id: result.updated.id,
      status: result.updated.status,
      totalPaid: result.newTotalPaid,
      remaining: Number(order.total) - result.newTotalPaid,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_CLOSED") {
      return NextResponse.json({ error: "La sesión de caja está cerrada" }, { status: 409 })
    }
    console.error("Layaway payment error:", error)
    return NextResponse.json({ error: "Error al registrar el abono" }, { status: 500 })
  }
}
