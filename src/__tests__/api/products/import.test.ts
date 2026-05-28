import { describe, it, expect, vi, beforeEach } from "vitest"
import type { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { createMany: vi.fn() },
  },
}))

import { POST } from "@/app/api/products/import/route"
import { prisma } from "@/lib/prisma"
import type { ResolvedRow } from "@/lib/products/import-types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body: object): NextRequest {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

const VALID_ROW: ResolvedRow = {
  name: "Laptop Test",
  slug: "laptop-test",
  description: "Una laptop",
  price: 1500000,
  stock: 10,
  isNew: false,
  isFeatured: false,
  isActive: true,
  categoryId: "cat-1",
  brandId: "brand-1",
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe("POST /api/products/import", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.product.createMany).mockResolvedValue({ count: 1 })
  })

  it("retorna 400 si rows es un array vacío", async () => {
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBeDefined()
  })

  it("retorna 400 si rows es null", async () => {
    const res = await POST(makeRequest({ rows: null }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 si rows no viene en el body", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("crea productos y retorna { created: n }", async () => {
    vi.mocked(prisma.product.createMany).mockResolvedValue({ count: 2 })
    const res = await POST(
      makeRequest({ rows: [VALID_ROW, { ...VALID_ROW, slug: "mouse-test", name: "Mouse" }] }),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).created).toBe(2)
  })

  it("llama a prisma.product.createMany con los datos correctos", async () => {
    await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(vi.mocked(prisma.product.createMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            name: "Laptop Test",
            slug: "laptop-test",
            price: 1500000,
            stock: 10,
            isNew: false,
            isActive: true,
            categoryId: "cat-1",
            brandId: "brand-1",
            images: [],
            specs: {},
          }),
        ]),
        skipDuplicates: false,
      }),
    )
  })

  it("sets images: [] y specs: {} para cada producto", async () => {
    await POST(makeRequest({ rows: [VALID_ROW] }))
    const call = vi.mocked(prisma.product.createMany).mock.calls[0][0]
    expect(call.data[0].images).toEqual([])
    expect(call.data[0].specs).toEqual({})
  })

  it("sets description a null si viene vacía", async () => {
    await POST(makeRequest({ rows: [{ ...VALID_ROW, description: "" }] }))
    const call = vi.mocked(prisma.product.createMany).mock.calls[0][0]
    expect(call.data[0].description).toBeNull()
  })

  it("sets comparePrice a null si es undefined en el row", async () => {
    const rowSinPrecioComparativo = { ...VALID_ROW }
    await POST(makeRequest({ rows: [rowSinPrecioComparativo] }))
    const call = vi.mocked(prisma.product.createMany).mock.calls[0][0]
    expect(call.data[0].comparePrice).toBeNull()
  })

  it("retorna 500 cuando Prisma lanza una excepción", async () => {
    vi.mocked(prisma.product.createMany).mockRejectedValue(
      new Error("Unique constraint failed"),
    )
    const res = await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBeDefined()
  })

  it("retorna 400 si rows supera MAX_ROWS", async () => {
    const rows = Array.from({ length: 501 }, (_, i) => ({
      ...VALID_ROW,
      slug: `slug-${i}`,
    }))
    const res = await POST(makeRequest({ rows }))
    expect(res.status).toBe(400)
  })
})
