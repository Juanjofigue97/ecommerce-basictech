"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { User, LogOut, Settings, Package, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AuthSection() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="hidden h-9 w-20 animate-pulse rounded-md bg-muted sm:block" />
  }

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="hidden h-9 gap-1 px-2 sm:flex">
            <User className="h-4 w-4" />
            <span className="max-w-24 truncate text-sm">
              {session.user?.name?.split(" ")[0]}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{session.user?.name}</span>
              <span className="text-xs text-muted-foreground">{session.user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/orders" className="cursor-pointer">
              <Package className="mr-2 h-4 w-4" />
              Mis Pedidos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </DropdownMenuItem>
          {session.user?.roleName === "Administrador" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Panel Admin
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link href="/login">
        <Button variant="outline" size="sm">
          Ingresar
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm">Registrarse</Button>
      </Link>
    </div>
  )
}
