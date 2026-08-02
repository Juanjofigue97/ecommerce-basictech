# BasicTechShop

E-commerce de productos de computación construido con Next.js 16, TypeScript y Tailwind CSS.

## Descripción

BasicTechShop es una tienda online especializada en hardware, periféricos y componentes de computación. El repositorio es un **monorepo con npm workspaces**: la app web vive en `apps/web/`. Incluye:

- **Tienda pública**: Catálogo con filtros, carrito y checkout
- **Panel de usuario**: Perfil, historial de pedidos y direcciones
- **Panel de administración**: Gestión de productos, usuarios y pedidos

## Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| Next.js 16 | Framework (App Router) |
| TypeScript | Lenguaje |
| Tailwind CSS v4 | Estilos |
| shadcn/ui | Componentes UI |
| Prisma | ORM |
| PostgreSQL | Base de datos |
| Zustand | Estado global |
| NextAuth.js | Autenticación |

## Requisitos

- Node.js 18+
- PostgreSQL (para backend)
- Docker (opcional)

## Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd ecommerce-basictech

# Instalar dependencias (workspaces: instala todo el monorepo, incluyendo apps/web)
npm install

# Configurar variables de entorno de la app web (crear/editar apps/web/.env)
# Ver apps/web/.env con las credenciales requeridas (DATABASE_URL, NEXTAUTH_SECRET, etc.)

# Iniciar base de datos con Docker (opcional)
docker-compose up -d

# Ejecutar migraciones (el schema de Prisma vive en apps/web/prisma)
npx prisma migrate dev --schema=apps/web/prisma/schema.prisma

# Sembrar datos iniciales
npm run db:seed
```

## Desarrollo

```bash
# Servidor de desarrollo (corre "next dev" dentro de apps/web)
npm run dev

# Abrir http://localhost:3000
```

## Scripts Disponibles

Los scripts se ejecutan desde la raíz del monorepo y delegan al workspace `apps/web` (`-w apps/web`).

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (`apps/web`) |
| `npm run build` | Genera build de producción (`apps/web`) |
| `npm run start` | Inicia servidor de producción (`apps/web`) |
| `npm run lint` | Ejecuta ESLint (`apps/web`) |
| `npm run db:seed` | Siembra datos iniciales vía Prisma (`apps/web/prisma/seed.ts`) |
| `npm test` | Ejecuta la suite de tests con Vitest (`apps/web`) |
| `npm run test:watch` | Tests en modo watch (`apps/web`) |

## Estructura del Proyecto

```
apps/
└── web/                     # Aplicación Next.js (único workspace por ahora)
    ├── prisma/               # Schema, migraciones y seed
    └── src/
        ├── app/
        │   ├── (shop)/          # Rutas públicas (tienda)
        │   ├── (admin-panel)/   # Panel de administración
        │   ├── (auth)/          # Login y registro
        │   └── api/             # API Routes
        ├── components/
        │   ├── ui/              # shadcn/ui
        │   ├── layout/          # Header, Footer, Nav
        │   ├── products/        # Componentes de productos
        │   ├── cart/            # Carrito
        │   └── admin/           # Panel admin
        ├── data/                # Datos mock
        ├── lib/                 # Utilidades
        ├── stores/              # Zustand stores
        ├── types/                # Tipos TypeScript
        └── __tests__/            # Tests (Vitest)
```

> El `package.json` raíz define `"workspaces": ["apps/*", "packages/*"]`. Actualmente `apps/web` es el único paquete; `packages/` está reservado para código compartido futuro (p.ej. una app mobile).

## Documentación

- [PRD](./docs/PRD.md) - Documento de requisitos del producto
- [Plan](./docs/PLAN.md) - Plan de implementación
- [Modelo de datos](./docs/DATA-MODEL.md) - Schema de base de datos
- [Páginas](./docs/PAGES.md) - Listado de rutas y endpoints

## Licencia

MIT
