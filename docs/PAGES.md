# Listado de Paginas - BasicTechShop

> Rutas relativas a la app Next.js del workspace `apps/web` (`apps/web/src/app/...`). El repositorio es un monorepo con npm workspaces; por ahora `apps/web` es la unica app.

## Paginas Publicas (Shop)

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/` | Homepage - Hero, categorias, productos destacados | No |
| `/products` | Catalogo de productos con filtros | No |
| `/products/[id]` | Detalle de producto | No |
| `/cart` | Carrito de compras | No |
| `/login` | Inicio de sesion | Solo invitados |
| `/register` | Registro de usuario | Solo invitados |

### Paginas informativas / institucionales

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/about` | Sobre la tienda | No |
| `/contact` | Contacto | No |
| `/faq` | Preguntas frecuentes | No |
| `/help` | Ayuda | No |
| `/shipping` | Politica de envios | No |
| `/returns` | Politica de devoluciones | No |
| `/privacy` | Politica de privacidad | No |
| `/cookies` | Politica de cookies | No |
| `/terms` | Terminos y condiciones | No |

## Paginas de Checkout

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/checkout` | Proceso de checkout | Si |
| `/checkout/success` | Confirmacion de pago exitoso | Si |
| `/checkout/cancel` | Pago cancelado | Si |

## Paginas de Perfil de Usuario

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/profile` | Informacion del perfil y estadisticas | Si |
| `/profile/orders` | Historial de pedidos | Si |
| `/profile/addresses` | Lista de direcciones | Si |
| `/profile/addresses/new` | Agregar nueva direccion | Si |
| `/profile/addresses/[id]/edit` | Editar direccion | Si |
| `/profile/favorites` | Productos favoritos | Si |
| `/profile/settings` | Configuracion de cuenta | Si |

## Paginas de Administracion

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin` | Dashboard con estadisticas | Admin |
| `/admin/profile` | Perfil del usuario admin/staff | Admin |
| `/admin/settings` | Configuracion del sistema | Admin |

### Catalogo (productos, categorias, marcas, atributos)

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin/products` | Gestion de productos | Admin |
| `/admin/products/new` | Crear nuevo producto | Admin |
| `/admin/products/[id]` | Detalle de producto | Admin |
| `/admin/products/[id]/edit` | Editar producto | Admin |
| `/admin/products/import-export` | Importar/exportar productos (CSV/XLSX) | Admin |
| `/admin/categories` | Gestion de categorias | Admin |
| `/admin/categories/new` | Crear categoria | Admin |
| `/admin/categories/[id]/edit` | Editar categoria | Admin |
| `/admin/brands` | Gestion de marcas | Admin |
| `/admin/brands/new` | Crear marca | Admin |
| `/admin/brands/[id]/edit` | Editar marca | Admin |
| `/admin/attributes` | Gestion de atributos (y sus valores) | Admin |
| `/admin/attributes/new` | Crear atributo | Admin |
| `/admin/attributes/[id]` | Editar atributo / gestionar valores | Admin |

### Clientes y usuarios

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin/customers` | Gestion de clientes (POS + online) | Admin |
| `/admin/customers/new` | Crear cliente | Admin |
| `/admin/customers/[id]/edit` | Editar cliente | Admin |
| `/admin/users` | Gestion de usuarios internos | Admin |
| `/admin/users/new` | Crear usuario | Admin |
| `/admin/users/[id]/edit` | Editar usuario y su rol | Admin |
| `/admin/roles` | Gestion de roles y permisos | Admin |
| `/admin/roles/new` | Crear rol | Admin |
| `/admin/roles/[id]/edit` | Editar rol y sus permisos | Admin |

### Ordenes, pagos y contenido

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin/payments` | Historial de pagos/ordenes | Admin |
| `/admin/hero-slides` | Gestion de slides del hero de la homepage | Admin |
| `/admin/hero-slides/new` | Crear slide | Admin |
| `/admin/hero-slides/[id]/edit` | Editar slide | Admin |

### Compras y proveedores

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin/suppliers` | Gestion de proveedores | Admin |
| `/admin/suppliers/new` | Crear proveedor | Admin |
| `/admin/suppliers/[id]/edit` | Editar proveedor | Admin |
| `/admin/purchase-orders` | Ordenes de compra | Admin |
| `/admin/purchase-orders/new` | Crear orden de compra | Admin |
| `/admin/purchase-orders/[id]` | Detalle / recepcion de orden de compra | Admin |

### Punto de venta (POS) y caja

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin/pos` | Seleccion de terminal / inicio de sesion de caja | Admin |
| `/admin/pos/[terminalId]` | Interfaz de venta del punto de venta | Admin |
| `/admin/terminals` | Gestion de terminales POS | Admin |
| `/admin/terminals/new` | Crear terminal | Admin |
| `/admin/terminals/[id]/edit` | Editar terminal | Admin |
| `/admin/cash-sessions` | Historial de sesiones de caja | Admin |
| `/admin/cash-sessions/new` | Abrir sesion de caja | Admin |
| `/admin/cash-sessions/[id]` | Detalle / cierre de sesion de caja | Admin |
| `/admin/cash-movements` | Historial de movimientos de caja (ingresos/egresos) | Admin |
| `/admin/cash-movements/new` | Registrar movimiento de caja | Admin |

---

## API Routes

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js handlers |
| POST | `/api/auth/register` | Registro de usuario |

### Productos, categorias, marcas y atributos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/products` | Listar productos (con filtros) |
| POST | `/api/products` | Crear producto |
| GET | `/api/products/[id]` | Obtener producto |
| PUT | `/api/products/[id]` | Actualizar producto |
| DELETE | `/api/products/[id]` | Eliminar producto |
| GET/POST | `/api/products/[id]/variants` | Listar/crear variantes del producto |
| PUT/DELETE | `/api/products/[id]/variants/[variantId]` | Actualizar/eliminar variante |
| GET | `/api/products/export` | Exportar productos (CSV/XLSX) |
| POST | `/api/products/import` | Importar productos |
| POST | `/api/products/import/validate` | Validar archivo de importacion |
| GET | `/api/categories` | Listar categorias |
| POST | `/api/categories` | Crear categoria |
| GET/PUT/DELETE | `/api/categories/[id]` | Obtener/actualizar/eliminar categoria |
| GET | `/api/brands` | Listar marcas |
| POST | `/api/brands` | Crear marca |
| GET/PUT/DELETE | `/api/brands/[id]` | Obtener/actualizar/eliminar marca |
| GET/POST | `/api/attributes` | Listar/crear atributos |
| GET/PUT/DELETE | `/api/attributes/[id]` | Obtener/actualizar/eliminar atributo |
| GET/POST | `/api/attributes/[id]/values` | Listar/crear valores del atributo |
| PUT/DELETE | `/api/attributes/[id]/values/[valueId]` | Actualizar/eliminar valor del atributo |

### Ordenes y checkout

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/orders` | Listar ordenes del usuario |
| POST | `/api/orders` | Crear orden |
| GET | `/api/orders/[id]` | Obtener orden |
| POST | `/api/checkout` | Crear sesion de pago (Wompi) |
| POST | `/api/webhook/wompi` | Webhook de confirmacion de pago (Wompi) |
| POST | `/api/pos/checkout` | Checkout desde el punto de venta |

### Direcciones y usuarios

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/addresses` | Listar direcciones del usuario |
| POST | `/api/addresses` | Crear direccion |
| GET/PUT/DELETE | `/api/addresses/[id]` | Obtener/actualizar/eliminar direccion |
| GET | `/api/users` | Listar usuarios (admin) |
| POST | `/api/users` | Crear usuario (admin) |
| GET/PUT/DELETE | `/api/users/[id]` | Obtener/actualizar/eliminar usuario |
| GET/POST | `/api/customers` | Listar/crear clientes |
| GET/PUT/DELETE | `/api/customers/[id]` | Obtener/actualizar/eliminar cliente |

### Roles, permisos y administracion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Estadisticas del dashboard |
| GET | `/api/admin/orders` | Listar todas las ordenes |
| GET | `/api/admin/payments` | Listar pagos |
| GET | `/api/admin/cash-flow` | Reporte de flujo de caja |
| GET | `/api/admin/settings` | Configuracion del sistema (`StoreSettings`) |
| PUT | `/api/admin/settings` | Actualizar configuracion del sistema |
| GET | `/api/admin/permissions` | Listar permisos disponibles |
| GET/POST | `/api/admin/roles` | Listar/crear roles |
| GET/PUT/DELETE | `/api/admin/roles/[id]` | Obtener/actualizar/eliminar rol |
| GET/POST | `/api/admin/hero-slides` | Listar/crear slides del hero |
| PUT/DELETE | `/api/admin/hero-slides/[id]` | Actualizar/eliminar slide |
| POST | `/api/upload` | Subida de imagenes (Cloudinary) |

### Compras, proveedores, POS y caja

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET/POST | `/api/suppliers` | Listar/crear proveedores |
| GET/PUT/DELETE | `/api/suppliers/[id]` | Obtener/actualizar/eliminar proveedor |
| GET/POST | `/api/purchase-orders` | Listar/crear ordenes de compra |
| GET/PUT | `/api/purchase-orders/[id]` | Obtener/actualizar orden de compra (recepcion) |
| GET/POST | `/api/terminals` | Listar/crear terminales POS |
| GET/PUT/DELETE | `/api/terminals/[id]` | Obtener/actualizar/eliminar terminal |
| GET/POST | `/api/cash-sessions` | Listar/abrir sesiones de caja |
| GET/PUT | `/api/cash-sessions/[id]` | Obtener/cerrar sesion de caja |
| GET/POST | `/api/cash-movements` | Listar/crear movimientos de caja |
| GET/DELETE | `/api/cash-movements/[id]` | Obtener/eliminar movimiento de caja |

---

## Estructura de Layouts

```
apps/web/src/app/
├── layout.tsx                    # Root layout (ThemeProvider, SessionProvider)
├── (shop)/                       # Grupo de rutas publicas
│   ├── layout.tsx               # Layout con TopBar, Header, Footer
│   ├── page.tsx                 # Homepage
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── profile/
│   │   └── layout.tsx           # Layout con sidebar de perfil
│   └── about/, contact/, faq/, help/, shipping/, returns/, privacy/, cookies/, terms/
├── (auth)/                       # Grupo de rutas de autenticacion
│   ├── login/
│   └── register/
├── (admin-panel)/                # Grupo de rutas admin
│   └── admin/
│       ├── layout.tsx           # Layout con AdminSidebar
│       ├── page.tsx             # Dashboard
│       ├── products/, categories/, brands/, attributes/
│       ├── customers/, users/, roles/
│       ├── payments/, hero-slides/, settings/, profile/
│       ├── suppliers/, purchase-orders/
│       └── pos/, terminals/, cash-sessions/, cash-movements/
└── api/                           # API Routes (ver seccion anterior)
```

## Proteccion de Rutas (Middleware)

`apps/web/src/middleware.ts` protege las rutas segun `req.auth`:

- **Rutas protegidas** (`/profile/*`, `/checkout`): Requieren autenticacion.
- **Rutas admin** (`/admin/*`): Requieren que el usuario tenga un rol asignado (`req.auth.user.roleId`).
- **Rutas de invitados** (`/login`, `/register`): Solo accesibles sin autenticacion.

---

## Resumen

| Categoria | Cantidad aproximada |
|-----------|----------------------|
| Paginas Publicas + institucionales | 15 |
| Paginas Checkout | 3 |
| Paginas Perfil | 7 |
| Paginas Admin (catalogo, clientes/usuarios, ordenes, compras, POS/caja) | 45+ |
| **Total Paginas** | **~70** |
| API Routes | 50+ |

> Los conteos son aproximados; ante la duda, la fuente de verdad es `apps/web/src/app/**/page.tsx` y `apps/web/src/app/api/**/route.ts`.
