/**
 * Additive demo catalog for a hardware store ("ferretería") — invented data,
 * completely separate from the real store's catalog (sportswear/jerseys)
 * seeded by prisma/seed.ts. This script never touches, imports from, or
 * references seed.ts in any way.
 *
 * Like prisma/bootstrap-catalog.ts, this is purely additive: it upserts
 * categories, brands, and products by slug, so it's safe to run more than
 * once and safe to run on top of the real seed.ts data — it never deletes
 * anything and never touches Role/Permission/User/StoreSettings.
 *
 * Usage (from apps/web/, with DATABASE_URL pointing at the target database):
 *
 *   npx tsx prisma/seed-ferreteria.ts
 */
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CATEGORIES = [
  { name: "Herramientas Manuales", slug: "herramientas-manuales", icon: "Hammer" },
  { name: "Herramientas Eléctricas", slug: "herramientas-electricas", icon: "Drill" },
  { name: "Tornillería y Fijaciones", slug: "tornilleria-fijaciones", icon: "Nut" },
  { name: "Pinturas y Acabados", slug: "pinturas-acabados", icon: "Paintbrush" },
  { name: "Plomería", slug: "plomeria", icon: "Droplet" },
  { name: "Electricidad", slug: "electricidad", icon: "Zap" },
  { name: "Cerrajería", slug: "cerrajeria", icon: "Lock" },
  { name: "Adhesivos y Selladores", slug: "adhesivos-selladores", icon: "Layers" },
  { name: "Seguridad Industrial", slug: "seguridad-industrial", icon: "HardHat" },
  { name: "Jardinería", slug: "jardineria", icon: "Sprout" },
]

const BRANDS = [
  { name: "Truper", slug: "truper" },
  { name: "Stanley", slug: "stanley" },
  { name: "DeWalt", slug: "dewalt" },
  { name: "Bosch", slug: "bosch" },
  { name: "Black+Decker", slug: "black-decker" },
  { name: "Makita", slug: "makita" },
  { name: "3M", slug: "3m" },
  { name: "Pintuco", slug: "pintuco" },
  { name: "Corona", slug: "corona" },
  { name: "Yale", slug: "yale" },
]

interface ProductSeed {
  name: string
  slug: string
  description: string
  price: number
  cost?: number
  wholesalePrice?: number
  stock: number
  images: string[]
  specs: Record<string, string>
  isNew?: boolean
  isFeatured?: boolean
  categorySlug: string
  brandSlug: string
}

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=500`

const PRODUCTS: ProductSeed[] = [
  // ==================== Herramientas Manuales ====================
  {
    name: "Martillo de Uña 16 oz Mango Fibra de Vidrio",
    slug: "martillo-una-16oz-truper",
    description:
      "Martillo de uña con cabeza de acero forjado y mango de fibra de vidrio para absorber impactos. Uso general en carpintería y construcción.",
    price: 32900,
    cost: 20000,
    stock: 40,
    images: [img("1581783898377-1c85bf937427"), img("1586864387967-d02ef85d93e8")],
    specs: { Marca: "Truper", Peso: "16 oz (450 g)", Mango: "Fibra de vidrio", Garantía: "6 meses" },
    categorySlug: "herramientas-manuales",
    brandSlug: "truper",
  },
  {
    name: 'Juego de Destornilladores 6 Piezas Phillips y Plana',
    slug: "destornilladores-6-piezas-stanley",
    description:
      "Set de 6 destornilladores con puntas Phillips y plana en distintas medidas. Mango bimaterial antideslizante para mayor control.",
    price: 45900,
    cost: 28500,
    wholesalePrice: 38000,
    stock: 55,
    images: [img("1586864387789-628af9feed72"), img("1671554597147-a884922a0ea5")],
    specs: { Marca: "Stanley", Piezas: "6", Puntas: "Phillips y plana", Mango: "Antideslizante" },
    categorySlug: "herramientas-manuales",
    brandSlug: "stanley",
  },
  {
    name: 'Alicate Universal 8" Mango Ergonómico',
    slug: "alicate-universal-8-truper",
    description:
      "Alicate universal de 8 pulgadas en acero al cromo vanadio, con mango bimaterial ergonómico para tareas eléctricas y mecánicas.",
    price: 24900,
    cost: 15000,
    stock: 70,
    images: [img("1575908393823-8e6ee16403d8"), img("1679210208120-1b6a008be9b4")],
    specs: {
      Marca: "Truper",
      Longitud: '8 pulgadas',
      Material: "Acero al cromo vanadio",
      Mango: "Bimaterial antideslizante",
    },
    categorySlug: "herramientas-manuales",
    brandSlug: "truper",
  },
  {
    name: 'Llave Inglesa Ajustable 10"',
    slug: "llave-inglesa-ajustable-10-black-decker",
    description:
      "Llave ajustable de 10 pulgadas en acero al cromo vanadio, con mordazas de apertura amplia para tuercas y tubería.",
    price: 38900,
    cost: 24000,
    wholesalePrice: 32000,
    stock: 35,
    images: [img("1607870411816-fb70b9d7da6a"), img("1571505280193-4b4e29712a77")],
    specs: {
      Marca: "Black+Decker",
      Longitud: '10 pulgadas',
      Material: "Acero al cromo vanadio",
      "Apertura máxima": "25 mm",
    },
    categorySlug: "herramientas-manuales",
    brandSlug: "black-decker",
  },
  {
    name: 'Serrucho para Madera 20" Dientes Templados',
    slug: "serrucho-madera-20-stanley",
    description:
      "Serrucho de 20 pulgadas con dientes templados de precisión para cortes limpios en madera. Mango de polipropileno reforzado.",
    price: 34900,
    cost: 21500,
    stock: 30,
    images: [img("1626122366589-c5ee0e744102"), img("1607870411590-d5e9e06da09a")],
    specs: {
      Marca: "Stanley",
      Longitud: '20 pulgadas',
      Dientes: "Templados de precisión",
      Mango: "Polipropileno",
    },
    categorySlug: "herramientas-manuales",
    brandSlug: "stanley",
  },

  // ==================== Herramientas Eléctricas ====================
  {
    name: "Taladro Percutor Inalámbrico 20V",
    slug: "taladro-percutor-inalambrico-20v-dewalt",
    description:
      "Taladro percutor inalámbrico de 20V con batería de litio incluida. Mandril de 13 mm y dos velocidades para madera, metal y mampostería liviana.",
    price: 489900,
    cost: 315000,
    wholesalePrice: 410000,
    stock: 18,
    images: [img("1572981779307-38b8cabb2407"), img("1504148455328-c376907d081c")],
    specs: { Marca: "DeWalt", Voltaje: "20V", Batería: "Litio incluida", Mandril: "13 mm", Garantía: "12 meses" },
    isNew: true,
    isFeatured: true,
    categorySlug: "herramientas-electricas",
    brandSlug: "dewalt",
  },
  {
    name: "Rotomartillo SDS-Plus 800W",
    slug: "rotomartillo-sds-plus-800w-bosch",
    description:
      "Rotomartillo de 800W con sistema SDS-Plus para perforación en concreto y mampostería. Incluye empuñadura auxiliar y tope de profundidad.",
    price: 689900,
    cost: 445000,
    stock: 10,
    images: [img("1622044939413-0b829c342434"), img("1689935421853-cb23a0bc92e4")],
    specs: { Marca: "Bosch", Potencia: "800W", Sistema: "SDS-Plus", Uso: "Concreto y mampostería" },
    isFeatured: true,
    categorySlug: "herramientas-electricas",
    brandSlug: "bosch",
  },
  {
    name: 'Amoladora Angular 4.5" 900W',
    slug: "amoladora-angular-45-900w-makita",
    description:
      "Amoladora angular de 900W para corte y desbaste de metal. Disco de 4.5 pulgadas con protector de seguridad ajustable.",
    price: 259900,
    cost: 168000,
    wholesalePrice: 215000,
    stock: 25,
    images: [img("1592054286113-649ba108e968"), img("1590635023142-73c3d34f2805")],
    specs: { Marca: "Makita", Potencia: "900W", Disco: '4.5 pulgadas', RPM: "11000" },
    categorySlug: "herramientas-electricas",
    brandSlug: "makita",
  },
  {
    name: 'Sierra Circular 7 1/4" 1400W',
    slug: "sierra-circular-714-1400w-dewalt",
    description:
      "Sierra circular de 1400W con disco de 7 1/4 pulgadas para corte de madera y tableros. Guía láser y ajuste de profundidad e inclinación.",
    price: 549900,
    cost: 355000,
    stock: 12,
    images: [img("1645651964715-d200ce0939cc"), img("1623161551706-318825cd18ef")],
    specs: { Marca: "DeWalt", Potencia: "1400W", Disco: '7 1/4 pulgadas', "Profundidad de corte": "66 mm" },
    categorySlug: "herramientas-electricas",
    brandSlug: "dewalt",
  },
  {
    name: "Atornillador Inalámbrico 12V con Maletín",
    slug: "atornillador-inalambrico-12v-black-decker",
    description:
      "Atornillador inalámbrico compacto de 12V con torque ajustable. Incluye maletín, batería y juego de puntas.",
    price: 189900,
    cost: 118000,
    wholesalePrice: 156000,
    stock: 32,
    images: [img("1623161551727-54c918bdcec1"), img("1540104539488-92a51bbc0410")],
    specs: { Marca: "Black+Decker", Voltaje: "12V", Torque: "20 Nm", Incluye: "Maletín y puntas" },
    isNew: true,
    categorySlug: "herramientas-electricas",
    brandSlug: "black-decker",
  },

  // ==================== Tornillería y Fijaciones ====================
  {
    name: 'Caja de Tornillos Autorroscantes 1" x 100 Unidades',
    slug: "caja-tornillos-autorroscantes-1-truper",
    description: "Caja de 100 tornillos autorroscantes en acero galvanizado para fijación en madera y lámina.",
    price: 8900,
    cost: 4800,
    stock: 150,
    images: [img("1613945831677-383c19ad7721"), img("1641937725629-2adda0f55251")],
    specs: { Marca: "Truper", Cantidad: "100 unidades", Medida: '1 pulgada', Material: "Acero galvanizado" },
    categorySlug: "tornilleria-fijaciones",
    brandSlug: "truper",
  },
  {
    name: "Set de Tuercas y Tornillos Hexagonales M8 x 50 Unidades",
    slug: "set-tuercas-tornillos-m8-truper",
    description: "Combo de 50 tornillos y tuercas hexagonales M8 en acero zincado para ensambles generales.",
    price: 12900,
    cost: 7200,
    wholesalePrice: 10500,
    stock: 90,
    images: [img("1614424428282-b2b1e72c6a4e"), img("1529255848089-c4e456d166e0")],
    specs: { Marca: "Truper", Cantidad: "50 unidades", Rosca: "M8", Material: "Acero zincado" },
    categorySlug: "tornilleria-fijaciones",
    brandSlug: "truper",
  },
  {
    name: 'Anclas de Expansión para Concreto 3/8" x 20 Unidades',
    slug: "anclas-expansion-concreto-38-stanley",
    description: "Anclas de expansión de 3/8 de pulgada para fijaciones de carga en concreto sólido.",
    price: 15900,
    stock: 70,
    images: [img("1617123623686-2b7b339785da")],
    specs: { Marca: "Stanley", Cantidad: "20 unidades", Medida: '3/8 pulgada', Uso: "Fijación en concreto" },
    categorySlug: "tornilleria-fijaciones",
    brandSlug: "stanley",
  },
  {
    name: 'Clavos de Acero para Construcción 2.5" x 1 kg',
    slug: "clavos-acero-construccion-25-1kg-truper",
    description: "Clavos de acero pulido de 2.5 pulgadas, presentación por kilogramo, para uso general en obra.",
    price: 9900,
    cost: 5400,
    stock: 120,
    images: [img("1655927858183-fe31d5dd1080"), img("1605701249987-f0bb9b505d06")],
    specs: { Marca: "Truper", Peso: "1 kg", Medida: '2.5 pulgadas', Material: "Acero pulido" },
    isNew: true,
    categorySlug: "tornilleria-fijaciones",
    brandSlug: "truper",
  },

  // ==================== Pinturas y Acabados ====================
  {
    name: "Pintura Vinilo Tipo 1 Blanco 1 Galón",
    slug: "pintura-vinilo-tipo1-blanco-galon-pintuco",
    description: "Pintura vinilo tipo 1 en color blanco, acabado mate, para interiores y exteriores.",
    price: 89900,
    cost: 58000,
    wholesalePrice: 74000,
    stock: 45,
    images: [img("1585676737728-432f58d5fdba"), img("1652829069834-2c05031199c5")],
    specs: {
      Marca: "Pintuco",
      Presentación: "1 galón",
      Color: "Blanco",
      Rendimiento: "40 m² aprox.",
      Acabado: "Mate",
    },
    isFeatured: true,
    categorySlug: "pinturas-acabados",
    brandSlug: "pintuco",
  },
  {
    name: "Esmalte Sintético Negro 1/4 Galón",
    slug: "esmalte-sintetico-negro-cuarto-pintuco",
    description: "Esmalte sintético brillante en color negro, ideal para superficies metálicas y de madera.",
    price: 42900,
    cost: 27000,
    stock: 60,
    images: [img("1652829069862-87874e119527"), img("1652829069968-4ded3e30f411")],
    specs: { Marca: "Pintuco", Presentación: "1/4 galón", Color: "Negro", Acabado: "Brillante", Uso: "Metal y madera" },
    categorySlug: "pinturas-acabados",
    brandSlug: "pintuco",
  },
  {
    name: "Set de Rodillos y Bandeja para Pintura",
    slug: "set-rodillos-bandeja-pintura-truper",
    description: "Kit de dos rodillos, bandeja y extensión para aplicación de pintura en interiores.",
    price: 39900,
    cost: 23500,
    wholesalePrice: 32500,
    stock: 55,
    images: [img("1629397545188-cf2da30db99b"), img("1629397545234-6b90d2ac2476")],
    specs: { Marca: "Truper", Incluye: "2 rodillos, bandeja y extensión", Uso: "Pintura de interiores" },
    categorySlug: "pinturas-acabados",
    brandSlug: "truper",
  },
  {
    name: 'Brocha de Cerdas Naturales 3"',
    slug: "brocha-cerdas-naturales-3-truper",
    description: "Brocha de 3 pulgadas con cerdas naturales y mango de madera, para acabados de precisión.",
    price: 15900,
    cost: 8800,
    stock: 100,
    images: [img("1652211460460-cee33d1617d1"), img("1652829069585-37858739312a")],
    specs: { Marca: "Truper", Ancho: '3 pulgadas', Cerdas: "Naturales", Mango: "Madera" },
    categorySlug: "pinturas-acabados",
    brandSlug: "truper",
  },
  {
    name: 'Cinta de Enmascarar Profesional 2" x 50 m',
    slug: "cinta-enmascarar-profesional-2x50-3m",
    description: "Cinta de enmascarar de uso profesional, fácil de retirar sin dejar residuo.",
    price: 18900,
    stock: 130,
    images: [img("1597857306105-b23e08328d30"), img("1652829069629-959f8927f608")],
    specs: { Marca: "3M", Ancho: '2 pulgadas', Longitud: "50 m", Uso: "Enmascarado profesional" },
    isNew: true,
    categorySlug: "pinturas-acabados",
    brandSlug: "3m",
  },

  // ==================== Plomería ====================
  {
    name: 'Llave de Paso PVC 1/2"',
    slug: "llave-paso-pvc-12-corona",
    description: "Llave de paso en PVC de 1/2 pulgada para redes de agua potable residenciales.",
    price: 12900,
    cost: 7500,
    stock: 80,
    images: [img("1538474705339-e87de81450e8")],
    specs: { Marca: "Corona", Medida: '1/2 pulgada', Material: "PVC", Uso: "Agua potable" },
    categorySlug: "plomeria",
    brandSlug: "corona",
  },
  {
    name: 'Tubo PVC Presión 1/2" x 6 m',
    slug: "tubo-pvc-presion-12-6m-corona",
    description: "Tubo PVC para agua a presión de 1/2 pulgada, presentación de 6 metros.",
    price: 24900,
    cost: 15500,
    wholesalePrice: 20500,
    stock: 60,
    images: [img("1607472586893-edb57bdc0e39"), img("1693907986952-3cd372e4c9d8")],
    specs: { Marca: "Corona", Medida: '1/2 pulgada', Longitud: "6 metros", Uso: "Agua potable presurizada" },
    categorySlug: "plomeria",
    brandSlug: "corona",
  },
  {
    name: "Llave Mezcladora para Lavamanos Monocontrol",
    slug: "llave-mezcladora-lavamanos-corona",
    description: "Llave mezcladora monocontrol para lavamanos, acabado cromado, incluye instalación estándar.",
    price: 129900,
    cost: 83000,
    wholesalePrice: 106000,
    stock: 22,
    images: [img("1650551182991-b07558247564"), img("1545193329-4a052e14eb8f")],
    specs: { Marca: "Corona", Tipo: "Monocontrol", Acabado: "Cromado", Instalación: "Lavamanos" },
    isFeatured: true,
    categorySlug: "plomeria",
    brandSlug: "corona",
  },
  {
    name: "Kit de Reparación de Sifón para Lavaplatos",
    slug: "kit-reparacion-sifon-lavaplatos-corona",
    description: "Kit en PVC para reparación o instalación de sifón en lavaplatos y lavamanos, incluye empaques.",
    price: 22900,
    stock: 40,
    images: [img("1639600993675-2281b2c939f0"), img("1543674892-7d64d45df18b")],
    specs: { Marca: "Corona", Material: "PVC", Incluye: "Sifón, empaques y tuerca", Uso: "Lavaplatos y lavamanos" },
    isNew: true,
    categorySlug: "plomeria",
    brandSlug: "corona",
  },

  // ==================== Electricidad ====================
  {
    name: "Cable Eléctrico Encauchetado 3x14 AWG x metro",
    slug: "cable-electrico-encauchetado-3x14-truper",
    description: "Cable encauchetado 3x14 AWG, venta por metro, para instalaciones eléctricas residenciales.",
    price: 4900,
    cost: 2900,
    stock: 300,
    images: [img("1518181835702-6eef8b4b2113"), img("1625276254563-f0fbbf66a5e7")],
    specs: { Marca: "Truper", Calibre: "3x14 AWG", Tipo: "Encauchetado", Uso: "Instalaciones residenciales" },
    categorySlug: "electricidad",
    brandSlug: "truper",
  },
  {
    name: 'Cinta Aislante Eléctrica Negra 3/4" x 18 m',
    slug: "cinta-aislante-electrica-negra-3m",
    description: "Cinta aislante de PVC en color negro, para empalmes y protección de instalaciones eléctricas.",
    price: 6900,
    cost: 3900,
    wholesalePrice: 5600,
    stock: 200,
    images: [img("1717667745852-a5bd6876c1de")],
    specs: { Marca: "3M", Ancho: '3/4 pulgada', Longitud: "18 metros", "Voltaje máximo": "600V" },
    categorySlug: "electricidad",
    brandSlug: "3m",
  },
  {
    name: "Breaker Termomagnético 1 Polo 20A",
    slug: "breaker-termomagnetico-1-polo-20a-truper",
    description: "Breaker termomagnético de 1 polo y 20 amperios para tableros de distribución residencial.",
    price: 18900,
    cost: 11800,
    stock: 70,
    images: [img("1687038520579-8d8f24721267")],
    specs: { Marca: "Truper", Polos: "1", Amperaje: "20A", Uso: "Tablero eléctrico residencial" },
    categorySlug: "electricidad",
    brandSlug: "truper",
  },
  {
    name: "Multímetro Digital Automático",
    slug: "multimetro-digital-automatico-truper",
    description: "Multímetro digital de rango automático para medir voltaje, corriente y resistencia. Pantalla LCD.",
    price: 79900,
    cost: 50000,
    wholesalePrice: 65500,
    stock: 28,
    images: [img("1687038520563-2310e8b06ed2"), img("1607631755187-298a3f9a640a")],
    specs: {
      Marca: "Truper",
      Rango: "Automático",
      Mide: "Voltaje, corriente y resistencia",
      Pantalla: "LCD",
    },
    isNew: true,
    isFeatured: true,
    categorySlug: "electricidad",
    brandSlug: "truper",
  },

  // ==================== Cerrajería ====================
  {
    name: "Candado de Seguridad 50 mm Acero Laminado",
    slug: "candado-seguridad-50mm-yale",
    description: "Candado de seguridad de 50 mm en acero laminado, incluye tres llaves.",
    price: 34900,
    cost: 21500,
    wholesalePrice: 29000,
    stock: 60,
    images: [img("1555529902-5261145633bf"), img("1561825618-a26f85c50bf4")],
    specs: { Marca: "Yale", Medida: "50 mm", Material: "Acero laminado", "Llaves incluidas": "3" },
    isFeatured: true,
    categorySlug: "cerrajeria",
    brandSlug: "yale",
  },
  {
    name: "Cerradura de Perilla para Puerta Interior",
    slug: "cerradura-perilla-puerta-interior-yale",
    description: "Cerradura de perilla para puertas interiores, acabado níquel satinado.",
    price: 45900,
    cost: 28500,
    stock: 40,
    images: [img("1586864387634-2f33030dab41"), img("1614797091730-e2a6121aaa60")],
    specs: { Marca: "Yale", Tipo: "Perilla", Uso: "Puerta interior", Acabado: "Níquel satinado" },
    categorySlug: "cerrajeria",
    brandSlug: "yale",
  },
  {
    name: "Cerradura de Sobreponer con Cerrojo",
    slug: "cerradura-sobreponer-cerrojo-yale",
    description: "Cerradura de sobreponer con cerrojo de seguridad, incluye tres llaves.",
    price: 69900,
    cost: 44000,
    wholesalePrice: 58000,
    stock: 25,
    images: [img("1586661615438-349a276d098b"), img("1615842978998-54a9182892b2")],
    specs: { Marca: "Yale", Tipo: "Sobreponer", Incluye: "Cerrojo", "Llaves incluidas": "3" },
    categorySlug: "cerrajeria",
    brandSlug: "yale",
  },
  {
    name: "Candado de Combinación 4 Dígitos",
    slug: "candado-combinacion-4-digitos-truper",
    description: "Candado con combinación de 4 dígitos en aleación de zinc, sin necesidad de llave.",
    price: 19900,
    cost: 11800,
    stock: 75,
    images: [img("1587195399841-fc7174360a86"), img("1584985429980-a9db9a42b324")],
    specs: { Marca: "Truper", Tipo: "Combinación", Dígitos: "4", Material: "Aleación de zinc" },
    isNew: true,
    categorySlug: "cerrajeria",
    brandSlug: "truper",
  },

  // ==================== Adhesivos y Selladores ====================
  {
    name: "Silicona Sellante Transparente 300 ml",
    slug: "silicona-sellante-transparente-300ml-3m",
    description: "Silicona sellante transparente multiuso, presentación en cartucho de 300 ml.",
    price: 16900,
    cost: 9700,
    wholesalePrice: 14000,
    stock: 110,
    images: [img("1614162063681-1adc832305b1")],
    specs: { Marca: "3M", Presentación: "300 ml", Color: "Transparente", Uso: "Sellado multiuso" },
    categorySlug: "adhesivos-selladores",
    brandSlug: "3m",
  },
  {
    name: "Pistola para Silicona Manual",
    slug: "pistola-silicona-manual-truper",
    description: "Pistola manual en acero para aplicación de cartuchos de silicona de 300 ml.",
    price: 12900,
    cost: 7400,
    stock: 85,
    images: [img("1560755341-c5417203d21c")],
    specs: { Marca: "Truper", Tipo: "Manual", Compatibilidad: "Cartuchos 300 ml", Material: "Acero" },
    categorySlug: "adhesivos-selladores",
    brandSlug: "truper",
  },
  {
    name: "Pegante de Contacto Multiuso 250 g",
    slug: "pegante-contacto-multiuso-250g-truper",
    description: "Pegante de contacto de secado rápido para madera, cuero y caucho. Presentación de 250 g.",
    price: 14900,
    cost: 8500,
    stock: 95,
    images: [img("1536786724684-63545518d243")],
    specs: { Marca: "Truper", Presentación: "250 g", Tipo: "Contacto", Uso: "Madera, cuero y caucho" },
    categorySlug: "adhesivos-selladores",
    brandSlug: "truper",
  },
  {
    name: 'Cinta Doble Faz de Alta Resistencia 2" x 5 m',
    slug: "cinta-doble-faz-alta-resistencia-3m",
    description: "Cinta doble faz de alta resistencia para fijaciones sin tornillos en interiores y exteriores.",
    price: 22900,
    cost: 13500,
    wholesalePrice: 18800,
    stock: 70,
    images: [img("1614162063681-1adc832305b1"), img("1560755341-c5417203d21c")],
    specs: { Marca: "3M", Ancho: '2 pulgadas', Longitud: "5 metros", Uso: "Fijación sin tornillos" },
    isNew: true,
    categorySlug: "adhesivos-selladores",
    brandSlug: "3m",
  },

  // ==================== Seguridad Industrial ====================
  {
    name: "Casco de Seguridad Tipo I Ajustable",
    slug: "casco-seguridad-tipo1-3m",
    description: "Casco de seguridad tipo I con sistema de ajuste tipo rachet, cumple norma ANSI Z89.1.",
    price: 39900,
    cost: 24500,
    wholesalePrice: 33000,
    stock: 50,
    images: [img("1567954970774-58d6aa6c50dc"), img("1564483335100-3413b45dbd37")],
    specs: { Marca: "3M", Tipo: "I", Ajuste: "Rachet", Norma: "ANSI Z89.1" },
    isFeatured: true,
    categorySlug: "seguridad-industrial",
    brandSlug: "3m",
  },
  {
    name: "Gafas de Seguridad Antiempañantes",
    slug: "gafas-seguridad-antiempanantes-3m",
    description: "Gafas de seguridad con tratamiento antiempañante y protección UV, cumplen norma ANSI Z87.1.",
    price: 15900,
    cost: 9000,
    stock: 120,
    images: [img("1622612023350-b15f063eabe6")],
    specs: { Marca: "3M", Tratamiento: "Antiempañante", "Protección UV": "Sí", Norma: "ANSI Z87.1" },
    categorySlug: "seguridad-industrial",
    brandSlug: "3m",
  },
  {
    name: "Guantes de Carnaza Reforzados Talla Única",
    slug: "guantes-carnaza-reforzados-truper",
    description: "Guantes de carnaza reforzada para manejo de cargas y trabajos de soldadura.",
    price: 18900,
    cost: 11000,
    wholesalePrice: 15500,
    stock: 100,
    images: [img("1632516160994-b4463d4e19d2")],
    specs: { Marca: "Truper", Material: "Carnaza", Talla: "Única", Uso: "Manejo de cargas y soldadura" },
    categorySlug: "seguridad-industrial",
    brandSlug: "truper",
  },
  {
    name: "Chaleco Reflectivo de Seguridad",
    slug: "chaleco-reflectivo-seguridad-truper",
    description: "Chaleco de poliéster con franjas reflectivas para trabajos de alta visibilidad.",
    price: 22900,
    stock: 65,
    images: [img("1509453721491-c3af5961df76"), img("1567954970774-58d6aa6c50dc")],
    specs: { Marca: "Truper", Material: "Poliéster", Franjas: "Reflectivas", Norma: "Alta visibilidad" },
    isNew: true,
    categorySlug: "seguridad-industrial",
    brandSlug: "truper",
  },

  // ==================== Jardinería ====================
  {
    name: "Pala Cuadrada con Mango Largo",
    slug: "pala-cuadrada-mango-largo-truper",
    description: "Pala cuadrada de acero con mango de madera de 120 cm, para trabajos de jardinería y obra.",
    price: 42900,
    cost: 26500,
    wholesalePrice: 35500,
    stock: 40,
    images: [img("1661712663315-d851d40bcf07"), img("1537877853655-34bdcda5e833")],
    specs: { Marca: "Truper", Tipo: "Cuadrada", Mango: "Madera 120 cm", Material: "Acero" },
    categorySlug: "jardineria",
    brandSlug: "truper",
  },
  {
    name: "Tijeras Podadoras de Mano",
    slug: "tijeras-podadoras-mano-stanley",
    description: "Tijeras podadoras tipo bypass con mango antideslizante, para ramas y tallos delgados.",
    price: 28900,
    cost: 17500,
    stock: 65,
    images: [img("1598851418241-f52c34b6e4c3"), img("1651197227940-60c9d32f89e7")],
    specs: { Marca: "Stanley", Tipo: "Bypass", Mango: "Antideslizante", Uso: "Poda de ramas delgadas" },
    categorySlug: "jardineria",
    brandSlug: "stanley",
  },
  {
    name: "Manguera para Jardín 15 m con Accesorios",
    slug: "manguera-jardin-15m-accesorios-truper",
    description: "Manguera de PVC reforzado de 15 metros para riego, incluye pistola de riego con varias posiciones.",
    price: 65900,
    cost: 41500,
    wholesalePrice: 54500,
    stock: 30,
    images: [img("1597764983031-60a74afb8692"), img("1596277922657-f80257171aec")],
    specs: { Marca: "Truper", Longitud: "15 metros", Material: "PVC reforzado", Incluye: "Pistola de riego" },
    isFeatured: true,
    categorySlug: "jardineria",
    brandSlug: "truper",
  },
  {
    name: "Carretilla de Construcción 6 Pies Cúbicos",
    slug: "carretilla-construccion-6pc-truper",
    description: "Carretilla con bandeja metálica de 6 pies cúbicos y llanta neumática, para obra y jardín.",
    price: 189900,
    cost: 123000,
    wholesalePrice: 156000,
    stock: 15,
    images: [img("1573561368183-fd88bdb4503d"), img("1599914466149-1b958674b7ba")],
    specs: { Marca: "Truper", Capacidad: "6 pies cúbicos", Llanta: "Neumática", Uso: "Obra y jardín" },
    isNew: true,
    isFeatured: true,
    categorySlug: "jardineria",
    brandSlug: "truper",
  },
]

async function main() {
  let createdCategories = 0
  const categoryIds: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    categoryIds[cat.slug] = result.id
    if (result.createdAt.getTime() === result.updatedAt.getTime()) createdCategories++
  }
  console.log(`Categorías: ${createdCategories} creadas, ${CATEGORIES.length - createdCategories} ya existían.`)

  let createdBrands = 0
  const brandIds: Record<string, string> = {}
  for (const brand of BRANDS) {
    const result = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    })
    brandIds[brand.slug] = result.id
    if (result.createdAt.getTime() === result.updatedAt.getTime()) createdBrands++
  }
  console.log(`Marcas: ${createdBrands} creadas, ${BRANDS.length - createdBrands} ya existían.`)

  let createdProducts = 0
  for (const p of PRODUCTS) {
    const result = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        cost: p.cost,
        wholesalePrice: p.wholesalePrice,
        stock: p.stock,
        images: p.images,
        specs: p.specs,
        isNew: p.isNew ?? false,
        isFeatured: p.isFeatured ?? false,
        categoryId: categoryIds[p.categorySlug],
        brandId: brandIds[p.brandSlug],
      },
    })
    if (result.createdAt.getTime() === result.updatedAt.getTime()) createdProducts++
  }
  console.log(`Productos: ${createdProducts} creados, ${PRODUCTS.length - createdProducts} ya existían.`)

  console.log("\nListo.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
