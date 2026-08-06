import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { RotateCcw } from "lucide-react"

const ayudaLinks = [
  { name: "Centro de Ayuda", href: "/help" },
  { name: "Envíos y Entregas", href: "/shipping" },
  { name: "Devoluciones", href: "/returns" },
  { name: "Preguntas Frecuentes", href: "/faq" },
]

export default function ReturnsPage() {
  return (
    <InfoPageLayout
      title="Devoluciones"
      subtitle="Conocé nuestro proceso de devolución y cómo gestionar un cambio o reembolso."
      icon={RotateCcw}
      category="Ayuda"
      navLinks={ayudaLinks}
    >
      <h2>Política de devoluciones</h2>
      <p>
        Si tu camiseta o par de calzado no te queda o no llegó como esperabas, podés
        solicitar un cambio o devolución. La prenda debe estar en su estado original, sin
        uso y con las etiquetas puestas.
      </p>

      <h3>¿Cuándo puedo devolver un producto?</h3>
      <ul>
        <li>El producto llegó dañado o defectuoso.</li>
        <li>Recibiste un artículo diferente al que compraste.</li>
        <li>La talla no corresponde a la que pediste.</li>
        <li>Cambio de talla o de opinión (aplican condiciones, ver abajo).</li>
      </ul>

      <h3>Cambio de talla o de opinión</h3>
      <p>
        Si necesitás otra talla o decidís devolver el producto sin que exista un defecto,
        coordinamos el cambio por WhatsApp. En estos casos el costo del envío de la devolución
        corre por tu cuenta y la prenda no debe haber sido usada ni lavada.
      </p>

      <h3>¿Cómo iniciar una devolución?</h3>
      <ol>
        <li>Escribinos por WhatsApp: Camisetas al 315 552 1144 o Calzado al 314 758 0370.</li>
        <li>Contanos el número de pedido y el motivo de la devolución o cambio.</li>
        <li>Te indicamos cómo enviarnos el producto o coordinar el cambio en el local.</li>
        <li>Una vez recibido y verificado el producto, procesamos el cambio o reembolso.</li>
      </ol>

      <h3>Tiempos de reembolso</h3>
      <p>
        El reembolso se acredita en el mismo medio de pago utilizado tras verificar el
        producto devuelto. Te mantenemos al tanto del proceso por WhatsApp.
      </p>
    </InfoPageLayout>
  )
}
