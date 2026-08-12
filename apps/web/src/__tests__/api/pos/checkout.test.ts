import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cashSession: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    productVariant: { findMany: vi.fn() },
    order: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

// requireAdmin() calls next-auth's auth(), which needs a real request-rendering
// scope it doesn't have here — stub it so the route's own logic (the thing
// under test) is what actually runs. Each test overrides the resolved value
// to control the authorized role.
vi.mock("@/lib/api-auth", () => ({
  requireAdmin: vi.fn(),
}))

import { POST } from "@/app/api/pos/checkout/route"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/pos/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

const ADMINISTRADOR = {
  session: { user: { roleId: "admin-role", roleName: "Administrador" } },
  response: null,
}

const CASHIER = {
  session: { user: { roleId: "cashier-role", roleName: "Cajero" } },
  response: null,
}

const OPEN_SESSION = { id: "session-1", userId: "cashier-1", status: "OPEN" }

const BASE_BODY = {
  terminalId: "terminal-1",
  sessionId: "session-1",
  customerId: "customer-1",
  paymentMethod: "CASH",
}

function makeTxMock(overrides: Record<string, unknown> = {}) {
  return {
    cashSession: { findUnique: vi.fn().mockResolvedValue(OPEN_SESSION) },
    order: {
      create: vi.fn().mockResolvedValue({ id: "order-1", orderNumber: "POS-2026-000001" }),
    },
    payment: { create: vi.fn().mockResolvedValue({}) },
    product: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    productVariant: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    ...overrides,
  }
}

describe("POST /api/pos/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(ADMINISTRADOR as never)
    vi.mocked(prisma.cashSession.findUnique).mockResolvedValue(OPEN_SESSION as never)
    vi.mocked(prisma.order.count).mockResolvedValue(0)
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([])
  })

  it("retorna 403 cuando un no-Administrador intenta aplicar precio mayorista, sin escribir en la DB", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(CASHIER as never)

    const res = await POST(
      buildRequest({
        ...BASE_BODY,
        items: [{ productId: "prod-1", quantity: 1, wholesale: true }],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe("Solo un administrador puede aplicar precio mayorista")
    expect(vi.mocked(prisma.product.findMany)).not.toHaveBeenCalled()
    expect(vi.mocked(prisma.cashSession.findUnique)).not.toHaveBeenCalled()
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled()
  })

  it("retorna 400 nombrando el producto cuando no tiene precio mayorista configurado", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-1", name: "Laptop Test", price: 1000000, wholesalePrice: null },
    ] as never)

    const res = await POST(
      buildRequest({
        ...BASE_BODY,
        items: [{ productId: "prod-1", quantity: 1, wholesale: true }],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('El producto "Laptop Test" no tiene precio mayorista configurado')
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled()
  })

  it("crea la orden usando el precio mayorista cuando un Administrador lo solicita (incluso sobre el precio de variante)", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-1", name: "Laptop Test", price: 1000000, wholesalePrice: 800000 },
    ] as never)
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
      { id: "variant-1", label: "16GB", price: 950000 },
    ] as never)

    const tx = makeTxMock()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: unknown) => unknown)(tx)
    )

    const res = await POST(
      buildRequest({
        ...BASE_BODY,
        items: [{ productId: "prod-1", variantId: "variant-1", quantity: 2, wholesale: true }],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.orderId).toBe("order-1")

    const createCall = tx.order.create.mock.calls[0][0]
    expect(createCall.data.subtotal).toBe(1600000) // 800000 * 2, not 950000 (variant) nor 1000000 (base)
    expect(createCall.data.items.create[0].price).toBe(800000)
  })

  it("no afecta el checkout normal sin precio mayorista (regresión)", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(CASHIER as never)
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-1", name: "Laptop Test", price: 1000000, wholesalePrice: 800000 },
    ] as never)

    const tx = makeTxMock()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: unknown) => unknown)(tx)
    )

    const res = await POST(
      buildRequest({
        ...BASE_BODY,
        items: [{ productId: "prod-1", quantity: 1 }],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.orderId).toBe("order-1")

    const createCall = tx.order.create.mock.calls[0][0]
    expect(createCall.data.subtotal).toBe(1000000)
    expect(createCall.data.items.create[0].price).toBe(1000000)
    expect(createCall.data.status).toBe("CONFIRMED")
    expect(createCall.data.deliverNow).toBe(true)
    expect(createCall.data.holdDays).toBeNull()
    expect(createCall.data.holdUntil).toBeNull()
  })

  describe("apartados (layaway)", () => {
    beforeEach(() => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: "prod-1", name: "Laptop Test", price: 1000000, wholesalePrice: null },
      ] as never)
    })

    it("rechaza cuando el abono es mayor o igual al total", async () => {
      const res = await POST(
        buildRequest({
          ...BASE_BODY,
          items: [{ productId: "prod-1", quantity: 1 }],
          layaway: { deposit: 1000000, deliverNow: true },
        })
      )
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe("El abono debe ser menor al total; para pagar todo usa una venta normal")
      expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled()
    })

    it("rechaza cuando deliverNow es false y no se indica holdDays", async () => {
      const res = await POST(
        buildRequest({
          ...BASE_BODY,
          items: [{ productId: "prod-1", quantity: 1 }],
          layaway: { deposit: 300000, deliverNow: false },
        })
      )
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe("Indica cuántos días se guarda el producto")
      expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled()
    })

    it("crea un apartado con status LAYAWAY, holdUntil correcto y Payment por el abono", async () => {
      const tx = makeTxMock()
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
        (fn as (tx: unknown) => unknown)(tx)
      )

      const now = Date.now()
      const res = await POST(
        buildRequest({
          ...BASE_BODY,
          items: [{ productId: "prod-1", quantity: 1 }],
          layaway: { deposit: 300000, deliverNow: false, holdDays: 15 },
        })
      )
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.orderId).toBe("order-1")

      const createCall = tx.order.create.mock.calls[0][0]
      expect(createCall.data.status).toBe("LAYAWAY")
      expect(createCall.data.deliverNow).toBe(false)
      expect(createCall.data.holdDays).toBe(15)
      expect(createCall.data.total).toBe(1000000)
      expect(createCall.data.subtotal).toBe(1000000)
      const holdUntil = createCall.data.holdUntil as Date
      expect(holdUntil.getTime()).toBeGreaterThanOrEqual(now + 15 * 86400000 - 5000)
      expect(holdUntil.getTime()).toBeLessThanOrEqual(now + 15 * 86400000 + 5000)

      const paymentCall = tx.payment.create.mock.calls[0][0]
      expect(paymentCall.data.amount).toBe(300000)
    })

    it("crea un apartado con entrega inmediata (deliverNow true) sin holdDays/holdUntil", async () => {
      const tx = makeTxMock()
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
        (fn as (tx: unknown) => unknown)(tx)
      )

      const res = await POST(
        buildRequest({
          ...BASE_BODY,
          items: [{ productId: "prod-1", quantity: 1 }],
          layaway: { deposit: 300000, deliverNow: true },
        })
      )

      expect(res.status).toBe(201)
      const createCall = tx.order.create.mock.calls[0][0]
      expect(createCall.data.status).toBe("LAYAWAY")
      expect(createCall.data.deliverNow).toBe(true)
      expect(createCall.data.holdDays).toBeNull()
      expect(createCall.data.holdUntil).toBeNull()
    })

    it("ignora el tip cuando hay layaway y valida el CASH recibido contra el abono, no el total", async () => {
      const res = await POST(
        buildRequest({
          ...BASE_BODY,
          items: [{ productId: "prod-1", quantity: 1 }],
          tip: 50000,
          receivedAmount: 200000,
          layaway: { deposit: 300000, deliverNow: true },
        })
      )
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe("El monto recibido es insuficiente")
    })
  })
})
