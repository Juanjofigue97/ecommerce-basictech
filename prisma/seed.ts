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
      name: "BasicWear",
      email: "info@basicwear.com",
      phone: "+57 300 123 4567",
      address: "Calle 72 #10-34, Bogotá",
      description: "Tu tienda de ropa y accesorios de confianza",
      timezone: "america-bogota",
      currency: "cop",
      shippingCost: 12000,
      freeShippingFrom: 150000,
    },
  })
  console.log("Created store settings")

  // ==================== CATEGORIES ====================
  const categoriesData = [
    { name: "Remeras", slug: "remeras", icon: "Shirt" },
    { name: "Pantalones", slug: "pantalones", icon: "ShoppingBag" },
    { name: "Vestidos", slug: "vestidos", icon: "Sparkles" },
    { name: "Camperas", slug: "camperas", icon: "Wind" },
    { name: "Zapatillas", slug: "zapatillas", icon: "Footprints" },
    { name: "Accesorios", slug: "accesorios", icon: "Watch" },
    { name: "Deportivo", slug: "deportivo", icon: "Dumbbell" },
    { name: "Ropa Interior", slug: "ropa-interior", icon: "Package" },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat })
    categories[cat.slug] = created.id
  }
  console.log(`Created ${categoriesData.length} categories`)

  // ==================== BRANDS ====================
  const brandsData = [
    { name: "Nike", slug: "nike" },
    { name: "Adidas", slug: "adidas" },
    { name: "Zara", slug: "zara" },
    { name: "H&M", slug: "hm" },
    { name: "Lacoste", slug: "lacoste" },
    { name: "Levi's", slug: "levis" },
    { name: "Tommy Hilfiger", slug: "tommy-hilfiger" },
    { name: "Puma", slug: "puma" },
    { name: "Polo Ralph Lauren", slug: "polo-ralph-lauren" },
    { name: "Calvin Klein", slug: "calvin-klein" },
  ]

  const brands: Record<string, string> = {}
  for (const brand of brandsData) {
    const created = await prisma.brand.create({ data: brand })
    brands[brand.slug] = created.id
  }
  console.log(`Created ${brandsData.length} brands`)

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
          { value: "Negro", slug: "negro" },
          { value: "Blanco", slug: "blanco" },
          { value: "Azul", slug: "azul" },
          { value: "Rojo", slug: "rojo" },
          { value: "Gris", slug: "gris" },
          { value: "Verde", slug: "verde" },
          { value: "Beige", slug: "beige" },
          { value: "Rosa", slug: "rosa" },
        ],
      },
    },
    include: { values: true },
  })

  const tallaCalzadoAttr = await prisma.attribute.create({
    data: {
      name: "Talla Calzado",
      slug: "talla-calzado",
      values: {
        create: [
          { value: "36", slug: "36" },
          { value: "37", slug: "37" },
          { value: "38", slug: "38" },
          { value: "39", slug: "39" },
          { value: "40", slug: "40" },
          { value: "41", slug: "41" },
          { value: "42", slug: "42" },
          { value: "43", slug: "43" },
        ],
      },
    },
    include: { values: true },
  })

  const generoAttr = await prisma.attribute.create({
    data: {
      name: "Género",
      slug: "genero",
      values: {
        create: [
          { value: "Hombre", slug: "hombre" },
          { value: "Mujer", slug: "mujer" },
          { value: "Unisex", slug: "unisex" },
          { value: "Niños", slug: "ninos" },
        ],
      },
    },
    include: { values: true },
  })

  const tallaById: Record<string, string> = {}
  for (const v of tallaAttr.values) tallaById[v.slug] = v.id

  const colorById: Record<string, string> = {}
  for (const v of colorAttr.values) colorById[v.slug] = v.id

  const calzadoById: Record<string, string> = {}
  for (const v of tallaCalzadoAttr.values) calzadoById[v.slug] = v.id

  console.log("Created attributes")

  // ==================== CATEGORY ATTRIBUTES ====================
  const clothingCategories = ["remeras", "pantalones", "vestidos", "camperas", "deportivo", "ropa-interior"]
  for (const slug of clothingCategories) {
    await prisma.categoryAttribute.createMany({
      data: [
        { categoryId: categories[slug], attributeId: tallaAttr.id },
        { categoryId: categories[slug], attributeId: colorAttr.id },
        { categoryId: categories[slug], attributeId: generoAttr.id },
      ],
    })
  }
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["zapatillas"], attributeId: tallaCalzadoAttr.id },
      { categoryId: categories["zapatillas"], attributeId: colorAttr.id },
      { categoryId: categories["zapatillas"], attributeId: generoAttr.id },
    ],
  })
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: categories["accesorios"], attributeId: colorAttr.id },
      { categoryId: categories["accesorios"], attributeId: generoAttr.id },
    ],
  })
  console.log("Created category attributes")

  // ==================== PRODUCTS + VARIANTS ====================

  async function createVariants(
    productId: string,
    combinations: { talla: string; color: string; tallaAttrId: string; stock: number; price: number; skuPrefix: string }[]
  ) {
    for (const combo of combinations) {
      const label = `${combo.talla.toUpperCase()} / ${combo.color.charAt(0).toUpperCase() + combo.color.slice(1)}`
      const sku = `${combo.skuPrefix}-${combo.talla.toUpperCase()}-${combo.color.toUpperCase()}`
      const variant = await prisma.productVariant.create({
        data: { label, sku, stock: combo.stock, price: combo.price, productId },
      })
      await prisma.productVariantValue.createMany({
        data: [
          { variantId: variant.id, attributeValueId: combo.tallaAttrId },
          { variantId: variant.id, attributeValueId: colorById[combo.color] },
        ],
      })
    }
  }

  // Remera Básica Nike
  const remera = await prisma.product.create({
    data: {
      name: "Remera Básica Nike Dri-FIT",
      slug: "remera-basica-nike-dri-fit",
      description: "Remera de algodón premium con tecnología Dri-FIT para máxima comodidad y rendimiento",
      price: 29990,
      comparePrice: 39990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500",
      ],
      specs: { Material: "100% Algodón", Tecnología: "Dri-FIT", Cuidado: "Lavar a máquina 30°" },
      isNew: true,
      isFeatured: true,
      categoryId: categories["remeras"],
      brandId: brands["nike"],
    },
  })
  for (const talla of ["s", "m", "l", "xl"] as const) {
    for (const color of ["negro", "blanco", "azul"] as const) {
      await createVariants(remera.id, [{
        talla, color, tallaAttrId: tallaById[talla],
        stock: talla === "m" ? 15 : talla === "l" ? 12 : 8,
        price: 29990, skuPrefix: "NIKE-REM",
      }])
    }
  }

  // Jean Slim Levi's 511
  const jean = await prisma.product.create({
    data: {
      name: "Jean Slim Levi's 511",
      slug: "jean-slim-levis-511",
      description: "El clásico jean slim fit con denim de alta calidad y stretch para mayor comodidad",
      price: 89990,
      comparePrice: 109990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
        "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=500",
      ],
      specs: { Material: "98% Denim 2% Elastano", Corte: "Slim Fit", Cintura: "Media" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["pantalones"],
      brandId: brands["levis"],
    },
  })
  for (const talla of ["s", "m", "l", "xl"] as const) {
    for (const color of ["azul", "negro"] as const) {
      await createVariants(jean.id, [{
        talla, color, tallaAttrId: tallaById[talla],
        stock: 6, price: 89990, skuPrefix: "LEVIS-511",
      }])
    }
  }

  // Vestido Floral Zara
  const vestido = await prisma.product.create({
    data: {
      name: "Vestido Midi Floral Zara",
      slug: "vestido-midi-floral-zara",
      description: "Vestido midi con estampado floral, escote en V y manga larga. Perfecto para cualquier ocasión",
      price: 49990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500",
      ],
      specs: { Material: "100% Viscosa", Largo: "Midi", Cierre: "Invisible lateral" },
      isNew: true,
      isFeatured: true,
      categoryId: categories["vestidos"],
      brandId: brands["zara"],
    },
  })
  for (const talla of ["xs", "s", "m", "l"] as const) {
    for (const color of ["rosa", "verde"] as const) {
      await createVariants(vestido.id, [{
        talla, color, tallaAttrId: tallaById[talla],
        stock: 5, price: 49990, skuPrefix: "ZARA-VES",
      }])
    }
  }

  // Campera Bomber Adidas Originals
  const campera = await prisma.product.create({
    data: {
      name: "Campera Bomber Adidas Originals",
      slug: "campera-bomber-adidas-originals",
      description: "Campera bomber estilo retro con el icónico logo de Adidas Originals e interior de felpa suave",
      price: 119990,
      comparePrice: 149990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500",
        "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=500",
      ],
      specs: { Material: "100% Poliéster", Interior: "Felpa", Cierre: "Cremallera central" },
      isNew: false,
      isFeatured: true,
      categoryId: categories["camperas"],
      brandId: brands["adidas"],
    },
  })
  for (const talla of ["s", "m", "l", "xl"] as const) {
    for (const color of ["negro", "gris"] as const) {
      await createVariants(campera.id, [{
        talla, color, tallaAttrId: tallaById[talla],
        stock: 4, price: 119990, skuPrefix: "ADI-BOMB",
      }])
    }
  }

  // Nike Air Max 90
  const zapatillas = await prisma.product.create({
    data: {
      name: "Nike Air Max 90",
      slug: "nike-air-max-90",
      description: "Zapatillas icónicas con amortiguación Air-Sole visible. Estilo clásico y comodidad sin igual",
      price: 159990,
      comparePrice: 189990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500",
      ],
      specs: { Upper: "Cuero y malla", Suela: "Goma con Air Max", Cierre: "Cordones" },
      isNew: true,
      isFeatured: true,
      categoryId: categories["zapatillas"],
      brandId: brands["nike"],
    },
  })
  for (const talla of ["38", "39", "40", "41", "42", "43"] as const) {
    for (const color of ["blanco", "negro"] as const) {
      const label = `${talla} / ${color.charAt(0).toUpperCase() + color.slice(1)}`
      const sku = `NIKE-AM90-${talla}-${color.toUpperCase()}`
      const variant = await prisma.productVariant.create({
        data: { label, sku, stock: 3, price: 159990, productId: zapatillas.id },
      })
      await prisma.productVariantValue.createMany({
        data: [
          { variantId: variant.id, attributeValueId: calzadoById[talla] },
          { variantId: variant.id, attributeValueId: colorById[color] },
        ],
      })
    }
  }

  // Polo Classic Lacoste
  const polo = await prisma.product.create({
    data: {
      name: "Polo Classic Lacoste",
      slug: "polo-classic-lacoste",
      description: "El clásico polo de piqué con el famoso cocodrilo bordado. Elegancia casual sin esfuerzo",
      price: 79990,
      comparePrice: 99990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500",
        "https://images.unsplash.com/photo-1625910513880-b84f9c5e5a2d?w=500",
      ],
      specs: { Material: "100% Piqué de algodón", Cuello: "Polo con botones", Manga: "Corta" },
      isNew: false,
      isFeatured: false,
      categoryId: categories["remeras"],
      brandId: brands["lacoste"],
    },
  })
  for (const talla of ["s", "m", "l", "xl", "xxl"] as const) {
    for (const color of ["blanco", "azul", "rojo", "verde"] as const) {
      await createVariants(polo.id, [{
        talla, color, tallaAttrId: tallaById[talla],
        stock: 6, price: talla === "xxl" ? 84990 : 79990, skuPrefix: "LAC-POLO",
      }])
    }
  }

  // Jogging Puma Essentials
  const jogging = await prisma.product.create({
    data: {
      name: "Jogging Puma Essentials",
      slug: "jogging-puma-essentials",
      description: "Pantalón de jogging con tecnología DryCell para mantener la comodidad durante el entrenamiento",
      price: 54990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4b4e1a?w=500",
        "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500",
      ],
      specs: { Material: "80% Algodón 20% Poliéster", Tecnología: "DryCell", Bolsillos: "2 laterales + 1 posterior" },
      isNew: true,
      isFeatured: false,
      categoryId: categories["deportivo"],
      brandId: brands["puma"],
    },
  })
  for (const talla of ["s", "m", "l", "xl"] as const) {
    for (const color of ["negro", "gris"] as const) {
      await createVariants(jogging.id, [{
        talla, color, tallaAttrId: tallaById[talla],
        stock: 8, price: 54990, skuPrefix: "PUMA-JOG",
      }])
    }
  }

  // Campera de Cuero Tommy Hilfiger
  const cueroCampera = await prisma.product.create({
    data: {
      name: "Campera Cuero Tommy Hilfiger",
      slug: "campera-cuero-tommy-hilfiger",
      description: "Campera de cuero genuino con detalles de la marca. Un clásico atemporal para cualquier ocasión",
      price: 249990,
      comparePrice: 299990,
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
        "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=500",
      ],
      specs: { Material: "100% Cuero genuino", Interior: "Tela forrada", Cierre: "YKK" },
      isNew: false,
      isFeatured: false,
      categoryId: categories["camperas"],
      brandId: brands["tommy-hilfiger"],
    },
  })
  for (const talla of ["s", "m", "l", "xl"] as const) {
    await createVariants(cueroCampera.id, [{
      talla, color: "negro", tallaAttrId: tallaById[talla],
      stock: 2, price: 249990, skuPrefix: "TOM-CUER",
    }])
  }

  console.log("Created 8 products with variants")

  // ==================== SUPPLIERS ====================
  const supplier1 = await prisma.supplier.create({
    data: {
      nit: "900.123.456-7",
      name: "Textiles ABC S.A.S",
      phone: "+57 301 234 5678",
      address: "Zona Industrial Montevideo, Bogotá",
      type: "JURIDICA",
      status: "ACTIVE",
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      nit: "800.987.654-3",
      name: "Importadora Moda Colombia Ltda",
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
      email: "admin@basicwear.com",
      password: "$2b$10$qrNX1DkisQhnt1.Imhoz0u0JDglKCLV87X57rK9zPV0TFfjL7/mnC", // admin123
      name: "Admin Principal",
      phone: "+57 300 111 2222",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  })

  const cashierUser = await prisma.user.create({
    data: {
      email: "cajero@basicwear.com",
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

  // Cliente walk-in de POS (sin cuenta de usuario)
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
      total: 2500000,
      status: "RECEIVED",
      receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: "Pedido de reposición de stock temporada verano",
      items: {
        create: [
          { productId: remera.id, quantity: 50, quantityReceived: 50, unitCost: 15000, total: 750000 },
          { productId: polo.id, quantity: 30, quantityReceived: 30, unitCost: 40000, total: 1200000 },
          { productId: jogging.id, quantity: 20, quantityReceived: 20, unitCost: 27500, total: 550000 },
        ],
      },
    },
  })

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2024-002",
      supplierId: supplier2.id,
      createdById: adminUser.id,
      total: 5175000,
      status: "ORDERED",
      notes: "Importación colección otoño-invierno",
      items: {
        create: [
          { productId: campera.id, quantity: 25, quantityReceived: 0, unitCost: 60000, total: 1500000 },
          { productId: cueroCampera.id, quantity: 15, quantityReceived: 0, unitCost: 125000, total: 1875000 },
          { productId: jean.id, quantity: 40, quantityReceived: 0, unitCost: 45000, total: 1800000 },
        ],
      },
    },
  })
  console.log("Created 2 purchase orders")

  // ==================== ORDERS ====================

  // Orden online - Juan Pérez
  await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0001",
      status: "DELIVERED",
      channel: "ONLINE",
      subtotal: 114980,
      shipping: 12000,
      total: 126980,
      paymentMethod: "CARD",
      customerId: customer1.id,
      userId: customerUser1.id,
      addressId: address1.id,
      items: {
        create: [
          {
            name: "Remera Básica Nike Dri-FIT - M / Negro",
            price: 29990,
            quantity: 2,
            total: 59980,
            productId: remera.id,
          },
          {
            name: "Jogging Puma Essentials - L / Negro",
            price: 54990,
            quantity: 1,
            total: 54990,
            productId: jogging.id,
          },
        ],
      },
    },
  })

  // Orden online - Sofía Rodríguez
  await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0002",
      status: "SHIPPED",
      channel: "ONLINE",
      subtotal: 99980,
      shipping: 12000,
      total: 111980,
      paymentMethod: "TRANSFER",
      customerId: customer2.id,
      userId: customerUser2.id,
      items: {
        create: [
          {
            name: "Vestido Midi Floral Zara - S / Rosa",
            price: 49990,
            quantity: 2,
            total: 99980,
            productId: vestido.id,
          },
        ],
      },
    },
  })

  // Orden POS - Cliente walk-in
  const posOrder = await prisma.order.create({
    data: {
      orderNumber: "POS-2024-0001",
      status: "DELIVERED",
      channel: "POS",
      subtotal: 159990,
      shipping: 0,
      total: 159990,
      paymentMethod: "CASH",
      customerId: customer3.id,
      cashierId: cashierUser.id,
      terminalId: terminal1.id,
      sessionId: closedSession.id,
      items: {
        create: [
          {
            name: "Nike Air Max 90 - 42 / Blanco",
            price: 159990,
            quantity: 1,
            total: 159990,
            productId: zapatillas.id,
          },
        ],
      },
    },
  })

  // Payment para la orden POS
  await prisma.payment.create({
    data: {
      orderId: posOrder.id,
      sessionId: closedSession.id,
      method: "CASH",
      amount: 159990,
      receivedAmount: 200000,
      change: 40010,
    },
  })
  console.log("Created 3 orders and 1 payment")

  // ==================== HERO SLIDES ====================
  await prisma.heroSlide.createMany({
    data: [
      {
        badge: "Nueva Colección",
        title: "Moda Primavera",
        subtitle: "2025",
        description: "Descubre las últimas tendencias en ropa y accesorios para esta temporada",
        image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
        gradient: "from-rose-900 via-pink-900 to-slate-900",
        ctaText: "Ver Colección",
        ctaHref: "/products?category=vestidos",
        order: 0,
        isActive: true,
      },
      {
        badge: "Hasta 40% OFF",
        title: "Camperas y Abrigos",
        subtitle: "Otoño-Invierno",
        description: "Las mejores marcas con descuentos exclusivos para el frío que se viene",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        gradient: "from-blue-900 via-cyan-900 to-slate-900",
        ctaText: "Ver Ofertas",
        ctaHref: "/products?category=camperas",
        order: 1,
        isActive: true,
      },
      {
        badge: "Bestseller",
        title: "Zapatillas Nike",
        subtitle: "Air Max 90",
        description: "El clásico que nunca pasa de moda. Comodidad y estilo en cada paso",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
        gradient: "from-emerald-900 via-teal-900 to-slate-900",
        ctaText: "Comprar Ahora",
        ctaHref: "/products?category=zapatillas",
        order: 2,
        isActive: true,
      },
    ],
  })
  console.log("Created 3 hero slides")

  console.log(`
✅ Seed completado exitosamente!
-----------------------------------
📂 ${categoriesData.length} categorías
🏷️  ${brandsData.length} marcas
🎨 4 atributos (Talla, Color, Talla Calzado, Género)
👕 8 productos con variantes
🏭 3 proveedores
📋 2 órdenes de compra
🖥️  2 terminales (1 abierta, 1 cerrada)
💰 2 sesiones de caja
📦 3 órdenes (2 online, 1 POS)
🖼️  3 hero slides
-----------------------------------
👤 Admin:   admin@basicwear.com  / admin123
👤 Cajero:  cajero@basicwear.com / admin123
👤 Cliente: juan@email.com       / admin123
👤 Cliente: sofia@email.com      / admin123
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
