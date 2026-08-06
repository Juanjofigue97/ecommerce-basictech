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
        Despachamos pedidos desde nuestro local en Pasto hacia todo Colombia, ya sea que
        finalices tu compra en línea o la coordines por WhatsApp.
      </p>

      <h3>Envío estándar</h3>
      <p>
        Disponible para todo el país. El costo estándar es de <strong>$15.000 COP</strong> y
        se calcula automáticamente al ingresar tu dirección en el checkout.
      </p>

      <h3>Envío gratis</h3>
      <p>
        Los pedidos que superen los <strong>$200.000 COP</strong> tienen envío gratis a todo
        el país. La promoción se aplica automáticamente en el checkout.
      </p>

      <h3>Retiro en el local</h3>
      <p>
        Si estás en Pasto, podés retirar tu pedido directamente en nuestro local frente al
        Colegio La Normal, coordinando antes por WhatsApp.
      </p>

      <h3>Seguimiento del pedido</h3>
      <p>
        Podés consultar el estado de tu pedido desde tu perfil en <strong>Mis Órdenes</strong>{" "}
        o escribiéndonos directamente por WhatsApp con tu número de pedido.
      </p>

      <h3>Zonas sin cobertura</h3>
      <p>
        Si tu municipio no aparece al calcular el envío o tenés dudas sobre la cobertura,
        escribinos por WhatsApp y buscamos una solución.
      </p>
    </InfoPageLayout>
  )
}
