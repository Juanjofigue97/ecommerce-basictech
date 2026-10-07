/**
 * Populates real per-size stock (ProductVariant) for the 118 products already
 * imported from productos-import.csv, using the size breakdown from the
 * ORIGINAL raw inventory file (which import-products-csv.ts flattened into a
 * single `stock` total, since the product importer doesn't support variants).
 *
 * Matches rows by POSITION, not by re-deriving slugs: row N of the original
 * file corresponds to row N of productos-import.csv (both were produced by
 * iterating the same source top-to-bottom, one-to-one, no rows skipped or
 * reordered) — so we read productos-import.csv's already-correct `slug` for
 * each row instead of risking a second, possibly-diverging slugify pass.
 *
 * Creates (idempotently, upsert-by-slug) the "Talla" attribute with whatever
 * size values actually appear in the source file, links it to the Camisetas
 * and Buzos y Camperas categories, and creates one ProductVariant per
 * product per non-empty size column, with that column's quantity as stock.
 * Skips products that already have variants, so it's safe to re-run.
 *
 * Usage (from apps/web/, with DATABASE_URL pointing at the target database):
 *
 *   npx tsx prisma/import-variants-from-csv.ts <original.csv> <productos-import.csv>
 */
import "dotenv/config"
import { readFileSync } from "fs"
import { resolve } from "path"
import { parseCSV } from "../src/lib/export/csv-parser"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Column order in the original file, right after the product name column.
const SIZE_COLUMNS: { header: string; value: string; slug: string }[] = [
  { header: "16", value: "16", slug: "16" },
  { header: "18", value: "18", slug: "18" },
  { header: "20", value: "20", slug: "20" },
  { header: "22", value: "22", slug: "22" },
  { header: "24", value: "24", slug: "24" },
  { header: "26", value: "26", slug: "26" },
  { header: "28", value: "28", slug: "28" },
  { header: "30", value: "30", slug: "30" },
  { header: "s", value: "S", slug: "s" },
  { header: "m", value: "M", slug: "m" },
  { header: "l", value: "L", slug: "l" },
  { header: "xl", value: "XL", slug: "xl" },
  { header: "xxl", value: "XXL", slug: "xxl" },
  { header: "xxxl", value: "XXXL", slug: "xxxl" },
  { header: "unica", value: "Única", slug: "unica" },
]

async function main() {
  const [origArg, importedArg] = process.argv.slice(2)
  if (!origArg || !importedArg) {
    console.error(
      "Uso: npx tsx prisma/import-variants-from-csv.ts <original.csv> <productos-import.csv>",
    )
    process.exit(1)
  }

  const origText = readFileSync(resolve(process.cwd(), origArg), "latin1")
  const importedText = readFileSync(resolve(process.cwd(), importedArg), "utf-8")

  const orig = parseCSV(origText)
  const imported = parseCSV(importedText)

  if (orig.rows.length !== imported.rows.length) {
    console.error(
      `Los archivos no tienen el mismo número de filas (${orig.rows.length} vs ${imported.rows.length}) — no puedo emparejar por posición con confianza. Abortando sin escribir nada.`,
    )
    process.exit(1)
  }

  // ── Talla attribute: create/reuse, and make sure every needed value exists ──
  let tallaAttr = await prisma.attribute.findUnique({
    where: { slug: "talla" },
    include: { values: true },
  })
  if (!tallaAttr) {
    tallaAttr = await prisma.attribute.create({
      data: { name: "Talla", slug: "talla" },
      include: { values: true },
    })
  }

  const valueIdBySlug: Record<string, string> = Object.fromEntries(
    tallaAttr.values.map((v) => [v.slug, v.id]),
  )
  for (const size of SIZE_COLUMNS) {
    if (valueIdBySlug[size.slug]) continue
    const created = await prisma.attributeValue.create({
      data: { value: size.value, slug: size.slug, attributeId: tallaAttr.id },
    })
    valueIdBySlug[size.slug] = created.id
  }

  const categorySlugs = [...new Set(imported.rows.map((r) => r.categoryslug).filter(Boolean))]
  const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs } } })
  for (const cat of categories) {
    await prisma.categoryAttribute.upsert({
      where: { categoryId_attributeId: { categoryId: cat.id, attributeId: tallaAttr.id } },
      update: {},
      create: { categoryId: cat.id, attributeId: tallaAttr.id },
    })
  }
  console.log(`Atributo "Talla" listo, ligado a: ${categories.map((c) => c.name).join(", ")}`)

  // ── Variants per product, matched by row position ──────────────────────────
  let productsWithVariants = 0
  let variantsCreated = 0
  let skippedExisting = 0
  let skippedNotFound = 0

  for (let i = 0; i < imported.rows.length; i++) {
    const slug = imported.rows[i].slug
    const origRow = orig.rows[i]
    if (!slug) continue

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { _count: { select: { variants: true } } },
    })
    if (!product) {
      skippedNotFound++
      continue
    }
    if (product._count.variants > 0) {
      skippedExisting++
      continue
    }

    let createdForThisProduct = 0
    for (const size of SIZE_COLUMNS) {
      const raw = origRow[size.header]
      const qty = raw ? parseInt(raw.replace(/[^\d]/g, ""), 10) : 0
      if (!qty || qty <= 0) continue

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          label: size.value,
          stock: qty,
          values: {
            create: [{ attributeValueId: valueIdBySlug[size.slug] }],
          },
        },
      })
      void variant
      createdForThisProduct++
      variantsCreated++
    }

    if (createdForThisProduct > 0) productsWithVariants++
  }

  console.log(`\nProductos con variantes creadas: ${productsWithVariants}`)
  console.log(`Variantes creadas en total: ${variantsCreated}`)
  console.log(`Productos saltados (ya tenían variantes): ${skippedExisting}`)
  console.log(`Productos saltados (slug no encontrado en la base): ${skippedNotFound}`)
  console.log("\nListo.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
