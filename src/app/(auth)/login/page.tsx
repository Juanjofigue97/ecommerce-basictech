import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { LoginForm } from "@/components/auth/LoginForm"

export default async function LoginPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense fallback={<div className="text-center">Cargando...</div>}>
          <LoginForm
            storeName={settings?.name}
            storeDescription={settings?.description ?? undefined}
          />
        </Suspense>
      </div>
    </div>
  )
}
