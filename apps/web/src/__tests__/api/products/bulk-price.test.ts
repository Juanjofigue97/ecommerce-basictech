import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

// requireAdmin() calls next-auth's auth(), which needs a real request-rendering
// scope it doesn't have here — stub it so the route's own logic (the thing
// under test) is what actually runs. Each test overrides the resolved value
// to control the authorized/unauthorized path.
vi.mock("@/lib/api-auth", () => ({
  requireAdmin: vi.fn(),
}))

import { PATCH } from "@/app/api/products/bulk-price/route"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/products/bulk-price", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

const AUTHORIZED = {
  session: { user: { roleId: "admin-role", roleName: "Administrador" } },
  response: null,
}

const UNAUTHORIZED = {
  session: null,
  response: new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 }),
}

describe("PATCH /api/products/bulk-price", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(AUTHORIZED as never)
  })

  it("retorna 401 cuando requireAdmin deniega el acceso", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(UNAUTHORIZED as never)

    const res = await PATCH(buildRequest({ items: [{ id: "p1", price: 1000 }] }))

    expect(res.status).toBe(401)
    expect(vi.mocked(prisma.product.findMany)).not.toHaveBeenCalled()
  })

  it("retorna 400 cuando items es un array vacío", async () => {
    const res = await PATCH(buildRequest({ items: [] }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeTruthy()
  })

  it("retorna 400 cuando un precio no es positivo", async () => {
    const res = await PATCH(
      buildRequest({ items: [{ id: "p1", price: 0 }, { id: "p2", price: -100 }] })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeTruthy()
    expect(vi.mocked(prisma.product.findMany)).not.toHaveBeenCalled()
  })

  it("retorna 404 cuando un id no existe y no actualiza nada", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([{ id: "p1" }] as never)

    const res = await PATCH(
      buildRequest({
        items: [
          { id: "p1", price: 1000 },
          { id: "missing-id", price: 2000 },
        ],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBeTruthy()
    expect(body.missingIds).toEqual(["missing-id"])
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled()
  })

  it("aplica las actualizaciones en una transaccion y retorna success", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "p1" },
      { id: "p2" },
    ] as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

    const items = [
      { id: "p1", price: 1000 },
      { id: "p2", price: 2000 },
    ]
    const res = await PATCH(buildRequest({ items }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true, updated: 2 })

    expect(vi.mocked(prisma.product.update)).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { price: 1000 },
    })
    expect(vi.mocked(prisma.product.update)).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { price: 2000 },
    })
    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalledTimes(1)
  })
})
