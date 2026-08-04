import { prisma } from "@/lib/prisma"
import { csvResponse } from "@/lib/export/server"
import type { ExportColumn } from "@/lib/export/types"
import { requireAdmin } from "@/lib/api-auth"

type ProductRow = Awaited<ReturnType<typeof fetchProducts>>[number]

async function fetchProducts() {
  return prisma.product.findMany({
    include: { category: true, brand: true },
    orderBy: { name: "asc" },
  })
}

const COLUMNS: ExportColumn<ProductRow>[] = [
  { key: "name", label: "name" },
  { key: "slug", label: "slug" },
  { key: "description", label: "description", format: (v) => (v != null ? String(v) : "") },
  { key: "price", label: "price", format: (v) => Number(v) },
  { key: "comparePrice", label: "comparePrice", format: (v) => (v != null ? Number(v) : "") },
  { key: "stock", label: "stock", format: (v) => Number(v) },
  { key: "isNew", label: "isNew", format: (v) => (v ? "true" : "false") },
  { key: "isFeatured", label: "isFeatured", format: (v) => (v ? "true" : "false") },
  { key: "isActive", label: "isActive", format: (v) => (v ? "true" : "false") },
  { key: "category.slug", label: "categorySlug" },
  { key: "brand.slug", label: "brandSlug" },
]

export async function GET() {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  const products = await fetchProducts()
  return csvResponse({ filename: "productos", columns: COLUMNS, data: products })
}
