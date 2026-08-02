import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, roleId: true, role: { select: { name: true } }, status: true, createdAt: true },
    })
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    return NextResponse.json({ ...user, roleName: user.role?.name ?? null })
  } catch {
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.name) data.name = body.name
    if (body.email) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.password) data.password = await bcrypt.hash(body.password, 10)
    if (body.roleId !== undefined) data.roleId = body.roleId || null
    if (body.status) data.status = body.status.toUpperCase()

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, roleId: true, role: { select: { name: true } }, status: true },
    })

    return NextResponse.json({ ...user, roleName: user.role?.name ?? null })
  } catch {
    return NextResponse.json({ error: "Error updating user" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 })
  }
}
