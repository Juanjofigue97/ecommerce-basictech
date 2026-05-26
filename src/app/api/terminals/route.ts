import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const terminals = await prisma.terminal.findMany({
      include: { _count: { select: { sessions: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(
      terminals.map((t) => ({
        id: t.id,
        name: t.name,
        isActive: t.isActive,
        sessionCount: t._count.sessions,
        createdAt: t.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("GET /api/terminals:", error)
    return NextResponse.json({ error: "Error al obtener terminales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    const terminal = await prisma.terminal.create({
      data: { name: body.name.trim(), isActive: body.isActive ?? true },
      include: { _count: { select: { sessions: true } } },
    })
    return NextResponse.json(
      {
        id: terminal.id,
        name: terminal.name,
        isActive: terminal.isActive,
        sessionCount: terminal._count.sessions,
        createdAt: terminal.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/terminals:", error)
    return NextResponse.json({ error: "Error al crear terminal" }, { status: 500 })
  }
}
