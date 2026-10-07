/**
 * One-time production bootstrap: creates the base categories and brands a
 * fresh, otherwise-empty database needs before you can import products
 * (via prisma/import-products-csv.ts or the admin UI) — neither route
 * creates categories/brands on the fly, both require them to already exist.
 *
 * Unlike prisma/seed.ts (dev-only demo data — deletes everything first),
 * this script is purely additive: it upserts by slug, so it's safe to run
 * more than once and won't touch anything that already exists.
 *
 * Usage (from apps/web/, with DATABASE_URL pointing at the target database):
 *
 *   npx tsx prisma/bootstrap-catalog.ts
 */
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CATEGORIES = [
  { name: "Camisetas", slug: "camisetas", icon: "Shirt" },
  { name: "Shorts", slug: "shorts", icon: "ShoppingBag" },
  { name: "Buzos y Camperas", slug: "buzos-camperas", icon: "Wind" },
  { name: "Calzado Fútbol", slug: "calzado-futbol", icon: "Footprints" },
  { name: "Accesorios", slug: "accesorios", icon: "Package" },
]

const BRANDS = [
  { name: "Adidas", slug: "adidas" },
  { name: "Crower", slug: "crower" },
  { name: "Kappa", slug: "kappa" },
  { name: "New Balance", slug: "new-balance" },
  { name: "Nike", slug: "nike" },
  { name: "On", slug: "on" },
  { name: "Puma", slug: "puma" },
  { name: "Reebok", slug: "reebok" },
  { name: "Umbro", slug: "umbro" },
  { name: "Under Armour", slug: "under-armour" },
  { name: "Sin Marca / Réplica", slug: "sin-marca-replica" },
]

async function main() {
  let createdCategories = 0
  for (const cat of CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    if (result.createdAt.getTime() === result.updatedAt.getTime()) createdCategories++
  }
  console.log(`Categorías: ${createdCategories} creadas, ${CATEGORIES.length - createdCategories} ya existían.`)

  let createdBrands = 0
  for (const brand of BRANDS) {
    const result = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    })
    if (result.createdAt.getTime() === result.updatedAt.getTime()) createdBrands++
  }
  console.log(`Marcas: ${createdBrands} creadas, ${BRANDS.length - createdBrands} ya existían.`)

  console.log("\nListo.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
