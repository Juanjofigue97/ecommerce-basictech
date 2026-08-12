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

// Unlike requireAdmin() (which only checks the caller is logged in with ANY
// role), this enforces the caller's role is exactly "Administrador".
export async function requireAdministrator() {
  const session = await auth()

  if (!session?.user?.roleId) {
    return {
      session: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }

  if (session.user.roleName !== "Administrador") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Solo un administrador puede realizar esta acción" },
        { status: 403 }
      ),
    }
  }

  return { session, response: null }
}
