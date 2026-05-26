import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const attributes = await prisma.attribute.findMany({
      include: {
        values: { orderBy: { value: "asc" } },
        _count: { select: { values: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(attributes)
  } catch (error) {
    console.error("Error fetching attributes:", error)
    return NextResponse.json({ error: "Error fetching attributes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug } = await request.json()

    const attribute = await prisma.attribute.create({
      data: { name, slug },
      include: {
        values: true,
        _count: { select: { values: true } },
      },
    })

    return NextResponse.json(attribute, { status: 201 })
  } catch (error) {
    console.error("Error creating attribute:", error)
    return NextResponse.json({ error: "Error creating attribute" }, { status: 500 })
  }
}
