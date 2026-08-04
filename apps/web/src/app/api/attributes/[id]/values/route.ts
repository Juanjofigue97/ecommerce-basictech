import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/api-auth"

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id: attributeId } = await params
    const { value, slug } = await request.json()

    const attributeValue = await prisma.attributeValue.create({
      data: { value, slug, attributeId },
    })

    return NextResponse.json(attributeValue, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un valor con ese slug para este atributo" },
        { status: 409 }
      )
    }
    console.error("Error creating attribute value:", error)
    return NextResponse.json({ error: "Error creating attribute value" }, { status: 500 })
  }
}
