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
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nit: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (type) where.type = type
    if (status) where.status = status

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: { select: { purchaseOrders: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit ? Number(limit) : undefined,
        skip: offset ? Number(offset) : undefined,
      }),
      prisma.supplier.count({ where }),
    ])

    return NextResponse.json({ suppliers, total })
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ error: "Error fetching suppliers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()

    const supplier = await prisma.supplier.create({
      data: {
        nit: body.nit,
        name: body.name,
        phone: body.phone,
        address: body.address,
        type: body.type || "NATURAL",
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un proveedor con ese NIT" }, { status: 409 })
    }
    console.error("Error creating supplier:", error)
    return NextResponse.json({ error: "Error creating supplier" }, { status: 500 })
  }
}
