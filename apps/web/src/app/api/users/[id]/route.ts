import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import bcrypt from "bcryptjs"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

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
  const { session, response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    if (id === session.user.id && (body.roleId !== undefined || body.status !== undefined)) {
      return NextResponse.json(
        { error: "No podés cambiar tu propio rol o estado" },
        { status: 403 }
      )
    }

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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error updating user" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params

    if (id === session.user.id) {
      return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 403 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar: el usuario tiene pedidos, sesiones de caja u otros registros asociados" },
        { status: 409 }
      )
    }
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 })
  }
}
