import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"

// Self-service: any logged-in user (staff or customer) can edit their own
// account. Only name/email/phone/password are accepted — never roleId or
// status, so this can never be used to escalate privileges.
export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.name) data.name = body.name
    if (body.email) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.password) {
      if (typeof body.password !== "string" || body.password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        )
      }
      data.password = await bcrypt.hash(body.password, 10)
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 })
    }
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 })
  }
}
