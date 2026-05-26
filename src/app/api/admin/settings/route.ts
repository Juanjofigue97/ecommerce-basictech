import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SINGLETON_ID = "singleton"

export async function GET() {
  try {
    // Migrate old default "pen" → "cop" (safe: only runs if value is still the old default)
    await prisma.storeSettings.updateMany({
      where: { id: SINGLETON_ID, currency: "pen" },
      data: { currency: "cop" },
    })

    const settings = await prisma.storeSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, currency: "cop" },
      update: {},
    })

    return NextResponse.json({
      ...settings,
      shippingCost: Number(settings.shippingCost),
      freeShippingFrom: Number(settings.freeShippingFrom),
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Error fetching settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const settings = await prisma.storeSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...body },
      update: body,
    })

    return NextResponse.json({
      ...settings,
      shippingCost: Number(settings.shippingCost),
      freeShippingFrom: Number(settings.freeShippingFrom),
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Error updating settings" }, { status: 500 })
  }
}
