import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { transformProduct } from "@/lib/transformers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { include: { category: true, brand: true } } },
    })

    return NextResponse.json(
      favorites.map((f) => ({
        ...transformProduct(f.product),
        favoritedAt: f.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Error fetching favorites" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body.productId) {
      return NextResponse.json({ error: "productId es requerido" }, { status: 400 })
    }

    const favorite = await prisma.favorite.create({
      data: { userId: session.user.id, productId: body.productId },
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Already favorited — treat as success, idempotent
      return NextResponse.json({ success: true })
    }
    console.error("Error creating favorite:", error)
    return NextResponse.json({ error: "Error creating favorite" }, { status: 500 })
  }
}
