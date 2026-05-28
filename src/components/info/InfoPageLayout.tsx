"use client"

import Link from "next/link"
import { ChevronRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface NavLink {
  name: string
  href: string
}

interface InfoPageLayoutProps {
  title: string
  subtitle: string
  icon: LucideIcon
  category: string
  navLinks: NavLink[]
  children: React.ReactNode
}

export function InfoPageLayout({
  title,
  subtitle,
  icon: Icon,
  category,
  navLinks,
  children,
}: InfoPageLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-muted/40 border-b">
        <div className="container mx-auto px-4 py-12">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{category}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1.5 text-muted-foreground max-w-xl">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </p>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className="prose prose-neutral dark:prose-invert max-w-none">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
