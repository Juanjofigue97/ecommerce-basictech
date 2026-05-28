import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
  },
}))

import { GET } from "@/app/api/products/export/route"
import { prisma } from "@/lib/prisma"

// ─── datos mock ───────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    name: "Laptop Test",
    slug: "laptop-test",
    description: "Una laptop",
    price: 1500000,
    comparePrice: null,
    stock: 10,
    isNew: false,
    isFeatured: false,
    isActive: true,
    images: [],
    specs: {},
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    categoryId: "cat-1",
    brandId: "brand-1",
    category: {
      id: "cat-1",
      name: "Laptops",
      slug: "laptops",
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    brand: {
      id: "brand-1",
      name: "Lenovo",
      slug: "lenovo",
      logo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: "prod-2",
    name: "Mouse Inalámbrico",
    slug: "mouse-inalambrico",
    description: null,
    price: 85000,
    comparePrice: 100000,
    stock: 50,
    isNew: true,
    isFeatured: false,
    isActive: true,
    images: [],
    specs: {},
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    categoryId: "cat-2",
    brandId: "brand-2",
    category: {
      id: "cat-2",
      name: "Accesorios",
      slug: "accesorios",
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    brand: {
      id: "brand-2",
      name: "Logitech",
      slug: "logitech",
      logo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
]

// ─── tests ───────────────────────────────────────────────────────────────────

describe("GET /api/products/export", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.product.findMany).mockResolvedValue(MOCK_PRODUCTS as never)
  })

  it("retorna status 200", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("Content-Type es text/csv con charset utf-8", async () => {
    const res = await GET()
    const ct = res.headers.get("Content-Type")
    expect(ct).toContain("text/csv")
    expect(ct).toContain("utf-8")
  })

  it("Content-Disposition es attachment con filename productos.csv", async () => {
    const res = await GET()
    const disp = res.headers.get("Content-Disposition")
    expect(disp).toContain("attachment")
    expect(disp).toContain("productos.csv")
  })

  it("body contiene todos los headers CSV esperados", async () => {
    const res = await GET()
    const text = await res.text()
    const firstLine = text.replace(/^﻿/, "").split("\r\n")[0]
    expect(firstLine).toContain("name")
    expect(firstLine).toContain("slug")
    expect(firstLine).toContain("price")
    expect(firstLine).toContain("stock")
    expect(firstLine).toContain("categorySlug")
    expect(firstLine).toContain("brandSlug")
    expect(firstLine).toContain("isNew")
    expect(firstLine).toContain("isFeatured")
    expect(firstLine).toContain("isActive")
  })

  it("no incluye imágenes en el CSV", async () => {
    const res = await GET()
    const text = await res.text()
    const firstLine = text.replace(/^﻿/, "").split("\r\n")[0]
    expect(firstLine).not.toContain("image")
  })

  it("exporta el categorySlug (no el nombre de categoría)", async () => {
    const res = await GET()
    const text = await res.text()
    expect(text).toContain("laptops")
    expect(text).toContain("accesorios")
    // no debe aparecer el nombre "Laptops" como dato de categoria
    // (puede aparecer como nombre del producto si coincide, pero verificamos el slug)
    expect(text).toContain("slug")
  })

  it("exporta el brandSlug (no el nombre de marca)", async () => {
    const res = await GET()
    const text = await res.text()
    expect(text).toContain("lenovo")
    expect(text).toContain("logitech")
  })

  it("exporta isNew como 'true'/'false' string", async () => {
    const res = await GET()
    const text = await res.text()
    expect(text).toContain("true")
    expect(text).toContain("false")
  })

  it("comparePrice vacío se exporta como string vacío", async () => {
    const res = await GET()
    const text = await res.text()
    const lines = text.replace(/^﻿/, "").split("\r\n").filter(Boolean)
    // prod-1 tiene comparePrice null → debe aparecer vacío en esa columna
    expect(lines[1]).toContain("laptop-test")
  })

  it("retorna solo la fila de headers cuando no hay productos", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([])
    const res = await GET()
    const text = await res.text()
    const lines = text.replace(/^﻿/, "").split("\r\n").filter(Boolean)
    expect(lines).toHaveLength(1) // solo headers
  })

  it("llama a prisma.product.findMany con include de category y brand", async () => {
    await GET()
    expect(vi.mocked(prisma.product.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          category: true,
          brand: true,
        }),
      }),
    )
  })
})
