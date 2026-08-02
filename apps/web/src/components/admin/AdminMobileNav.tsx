"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  LayoutDashboard,
  Package,
  CreditCard,
  Users,
  Settings,
  Store,
  Tag,
  SlidersHorizontal,
  UserCheck,
  Truck,
  ShoppingBag,
  Bookmark,
  Monitor,
  CalendarClock,
  ArrowLeftRight,
  Receipt,
  Images,
  ShieldCheck,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const mainNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/products", icon: Package },
  { name: "Categorías", href: "/admin/categories", icon: Tag },
  { name: "Marcas", href: "/admin/brands", icon: Bookmark },
  { name: "Atributos", href: "/admin/attributes", icon: SlidersHorizontal },
  { name: "Clientes", href: "/admin/customers", icon: UserCheck },
  { name: "Proveedores", href: "/admin/suppliers", icon: Truck },
  { name: "Compras", href: "/admin/purchase-orders", icon: ShoppingBag },
  { name: "POS", href: "/admin/pos", icon: Receipt },
  { name: "Sesiones", href: "/admin/cash-sessions", icon: CalendarClock },
  { name: "Movimientos", href: "/admin/cash-movements", icon: ArrowLeftRight },
  { name: "Pagos", href: "/admin/payments", icon: CreditCard },
  { name: "Usuarios", href: "/admin/users", icon: Users },
]

const configNav = [
  { name: "Terminales", href: "/admin/terminals", icon: Monitor },
  { name: "Roles y permisos", href: "/admin/roles", icon: ShieldCheck },
  { name: "Slider", href: "/admin/hero-slides", icon: Images },
  { name: "Ajustes", href: "/admin/settings", icon: Settings },
]

export function AdminMobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const isConfigActive = configNav.some((item) => pathname.startsWith(item.href))
  const [configOpen, setConfigOpen] = React.useState(isConfigActive)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">BT</span>
            </div>
            Admin Panel
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto space-y-1 p-4">
          {mainNav.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}

          <div className="pt-2">
            <button
              onClick={() => setConfigOpen((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isConfigActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                Configuración
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  configOpen && "rotate-180",
                )}
              />
            </button>

            {configOpen && (
              <div className="mt-1 ml-3 space-y-1 border-l pl-3">
                {configNav.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t p-4">
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
            onClick={() => setOpen(false)}
          >
            <Link href="/">
              <Store className="mr-2 h-4 w-4" />
              Volver a la Tienda
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
