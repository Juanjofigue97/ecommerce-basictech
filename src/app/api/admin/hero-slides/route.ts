import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: "asc" },
    })
    return NextResponse.json(slides)
  } catch (error) {
    console.error("Error fetching hero slides:", error)
    return NextResponse.json({ error: "Error al obtener los slides" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const slide = await prisma.heroSlide.create({ data: body })
    return NextResponse.json(slide, { status: 201 })
  } catch (error) {
    console.error("Error creating hero slide:", error)
    return NextResponse.json({ error: "Error al crear el slide" }, { status: 500 })
  }
}
