import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "El id del producto es requerido"),
        price: z
          .number()
          .finite("El precio debe ser un número válido")
          .positive("El precio debe ser mayor a 0"),
      })
    )
    .nonempty("Debes incluir al menos un producto"),
})

export async function PATCH(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }

    const { items } = result.data

    const ids = items.map((item) => item.id)
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    const existingIds = new Set(existingProducts.map((p) => p.id))
    const missingIds = ids.filter((id) => !existingIds.has(id))

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Algunos productos no existen", missingIds },
        { status: 404 }
      )
    }

    const updated = await prisma.$transaction(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: { price: item.price },
        })
      )
    )

    return NextResponse.json({ success: true, updated: updated.length })
  } catch (error) {
    console.error("Error updating product prices:", error)
    return NextResponse.json(
      { error: "Error updating product prices" },
      { status: 500 }
    )
  }
}
