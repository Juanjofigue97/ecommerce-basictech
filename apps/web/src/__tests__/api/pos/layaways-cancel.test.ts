import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

// requireAdmin() calls next-auth's auth(), which needs a real request-rendering
// scope it doesn't have here — stub it so the route's own logic (the thing
// under test) is what actually runs.
vi.mock("@/lib/api-auth", () => ({
  requireAdmin: vi.fn(),
}))

import { POST } from "@/app/api/pos/layaways/[id]/cancel/route"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

function buildRequest() {
  return new NextRequest("http://localhost/api/pos/layaways/order-1/cancel", {
    method: "POST",
  })
}

function callRoute(id = "order-1") {
  return POST(buildRequest(), { params: Promise.resolve({ id }) })
}

const AUTHORIZED = {
  session: { user: { roleId: "cashier-role", roleName: "Cajero" } },
  response: null,
}

const UNAUTHORIZED_RESPONSE = new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })

const LAYAWAY_ORDER = {
  id: "order-1",
  status: "LAYAWAY",
  items: [
    { productId: "prod-1", variantId: null, quantity: 2 },
    { productId: "prod-2", variantId: "variant-1", quantity: 1 },
  ],
}

function makeTxMock(overrides: Record<string, unknown> = {}) {
  return {
    product: {
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    productVariant: {
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([{ stock: 5 }, { stock: 3 }]),
    },
    order: {
      update: vi.fn().mockResolvedValue({ id: "order-1", status: "CANCELLED" }),
    },
    ...overrides,
  }
}

describe("POST /api/pos/layaways/[id]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(AUTHORIZED as never)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(LAYAWAY_ORDER as never)
  })

  it("retorna 401 cuando no está autenticado", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      session: null,
      response: UNAUTHORIZED_RESPONSE,
    } as never)

    const res = await callRoute()

    expect(res.status).toBe(401)
    expect(vi.mocked(prisma.order.findUnique)).not.toHaveBeenCalled()
  })

  it("retorna 404 cuando la orden no existe", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    const res = await callRoute()

    expect(res.status).toBe(404)
  })

  it("retorna 400 cuando la orden no está en estado LAYAWAY", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...LAYAWAY_ORDER,
      status: "CANCELLED",
    } as never)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeTruthy()
  })

  it("reabastece cada ítem y marca la orden como CANCELLED", async () => {
    const tx = makeTxMock()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: unknown) => unknown)(tx)
    )

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    // Item without variant: increments product stock directly
    expect(tx.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "prod-1" }),
        data: expect.objectContaining({ stock: { increment: 2 } }),
      })
    )

    // Item with variant: increments variant stock, then recomputes parent product's total stock
    expect(tx.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "variant-1" },
        data: expect.objectContaining({ stock: { increment: 1 } }),
      })
    )
    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-2" },
        data: { stock: 8 }, // 5 + 3 from siblingVariants mock
      })
    )

    const updateCall = tx.order.update.mock.calls[0][0]
    expect(updateCall.data.status).toBe("CANCELLED")
  })
})
