import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    attributeValue: { findMany: vi.fn() },
  },
}))

// GET is public and only does a *soft* auth check (to decide whether to
// include wholesalePrice) — it must not require a session. Mock next-auth's
// auth() directly so each test can control what "logged in as" looks like.
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

import { GET, POST } from "@/app/api/products/route"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/api-auth"

function buildGetRequest(qs = "") {
  return new NextRequest(`http://localhost/api/products${qs}`)
}

function buildPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/products", {
    method: "POST",
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

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.product.findMany).mockResolvedValue([PRODUCT_WITH_WHOLESALE] as never)
    vi.mocked(prisma.product.count).mockResolvedValue(1)
  })

  it("omite wholesalePrice para llamadas anónimas", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET(buildGetRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.products[0]).not.toHaveProperty("wholesalePrice")
  })

  it("omite wholesalePrice para sesiones no-Administrador", async () => {
    vi.mocked(auth).mockResolvedValue(CAJERO_SESSION as never)

    const res = await GET(buildGetRequest())
    const body = await res.json()

    expect(body.products[0]).not.toHaveProperty("wholesalePrice")
  })

  it("incluye wholesalePrice para sesiones Administrador", async () => {
    vi.mocked(auth).mockResolvedValue(ADMINISTRADOR_SESSION as never)

    const res = await GET(buildGetRequest())
    const body = await res.json()

    expect(body.products[0].wholesalePrice).toBe(800000)
  })

  it("omite cost para llamadas anónimas", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET(buildGetRequest())
    const body = await res.json()

    expect(body.products[0]).not.toHaveProperty("cost")
  })

  it("omite cost para sesiones no-Administrador", async () => {
    vi.mocked(auth).mockResolvedValue(CAJERO_SESSION as never)

    const res = await GET(buildGetRequest())
    const body = await res.json()

    expect(body.products[0]).not.toHaveProperty("cost")
  })

  it("incluye cost para sesiones Administrador", async () => {
    vi.mocked(auth).mockResolvedValue(ADMINISTRADOR_SESSION as never)

    const res = await GET(buildGetRequest())
    const body = await res.json()

    expect(body.products[0].cost).toBe(500000)
  })
})

describe("POST /api/products", () => {
  const VALID_BODY = {
    name: "Laptop Test",
    slug: "laptop-test",
    description: "Una laptop",
    price: 1000000,
    categoryId: "cat-1",
    brandId: "brand-1",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue({ session: ADMINISTRADOR_SESSION, response: null } as never)
    vi.mocked(prisma.product.create).mockResolvedValue({
      ...PRODUCT_WITH_WHOLESALE,
      wholesalePrice: null,
    } as never)
  })

  it("descarta wholesalePrice del body cuando el rol no es Administrador", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ session: CAJERO_SESSION, response: null } as never)

    await POST(buildPostRequest({ ...VALID_BODY, wholesalePrice: 800000 }))

    const createArgs = vi.mocked(prisma.product.create).mock.calls[0][0]
    expect(createArgs.data).not.toHaveProperty("wholesalePrice")
  })

  it("persiste wholesalePrice cuando el rol es Administrador", async () => {
    await POST(buildPostRequest({ ...VALID_BODY, wholesalePrice: 800000 }))

    const createArgs = vi.mocked(prisma.product.create).mock.calls[0][0]
    expect(createArgs.data.wholesalePrice).toBe(800000)
  })

  it("retorna 400 si wholesalePrice no es un número positivo", async () => {
    const res = await POST(buildPostRequest({ ...VALID_BODY, wholesalePrice: -10 }))

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.product.create)).not.toHaveBeenCalled()
  })

  it("descarta cost del body cuando el rol no es Administrador", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ session: CAJERO_SESSION, response: null } as never)

    await POST(buildPostRequest({ ...VALID_BODY, cost: 500000 }))

    const createArgs = vi.mocked(prisma.product.create).mock.calls[0][0]
    expect(createArgs.data).not.toHaveProperty("cost")
  })

  it("persiste cost cuando el rol es Administrador", async () => {
    await POST(buildPostRequest({ ...VALID_BODY, cost: 500000 }))

    const createArgs = vi.mocked(prisma.product.create).mock.calls[0][0]
    expect(createArgs.data.cost).toBe(500000)
  })

  it("retorna 400 si cost no es un número positivo", async () => {
    const res = await POST(buildPostRequest({ ...VALID_BODY, cost: -10 }))

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.product.create)).not.toHaveBeenCalled()
  })
})
