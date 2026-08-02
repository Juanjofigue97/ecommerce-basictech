import Link from "next/link"
import { unstable_cache } from "next/cache"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { prisma } from "@/lib/prisma"
import { transformCategory } from "@/lib/transformers"

const empresaLinks = [
  { name: "Sobre Nosotros", href: "/about" },
  { name: "Contacto", href: "/contact" },
]

const ayudaLinks = [
  { name: "Centro de Ayuda", href: "/help" },
  { name: "Envios y Entregas", href: "/shipping" },
  { name: "Devoluciones", href: "/returns" },
  { name: "Preguntas Frecuentes", href: "/faq" },
]

const legalLinks = [
  { name: "Terminos y Condiciones", href: "/terms" },
  { name: "Politica de Privacidad", href: "/privacy" },
  { name: "Cookies", href: "/cookies" },
]

const getFooterData = unstable_cache(
  async () => {
    try {
      const [settings, categories] = await Promise.all([
        prisma.storeSettings.findUnique({ where: { id: "singleton" } }),
        prisma.category.findMany({
          where: { products: { some: { isActive: true } } },
          include: { _count: { select: { products: { where: { isActive: true } } } } },
          orderBy: { name: "asc" },
          take: 6,
        }),
      ])
      return {
        settings,
        categories: categories.map(transformCategory),
      }
    } catch {
      return { settings: null, categories: [] }
    }
  },
  ["footer-data"],
  { revalidate: 3600, tags: ["store-settings", "categories"] }
)

export async function Footer() {
  const { settings, categories } = await getFooterData()

  const storeName = settings?.name ?? "BasicTechShop"
  const storeInitials = storeName.slice(0, 2).toUpperCase()
  const description = settings?.description ?? "Tu tienda de tecnología de confianza."

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">{storeInitials}</span>
              </div>
              <span className="text-xl font-bold">{storeName}</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{description}</p>
            <div className="mt-4 flex gap-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold">Categorías</h3>
            <ul className="mt-4 space-y-2">
              {categories.length > 0
                ? categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/products?category=${cat.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))
                : empresaLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold">Empresa</h3>
            <ul className="mt-4 space-y-2">
              {empresaLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold">Ayuda</h3>
            <ul className="mt-4 space-y-2">
              {ayudaLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold">Contacto</h3>
            <ul className="mt-4 space-y-3">
              {settings?.address && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings?.phone && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{settings.phone}</span>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{settings.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
