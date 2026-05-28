import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { ContactForm } from "@/components/info/ContactForm"
import { MessageSquare } from "lucide-react"

const empresaLinks = [
  { name: "Sobre Nosotros", href: "/about" },
  { name: "Contacto", href: "/contact" },
]

const contactItems = [
  {
    icon: Mail,
    label: "Email",
    value: "soporte@basictechshop.com",
    detail: "Respondemos en menos de 24 hs hábiles",
  },
  {
    icon: Phone,
    label: "Teléfono",
    value: "0800-555-TECH",
    detail: "Lunes a viernes de 9 a 18 hs",
  },
  {
    icon: MapPin,
    label: "Ubicación",
    value: "Ciudad Autónoma de Buenos Aires",
    detail: "Argentina",
  },
  {
    icon: Clock,
    label: "Horario de atención",
    value: "Lunes a viernes, 9:00 – 18:00",
    detail: "No atendemos fines de semana ni feriados",
  },
]

export default function ContactPage() {
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
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Envianos un mensaje</h2>
      <p>
        Completá el formulario y te contactamos dentro de las próximas 24 horas hábiles.
      </p>

      <div className="not-prose mt-4">
        <ContactForm />
      </div>
    </InfoPageLayout>
  )
}
