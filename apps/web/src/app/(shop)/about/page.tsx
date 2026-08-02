import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { Building2 } from "lucide-react"

const empresaLinks = [
  { name: "Sobre Nosotros", href: "/about" },
  { name: "Contacto", href: "/contact" },
]

export default function AboutPage() {
  return (
    <InfoPageLayout
      title="Sobre Nosotros"
      subtitle="Conocé quiénes somos, qué nos mueve y por qué elegimos la tecnología como nuestro negocio."
      icon={Building2}
      category="Empresa"
      navLinks={empresaLinks}
    >
      <h2>Nuestra historia</h2>
      <p>
        BasicTechShop nació en 2018 con una idea simple: hacer que la tecnología de calidad
        sea accesible para todos. Lo que empezó como un pequeño emprendimiento familiar hoy
        es una plataforma con miles de clientes en todo el país.
      </p>

      <h2>Nuestra misión</h2>
      <p>
        Acercar la mejor tecnología a las personas, con precios justos, atención honesta y
        una experiencia de compra que realmente valga la pena. No vendemos lo que tenemos,
        vendemos lo que sabemos que funciona.
      </p>

      <h2>¿Por qué elegirnos?</h2>
      <ul>
        <li>
          <strong>Garantía real:</strong> Todos los productos son originales con garantía
          oficial del fabricante.
        </li>
        <li>
          <strong>Soporte humano:</strong> Nuestro equipo de soporte son personas reales que
          conocen los productos que vendemos.
        </li>
        <li>
          <strong>Precios transparentes:</strong> Sin letras chicas ni costos ocultos.
        </li>
        <li>
          <strong>Envíos a todo el país:</strong> Llegamos a cada rincón de Argentina.
        </li>
      </ul>

      <h2>Nuestro equipo</h2>
      <p>
        Somos un equipo de más de 20 personas apasionadas por la tecnología. Desde atención
        al cliente hasta logística, cada área trabaja con el mismo objetivo: que vos tengas
        la mejor experiencia posible.
      </p>

      <h2>Responsabilidad y compromiso</h2>
      <p>
        Creemos en el comercio responsable. Trabajamos solo con proveedores verificados,
        respetamos la ley de defensa del consumidor y nos comprometemos a la mejora
        continua de nuestros procesos.
      </p>
    </InfoPageLayout>
  )
}
