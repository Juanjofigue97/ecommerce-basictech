import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PERMISSIONS = [
  { key: "dashboard", name: "Dashboard" },
  { key: "clientes", name: "Clientes" },
  { key: "facturas", name: "Facturas" },
  { key: "configuraciones", name: "Configuraciones" },
  { key: "rangos_numeracion", name: "Rangos de numeración" },
  { key: "usuarios", name: "Usuarios" },
  { key: "productos", name: "Productos" },
  { key: "cierre_caja", name: "Cierre de caja" },
  { key: "proveedores", name: "Proveedores" },
  { key: "terminales", name: "Terminales" },
  { key: "roles_permisos", name: "Roles y permisos" },
  { key: "reporte_ventas_diarias", name: "Reporte de ventas diarias" },
  { key: "productos_vendidos", name: "Productos vendidos" },
  { key: "ventas_rapidas", name: "Ventas rapidas" },
  { key: "egresos", name: "Egresos" },
  { key: "compras", name: "Compras" },
  { key: "ver_totales_venta", name: "Ver totales de venta" },
  { key: "financiaciones", name: "Financiaciones" },
  { key: "nomina", name: "Nomina" },
  { key: "empleados", name: "Empleados" },
  { key: "impuestos", name: "Impuestos" },
  { key: "eliminar_facturas", name: "Eliminar facturas" },
  { key: "ir_a_factus", name: "Ir a factus" },
]

async function main() {
  console.log("Seeding database...")

  // Limpieza respetando orden de claves foráneas
  await prisma.heroSlide.deleteMany()
  await prisma.cashMovement.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cashSession.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.productVariantValue.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productAttribute.deleteMany()
  await prisma.categoryAttribute.deleteMany()
  await prisma.attributeValue.deleteMany()
  await prisma.attribute.deleteMany()
  await prisma.address.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.terminal.deleteMany()
  await prisma.storeSettings.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()

  // ==================== PERMISSIONS & ROLES ====================
  const permissionRecords = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PERMISSIONS.map((p) => (prisma as any).permission.create({ data: p }))
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminRole = await (prisma as any).role.create({
    data: {
      name: "Administrador",
      isSystem: true,
      permissions: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: permissionRecords.map((p: any) => ({ permissionId: p.id })),
      },
    },
  })
  console.log("Created permissions and Administrador role")

  // ==================== STORE SETTINGS ====================
  await prisma.storeSettings.create({
    data: {
      id: "singleton",
      name: "BasicTechShop",
      email: "info@basictechshop.com",
      phone: "+57 300 123 4567",
      address: "Calle 72 #10-34, Bogotá",
      description: "Tu tienda de tecnología y computación de confianza",
      currency: "cop",
    },
  })
  console.log("Created store settings")

  // ==================== CATEGORIES ====================
  const categoriesData = [
    { name: "Camisetas", slug: "camisetas", icon: "Shirt" },
    { name: "Shorts", slug: "shorts", icon: "ShoppingBag" },
    { name: "Buzos y Camperas", slug: "buzos-camperas", icon: "Wind" },
    { name: "Calzado Fútbol", slug: "calzado-futbol", icon: "Footprints" },
    { name: "Accesorios", slug: "accesorios", icon: "Package" },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat })
    categories[cat.slug] = created.id
  }
  console.log(`Created ${categoriesData.length} categories`)

  // ==================== BRANDS ====================
  const brandsData = [
    { name: "Adidas", slug: "adidas" },
    { name: "Crower", slug: "crower" },
    { name: "Kappa", slug: "kappa" },
    { name: "New Balance", slug: "new-balance" },
    { name: "Nike", slug: "nike" },
    { name: "On", slug: "on" },
    { name: "Puma", slug: "puma" },
    { name: "Reebok", slug: "reebok" },
    { name: "Umbro", slug: "umbro" },
    { name: "Under Armour", slug: "under-armour" },
  ]

  const brands: Record<string, string> = {}
  for (const brand of brandsData) {
    const created = await prisma.brand.create({ data: brand })
    brands[brand.slug] = created.id
  }
  console.log(`Created ${brandsData.length} teams/brands`)

  // ==================== ATTRIBUTES ====================
  const tallaAttr = await prisma.attribute.create({
    data: {
      name: "Talla",
      slug: "talla",
      values: {
        create: [
          { value: "XS", slug: "xs" },
          { value: "S", slug: "s" },
          { value: "M", slug: "m" },
          { value: "L", slug: "l" },
          { value: "XL", slug: "xl" },
          { value: "XXL", slug: "xxl" },
          { value: "38", slug: "38" },
          { value: "39", slug: "39" },
          { value: "40", slug: "40" },
          { value: "41", slug: "41" },
          { value: "42", slug: "42" },
          { value: "43", slug: "43" },
          { value: "44", slug: "44" },
          { value: "45", slug: "45" },
        ],
      },
    },
    include: { values: true },
  })

  const colorAttr = await prisma.attribute.create({
    data: {
      name: "Color",
      slug: "color",
      values: {
        create: [
          { value: "Blanco", slug: "blanco" },
          { value: "Negro", slug: "negro" },
          { value: "Azul", slug: "azul" },
          { value: "Rojo", slug: "rojo" },
          { value: "Verde", slug: "verde" },
          { value: "Amarillo", slug: "amarillo" },
          { value: "Celeste", slug: "celeste" },
          { value: "Naranja", slug: "naranja" },
          { value: "Violeta", slug: "violeta" },
          { value: "Rosa", slug: "rosa" },
        ],
      },
    },
    include: { values: true },
  })

  const equipoAttr = await prisma.attribute.create({
    data: {
      name: "Equipo",
      slug: "equipo",
      values: {
        create: [
          { value: "Real Madrid", slug: "real-madrid" },
          { value: "FC Barcelona", slug: "fc-barcelona" },
          { value: "Selección Argentina", slug: "seleccion-argentina" },
          { value: "Boca Juniors", slug: "boca-juniors" },
          { value: "River Plate", slug: "river-plate" },
          { value: "Manchester City", slug: "manchester-city" },
          { value: "Liverpool FC", slug: "liverpool-fc" },
          { value: "PSG", slug: "psg" },
          { value: "Bayern Munich", slug: "bayern-munich" },
          { value: "Juventus", slug: "juventus" },
        ],
      },
    },
    include: { values: true },
  })

  // Lookup maps
  const tallaById: Record<string, string> = {}
  for (const v of tallaAttr.values) tallaById[v.slug] = v.id

  const colorById: Record<string, string> = {}
  for (const v of colorAttr.values) colorById[v.slug] = v.id

  const equipoById: Record<string, string> = {}
  for (const v of equipoAttr.values) equipoById[v.slug] = v.id

  console.log("Created attributes")

  // ==================== CATEGORY ATTRIBUTES ====================
  // Camisetas: Talla + Color + Equipo
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["camisetas"], attributeId: tallaAttr.id },
      { categoryId: categories["camisetas"], attributeId: colorAttr.id },
      { categoryId: categories["camisetas"], attributeId: equipoAttr.id },
    ],
  })
  // Shorts: Talla + Color + Equipo
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["shorts"], attributeId: tallaAttr.id },
      { categoryId: categories["shorts"], attributeId: colorAttr.id },
      { categoryId: categories["shorts"], attributeId: equipoAttr.id },
    ],
  })
  // Buzos/Camperas: Talla + Color + Equipo
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["buzos-camperas"], attributeId: tallaAttr.id },
      { categoryId: categories["buzos-camperas"], attributeId: colorAttr.id },
      { categoryId: categories["buzos-camperas"], attributeId: equipoAttr.id },
    ],
  })
  // Calzado: Talla + Color
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["calzado-futbol"], attributeId: tallaAttr.id },
      { categoryId: categories["calzado-futbol"], attributeId: colorAttr.id },
    ],
  })
  // Accesorios: Color + Equipo
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["accesorios"], attributeId: colorAttr.id },
      { categoryId: categories["accesorios"], attributeId: equipoAttr.id },
    ],
  })
  console.log("Created category attributes")

  // ==================== PRODUCTS + VARIANTS ====================

  async function createJerseyVariants(
    productId: string,
    tallas: string[],
    colorId: string,
    equipoId: string,
    price: number,
    skuPrefix: string,
    stockPerTalla: Partial<Record<string, number>> = {}
  ) {
    for (const talla of tallas) {
      const label = talla.toUpperCase()
      const sku = `${skuPrefix}-${talla.toUpperCase()}`
      const stock = stockPerTalla[talla] ?? 10
      const variant = await prisma.productVariant.create({
        data: { label, sku, stock, price, productId },
      })
      await prisma.productVariantValue.createMany({
        data: [
          { variantId: variant.id, attributeValueId: tallaById[talla] },
          { variantId: variant.id, attributeValueId: colorId },
          { variantId: variant.id, attributeValueId: equipoId },
        ],
      })
    }
  }

  // ---- Camiseta Real Madrid Local 24/25 ----
  const camisetaRealMadrid = await prisma.product.create({
    data: {
      name: "Camiseta Real Madrid Local 24/25",
      slug: "camiseta-real-madrid-local-2425",
      description:
        "La camiseta oficial del Real Madrid para la temporada 2024/25. Confeccionada en tejido Dri-FIT ADV con tecnología de gestión de humedad para máximo rendimiento en el campo.",
      price: 129990,
      comparePrice: 159990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500",
        "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=500",
      ],
      specs: { Marca: "Adidas", Temporada: "2024/25", Material: "100% Poliéster reciclado", Tecnología: "HEAT.RDY" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["camisetas"],
      brandId: brands["adidas"],
    },
  })
  await createJerseyVariants(
    camisetaRealMadrid.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["blanco"],
    equipoById["real-madrid"],
    129990,
    "RM-LOC-2425",
    { xs: 5, s: 12, m: 18, l: 15, xl: 10, xxl: 6 }
  )

  // ---- Camiseta FC Barcelona Local 24/25 ----
  const camisetaBarcelona = await prisma.product.create({
    data: {
      name: "Camiseta FC Barcelona Local 24/25",
      slug: "camiseta-fc-barcelona-local-2425",
      description:
        "La camiseta oficial del Barça con el icónico diseño a rayas azulgranas. Tecnología Nike Dri-FIT para mantener la frescura durante los 90 minutos.",
      price: 129990,
      comparePrice: 159990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500",
      ],
      specs: { Marca: "Nike", Temporada: "2024/25", Material: "100% Poliéster reciclado", Tecnología: "Dri-FIT" },
      isNew: true,
      isFeatured: true,
      categoryId: categories["camisetas"],
      brandId: brands["nike"],
    },
  })
  await createJerseyVariants(
    camisetaBarcelona.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["azul"],
    equipoById["fc-barcelona"],
    129990,
    "FCB-LOC-2425",
    { xs: 4, s: 10, m: 20, l: 16, xl: 8, xxl: 4 }
  )

  // ---- Camiseta Selección Argentina 2024 ----
  const camisetaArgentina = await prisma.product.create({
    data: {
      name: "Camiseta Selección Argentina 2024",
      slug: "camiseta-seleccion-argentina-2024",
      description:
        "La camiseta de los campeones del mundo. El clásico diseño celeste y blanco con la AFA y las tres estrellas. Edición conmemorativa Copa América 2024.",
      price: 119990,
      comparePrice: 139990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1551958219-acbc141d4254?w=500",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500",
      ],
      specs: { Marca: "Adidas", Edición: "Copa América 2024", Material: "100% Poliéster", Tecnología: "AEROREADY" },
      isNew: true,
      isFeatured: true,
      categoryId: categories["camisetas"],
      brandId: brands["adidas"],
    },
  })
  await createJerseyVariants(
    camisetaArgentina.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["celeste"],
    equipoById["seleccion-argentina"],
    119990,
    "ARG-LOC-2024",
    { xs: 6, s: 15, m: 25, l: 20, xl: 12, xxl: 7 }
  )

  // ---- Camiseta Boca Juniors Local 2024 ----
  const camisetaBoca = await prisma.product.create({
    data: {
      name: "Camiseta Boca Juniors Local 2024",
      slug: "camiseta-boca-juniors-local-2024",
      description:
        "La camiseta azul y oro del Xeneize para la temporada 2024. Diseño clásico con el escudo bordado y tecnología de secado rápido para el calor de La Bombonera.",
      price: 89990,
      comparePrice: 109990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1559087867-ce4c91325525?w=500",
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=500",
      ],
      specs: { Marca: "Adidas", Temporada: "2024", Material: "100% Poliéster", Tecnología: "HEAT.RDY" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["camisetas"],
      brandId: brands["adidas"],
    },
  })
  await createJerseyVariants(
    camisetaBoca.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["azul"],
    equipoById["boca-juniors"],
    89990,
    "BCA-LOC-2024",
    { xs: 5, s: 12, m: 18, l: 14, xl: 8, xxl: 4 }
  )

  // ---- Camiseta River Plate Visitante 2024 ----
  const camisetaRiver = await prisma.product.create({
    data: {
      name: "Camiseta River Plate Visitante 2024",
      slug: "camiseta-river-plate-visitante-2024",
      description:
        "La camiseta visitante del Millonario en color negro con la banda blanca y roja. Edición especial para los partidos de visitante en la Liga Profesional 2024.",
      price: 89990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=500",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500",
      ],
      specs: { Marca: "Adidas", Temporada: "2024", Material: "100% Poliéster", Tecnología: "AEROREADY" },
      isNew: true,
      isFeatured: false,
      categoryId: categories["camisetas"],
      brandId: brands["adidas"],
    },
  })
  await createJerseyVariants(
    camisetaRiver.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["negro"],
    equipoById["river-plate"],
    89990,
    "RVR-VIS-2024",
    { xs: 4, s: 8, m: 12, l: 10, xl: 6, xxl: 3 }
  )

  // ---- Camiseta Manchester City Local 24/25 ----
  const camisetaCity = await prisma.product.create({
    data: {
      name: "Camiseta Manchester City Local 24/25",
      slug: "camiseta-manchester-city-local-2425",
      description:
        "La camiseta celeste del City para defender el título de la Premier League. Diseño minimalista con detalles en azul marino y tecnología Puma DRY CELL.",
      price: 119990,
      comparePrice: 149990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=500",
        "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=500",
      ],
      specs: { Marca: "Puma", Temporada: "2024/25", Material: "100% Poliéster reciclado", Tecnología: "DRY CELL" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["camisetas"],
      brandId: brands["puma"],
    },
  })
  await createJerseyVariants(
    camisetaCity.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["celeste"],
    equipoById["manchester-city"],
    119990,
    "MCI-LOC-2425",
    { xs: 4, s: 9, m: 14, l: 12, xl: 8, xxl: 4 }
  )

  // ---- Camiseta Liverpool FC Local 24/25 ----
  const camisetaLiverpool = await prisma.product.create({
    data: {
      name: "Camiseta Liverpool FC Local 24/25",
      slug: "camiseta-liverpool-local-2425",
      description:
        "El icónico rojo de Anfield para la temporada 2024/25. Con el escudo del LFC y tecnología Nike Dri-FIT para mantenerte fresco durante el partido.",
      price: 119990,
      comparePrice: 139990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=500",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500",
      ],
      specs: { Marca: "Nike", Temporada: "2024/25", Material: "100% Poliéster", Tecnología: "Dri-FIT" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["camisetas"],
      brandId: brands["nike"],
    },
  })
  await createJerseyVariants(
    camisetaLiverpool.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["rojo"],
    equipoById["liverpool-fc"],
    119990,
    "LIV-LOC-2425",
    { xs: 4, s: 9, m: 14, l: 12, xl: 7, xxl: 4 }
  )

  // ---- Camiseta PSG Local 24/25 ----
  const camisetaPSG = await prisma.product.create({
    data: {
      name: "Camiseta PSG Local 24/25",
      slug: "camiseta-psg-local-2425",
      description:
        "La camiseta del París Saint-Germain azul marino con detalles rojos. Diseño inspirado en la Torre Eiffel con la tecnología Nike Dri-FIT para los duelos de la Ligue 1.",
      price: 119990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1519766304817-4f37bda74a26?w=500",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500",
      ],
      specs: { Marca: "Nike", Temporada: "2024/25", Material: "100% Poliéster reciclado", Tecnología: "Dri-FIT" },
      isNew: true,
      isFeatured: false,
      categoryId: categories["camisetas"],
      brandId: brands["nike"],
    },
  })
  await createJerseyVariants(
    camisetaPSG.id,
    ["xs", "s", "m", "l", "xl", "xxl"],
    colorById["azul"],
    equipoById["psg"],
    119990,
    "PSG-LOC-2425",
    { xs: 3, s: 8, m: 12, l: 10, xl: 6, xxl: 3 }
  )

  // ---- Short Real Madrid 24/25 ----
  const shortRealMadrid = await prisma.product.create({
    data: {
      name: "Short Real Madrid 24/25",
      slug: "short-real-madrid-2425",
      description:
        "Short oficial del Real Madrid para la temporada 2024/25. Combina perfecto con la camiseta local. Cintura elástica con cordón y bolsillos laterales.",
      price: 59990,
      comparePrice: 74990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1562183241-b937e95585b6?w=500",
        "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=500",
      ],
      specs: { Marca: "Adidas", Temporada: "2024/25", Material: "100% Poliéster", Corte: "Regular" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["shorts"],
      brandId: brands["adidas"],
    },
  })
  for (const talla of ["xs", "s", "m", "l", "xl", "xxl"] as const) {
    const label = talla.toUpperCase()
    const sku = `RM-SHO-2425-${talla.toUpperCase()}`
    const variant = await prisma.productVariant.create({
      data: { label, sku, stock: 8, price: 59990, productId: shortRealMadrid.id },
    })
    await prisma.productVariantValue.createMany({
      data: [
        { variantId: variant.id, attributeValueId: tallaById[talla] },
        { variantId: variant.id, attributeValueId: colorById["blanco"] },
        { variantId: variant.id, attributeValueId: equipoById["real-madrid"] },
      ],
    })
  }

  // ---- Botín Nike Mercurial Vapor 16 ----
  const botin = await prisma.product.create({
    data: {
      name: "Botín Nike Mercurial Vapor 16 Elite",
      slug: "botin-nike-mercurial-vapor-16-elite",
      description:
        "El botín más rápido de Nike. Ideal para superficies de césped natural. Suela exterior con tacos AG-Pro y tejido NikeGrip para máxima tracción y velocidad.",
      price: 249990,
      comparePrice: 299990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500",
      ],
      specs: { Marca: "Nike", Superficie: "Césped Natural (FG)", Suela: "AG-Pro", Upper: "Flyknit" },
      isNew: true,
      isFeatured: true,
      categoryId: categories["calzado-futbol"],
      brandId: brands["nike"],
    },
  })
  for (const talla of ["38", "39", "40", "41", "42", "43", "44", "45"] as const) {
    const label = `Talla ${talla}`
    const sku = `NIKE-MV16-${talla}`
    const variant = await prisma.productVariant.create({
      data: { label, sku, stock: 4, price: 249990, productId: botin.id },
    })
    await prisma.productVariantValue.createMany({
      data: [
        { variantId: variant.id, attributeValueId: tallaById[talla] },
        { variantId: variant.id, attributeValueId: colorById["negro"] },
      ],
    })
  }

  console.log("Created 10 products with variants")

  // ==================== SUPPLIERS ====================
  const supplier1 = await prisma.supplier.create({
    data: {
      nit: "900.123.456-7",
      name: "Distribuidora Deportiva S.A.S",
      phone: "+57 301 234 5678",
      address: "Zona Industrial Montevideo, Bogotá",
      type: "JURIDICA",
      status: "ACTIVE",
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      nit: "800.987.654-3",
      name: "Importadora Sports Colombia Ltda",
      phone: "+57 302 345 6789",
      address: "Calle 13 #42-15, Medellín",
      type: "JURIDICA",
      status: "ACTIVE",
    },
  })

  await prisma.supplier.create({
    data: {
      nit: "1.098.765.432",
      name: "Carlos Martínez - Distribuidora Norte",
      phone: "+57 311 456 7890",
      address: "Carrera 15 #23-10, Barranquilla",
      type: "NATURAL",
      status: "ACTIVE",
    },
  })
  console.log("Created 3 suppliers")

  // ==================== USERS ====================
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: "$2b$10$qrNX1DkisQhnt1.Imhoz0u0JDglKCLV87X57rK9zPV0TFfjL7/mnC", // admin123
      name: "Admin Principal",
      phone: "+57 300 111 2222",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  })

  const cashierUser = await prisma.user.create({
    data: {
      email: "cajero@goalkit.com",
      password: "$2b$10$qrNX1DkisQhnt1.Imhoz0u0JDglKCLV87X57rK9zPV0TFfjL7/mnC", // admin123
      name: "María Cajero",
      phone: "+57 300 333 4444",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  })

  const customerUser1 = await prisma.user.create({
    data: {
      email: "juan@email.com",
      password: "$2b$10$qrNX1DkisQhnt1.Imhoz0u0JDglKCLV87X57rK9zPV0TFfjL7/mnC", // admin123
      name: "Juan Pérez",
      phone: "+57 311 987 6543",
      status: "ACTIVE",
    },
  })

  const customerUser2 = await prisma.user.create({
    data: {
      email: "sofia@email.com",
      password: "$2b$10$qrNX1DkisQhnt1.Imhoz0u0JDglKCLV87X57rK9zPV0TFfjL7/mnC", // admin123
      name: "Sofía Rodríguez",
      phone: "+57 312 765 4321",
      status: "ACTIVE",
    },
  })
  console.log("Created 4 users")

  // ==================== CUSTOMERS ====================
  const customer1 = await prisma.customer.create({
    data: {
      name: "Juan Pérez",
      phone: "+57 311 987 6543",
      email: "juan@email.com",
      document: "1.098.123.456",
      source: "ONLINE",
      status: "ACTIVE",
      userId: customerUser1.id,
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: "Sofía Rodríguez",
      phone: "+57 312 765 4321",
      email: "sofia@email.com",
      document: "1.012.345.678",
      source: "ONLINE",
      status: "ACTIVE",
      userId: customerUser2.id,
    },
  })

  const customer3 = await prisma.customer.create({
    data: {
      name: "Carlos Gómez",
      phone: "+57 315 111 2233",
      document: "79.456.321",
      source: "PHYSICAL",
      status: "ACTIVE",
    },
  })
  console.log("Created 3 customers")

  // ==================== ADDRESSES ====================
  const address1 = await prisma.address.create({
    data: {
      label: "Casa",
      name: "Juan Pérez",
      phone: "+57 311 987 6543",
      address: "Calle 72 #8-24, Apto 301",
      city: "Bogotá",
      state: "Cundinamarca",
      zipCode: "110221",
      isDefault: true,
      userId: customerUser1.id,
    },
  })

  await prisma.address.create({
    data: {
      label: "Trabajo",
      name: "Juan Pérez",
      phone: "+57 311 987 6543",
      address: "Carrera 11 #93-16, Of. 502",
      city: "Bogotá",
      state: "Cundinamarca",
      zipCode: "110221",
      isDefault: false,
      userId: customerUser1.id,
    },
  })

  await prisma.address.create({
    data: {
      label: "Casa",
      name: "Sofía Rodríguez",
      phone: "+57 312 765 4321",
      address: "Av. El Poblado #15-34",
      city: "Medellín",
      state: "Antioquia",
      zipCode: "050021",
      isDefault: true,
      userId: customerUser2.id,
    },
  })
  console.log("Created addresses")

  // ==================== TERMINALS ====================
  const terminal1 = await prisma.terminal.create({
    data: { name: "Caja Principal", isActive: true },
  })

  const terminal2 = await prisma.terminal.create({
    data: { name: "Caja 2", isActive: true },
  })
  console.log("Created 2 terminals")

  // ==================== CASH SESSIONS ====================
  const closedSession = await prisma.cashSession.create({
    data: {
      terminalId: terminal1.id,
      userId: cashierUser.id,
      openingBalance: 200000,
      closingBalance: 850000,
      expectedBalance: 850000,
      status: "CLOSED",
      openedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      closedAt: new Date(),
      observations: "Turno sin novedades",
    },
  })

  await prisma.cashSession.create({
    data: {
      terminalId: terminal2.id,
      userId: cashierUser.id,
      openingBalance: 150000,
      status: "OPEN",
      openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  })
  console.log("Created 2 cash sessions")

  // ==================== CASH MOVEMENTS ====================
  await prisma.cashMovement.createMany({
    data: [
      {
        sessionId: closedSession.id,
        userId: cashierUser.id,
        type: "INCOME",
        amount: 50000,
        concept: "Fondo adicional de caja",
      },
      {
        sessionId: closedSession.id,
        userId: cashierUser.id,
        type: "EXPENSE",
        amount: 15000,
        concept: "Compra bolsas de empaque",
      },
    ],
  })
  console.log("Created cash movements")

  // ==================== PURCHASE ORDERS ====================
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2024-001",
      supplierId: supplier1.id,
      createdById: adminUser.id,
      total: 3200000,
      status: "RECEIVED",
      receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: "Reposición de stock temporada Champions League",
      items: {
        create: [
          { productId: camisetaRealMadrid.id, quantity: 20, quantityReceived: 20, unitCost: 65000, total: 1300000 },
          { productId: camisetaBarcelona.id, quantity: 20, quantityReceived: 20, unitCost: 65000, total: 1300000 },
          { productId: shortRealMadrid.id, quantity: 20, quantityReceived: 20, unitCost: 30000, total: 600000 },
        ],
      },
    },
  })

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2024-002",
      supplierId: supplier2.id,
      createdById: adminUser.id,
      total: 4800000,
      status: "ORDERED",
      notes: "Importación camisetas ligas locales + botines",
      items: {
        create: [
          { productId: camisetaBoca.id, quantity: 30, quantityReceived: 0, unitCost: 45000, total: 1350000 },
          { productId: camisetaArgentina.id, quantity: 30, quantityReceived: 0, unitCost: 60000, total: 1800000 },
          { productId: botin.id, quantity: 10, quantityReceived: 0, unitCost: 125000, total: 1250000 },
          { productId: camisetaRiver.id, quantity: 20, quantityReceived: 0, unitCost: 45000, total: 900000 },
        ],
      },
    },
  })
  console.log("Created 2 purchase orders")

  // ==================== ORDERS ====================
  await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0001",
      status: "DELIVERED",
      channel: "ONLINE",
      subtotal: 249980,
      shipping: 12000,
      total: 261980,
      paymentMethod: "CARD",
      customerId: customer1.id,
      userId: customerUser1.id,
      addressId: address1.id,
      items: {
        create: [
          {
            name: "Camiseta Real Madrid Local 24/25 - L",
            price: 129990,
            quantity: 1,
            total: 129990,
            productId: camisetaRealMadrid.id,
          },
          {
            name: "Camiseta Selección Argentina 2024 - M",
            price: 119990,
            quantity: 1,
            total: 119990,
            productId: camisetaArgentina.id,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0002",
      status: "SHIPPED",
      channel: "ONLINE",
      subtotal: 129990,
      shipping: 12000,
      total: 141990,
      paymentMethod: "TRANSFER",
      customerId: customer2.id,
      userId: customerUser2.id,
      items: {
        create: [
          {
            name: "Camiseta FC Barcelona Local 24/25 - S",
            price: 129990,
            quantity: 1,
            total: 129990,
            productId: camisetaBarcelona.id,
          },
        ],
      },
    },
  })

  const posOrder = await prisma.order.create({
    data: {
      orderNumber: "POS-2024-0001",
      status: "DELIVERED",
      channel: "POS",
      subtotal: 249990,
      shipping: 0,
      total: 249990,
      paymentMethod: "CASH",
      customerId: customer3.id,
      cashierId: cashierUser.id,
      terminalId: terminal1.id,
      sessionId: closedSession.id,
      items: {
        create: [
          {
            name: "Botín Nike Mercurial Vapor 16 Elite - Talla 42",
            price: 249990,
            quantity: 1,
            total: 249990,
            productId: botin.id,
          },
        ],
      },
    },
  })

  await prisma.payment.create({
    data: {
      orderId: posOrder.id,
      sessionId: closedSession.id,
      method: "CASH",
      amount: 249990,
      receivedAmount: 300000,
      change: 50010,
    },
  })
  console.log("Created 3 orders and 1 payment")

  // ==================== HERO SLIDES ====================
  await prisma.heroSlide.createMany({
    data: [
      {
        badge: "Campeones del Mundo",
        title: "Camiseta Argentina",
        subtitle: "Edición 2024",
        description: "La camiseta de los bicampeones del mundo. Con las tres estrellas y el corazón de un pueblo.",
        image: "https://images.unsplash.com/photo-1551958219-acbc141d4254?w=800",
        gradient: "from-sky-900 via-blue-900 to-slate-900",
        ctaText: "Comprar Ahora",
        ctaHref: "/products?brand=adidas",
        order: 0,
        isActive: true,
      },
      {
        badge: "Champions League",
        title: "Real Madrid",
        subtitle: "Temporada 24/25",
        description: "La camiseta del equipo más ganador de la Champions. Elegancia y victoria en cada partido.",
        image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800",
        gradient: "from-purple-900 via-indigo-900 to-slate-900",
        ctaText: "Ver Camiseta",
        ctaHref: "/products?brand=nike",
        order: 1,
        isActive: true,
      },
      {
        badge: "Hasta 20% OFF",
        title: "Equipos Argentinos",
        subtitle: "Boca & River",
        description: "Las camisetas de los dos clubes más grandes de Argentina. ¿De qué lado estás?",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
        gradient: "from-yellow-900 via-amber-900 to-slate-900",
        ctaText: "Ver Equipos",
        ctaHref: "/products?category=camisetas",
        order: 2,
        isActive: true,
      },
    ],
  })
  console.log("Created 3 hero slides")

  console.log(`
✅ Seed completado exitosamente!
-----------------------------------
📂 ${categoriesData.length} categorías (Camisetas, Shorts, Buzos, Calzado, Accesorios)
🏆 ${brandsData.length} equipos (Boca, River, Argentina, Real Madrid, Barcelona...)
🎨 4 atributos (Talla, Liga, Tipo, Talla Calzado)
👕 10 productos con variantes
🏭 3 proveedores
📋 2 órdenes de compra
🖥️  2 terminales (1 abierta, 1 cerrada)
💰 2 sesiones de caja
📦 3 órdenes (2 online, 1 POS)
🖼️  3 hero slides
-----------------------------------
👤 Admin:   admin@goalkit.com   / admin123
👤 Cajero:  cajero@goalkit.com  / admin123
👤 Cliente: juan@email.com      / admin123
👤 Cliente: sofia@email.com     / admin123
  `)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
