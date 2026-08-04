import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = { params: Promise<{ productId: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { productId } = await params

    await prisma.favorite.deleteMany({
      where: { userId: session.user.id, productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting favorite:", error)
    return NextResponse.json({ error: "Error deleting favorite" }, { status: 500 })
  }
}
