"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "./ThemeToggle"
import { SearchBar } from "./SearchBar"
import { useCartStore } from "@/stores/cart-store"
import { useSettingsStore } from "@/stores/settings-store"

const AuthSection = dynamic(
  () => import("./AuthSection").then((m) => m.AuthSection),
  { ssr: false }
)

const MobileNav = dynamic(
  () => import("./MobileNav").then((m) => m.MobileNav),
  { ssr: false }
)

export function Header() {
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((state) => state.getItemCount())
  const { settings, fetchSettings } = useSettingsStore()

  useEffect(() => {
    // Hydration-safe "on client" flag — inherently needs to setState once on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    fetchSettings()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {settings?.logo ? (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                <Image src={settings.logo} alt={settings.name ?? "Logo"} fill className="object-contain" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  {settings?.name ? settings.name.slice(0, 2).toUpperCase() : "BT"}
                </span>
              </div>
            )}
            <span className="hidden text-xl font-bold sm:inline-block">
              {settings?.name ?? "BasicTechShop"}
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-xl md:flex">
            <SearchBar className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search - Mobile */}
            {/* <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
              <Search className="h-4 w-4" />
              <span className="sr-only">Buscar</span>
            </Button> */}

            {/* Products Link */}
            <Link href="/products" className="hidden md:block">
              <Button variant="ghost" size="sm" className="font-semibold">
                PRODUCTOS
              </Button>
            </Link>

            <ThemeToggle />

            {/* <Button variant="ghost" size="icon" className="h-9 w-9">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Favoritos</span>
            </Button> */}

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <ShoppingCart className="h-4 w-4" />
                {mounted && itemCount > 0 && (
                  <Badge
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    variant="destructive"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </Badge>
                )}
                <span className="sr-only">Carrito</span>
              </Button>
            </Link>

            <AuthSection />

            {/* Mobile Menu */}
            <MobileNav />
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="pb-3 md:hidden">
          <SearchBar className="w-full" />
        </div>
      </div>
    </header>
  )
}
