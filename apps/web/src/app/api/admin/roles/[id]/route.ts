import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/api-auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { name, permissions = [] } = body

    const existing = await prisma.role.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "No se puede modificar un rol del sistema" },
        { status: 403 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre del rol es requerido" }, { status: 400 })
    }

    const permissionRecords = await prisma.permission.findMany({
      where: { key: { in: permissions } },
    })

    await prisma.rolePermission.deleteMany({ where: { roleId: id } })

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: name.trim(),
        permissions: {
          create: permissionRecords.map((p) => ({ permissionId: p.id })),
        },
      },
      include: {
        _count: { select: { users: true, permissions: true } },
        permissions: { include: { permission: true } },
      },
    })

    return NextResponse.json({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissionCount: role._count.permissions,
      permissions: role.permissions.map((rp) => rp.permission.key),
      createdAt: role.createdAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 409 })
    }
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Error updating role" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params

    const existing = await prisma.role.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "No se puede eliminar un rol del sistema" },
        { status: 403 }
      )
    }

    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Error deleting role" }, { status: 500 })
  }
}
