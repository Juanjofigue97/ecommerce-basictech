import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { MessageCircleQuestion } from "lucide-react"

const ayudaLinks = [
  { name: "Centro de Ayuda", href: "/help" },
  { name: "Envíos y Entregas", href: "/shipping" },
  { name: "Devoluciones", href: "/returns" },
  { name: "Preguntas Frecuentes", href: "/faq" },
]

const faqs = [
  {
    q: "¿Cómo sé si un producto está en stock?",
    a: 'En cada página de producto podés ver la disponibilidad. Si dice "En stock" podés comprarlo inmediatamente. Si dice "Sin stock", podés registrarte para recibir una notificación cuando vuelva a estar disponible.',
  },
  {
    q: "¿Puedo modificar o cancelar mi pedido?",
    a: "Podés cancelar o modificar tu pedido siempre que no haya sido despachado. Una vez enviado, ya no es posible hacer cambios — en ese caso tenés que esperar a recibirlo e iniciar una devolución.",
  },
  {
    q: "¿Ofrecen garantía en los productos?",
    a: "Todos los productos tienen la garantía oficial del fabricante. La mayoría de los equipos incluyen 12 meses de garantía. Ante cualquier inconveniente, podés contactarnos y te asistimos en el proceso.",
  },
  {
    q: "¿Puedo pagar en cuotas?",
    a: "Sí, aceptamos cuotas con tarjetas de crédito. Las opciones disponibles (3, 6, 12 cuotas) dependen de tu banco y se muestran en el checkout antes de confirmar el pago.",
  },
  {
    q: "¿Hacen envíos al interior del país?",
    a: "Sí, enviamos a todo el territorio argentino. Los plazos y costos varían según la ubicación. Podés calcular el costo de envío directamente en la página del producto o en el carrito.",
  },
  {
    q: "¿Cómo creo una cuenta?",
    a: 'Hacé clic en el ícono de usuario en la parte superior y seleccioná "Registrarse". Solo necesitás un email y una contraseña. También podés registrarte al momento de hacer tu primera compra.',
  },
  {
    q: "¿Mi información de pago está segura?",
    a: "Sí. No almacenamos datos de tarjetas. Todos los pagos se procesan a través de plataformas certificadas con encriptación SSL y cumplimiento PCI DSS.",
  },
  {
    q: "¿Tienen local físico?",
    a: "Por el momento operamos exclusivamente de manera online. Esto nos permite mantener precios más competitivos y llegar a todo el país.",
  },
]

export default function FaqPage() {
  return (
    <InfoPageLayout
      title="Preguntas Frecuentes"
      subtitle="Las dudas más comunes de nuestros clientes, resueltas en un solo lugar."
      icon={MessageCircleQuestion}
      category="Ayuda"
      navLinks={ayudaLinks}
    >
      <p>
        Si no encontrás respuesta a tu pregunta, visitá el{" "}
        <a href="/help">Centro de Ayuda</a> o escribinos directamente.
      </p>

      <div className="not-prose mt-6 space-y-4">
        {faqs.map((item, i) => (
          <details
            key={i}
            className="group rounded-lg border bg-card px-5 py-4 open:shadow-sm transition-shadow"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground select-none flex items-center justify-between gap-2">
              {item.q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </InfoPageLayout>
  )
}
