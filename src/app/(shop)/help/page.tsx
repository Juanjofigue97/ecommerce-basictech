import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { LifeBuoy } from "lucide-react"

const ayudaLinks = [
  { name: "Centro de Ayuda", href: "/help" },
  { name: "Envíos y Entregas", href: "/shipping" },
  { name: "Devoluciones", href: "/returns" },
  { name: "Preguntas Frecuentes", href: "/faq" },
]

export default function HelpPage() {
  return (
    <InfoPageLayout
      title="Centro de Ayuda"
      subtitle="Encontrá respuestas a tus preguntas y resolvé cualquier inconveniente con tu compra."
      icon={LifeBuoy}
      category="Ayuda"
      navLinks={ayudaLinks}
    >
      <h2>¿En qué podemos ayudarte?</h2>
      <p>
        Nuestro equipo de soporte está disponible para asistirte en todo lo relacionado a tus
        pedidos, pagos, envíos y devoluciones. Antes de contactarnos, te recomendamos revisar
        las secciones de esta guía — la mayoría de las dudas tienen respuesta aquí.
      </p>

      <h3>Gestión de pedidos</h3>
      <p>
        Podés consultar el estado de tu pedido en cualquier momento desde tu perfil, en la
        sección <strong>Mis Órdenes</strong>. Allí vas a encontrar el historial completo con
        número de seguimiento, estado de pago y fecha estimada de entrega.
      </p>

      <h3>Métodos de pago</h3>
      <p>
        Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), pagos
        mediante transferencia bancaria y efectivo a través de Rapipago y Pago Fácil.
      </p>

      <h3>Contacto directo</h3>
      <p>
        Si no encontrás lo que buscás, escribinos a{" "}
        <a href="mailto:soporte@basictechshop.com">soporte@basictechshop.com</a> o llamanos
        al <strong>0800-555-TECH</strong> de lunes a viernes de 9 a 18 hs.
      </p>
    </InfoPageLayout>
  )
}
