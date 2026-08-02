import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { ScrollText } from "lucide-react"

const legalLinks = [
  { name: "Términos y Condiciones", href: "/terms" },
  { name: "Política de Privacidad", href: "/privacy" },
  { name: "Cookies", href: "/cookies" },
]

export default function TermsPage() {
  return (
    <InfoPageLayout
      title="Términos y Condiciones"
      subtitle="Leé atentamente las condiciones que regulan el uso de nuestra plataforma y la compra de productos."
      icon={ScrollText}
      category="Legal"
      navLinks={legalLinks}
    >
      <p className="text-sm text-muted-foreground">
        Última actualización: mayo de 2026
      </p>

      <h2>1. Aceptación de los términos</h2>
      <p>
        Al acceder y utilizar BasicTechShop, aceptás de manera plena y sin reservas estos
        Términos y Condiciones. Si no estás de acuerdo con alguna de las disposiciones aquí
        establecidas, te pedimos que no utilices nuestros servicios.
      </p>

      <h2>2. Uso del sitio</h2>
      <p>
        Este sitio está destinado exclusivamente al uso personal y no comercial. Queda
        prohibido reproducir, duplicar, copiar, vender o explotar cualquier parte del
        contenido sin autorización expresa por escrito de BasicTechShop.
      </p>

      <h2>3. Registro y cuenta de usuario</h2>
      <p>
        Para realizar compras es necesario crear una cuenta. Sos responsable de mantener la
        confidencialidad de tus credenciales y de todas las actividades realizadas bajo tu
        cuenta. Notificanos de inmediato ante cualquier uso no autorizado.
      </p>

      <h2>4. Precios y disponibilidad</h2>
      <p>
        Los precios publicados están en pesos argentinos e incluyen IVA, salvo indicación
        contraria. Nos reservamos el derecho de modificar precios en cualquier momento sin
        previo aviso. La confirmación de una orden constituye un contrato de compraventa al
        precio vigente en ese momento.
      </p>

      <h2>5. Limitación de responsabilidad</h2>
      <p>
        BasicTechShop no será responsable por daños indirectos, incidentales o consecuentes
        derivados del uso o la imposibilidad de uso de nuestros productos o servicios, en la
        medida que la ley aplicable lo permita.
      </p>

      <h2>6. Modificaciones</h2>
      <p>
        Podemos actualizar estos Términos en cualquier momento. Los cambios entran en vigor
        desde su publicación en este sitio. El uso continuado del servicio implica la
        aceptación de los términos vigentes.
      </p>

      <h2>7. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa
        se someterá a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de
        Buenos Aires.
      </p>
    </InfoPageLayout>
  )
}
