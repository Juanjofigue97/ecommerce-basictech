import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MAX_ROWS } from "@/lib/products/import-types"
import type { ResolvedRow } from "@/lib/products/import-types"

export async function POST(req: NextRequest) {
  let body: { rows: ResolvedRow[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const { rows } = body

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Sin filas para importar" }, { status: 400 })
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Máximo ${MAX_ROWS} filas por importación` }, { status: 400 })
  }

  try {
    const result = await prisma.product.createMany({
      data: rows.map((r) => ({
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

    return NextResponse.json({ created: result.count })
  } catch (error) {
    console.error("Error importing products:", error)
    return NextResponse.json(
      {
        error:
          "Error al importar. Es posible que algunos slugs se hayan creado entre la validación y el envío. Volvé a validar el archivo.",
      },
      { status: 500 },
    )
  }
}
