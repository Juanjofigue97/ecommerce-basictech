import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { Shirt } from "lucide-react"

const empresaLinks = [
  { name: "Sobre Nosotros", href: "/about" },
  { name: "Contacto", href: "/contact" },
]

export default function AboutPage() {
  return (
    <InfoPageLayout
      title="Sobre Nosotros"
      subtitle="Conocé quiénes somos, qué nos mueve y por qué el deporte y la moda urbana son nuestro negocio."
      icon={Shirt}
      category="Empresa"
      navLinks={empresaLinks}
    >
      <h2>Nuestra historia</h2>
      <p>
        Somos una tienda de ropa deportiva ubicada en Pasto, frente al Colegio La Normal.
        Empezamos atendiendo local a local a los hinchas del barrio y hoy también vendemos
        online, siempre con la misma idea: uniformes importados de calidad premium a un
        precio justo.
      </p>

      <h2>Nuestra misión</h2>
      <p>
        Ofrecerte uniformes y calzado deportivo y urbano de calidad, con atención cercana
        y honesta, para que representes a tu equipo o lleves tu estilo con la mejor pinta.
      </p>

      <h2>¿Qué encontrás en la tienda?</h2>
      <ul>
        <li>
          <strong>⚽ Uniformes importados calidad premium:</strong> Camisetas de selecciones,
          clubes y ediciones especiales.
        </li>
        <li>
          <strong>👟 Calzado deportivo y urbano:</strong> Botines, zapatillas y calzado para
          todos los días.
        </li>
        <li>
          <strong>Atención cercana:</strong> Te asesoramos por WhatsApp antes de que compres,
          no solo después.
        </li>
        <li>
          <strong>Envíos:</strong> Hacemos envíos dentro de Colombia además de la atención
          en el local.
        </li>
      </ul>

      <h2>Visitanos o escribinos</h2>
      <ul>
        <li>
          <strong>📍 Ubicación:</strong> Frente al Colegio La Normal, Pasto.
        </li>
        <li>
          <strong>📲 Camisetas:</strong> 315 552 1144
        </li>
        <li>
          <strong>👟 Calzado:</strong> 314 758 0370
        </li>
      </ul>
    </InfoPageLayout>
  )
}
