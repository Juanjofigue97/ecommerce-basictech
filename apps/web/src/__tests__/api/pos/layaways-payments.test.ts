import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: vi.fn() },
    cashSession: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

// requireAdmin() calls next-auth's auth(), which needs a real request-rendering
// scope it doesn't have here — stub it so the route's own logic (the thing
// under test) is what actually runs. Each test overrides the resolved value
// to control the authorized/unauthorized case.
vi.mock("@/lib/api-auth", () => ({
  requireAdmin: vi.fn(),
}))

import { POST } from "@/app/api/pos/layaways/[id]/payments/route"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/pos/layaways/order-1/payments", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

function callRoute(body: unknown, id = "order-1") {
  return POST(buildRequest(body), { params: Promise.resolve({ id }) })
}

const AUTHORIZED = {
  session: { user: { roleId: "cashier-role", roleName: "Cajero" } },
  response: null,
}

const UNAUTHORIZED_RESPONSE = new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

const OPEN_SESSION = { id: "session-1", userId: "cashier-1", status: "OPEN" }

const LAYAWAY_ORDER = {
  id: "order-1",
  status: "LAYAWAY",
  total: 1000000,
  payments: [{ amount: 300000 }],
}

const BASE_BODY = {
  sessionId: "session-1",
  amount: 200000,
  method: "CASH",
  receivedAmount: 200000,
}

function makeTxMock(overrides: Record<string, unknown> = {}) {
  return {
    cashSession: { findUnique: vi.fn().mockResolvedValue(OPEN_SESSION) },
    payment: { create: vi.fn().mockResolvedValue({}) },
    order: {
      update: vi.fn().mockResolvedValue({ id: "order-1", status: "LAYAWAY" }),
    },
    ...overrides,
  }
}

describe("POST /api/pos/layaways/[id]/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(AUTHORIZED as never)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(LAYAWAY_ORDER as never)
    vi.mocked(prisma.cashSession.findUnique).mockResolvedValue(OPEN_SESSION as never)
  })

  it("retorna 401 cuando no está autenticado", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      session: null,
      response: UNAUTHORIZED_RESPONSE,
    } as never)

    const res = await callRoute(BASE_BODY)

    expect(res.status).toBe(401)
    expect(vi.mocked(prisma.order.findUnique)).not.toHaveBeenCalled()
  })

  it("retorna 404 cuando la orden no existe", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    const res = await callRoute(BASE_BODY)

    expect(res.status).toBe(404)
  })

  it("retorna 400 cuando la orden no está en estado LAYAWAY", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...LAYAWAY_ORDER,
      status: "CONFIRMED",
    } as never)

    const res = await callRoute(BASE_BODY)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeTruthy()
  })

  it("retorna 400 cuando el abono supera el saldo pendiente", async () => {
    // remaining = 1,000,000 - 300,000 = 700,000
    const res = await callRoute({ ...BASE_BODY, amount: 800000, receivedAmount: 800000 })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain("saldo pendiente")
  })

  it("retorna 400 cuando el monto recibido en efectivo es insuficiente", async () => {
    const res = await callRoute({ ...BASE_BODY, amount: 200000, receivedAmount: 100000 })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe("El monto recibido es insuficiente")
  })

  it("un abono que completa el total cambia la orden a CONFIRMED", async () => {
    const tx = makeTxMock({
      order: {
        update: vi.fn().mockResolvedValue({ id: "order-1", status: "CONFIRMED" }),
      },
    })
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: unknown) => unknown)(tx)
    )

    // remaining = 700,000 — pay exactly that to complete the order
    const res = await callRoute({ ...BASE_BODY, amount: 700000, receivedAmount: 700000 })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("CONFIRMED")
    const updateCall = tx.order.update.mock.calls[0][0]
    expect(updateCall.data.status).toBe("CONFIRMED")
  })

  it("un abono parcial deja la orden en LAYAWAY", async () => {
    const tx = makeTxMock()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: unknown) => unknown)(tx)
    )

    const res = await callRoute({ ...BASE_BODY, amount: 200000, receivedAmount: 200000 })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("LAYAWAY")
    const updateCall = tx.order.update.mock.calls[0][0]
    expect(updateCall.data.status).toBe("LAYAWAY")
  })
})
