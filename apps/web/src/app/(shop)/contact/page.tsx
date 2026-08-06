import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react"
import { ContactForm } from "@/components/info/ContactForm"
import { MessageSquare } from "lucide-react"
import { prisma } from "@/lib/prisma"

const empresaLinks = [
  { name: "Sobre Nosotros", href: "/about" },
  { name: "Contacto", href: "/contact" },
]

// Reads StoreSettings live on every request — must not be statically prerendered
// at build time, when no database is reachable (e.g. inside the Docker build stage).
export const dynamic = "force-dynamic"

export default async function ContactPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } })

  const contactItems = [
    {
      icon: Mail,
      label: "Email",
      value: settings?.email ?? "Configurá un email en el panel de administración",
      detail: "Te respondemos por este medio",
    },
    {
      icon: Phone,
      label: "Teléfono",
      value: settings?.phone ?? "Configurá un teléfono en el panel de administración",
      detail: "Escribinos y te respondemos a la brevedad",
    },
    {
      icon: MapPin,
      label: "Ubicación",
      value: settings?.address ?? "Configurá una dirección en el panel de administración",
      detail: settings?.name,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp Camisetas",
      value: "315 552 1144",
      detail: "Consultas sobre camisetas",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp Calzado",
      value: "314 758 0370",
      detail: "Consultas sobre calzado",
    },
  ]

  return (
    <InfoPageLayout
      title="Contacto"
      subtitle="Estamos para ayudarte. Elegí el canal que más te convenga y te respondemos a la brevedad."
      icon={MessageSquare}
      category="Empresa"
      navLinks={empresaLinks}
    >
      <h2>Nuestros canales de atención</h2>

      <div className="not-prose grid gap-4 sm:grid-cols-2 mt-4 mb-8">
        {contactItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-lg border bg-card p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
              {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      <h2>Envianos un mensaje</h2>
      <p>Completá el formulario y te contactamos a la brevedad.</p>

      <div className="not-prose mt-4">
        <ContactForm />
      </div>
    </InfoPageLayout>
  )
}
