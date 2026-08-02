import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { Truck } from "lucide-react"

const ayudaLinks = [
  { name: "Centro de Ayuda", href: "/help" },
  { name: "Envíos y Entregas", href: "/shipping" },
  { name: "Devoluciones", href: "/returns" },
  { name: "Preguntas Frecuentes", href: "/faq" },
]

export default function ShippingPage() {
  return (
    <InfoPageLayout
      title="Envíos y Entregas"
      subtitle="Toda la información sobre plazos, costos y zonas de envío para tu pedido."
      icon={Truck}
      category="Ayuda"
      navLinks={ayudaLinks}
    >
      <h2>Opciones de envío</h2>
      <p>
        Trabajamos con los principales operadores logísticos del país para garantizar que tu
        pedido llegue en tiempo y forma, sin importar dónde estés.
      </p>

      <h3>Envío estándar</h3>
      <p>
        Disponible para todo el país. El plazo de entrega es de <strong>3 a 7 días hábiles</strong>{" "}
        desde la confirmación del pago. El costo se calcula automáticamente al ingresar tu
        dirección en el checkout.
      </p>

      <h3>Envío express</h3>
      <p>
        Disponible para CABA y Gran Buenos Aires. Entrega en <strong>24 a 48 hs hábiles</strong>.
        Tiene un costo adicional que se muestra al seleccionar esta opción.
      </p>

      <h3>Envío gratis</h3>
      <p>
        Todos los pedidos que superen los <strong>$50.000</strong> tienen envío gratis a todo
        el país con la modalidad estándar. La promoción se aplica automáticamente en el
        checkout.
      </p>

      <h3>Seguimiento del pedido</h3>
      <p>
        Una vez despachado, vas a recibir un email con el número de seguimiento para rastrear
        tu envío en tiempo real. También podés consultarlo desde tu perfil en{" "}
        <strong>Mis Órdenes</strong>.
      </p>

      <h3>Zonas sin cobertura</h3>
      <p>
        Algunas localidades remotas pueden requerir un plazo mayor o un costo diferenciado.
        Si tu código postal no aparece al calcular el envío, contactanos para buscar una
        solución.
      </p>
    </InfoPageLayout>
  )
}
