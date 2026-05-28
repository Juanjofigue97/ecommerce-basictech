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
        Tenés <strong>30 días corridos</strong> desde la recepción de tu pedido para solicitar
        una devolución o cambio. El producto debe estar en su estado original, con el embalaje
        intacto y todos los accesorios incluidos.
      </p>

      <h3>¿Cuándo puedo devolver un producto?</h3>
      <ul>
        <li>El producto llegó dañado o defectuoso.</li>
        <li>Recibiste un artículo diferente al que compraste.</li>
        <li>El producto no funciona correctamente desde el primer uso.</li>
        <li>Cambio de opinión (aplican condiciones, ver abajo).</li>
      </ul>

      <h3>Cambio de opinión</h3>
      <p>
        Si decidís devolver el producto sin que exista un defecto, el flete de devolución
        corre por tu cuenta. El reembolso se procesa descontando el costo del envío original.
        El producto no debe haber sido abierto ni usado.
      </p>

      <h3>¿Cómo iniciar una devolución?</h3>
      <ol>
        <li>Iniciá sesión y andá a <strong>Mis Órdenes</strong>.</li>
        <li>Seleccioná el pedido y hacé clic en <strong>Solicitar devolución</strong>.</li>
        <li>Completá el motivo y confirmá la solicitud.</li>
        <li>Te enviamos una etiqueta de envío prepaga (en casos con defecto).</li>
        <li>Una vez recibido y verificado el producto, procesamos el reembolso.</li>
      </ol>

      <h3>Tiempos de reembolso</h3>
      <p>
        El reembolso se acredita en el mismo medio de pago utilizado dentro de{" "}
        <strong>5 a 10 días hábiles</strong> tras la aprobación de la devolución.
      </p>
    </InfoPageLayout>
  )
}
