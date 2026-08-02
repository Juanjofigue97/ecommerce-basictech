import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: attributeId } = await params
    const { value, slug } = await request.json()

    const attributeValue = await prisma.attributeValue.create({
      data: { value, slug, attributeId },
    })

    return NextResponse.json(attributeValue, { status: 201 })
  } catch (error) {
    console.error("Error creating attribute value:", error)
    return NextResponse.json({ error: "Error creating attribute value" }, { status: 500 })
  }
}
