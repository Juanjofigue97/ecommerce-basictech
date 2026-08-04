import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const source = searchParams.get("source")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { document: { contains: search, mode: "insensitive" } },
      ]
    }

    if (source) where.source = source
    if (status) where.status = status

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit ? Number(limit) : undefined,
        skip: offset ? Number(offset) : undefined,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({ customers, total })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Error fetching customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        document: body.document,
        source: body.source || "PHYSICAL",
        userId: body.userId,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un cliente con ese email" }, { status: 409 })
    }
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Error creating customer" }, { status: 500 })
  }
}
