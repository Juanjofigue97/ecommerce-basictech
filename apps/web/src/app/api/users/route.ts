import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get("roleId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (roleId) where.roleId = roleId
    if (status) where.status = status.toUpperCase()

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        roleId: true,
        role: { select: { name: true } },
        status: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: { select: { total: true }, where: { channel: "ONLINE" } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        roleId: user.roleId,
        roleName: user.role?.name ?? null,
        status: user.status.toLowerCase(),
        createdAt: user.createdAt.toISOString(),
        orders: user._count.orders,
        totalSpent: user.orders.reduce((sum, o) => sum + Number(o.total), 0),
      }))
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const hashedPassword = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        phone: body.phone,
        roleId: body.roleId ?? null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: { select: { name: true } },
        status: true,
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role?.name ?? null,
        status: user.status.toLowerCase(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error creating user" }, { status: 500 })
  }
}
