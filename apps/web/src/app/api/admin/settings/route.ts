import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

const SINGLETON_ID = "singleton"

// Public: the storefront header reads this to show the store name/logo.
export async function GET() {
  try {
    await prisma.storeSettings.updateMany({
      where: { id: SINGLETON_ID, currency: "pen" },
      data: { currency: "cop" },
    })

    const settings = await prisma.storeSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, currency: "cop" },
      update: {},
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Error fetching settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()

    const settings = await prisma.storeSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...body },
      update: body,
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Error updating settings" }, { status: 500 })
  }
}
