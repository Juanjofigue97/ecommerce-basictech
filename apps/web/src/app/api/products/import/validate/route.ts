import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseCSV } from "@/lib/export/csv-parser"
import { MAX_ROWS } from "@/lib/products/import-types"
import type { ValidatedRow, ValidationReport } from "@/lib/products/import-types"
import { requireAdmin } from "@/lib/api-auth"

const REQUIRED_HEADERS = [
  "name", "slug", "price", "stock",
  "isnew", "isfeatured", "isactive",
  "categoryslug", "brandslug",
]

function parseBool(v: string): boolean | null {
  const s = v.toLowerCase().trim()
  if (s === "true" || s === "1") return true
  if (s === "false" || s === "0") return false
  return null
}

export async function POST(req: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser multipart/form-data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Archivo requerido (campo: file)" }, { status: 400 })

  const text = await file.text()
  const { headers, rows } = parseCSV(text)

  // Validar headers requeridos
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Columnas faltantes: ${missing.join(", ")}` },
      { status: 400 },
    )
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene filas de datos" }, { status: 400 })
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ROWS} filas por importación (el archivo tiene ${rows.length})` },
      { status: 400 },
    )
  }

  // Recolectar slugs para validación en batch
  const categorySlugs = [...new Set(rows.map((r) => r.categoryslug).filter(Boolean))]
  const brandSlugs = [...new Set(rows.map((r) => r.brandslug).filter(Boolean))]
  const productSlugs = [...new Set(rows.map((r) => r.slug).filter(Boolean))]

  const [categories, brands, existingProducts] = await Promise.all([
    prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true, slug: true, name: true },
    }),
    prisma.brand.findMany({
      where: { slug: { in: brandSlugs } },
      select: { id: true, slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { slug: { in: productSlugs } },
      select: { slug: true },
    }),
  ])

  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c]))
  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b]))
  const existingSlugSet = new Set(existingProducts.map((p) => p.slug))
  const seenSlugs = new Set<string>()

  const validatedRows: ValidatedRow[] = rows.map((raw, idx) => {
    const rowIndex = idx + 1
    const errors: string[] = []

    const name = raw.name
    const slug = raw.slug
    const description = raw.description ?? ""
    const priceStr = raw.price
    const comparePriceStr = raw.compareprice ?? ""
    const stockStr = raw.stock
    const catSlug = raw.categoryslug
    const brandSlug = raw.brandslug

    // name
    if (!name) errors.push("El nombre es requerido")

    // slug
    if (!slug) {
      errors.push("El slug es requerido")
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.push('El slug debe contener solo minúsculas, números y guiones (ej: "mi-producto")')
    } else if (existingSlugSet.has(slug)) {
      errors.push(`El slug "${slug}" ya existe en la base de datos`)
    } else if (seenSlugs.has(slug)) {
      errors.push(`El slug "${slug}" está duplicado dentro del archivo`)
    }
    if (slug) seenSlugs.add(slug)

    // price
    let price = 0
    if (!priceStr) {
      errors.push("El precio es requerido")
    } else {
      const n = Number(priceStr.replace(/[^\d.]/g, ""))
      if (isNaN(n) || n <= 0) errors.push("El precio debe ser un número mayor a 0")
      else price = n
    }

    // comparePrice (optional)
    let comparePrice: number | undefined
    if (comparePriceStr) {
      const n = Number(comparePriceStr.replace(/[^\d.]/g, ""))
      if (isNaN(n) || n <= 0) errors.push("El precio comparativo debe ser mayor a 0")
      else comparePrice = n
    }

    // stock
    let stock = 0
    if (stockStr === "" || stockStr === undefined) {
      errors.push("El stock es requerido")
    } else {
      const n = parseInt(stockStr, 10)
      if (isNaN(n) || n < 0) errors.push("El stock debe ser un número entero mayor o igual a 0")
      else stock = n
    }

    // booleans
    const isNewVal = parseBool(raw.isnew ?? "")
    if (isNewVal === null) errors.push('isNew debe ser "true" o "false"')

    const isFeaturedVal = parseBool(raw.isfeatured ?? "")
    if (isFeaturedVal === null) errors.push('isFeatured debe ser "true" o "false"')

    const isActiveVal = parseBool(raw.isactive ?? "")
    if (isActiveVal === null) errors.push('isActive debe ser "true" o "false"')

    // category
    let categoryId: string | undefined
    if (!catSlug) {
      errors.push("La categoría es requerida (categorySlug)")
    } else {
      const cat = categoryMap[catSlug]
      if (!cat) errors.push(`La categoría "${catSlug}" no existe en el sistema`)
      else categoryId = cat.id
    }

    // brand
    let brandId: string | undefined
    if (!brandSlug) {
      errors.push("La marca es requerida (brandSlug)")
    } else {
      const br = brandMap[brandSlug]
      if (!br) errors.push(`La marca "${brandSlug}" no existe en el sistema`)
      else brandId = br.id
    }

    if (errors.length > 0) {
      return { rowIndex, raw, status: "invalid" as const, errors }
    }

    return {
      rowIndex,
      raw,
      status: "valid" as const,
      errors: [],
      resolved: {
        name: name!,
        slug: slug!,
        description,
        price,
        comparePrice,
        stock,
        isNew: isNewVal!,
        isFeatured: isFeaturedVal!,
        isActive: isActiveVal!,
        categoryId: categoryId!,
        brandId: brandId!,
      },
    }
  })

  const report: ValidationReport = {
    totalRows: rows.length,
    validCount: validatedRows.filter((r) => r.status === "valid").length,
    invalidCount: validatedRows.filter((r) => r.status === "invalid").length,
    rows: validatedRows,
  }

  return NextResponse.json(report)
}
