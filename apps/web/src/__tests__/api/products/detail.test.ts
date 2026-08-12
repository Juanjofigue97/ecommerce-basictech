import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findFirst: vi.fn() },
    attributeValue: { findMany: vi.fn() },
    productVariant: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

// GET is public and only does a *soft* auth check (to decide whether to
// include wholesalePrice) — it must not require a session.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// requireAdmin() calls next-auth's auth(), which needs a real request-rendering
// scope it doesn't have here — stub it so the route's own logic (the thing
// under test) is what actually runs. Each test overrides the resolved value
// to control the authorized role.
vi.mock("@/lib/api-auth", () => ({
  requireAdmin: vi.fn(),
}))

import { GET, PUT } from "@/app/api/products/[id]/route"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/api-auth"

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

function buildPutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/products/prod-1", {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

const CATEGORY = { id: "cat-1", name: "Laptops", slug: "laptops" }
const BRAND = { id: "brand-1", name: "Lenovo", slug: "lenovo" }

const PRODUCT_WITH_WHOLESALE = {
  id: "prod-1",
  name: "Laptop Test",
  slug: "laptop-test",
  description: "Una laptop",
  price: 1000000,
  comparePrice: null,
  wholesalePrice: 800000,
  cost: 500000,
  stock: 10,
  images: [],
  specs: {},
  isNew: false,
  isFeatured: false,
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  categoryId: "cat-1",
  brandId: "brand-1",
  category: CATEGORY,
  brand: BRAND,
  variants: [],
}

const ADMINISTRADOR_SESSION = { user: { roleId: "admin-role", roleName: "Administrador" } }
const CAJERO_SESSION = { user: { roleId: "cashier-role", roleName: "Cajero" } }

describe("GET /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.product.findFirst).mockResolvedValue(PRODUCT_WITH_WHOLESALE as never)
  })

  it("omite wholesalePrice para llamadas anónimas", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET(new NextRequest("http://localhost/api/products/prod-1"), params("prod-1"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).not.toHaveProperty("wholesalePrice")
  })

  it("incluye wholesalePrice para sesiones Administrador", async () => {
    vi.mocked(auth).mockResolvedValue(ADMINISTRADOR_SESSION as never)

    const res = await GET(new NextRequest("http://localhost/api/products/prod-1"), params("prod-1"))
    const body = await res.json()

    expect(body.wholesalePrice).toBe(800000)
  })

  it("omite cost para llamadas anónimas", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET(new NextRequest("http://localhost/api/products/prod-1"), params("prod-1"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).not.toHaveProperty("cost")
  })

  it("incluye cost para sesiones Administrador", async () => {
    vi.mocked(auth).mockResolvedValue(ADMINISTRADOR_SESSION as never)

    const res = await GET(new NextRequest("http://localhost/api/products/prod-1"), params("prod-1"))
    const body = await res.json()

    expect(body.cost).toBe(500000)
  })
})

describe("PUT /api/products/[id]", () => {
  const VALID_BODY = {
    name: "Laptop Test",
    slug: "laptop-test",
    description: "Una laptop",
    price: 1000000,
    categoryId: "cat-1",
    brandId: "brand-1",
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue({ session: ADMINISTRADOR_SESSION, response: null } as never)
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([])
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        productVariant: {
          updateMany: vi.fn().mockResolvedValue({}),
          deleteMany: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([]),
        },
        productVariantValue: { deleteMany: vi.fn().mockResolvedValue({}) },
        product: {
          update: vi.fn().mockResolvedValue({ ...PRODUCT_WITH_WHOLESALE, wholesalePrice: null }),
        },
      }
      return (fn as (tx: unknown) => unknown)(tx)
    })
  })

  it("descarta wholesalePrice del body cuando el rol no es Administrador", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ session: CAJERO_SESSION, response: null } as never)
    let capturedUpdateData: Record<string, unknown> | undefined
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        productVariant: {
          updateMany: vi.fn().mockResolvedValue({}),
          deleteMany: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([]),
        },
        productVariantValue: { deleteMany: vi.fn().mockResolvedValue({}) },
        product: {
          update: vi.fn().mockImplementation((args) => {
            capturedUpdateData = args.data
            return Promise.resolve({ ...PRODUCT_WITH_WHOLESALE, wholesalePrice: null })
          }),
        },
      }
      return (fn as (tx: unknown) => unknown)(tx)
    })

    await PUT(buildPutRequest({ ...VALID_BODY, wholesalePrice: 800000 }), params("prod-1"))

    expect(capturedUpdateData).not.toHaveProperty("wholesalePrice")
  })

  it("persiste wholesalePrice cuando el rol es Administrador", async () => {
    let capturedUpdateData: Record<string, unknown> | undefined
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        productVariant: {
          updateMany: vi.fn().mockResolvedValue({}),
          deleteMany: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([]),
        },
        productVariantValue: { deleteMany: vi.fn().mockResolvedValue({}) },
        product: {
          update: vi.fn().mockImplementation((args) => {
            capturedUpdateData = args.data
            return Promise.resolve({ ...PRODUCT_WITH_WHOLESALE, wholesalePrice: 800000 })
          }),
        },
      }
      return (fn as (tx: unknown) => unknown)(tx)
    })

    await PUT(buildPutRequest({ ...VALID_BODY, wholesalePrice: 800000 }), params("prod-1"))

    expect(capturedUpdateData?.wholesalePrice).toBe(800000)
  })

  it("retorna 400 si wholesalePrice no es un número positivo", async () => {
    const res = await PUT(buildPutRequest({ ...VALID_BODY, wholesalePrice: -10 }), params("prod-1"))

    expect(res.status).toBe(400)
  })

  it("descarta cost del body cuando el rol no es Administrador", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ session: CAJERO_SESSION, response: null } as never)
    let capturedUpdateData: Record<string, unknown> | undefined
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        productVariant: {
          updateMany: vi.fn().mockResolvedValue({}),
          deleteMany: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([]),
        },
        productVariantValue: { deleteMany: vi.fn().mockResolvedValue({}) },
        product: {
          update: vi.fn().mockImplementation((args) => {
            capturedUpdateData = args.data
            return Promise.resolve({ ...PRODUCT_WITH_WHOLESALE, cost: null })
          }),
        },
      }
      return (fn as (tx: unknown) => unknown)(tx)
    })

    await PUT(buildPutRequest({ ...VALID_BODY, cost: 500000 }), params("prod-1"))

    expect(capturedUpdateData).not.toHaveProperty("cost")
  })

  it("persiste cost cuando el rol es Administrador", async () => {
    let capturedUpdateData: Record<string, unknown> | undefined
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        productVariant: {
          updateMany: vi.fn().mockResolvedValue({}),
          deleteMany: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([]),
        },
        productVariantValue: { deleteMany: vi.fn().mockResolvedValue({}) },
        product: {
          update: vi.fn().mockImplementation((args) => {
            capturedUpdateData = args.data
            return Promise.resolve({ ...PRODUCT_WITH_WHOLESALE, cost: 500000 })
          }),
        },
      }
      return (fn as (tx: unknown) => unknown)(tx)
    })

    await PUT(buildPutRequest({ ...VALID_BODY, cost: 500000 }), params("prod-1"))

    expect(capturedUpdateData?.cost).toBe(500000)
  })

  it("retorna 400 si cost no es un número positivo", async () => {
    const res = await PUT(buildPutRequest({ ...VALID_BODY, cost: -10 }), params("prod-1"))

    expect(res.status).toBe(400)
  })
})
