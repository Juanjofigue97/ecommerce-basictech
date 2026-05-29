"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, Monitor, Keyboard, Mouse, Headphones, HardDrive, Cpu, Gamepad2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductsStore } from "@/stores/products-store"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  HardDrive,
  Cpu,
  Gamepad2,
  Package,
}

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const { categories, fetchCategories } = useProductsStore()

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          {/* Categories */}
          <div className="flex flex-col gap-1">
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              Categorias
            </p>
            {categories.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="mx-3 h-9 rounded-lg" />
                ))
              : categories.map((category) => {
                  const Icon = iconMap[category.icon] ?? Package
                  return (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </Link>
                  )
                })}
          </div>

          <Separator />

          {/* All Products */}
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
