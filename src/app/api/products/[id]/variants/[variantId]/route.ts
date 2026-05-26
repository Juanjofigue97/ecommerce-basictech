import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string; variantId: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { variantId } = await params

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        values: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ ...variant, price: variant.price ? Number(variant.price) : null })
  } catch (error) {
    console.error("Error fetching variant:", error)
    return NextResponse.json({ error: "Error fetching variant" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { variantId } = await params
    const body = await request.json()

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku: body.sku,
        stock: body.stock,
        price: body.price ?? null,
        isActive: body.isActive,
      },
      include: {
        values: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ ...variant, price: variant.price ? Number(variant.price) : null })
  } catch (error) {
    console.error("Error updating variant:", error)
    return NextResponse.json({ error: "Error updating variant" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { variantId } = await params

    await prisma.productVariant.delete({ where: { id: variantId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting variant:", error)
    return NextResponse.json({ error: "Error deleting variant" }, { status: 500 })
  }
}
