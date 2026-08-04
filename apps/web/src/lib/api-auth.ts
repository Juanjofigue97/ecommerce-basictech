import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function requireAdmin() {
  const session = await auth()

  if (!session?.user?.roleId) {
    return {
      session: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }

  return { session, response: null }
}
