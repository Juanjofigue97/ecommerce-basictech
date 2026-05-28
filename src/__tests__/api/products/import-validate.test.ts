import { describe, it, expect, vi, beforeEach } from "vitest"
import type { NextRequest } from "next/server"

// ─── mock prisma ANTES de importar el route ──────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: vi.fn() },
    brand: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
  },
}))

import { POST } from "@/app/api/products/import/validate/route"
import { prisma } from "@/lib/prisma"
import { MAX_ROWS } from "@/lib/products/import-types"

// ─── datos de referencia ─────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "cat-1", slug: "laptops", name: "Laptops" },
  { id: "cat-2", slug: "accesorios", name: "Accesorios" },
]
const BRANDS = [
  { id: "brand-1", slug: "lenovo", name: "Lenovo" },
  { id: "brand-2", slug: "logitech", name: "Logitech" },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_HEADERS = [
  "name", "slug", "description", "price", "comparePrice",
  "stock", "isNew", "isFeatured", "isActive", "categorySlug", "brandSlug",
]

function makeCSV(
  rows: Record<string, string>[],
  headers = DEFAULT_HEADERS,
): string {
  const headerLine = headers.join(",")
  const dataLines = rows.map((r) =>
    headers.map((h) => r[h] ?? "").join(","),
  )
  return [headerLine, ...dataLines].join("\n")
}

function makeRequest(csvContent: string): NextRequest {
  const file = new File([csvContent], "products.csv", { type: "text/csv" })
  const fd = new FormData()
  fd.append("file", file)
  return new Request("http://localhost/api/test", {
    method: "POST",
    body: fd,
  }) as unknown as NextRequest
}

const VALID_ROW: Record<string, string> = {
  name: "Laptop Test",
  slug: "laptop-test",
  description: "Una laptop genial",
  price: "1500000",
  comparePrice: "1800000",
  stock: "10",
  isNew: "false",
  isFeatured: "false",
  isActive: "true",
  categorySlug: "laptops",
  brandSlug: "lenovo",
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe("POST /api/products/import/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.category.findMany).mockResolvedValue(CATEGORIES as never)
    vi.mocked(prisma.brand.findMany).mockResolvedValue(BRANDS as never)
    vi.mocked(prisma.product.findMany).mockResolvedValue([])
  })

  // ── constante ──────────────────────────────────────────────────────────────

  it("MAX_ROWS es 500", () => {
    expect(MAX_ROWS).toBe(500)
  })

  // ── errores de estructura ──────────────────────────────────────────────────

  it("retorna 400 si no se envía ningún archivo", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: new FormData(),
    }) as unknown as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/requerido/i)
  })

  it("retorna 400 si el CSV no tiene las columnas obligatorias", async () => {
    const csv = makeCSV([{ name: "Laptop", slug: "laptop" }], ["name", "slug"])
    const res = await POST(makeRequest(csv))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/faltantes/i)
  })

  it("retorna 400 si el archivo no tiene filas de datos", async () => {
    const csv = DEFAULT_HEADERS.join(",") // solo headers, sin data
    const res = await POST(makeRequest(csv))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/filas/i)
  })

  it("retorna 400 si supera MAX_ROWS filas", async () => {
    const rows = Array.from({ length: MAX_ROWS + 1 }, (_, i) => ({
      ...VALID_ROW,
      slug: `slug-${i}`,
    }))
    const csv = makeCSV(rows)
    const res = await POST(makeRequest(csv))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/máximo/i)
  })

  // ── fila válida ────────────────────────────────────────────────────────────

  it("marca una fila correcta como válida", async () => {
    const res = await POST(makeRequest(makeCSV([VALID_ROW])))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.validCount).toBe(1)
    expect(body.invalidCount).toBe(0)
    expect(body.rows[0].status).toBe("valid")
  })

  it("resolved tiene los datos correctamente parseados", async () => {
    const res = await POST(makeRequest(makeCSV([VALID_ROW])))
    const { resolved } = (await res.json()).rows[0]
    expect(resolved.name).toBe("Laptop Test")
    expect(resolved.slug).toBe("laptop-test")
    expect(resolved.price).toBe(1500000)
    expect(resolved.comparePrice).toBe(1800000)
    expect(resolved.stock).toBe(10)
    expect(resolved.isNew).toBe(false)
    expect(resolved.isActive).toBe(true)
    expect(resolved.categoryId).toBe("cat-1")
    expect(resolved.brandId).toBe("brand-1")
  })

  it("retorna el reporte con totalRows, validCount e invalidCount", async () => {
    const csv = makeCSV([
      VALID_ROW,
      { ...VALID_ROW, slug: "laptop-test-2", name: "Laptop 2" },
      { ...VALID_ROW, slug: "slug invalido con espacios", name: "Malo" },
    ])
    const body = await (await POST(makeRequest(csv))).json()
    expect(body.totalRows).toBe(3)
    expect(body.validCount).toBe(2)
    expect(body.invalidCount).toBe(1)
  })

  // ── validaciones de slug ───────────────────────────────────────────────────

  it("detecta slug con mayúsculas", async () => {
    const res = await POST(makeRequest(makeCSV([{ ...VALID_ROW, slug: "Laptop-Test" }])))
    const row = (await res.json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /slug/i.test(e))).toBe(true)
  })

  it("detecta slug con espacios", async () => {
    const res = await POST(makeRequest(makeCSV([{ ...VALID_ROW, slug: "mi producto" }])))
    expect((await res.json()).rows[0].status).toBe("invalid")
  })

  it("detecta slug duplicado dentro del mismo archivo", async () => {
    const csv = makeCSV([
      VALID_ROW,
      { ...VALID_ROW, name: "Laptop Copia" }, // mismo slug
    ])
    const body = await (await POST(makeRequest(csv))).json()
    expect(body.invalidCount).toBe(1)
    expect(
      body.rows[1].errors.some((e: string) => /duplicado/i.test(e)),
    ).toBe(true)
  })

  it("detecta slug que ya existe en la base de datos", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { slug: "laptop-test" },
    ] as never)
    const res = await POST(makeRequest(makeCSV([VALID_ROW])))
    const row = (await res.json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /ya existe/i.test(e))).toBe(true)
  })

  // ── validaciones de categoría y marca ─────────────────────────────────────

  it("detecta categorySlug inexistente en el sistema", async () => {
    const csv = makeCSV([{ ...VALID_ROW, categorySlug: "categoria-inexistente" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /categor/i.test(e))).toBe(true)
  })

  it("detecta brandSlug inexistente en el sistema", async () => {
    const csv = makeCSV([{ ...VALID_ROW, brandSlug: "marca-inexistente" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /marca/i.test(e))).toBe(true)
  })

  it("detecta categorySlug vacío", async () => {
    const csv = makeCSV([{ ...VALID_ROW, categorySlug: "" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
  })

  // ── validaciones numéricas ─────────────────────────────────────────────────

  it("detecta precio no numérico", async () => {
    const csv = makeCSV([{ ...VALID_ROW, price: "precio-invalido" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /precio/i.test(e))).toBe(true)
  })

  it("detecta precio igual a cero", async () => {
    const csv = makeCSV([{ ...VALID_ROW, price: "0" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
  })

  it("detecta stock negativo", async () => {
    const csv = makeCSV([{ ...VALID_ROW, stock: "-5" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /stock/i.test(e))).toBe(true)
  })

  it("acepta stock igual a cero", async () => {
    const csv = makeCSV([{ ...VALID_ROW, stock: "0" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("valid")
  })

  it("acepta comparePrice vacío (es opcional)", async () => {
    const csv = makeCSV([{ ...VALID_ROW, comparePrice: "" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("valid")
    expect(row.resolved.comparePrice).toBeUndefined()
  })

  // ── validaciones de booleanos ──────────────────────────────────────────────

  it("detecta isNew con valor inválido", async () => {
    const csv = makeCSV([{ ...VALID_ROW, isNew: "si" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("invalid")
    expect(row.errors.some((e: string) => /isNew/i.test(e))).toBe(true)
  })

  it('acepta booleanos "1" y "0"', async () => {
    const csv = makeCSV([{ ...VALID_ROW, isNew: "1", isFeatured: "0", isActive: "1" }])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.status).toBe("valid")
    expect(row.resolved.isNew).toBe(true)
    expect(row.resolved.isFeatured).toBe(false)
  })

  it("rowIndex empieza en 1 (no en 0)", async () => {
    const csv = makeCSV([VALID_ROW])
    const row = (await (await POST(makeRequest(csv))).json()).rows[0]
    expect(row.rowIndex).toBe(1)
  })
})
