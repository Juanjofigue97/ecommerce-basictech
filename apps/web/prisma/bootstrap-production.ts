/**
 * One-time production bootstrap: creates the "Administrador" role with every
 * permission, and a single admin user, so you can log into a freshly migrated,
 * otherwise-empty production database.
 *
 * Unlike prisma/seed.ts (dev-only demo data — deletes everything, inserts fake
 * customers/orders/suppliers), this script is purely additive: it never
 * deletes anything, and refuses to run if the role or the given email already
 * exist, so it's safe even if someone runs it twice by accident.
 *
 * Usage (from apps/web/, with DATABASE_URL pointing at the target database):
 *
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" \
 *     npx tsx prisma/bootstrap-production.ts
 *
 * ADMIN_NAME is optional (defaults to "Administrador").
 */
import "dotenv/config"
import bcrypt from "bcryptjs"
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
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME ?? "Administrador"

  if (!email || !password) {
    console.error("Seteá ADMIN_EMAIL y ADMIN_PASSWORD antes de correr este script.")
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD debe tener al menos 8 caracteres.")
    process.exit(1)
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    console.error(`Ya existe un usuario con el email ${email}. No se creó nada.`)
    process.exit(1)
  }

  let adminRole = await prisma.role.findUnique({ where: { name: "Administrador" } })
  if (adminRole) {
    console.log("El rol 'Administrador' ya existe, lo reutilizo.")
  } else {
    const permissionRecords = await Promise.all(
      PERMISSIONS.map((p) => prisma.permission.create({ data: p })),
    )
    adminRole = await prisma.role.create({
      data: {
        name: "Administrador",
        isSystem: true,
        permissions: {
          create: permissionRecords.map((p) => ({ permissionId: p.id })),
        },
      },
    })
    console.log("Creado rol 'Administrador' con todos los permisos.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  })

  console.log(`\nListo. Usuario admin creado: ${admin.email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
