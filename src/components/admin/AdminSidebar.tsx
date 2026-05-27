"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Users,
  Settings,
  Tag,
  SlidersHorizontal,
  Store,
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Productos", href: "/admin/products", icon: Package, permission: "productos" },
  { name: "Categorías", href: "/admin/categories", icon: Tag, permission: "productos" },
  { name: "Marcas", href: "/admin/brands", icon: Bookmark, permission: "productos" },
  { name: "Atributos", href: "/admin/attributes", icon: SlidersHorizontal, permission: "productos" },
  { name: "Clientes", href: "/admin/customers", icon: UserCheck, permission: "clientes" },
  { name: "Proveedores", href: "/admin/suppliers", icon: Truck, permission: "proveedores" },
  { name: "Compras", href: "/admin/purchase-orders", icon: ShoppingBag, permission: "compras" },
  { name: "POS", href: "/admin/pos", icon: Receipt, permission: "ventas_rapidas" },
  { name: "Terminales", href: "/admin/terminals", icon: Monitor, permission: "terminales" },
  { name: "Sesiones", href: "/admin/cash-sessions", icon: CalendarClock, permission: "cierre_caja" },
  { name: "Movimientos", href: "/admin/cash-movements", icon: ArrowLeftRight, permission: "egresos" },
  { name: "Pagos", href: "/admin/payments", icon: CreditCard, permission: "facturas" },
  { name: "Usuarios", href: "/admin/users", icon: Users, permission: "usuarios" },
  { name: "Roles y permisos", href: "/admin/roles", icon: ShieldCheck, permission: "roles_permisos" },
  { name: "Slider", href: "/admin/hero-slides", icon: Images, permission: "configuraciones" },
  { name: "Configuracion", href: "/admin/settings", icon: Settings, permission: "configuraciones" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userPermissions = session?.user?.permissions ?? []

  const visibleNav = navigation.filter(
    (item) => userPermissions.length === 0 || userPermissions.includes(item.permission)
  )

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">BT</span>
        </div>
        <span className="font-bold">Admin Panel</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleNav.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/">
            <Store className="mr-2 h-4 w-4" />
            Volver a la Tienda
          </Link>
        </Button>
      </div>
    </aside>
  )
}
