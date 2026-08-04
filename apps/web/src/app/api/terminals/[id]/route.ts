import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const terminal = await prisma.terminal.findUnique({
      where: { id },
      include: { _count: { select: { sessions: true } } },
    })
    if (!terminal) return NextResponse.json({ error: "Terminal no encontrada" }, { status: 404 })
    return NextResponse.json({
      id: terminal.id,
      name: terminal.name,
      isActive: terminal.isActive,
      sessionCount: terminal._count.sessions,
      createdAt: terminal.createdAt.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Error al obtener terminal" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    const terminal = await prisma.terminal.update({
      where: { id },
      data: {
        name: body.name.trim(),
        isActive: body.isActive ?? true,
      },
      include: { _count: { select: { sessions: true } } },
    })
    return NextResponse.json({
      id: terminal.id,
      name: terminal.name,
      isActive: terminal.isActive,
      sessionCount: terminal._count.sessions,
      createdAt: terminal.createdAt.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Error al actualizar terminal" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const terminal = await prisma.terminal.findUnique({
      where: { id },
      include: { _count: { select: { sessions: true } } },
    })
    if (!terminal) return NextResponse.json({ error: "Terminal no encontrada" }, { status: 404 })
    if (terminal._count.sessions > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${terminal._count.sessions} sesión(es) registrada(s)` },
        { status: 409 }
      )
    }
    await prisma.terminal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar terminal" }, { status: 500 })
  }
}
