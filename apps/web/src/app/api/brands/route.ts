import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { transformBrand } from "@/lib/transformers"
import { requireAdmin } from "@/lib/api-auth"

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(brands.map(transformBrand))
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json(
      { error: "Error fetching brands" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()

    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        slug: body.slug,
        logo: body.logo,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(transformBrand(brand), { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una marca con ese slug" },
        { status: 409 }
      )
    }
    console.error("Error creating brand:", error)
    return NextResponse.json(
      { error: "Error creating brand" },
      { status: 500 }
    )
  }
}
