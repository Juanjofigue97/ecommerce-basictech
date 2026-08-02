import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      include: {
        values: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(
      variants.map((v) => ({
        ...v,
        price: v.price ? Number(v.price) : null,
      }))
    )
  } catch (error) {
    console.error("Error fetching variants:", error)
    return NextResponse.json({ error: "Error fetching variants" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    // body: { sku?, stock, price?, attributeValueIds: string[] }

    const variant = await prisma.productVariant.create({
      data: {
        sku: body.sku,
        stock: body.stock ?? 0,
        price: body.price ?? null,
        productId: id,
        values: {
          create: (body.attributeValueIds as string[]).map((attributeValueId) => ({
            attributeValueId,
          })),
        },
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

    return NextResponse.json(
      { ...variant, price: variant.price ? Number(variant.price) : null },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating variant:", error)
    return NextResponse.json({ error: "Error creating variant" }, { status: 500 })
  }
}
