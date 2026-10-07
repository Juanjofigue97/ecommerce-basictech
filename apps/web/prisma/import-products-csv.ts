/**
 * Imports a products CSV directly against the database, without going through
 * the browser at /admin/products/import-export. Same validation rules as
 * src/app/api/products/import/validate/route.ts (kept in sync manually — this
 * is a CLI mirror, not a shared module, to avoid coupling a Next.js route to
 * a standalone script's import graph).
 *
 * Usage (from apps/web/, with DATABASE_URL pointing at the target database):
 *
 *   npx tsx prisma/import-products-csv.ts ../productos-import.csv
 *
 * Required CSV headers: name, slug, price, stock, isNew, isFeatured,
 * isActive, categorySlug, brandSlug (description, comparePrice optional).
 * categorySlug/brandSlug must already exist in the target database.
 *
 * Aborts without writing anything if ANY row fails validation — this is an
 * all-or-nothing import, same as the admin UI requires you to fix every row
 * before the "Importar" button is enabled.
 */
import "dotenv/config"
import { readFileSync } from "fs"
import { resolve } from "path"
import { parseCSV } from "../src/lib/export/csv-parser"
import { MAX_ROWS } from "../src/lib/products/import-types"
import type { ResolvedRow } from "../src/lib/products/import-types"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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

async function main() {
  const filePathArg = process.argv[2]
  if (!filePathArg) {
    console.error("Uso: npx tsx prisma/import-products-csv.ts <ruta-al-csv>")
    process.exit(1)
  }

  const filePath = resolve(process.cwd(), filePathArg)
  const text = readFileSync(filePath, "utf-8")
  const { headers, rows } = parseCSV(text)

  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    console.error(`Columnas faltantes: ${missing.join(", ")}`)
    process.exit(1)
  }
  if (rows.length === 0) {
    console.error("El archivo no tiene filas de datos.")
    process.exit(1)
  }
  if (rows.length > MAX_ROWS) {
    console.error(`Máximo ${MAX_ROWS} filas por importación (el archivo tiene ${rows.length}).`)
    process.exit(1)
  }

  const categorySlugs = [...new Set(rows.map((r) => r.categoryslug).filter(Boolean))]
  const brandSlugs = [...new Set(rows.map((r) => r.brandslug).filter(Boolean))]
  const productSlugs = [...new Set(rows.map((r) => r.slug).filter(Boolean))]

  const [categories, brands, existingProducts] = await Promise.all([
    prisma.category.findMany({ where: { slug: { in: categorySlugs } }, select: { id: true, slug: true } }),
    prisma.brand.findMany({ where: { slug: { in: brandSlugs } }, select: { id: true, slug: true } }),
    prisma.product.findMany({ where: { slug: { in: productSlugs } }, select: { slug: true } }),
  ])
  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c]))
  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b]))
  const existingSlugSet = new Set(existingProducts.map((p) => p.slug))
  const seenSlugs = new Set<string>()

  const resolvedRows: ResolvedRow[] = []
  const errors: { row: number; name: string; problems: string[] }[] = []

  rows.forEach((raw, idx) => {
    const rowIndex = idx + 2 // +1 for 1-index, +1 for the header row
    const problems: string[] = []

    const name = raw.name
    const slug = raw.slug
    const description = raw.description ?? ""
    const priceStr = raw.price
    const comparePriceStr = raw.compareprice ?? ""
    const stockStr = raw.stock

    if (!name) problems.push("nombre requerido")

    if (!slug) {
      problems.push("slug requerido")
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      problems.push(`slug inválido: "${slug}"`)
    } else if (existingSlugSet.has(slug)) {
      problems.push(`slug ya existe en la base: "${slug}"`)
    } else if (seenSlugs.has(slug)) {
      problems.push(`slug duplicado en el archivo: "${slug}"`)
    }
    if (slug) seenSlugs.add(slug)

    let price = 0
    if (!priceStr) {
      problems.push("precio requerido")
    } else {
      const n = Number(priceStr.replace(/[^\d.]/g, ""))
      if (isNaN(n) || n <= 0) problems.push(`precio inválido: "${priceStr}"`)
      else price = n
    }

    let comparePrice: number | undefined
    if (comparePriceStr) {
      const n = Number(comparePriceStr.replace(/[^\d.]/g, ""))
      if (isNaN(n) || n <= 0) problems.push(`precio comparativo inválido: "${comparePriceStr}"`)
      else comparePrice = n
    }

    let stock = 0
    if (stockStr === "" || stockStr === undefined) {
      problems.push("stock requerido")
    } else {
      const n = parseInt(stockStr, 10)
      if (isNaN(n) || n < 0) problems.push(`stock inválido: "${stockStr}"`)
      else stock = n
    }

    const isNewVal = parseBool(raw.isnew ?? "")
    if (isNewVal === null) problems.push('isNew debe ser "true" o "false"')
    const isFeaturedVal = parseBool(raw.isfeatured ?? "")
    if (isFeaturedVal === null) problems.push('isFeatured debe ser "true" o "false"')
    const isActiveVal = parseBool(raw.isactive ?? "")
    if (isActiveVal === null) problems.push('isActive debe ser "true" o "false"')

    let categoryId: string | undefined
    if (!raw.categoryslug) {
      problems.push("categorySlug requerido")
    } else {
      const cat = categoryMap[raw.categoryslug]
      if (!cat) problems.push(`categoría no existe: "${raw.categoryslug}"`)
      else categoryId = cat.id
    }

    let brandId: string | undefined
    if (!raw.brandslug) {
      problems.push("brandSlug requerido")
    } else {
      const br = brandMap[raw.brandslug]
      if (!br) problems.push(`marca no existe: "${raw.brandslug}"`)
      else brandId = br.id
    }

    if (problems.length > 0) {
      errors.push({ row: rowIndex, name: name || "(sin nombre)", problems })
      return
    }

    resolvedRows.push({
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
    })
  })

  console.log(`Filas leídas: ${rows.length}`)
  console.log(`Válidas: ${resolvedRows.length}`)
  console.log(`Inválidas: ${errors.length}`)

  if (errors.length > 0) {
    console.log("\nNo se importó nada — corregí estas filas y volvé a correr el script:\n")
    for (const e of errors) {
      console.log(`  Fila ${e.row} (${e.name}): ${e.problems.join("; ")}`)
    }
    process.exit(1)
  }

  const result = await prisma.product.createMany({
    data: resolvedRows.map((r) => ({
      name: r.name,
      slug: r.slug,
      description: r.description || null,
      price: r.price,
      comparePrice: r.comparePrice ?? null,
      stock: r.stock,
      isNew: r.isNew,
      isFeatured: r.isFeatured,
      isActive: r.isActive,
      categoryId: r.categoryId,
      brandId: r.brandId,
      images: [],
      specs: {},
    })),
    skipDuplicates: false,
  })

  console.log(`\nListo. ${result.count} productos creados.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
