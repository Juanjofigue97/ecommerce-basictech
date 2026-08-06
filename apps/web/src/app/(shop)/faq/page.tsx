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
    q: "¿Cómo sé qué talla pedir?",
    a: "Manejamos tallas numéricas para niños (16, 18, 20, etc.) y S, M, L, XL, XXL, XXXL para uniformes de adulto, además de la numeración estándar en calzado. Si tenés dudas sobre cuál te queda, escribinos por WhatsApp y te asesoramos antes de comprar.",
  },
  {
    q: "¿Puedo modificar o cancelar mi pedido?",
    a: "Sí, siempre que el pedido no haya sido despachado. Escribinos por WhatsApp lo antes posible indicando tu número de pedido y lo ajustamos.",
  },
  {
    q: "¿Los productos son originales?",
    a: "Trabajamos con calzado y uniformes importados de calidad premium. Si tenés dudas sobre un producto puntual, consultanos por WhatsApp antes de comprar.",
  },
  {
    q: "¿Cómo pago mi pedido?",
    a: "Podés coordinar tu compra por WhatsApp y definir el medio de pago con nosotros, o pagar con tarjeta directamente en línea cuando esta opción esté habilitada en la tienda.",
  },
  {
    q: "¿Hacen envíos a todo Colombia?",
    a: "Sí. El envío estándar cuesta $15.000 COP y es gratis en pedidos desde $200.000 COP. Podés calcular el costo directamente en el carrito.",
  },
  {
    q: "¿Cómo creo una cuenta?",
    a: 'Hacé clic en el ícono de usuario en la parte superior y seleccioná "Registrarse". Solo necesitás un email y una contraseña. También podés registrarte al momento de hacer tu primera compra.',
  },
  {
    q: "¿Mi información de pago está segura?",
    a: "Sí. No almacenamos datos de tarjetas. Los pagos en línea se procesan a través de una pasarela de pago certificada.",
  },
  {
    q: "¿Tienen local físico?",
    a: "Sí, nuestro local está frente al Colegio La Normal, en Pasto, Nariño. También podés comprar online y coordinar el envío o el retiro en tienda.",
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
