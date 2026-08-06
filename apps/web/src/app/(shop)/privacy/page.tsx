import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { ShieldCheck } from "lucide-react"

const legalLinks = [
  { name: "Términos y Condiciones", href: "/terms" },
  { name: "Política de Privacidad", href: "/privacy" },
  { name: "Cookies", href: "/cookies" },
]

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Política de Privacidad"
      subtitle="Cómo recopilamos, usamos y protegemos tu información personal."
      icon={ShieldCheck}
      category="Legal"
      navLinks={legalLinks}
    >
      <p className="text-sm text-muted-foreground">
        Última actualización: mayo de 2026
      </p>

      <h2>1. Información que recopilamos</h2>
      <p>Recopilamos los siguientes tipos de información:</p>
      <ul>
        <li>
          <strong>Información personal:</strong> nombre, email, dirección de entrega y teléfono
          que proporcionás al registrarte o realizar una compra.
        </li>
        <li>
          <strong>Información de pago:</strong> procesada de forma segura por pasarelas de pago
          certificadas. No almacenamos datos de tarjetas.
        </li>
        <li>
          <strong>Datos de navegación:</strong> páginas visitadas, tiempo de sesión y dispositivo
          utilizado, a través de cookies y herramientas de análisis.
        </li>
      </ul>

      <h2>2. Uso de la información</h2>
      <p>Utilizamos tu información para:</p>
      <ul>
        <li>Procesar y gestionar tus pedidos.</li>
        <li>Enviarte confirmaciones, actualizaciones y notificaciones de envío.</li>
        <li>Mejorar nuestros productos, servicios y experiencia de usuario.</li>
        <li>Enviarte comunicaciones de marketing (solo con tu consentimiento).</li>
        <li>Cumplir con obligaciones legales y prevenir fraudes.</li>
      </ul>

      <h2>3. Compartir información</h2>
      <p>
        No vendemos ni alquilamos tu información personal a terceros. Podemos compartirla
        con operadores logísticos para procesar envíos, con procesadores de pago para
        transacciones en línea y con servicios de análisis bajo acuerdos de confidencialidad.
      </p>

      <h2>4. Seguridad</h2>
      <p>
        Implementamos medidas técnicas y organizativas para proteger tu información contra
        acceso no autorizado, alteración o divulgación. Sin embargo, ninguna transmisión por
        internet es 100% segura.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Tenés derecho a acceder, rectificar, eliminar u oponerte al tratamiento de tus datos
        personales, conforme a la normativa colombiana de protección de datos personales.
        Para ejercerlos, escribinos por WhatsApp o a través de nuestra página de{" "}
        <a href="/contact">Contacto</a>.
      </p>

      <h2>6. Retención de datos</h2>
      <p>
        Conservamos tu información mientras tu cuenta esté activa o sea necesaria para
        proveer el servicio. Podés solicitar la eliminación de tu cuenta y datos asociados
        en cualquier momento.
      </p>
    </InfoPageLayout>
  )
}
