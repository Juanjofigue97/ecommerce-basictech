import { InfoPageLayout } from "@/components/info/InfoPageLayout"
import { Cookie } from "lucide-react"

const legalLinks = [
  { name: "Términos y Condiciones", href: "/terms" },
  { name: "Política de Privacidad", href: "/privacy" },
  { name: "Cookies", href: "/cookies" },
]

const cookieTypes = [
  {
    name: "Estrictamente necesarias",
    required: true,
    description:
      "Permiten funciones esenciales como el carrito de compras, el inicio de sesión y la navegación. No pueden desactivarse.",
  },
  {
    name: "De rendimiento",
    required: false,
    description:
      "Recopilan información sobre cómo los visitantes usan el sitio (páginas más visitadas, errores, etc.) para ayudarnos a mejorar. No identifican a nadie personalmente.",
  },
  {
    name: "Funcionales",
    required: false,
    description:
      "Recuerdan tus preferencias (idioma, región, tema) para brindarte una experiencia más personalizada.",
  },
  {
    name: "De marketing",
    required: false,
    description:
      "Se usan para mostrar anuncios relevantes según tus intereses. Pueden ser establecidas por nosotros o por terceros con quienes colaboramos.",
  },
]

export default function CookiesPage() {
  return (
    <InfoPageLayout
      title="Política de Cookies"
      subtitle="Qué son las cookies, cuáles usamos y cómo podés controlarlas."
      icon={Cookie}
      category="Legal"
      navLinks={legalLinks}
    >
      <p className="text-sm text-muted-foreground">
        Última actualización: mayo de 2026
      </p>

      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
        dispositivo cuando los visitás. Se utilizan para recordar información de tu sesión,
        preferencias y mejorar la experiencia de navegación.
      </p>

      <h2>Tipos de cookies que utilizamos</h2>

      <div className="not-prose mt-4 space-y-3">
        {cookieTypes.map((type) => (
          <div key={type.name} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm text-foreground">{type.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  type.required
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {type.required ? "Requerida" : "Opcional"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </div>
        ))}
      </div>

      <h2>¿Cómo controlar las cookies?</h2>
      <p>
        Podés controlar y/o eliminar las cookies desde la configuración de tu navegador.
        Tené en cuenta que deshabilitar ciertas cookies puede afectar el funcionamiento de
        algunas secciones del sitio, como el carrito de compras o el inicio de sesión.
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
            Microsoft Edge
          </a>
        </li>
      </ul>

      <h2>Actualizaciones a esta política</h2>
      <p>
        Podemos actualizar esta política ocasionalmente. Los cambios se publicarán en esta
        página con la fecha de última actualización. Si seguís usando el sitio después de
        los cambios, aceptás la política actualizada.
      </p>
    </InfoPageLayout>
  )
}
