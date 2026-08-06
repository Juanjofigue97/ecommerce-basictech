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
        Nuestro equipo está disponible para asistirte con todo lo relacionado a tus pedidos,
        pagos, envíos y devoluciones de camisetas y calzado deportivo. Antes de escribirnos,
        te recomendamos revisar las secciones de esta guía — la mayoría de las dudas tienen
        respuesta aquí.
      </p>

      <h3>Gestión de pedidos</h3>
      <p>
        Podés consultar el estado de tu pedido desde tu perfil, en la sección{" "}
        <strong>Mis Órdenes</strong>. Si preferís coordinar directamente, escribinos por
        WhatsApp indicando tu número de pedido.
      </p>

      <h3>Métodos de pago</h3>
      <p>
        Podés coordinar tu compra por WhatsApp y pagar según acordemos (efectivo, transferencia
        o el medio que definamos), o completar el pago con tarjeta directamente en línea cuando
        esta opción esté habilitada en la tienda.
      </p>

      <h3>Contacto directo</h3>
      <p>
        Si no encontrás lo que buscás, escribinos por WhatsApp: <strong>Camisetas</strong>{" "}
        al 315 552 1144 o <strong>Calzado</strong> al 314 758 0370. También podés visitarnos
        en nuestro local frente al Colegio La Normal, en Pasto, o revisar más datos de
        contacto en la página de <a href="/contact">Contacto</a>.
      </p>
    </InfoPageLayout>
  )
}
