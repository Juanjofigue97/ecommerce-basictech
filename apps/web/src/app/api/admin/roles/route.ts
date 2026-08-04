import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/api-auth"

export async function GET() {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true, permissions: true } },
        permissions: { include: { permission: true } },
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        isSystem: r.isSystem,
        userCount: r._count.users,
        permissionCount: r._count.permissions,
        permissions: r.permissions.map((rp) => rp.permission.key),
        createdAt: r.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Error fetching roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, permissions = [] } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre del rol es requerido" }, { status: 400 })
    }

    const permissionRecords = await prisma.permission.findMany({
      where: { key: { in: permissions } },
    })

    const role = await prisma.role.create({
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

    return NextResponse.json(
      {
        id: role.id,
        name: role.name,
        isSystem: role.isSystem,
        userCount: role._count.users,
        permissionCount: role._count.permissions,
        permissions: role.permissions.map((rp) => rp.permission.key),
        createdAt: role.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 409 })
    }
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Error creating role" }, { status: 500 })
  }
}
