# Modelo de Datos - BasicTechShop

> El schema de Prisma vive en `apps/web/prisma/schema.prisma` dentro del monorepo (workspace `apps/web`). Este documento refleja el schema real actual, que ha crecido bastante respecto al diseño inicial: ademas de la tienda online, cubre roles/permisos dinamicos, atributos y variantes de producto, un modulo de punto de venta (POS) con caja, y compras a proveedores.

## Resumen de Requisitos

- **Registro**: Auto-registro + Admin puede crear cuentas
- **Auth**: Email/Password (NextAuth.js)
- **Inventario**: Stock por producto, con variantes opcionales (talla/color/etc.) que tienen su propio stock
- **Pedidos**: Crear, historial, estados, y dos canales: `ONLINE` (tienda) y `POS` (punto de venta)
- **Cupones**: No
- **Resenas**: No
- **Wishlist**: No
- **Roles**: Dinamicos, modelados con tablas `Role`/`Permission` (no un enum fijo). Los roles tipicos son Admin, Moderador/Vendedor, Cliente
- **Punto de venta (POS)**: Terminales, sesiones de caja, pagos y movimientos de caja
- **Compras**: Proveedores y ordenes de compra con recepcion de inventario

---

## Diagrama de Relaciones (nucleo tienda)

> Diagrama simplificado del flujo principal (usuario → producto → orden). El schema completo tiene ~25 modelos agrupados por dominio (ver secciones siguientes).

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Product   │       │  Category   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ email       │       │ name        │◄──────│ name        │
│ password    │       │ slug        │       │ slug        │
│ name        │       │ description │       │ icon        │
│ phone       │       │ price       │       │ createdAt   │
│ roleId      │       │ comparePrice│       └─────────────┘
│ status      │       │ stock       │
│ createdAt   │       │ images[]    │       ┌─────────────┐
└──────┬──────┘       │ specs       │       │   Brand     │
       │              │ isNew       │       ├─────────────┤
       │              │ isFeatured  │       │ id          │
       │              │ isActive    │◄──────│ name        │
       │              │ categoryId  │       │ slug        │
       │              │ brandId     │       │ logo        │
       │              │ createdAt   │       │ createdAt   │
       │              └─────────────┘       └─────────────┘
       │
       │
       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Address   │       │    Order    │       │ OrderItem   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ userId      │◄──────│ orderNumber │       │ orderId     │
│ label       │       │ customerId  │───────│ productId   │
│ name        │       │ userId      │       │ variantId   │
│ phone       │       │ addressId   │       │ name        │
│ address     │       │ channel     │       │ price       │
│ city        │       │ status      │       │ quantity    │
│ state       │       │ subtotal    │       │ total       │
│ zipCode     │       │ shipping/tip│       └─────────────┘
│ isDefault   │       │ total       │
│ createdAt   │       │ paymentMethod│
└─────────────┘       │ notes       │
                       │ createdAt   │
                       └─────────────┘
```

## Descripcion de Modelos

### Role (Roles) y Permission (Permisos)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre del rol (unico) |
| isSystem | Boolean | Rol protegido creado por el sistema (no editable/eliminable) |

`Permission` define claves de permiso (`key`, `name`) y se asocia a roles via la tabla pivote `RolePermission`. Reemplaza el enum fijo `role` que tenia `User` en el diseño original: ahora los roles y sus permisos son configurables desde `/admin/roles`.

### User (Usuarios)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| email | String | Email unico para login |
| password | String | Hash de contrasena (bcrypt) |
| name | String | Nombre completo |
| phone | String? | Telefono (opcional) |
| avatar | String? | URL de imagen de perfil |
| roleId | String? | FK a `Role` (reemplaza el enum `role`) |
| status | Enum | ACTIVE, INACTIVE, SUSPENDED |

Un `User` puede tener ordenes como cliente (`orders`), como cajero de POS (`cashierOrders`), sesiones y movimientos de caja, ordenes de compra creadas, y opcionalmente estar vinculado a un `Customer`.

### Customer (Clientes)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre del cliente |
| phone | String? | Telefono |
| email | String? | Email unico (opcional) |
| document | String? | Documento de identidad |
| source | Enum | ONLINE, PHYSICAL, BOTH — canal de origen del cliente |
| status | Enum | ACTIVE, INACTIVE, BLOCKED |
| userId | String? | FK opcional a `User` (si el cliente tambien tiene cuenta) |

Separa el concepto de "cliente" (quien compra, incluye clientes de tienda fisica/POS sin cuenta) del de "usuario" (quien inicia sesion). Toda `Order` pertenece a un `Customer`.

### Category (Categorias)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre (ej: "Monitores") |
| slug | String | URL-friendly (ej: "monitores") |
| icon | String? | Nombre del icono lucide |

### Brand (Marcas)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre (ej: "ASUS") |
| slug | String | URL-friendly (ej: "asus") |
| logo | String? | URL del logo |

### Product (Productos)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre del producto |
| slug | String | URL-friendly unico |
| description | String? | Descripcion detallada |
| price | Decimal | Precio actual |
| comparePrice | Decimal? | Precio anterior (para mostrar descuento) |
| stock | Int | Cantidad en inventario |
| images | String[] | Array de URLs de imagenes |
| specs | Json? | Especificaciones tecnicas (key-value) |
| isNew | Boolean | Marcar como nuevo |
| isFeatured | Boolean | Producto destacado |
| isActive | Boolean | Visible en tienda |

Un `Product` pertenece a una `Category` y una `Brand`, y opcionalmente tiene atributos (`ProductAttribute`) y variantes (`ProductVariant`) — ver seccion "Atributos y Variantes".

### Address (Direcciones)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| label | String | Etiqueta (Casa, Oficina) |
| name | String | Nombre del destinatario |
| phone | String | Telefono de contacto |
| address | String | Direccion completa |
| city | String | Ciudad |
| state | String | Departamento/Estado |
| zipCode | String | Codigo postal |
| isDefault | Boolean | Direccion predeterminada |

### Order (Pedidos)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| orderNumber | String | Numero visible (ORD-2024-001) |
| status | Enum | Estado del pedido |
| channel | Enum | ONLINE o POS — canal por el que se genero la orden |
| subtotal | Decimal | Suma de items |
| shipping | Decimal | Costo de envio |
| tip | Decimal | Propina (usada en POS) |
| total | Decimal | Total final |
| paymentMethod | String | Metodo de pago usado |
| paymentSessionId | String? | ID de la sesion de pago del proveedor (Wompi) |
| notes | String? | Notas adicionales |
| customerId | String | FK a `Customer` (siempre requerido) |
| userId | String? | FK a `User` que realizo la compra online |
| cashierId | String? | FK a `User` que atendio la venta en POS |
| addressId | String? | FK a `Address` de envio (ordenes online) |
| terminalId | String? | FK a `Terminal` (ordenes POS) |
| sessionId | String? | FK a `CashSession` (ordenes POS) |

### OrderItem (Items del Pedido)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre del producto (snapshot) |
| price | Decimal | Precio al momento de compra |
| quantity | Int | Cantidad |
| total | Decimal | price x quantity |
| productId | String | FK a `Product` |
| variantId | String? | FK a `ProductVariant`, si el item corresponde a una variante especifica |

---

## Atributos y Variantes de Producto

Permiten modelar productos con opciones (ej: talla, color) sin duplicar el producto base.

### Attribute (Atributos) y AttributeValue (Valores)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name / slug | String | Nombre del atributo (ej: "Color") y su slug |
| `AttributeValue.value` / `slug` | String | Valor concreto del atributo (ej: "Rojo") |

`CategoryAttribute` asocia que atributos aplican a cada `Category`. `ProductAttribute` asocia un `Product` con los valores de atributo que lo caracterizan (ej: especificaciones fijas, no generan variantes por si solas).

### ProductVariant (Variantes)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| label | String? | Etiqueta legible (ej: "Rojo / M") |
| sku | String? | SKU unico de la variante |
| stock | Int | Stock propio de la variante |
| price | Decimal? | Precio propio (si difiere del producto base) |
| isActive | Boolean | Variante disponible |
| productId | String | FK a `Product` |

`ProductVariantValue` asocia cada variante con las combinaciones de `AttributeValue` que la definen (ej: Color=Rojo + Talla=M).

---

## Proveedores y Compras

### Supplier (Proveedores)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| nit | String | Identificacion tributaria (unica) |
| name | String | Nombre / razon social |
| phone / address | String? | Datos de contacto |
| type | Enum | NATURAL, JURIDICA |
| status | Enum | ACTIVE, INACTIVE, SUSPENDED |

### PurchaseOrder (Ordenes de Compra) y PurchaseOrderItem
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| orderNumber | String | Numero visible (unico) |
| total | Decimal | Total de la orden |
| status | Enum | DRAFT, ORDERED, PARTIAL, RECEIVED, CANCELLED |
| receivedAt | DateTime? | Fecha de recepcion |
| supplierId | String | FK a `Supplier` |
| createdById | String | FK al `User` que creo la orden |

Cada `PurchaseOrderItem` referencia un `Product` (y opcionalmente una `ProductVariant`), con `quantity`, `quantityReceived`, `unitCost` y `total` — permite recepciones parciales.

---

## Punto de Venta (POS) y Caja

### Terminal
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre de la terminal/caja fisica |
| isActive | Boolean | Terminal habilitada |

### CashSession (Sesiones de Caja)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| terminalId | String | FK a `Terminal` |
| userId | String | FK al `User` que abre la caja |
| openedAt / closedAt | DateTime | Apertura / cierre de sesion |
| openingBalance | Decimal | Saldo inicial declarado |
| closingBalance | Decimal? | Saldo final contado al cerrar |
| expectedBalance | Decimal? | Saldo esperado segun movimientos |
| status | Enum | OPEN, CLOSED |

### Payment (Pagos POS)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| orderId | String | FK a `Order` |
| sessionId | String? | FK a `CashSession` |
| method | Enum | CASH, CREDIT_CARD, DEBIT_CARD, TRANSFER |
| amount | Decimal | Monto pagado |
| tip | Decimal | Propina |
| receivedAmount / change | Decimal? | Efectivo recibido y cambio entregado |

### CashMovement (Movimientos de Caja)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| sessionId | String | FK a `CashSession` |
| userId | String | FK al `User` que registra el movimiento |
| type | Enum | INCOME, EXPENSE |
| amount | Decimal | Monto del movimiento |
| concept | String | Motivo del movimiento (ej: "Retiro de efectivo") |

---

## Contenido y Configuracion

### HeroSlide (Slides del Hero de la Homepage)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| badge / title / subtitle / description | String | Contenido del slide |
| image | String | URL de la imagen |
| gradient | String | Clases de gradiente de fondo |
| ctaText / ctaHref | String | Texto y destino del boton de accion |
| order | Int | Orden de aparicion |
| isActive | Boolean | Slide visible |

### StoreSettings (Configuracion de la Tienda)
Modelo singleton (`id: "singleton"`) con datos generales de la tienda (nombre, contacto, moneda, zona horaria), reglas de stock/envio (`showOutOfStock`, `shippingCost`, `freeShippingFrom`), notificaciones (`notifyNewOrders`, `notifyLowStock`, etc.) y metodos de pago habilitados (`enableCards`, `enableTransfer`, `enableWallets`, `enableCashOnDelivery`). Se administra desde `/admin/settings`.

---

## Roles y Permisos

Los roles ya no son un enum fijo: se administran dinamicamente desde `/admin/roles` (modelos `Role`/`Permission`). La siguiente tabla resume el modelo de permisos tipico de los tres roles de referencia (Cliente, Vendedor/Moderador, Admin):

| Accion | CUSTOMER | MODERATOR | ADMIN |
|--------|----------|-----------|-------|
| Ver productos | ✅ | ✅ | ✅ |
| Crear pedidos | ✅ | ✅ | ✅ |
| Ver sus pedidos | ✅ | ✅ | ✅ |
| Gestionar direcciones propias | ✅ | ✅ | ✅ |
| Ver todos los pedidos | ❌ | ✅ | ✅ |
| Crear/editar productos | ❌ | ✅ | ✅ |
| Crear/editar categorias | ❌ | ✅ | ✅ |
| Crear/editar marcas | ❌ | ✅ | ✅ |
| Cambiar estado de pedidos | ❌ | ✅ | ✅ |
| Operar punto de venta (POS) | ❌ | ✅ | ✅ |
| Gestionar compras/proveedores | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Gestionar roles y permisos | ❌ | ❌ | ✅ |
| Ver estadisticas | ❌ | ✅ | ✅ |
| Configuracion del sistema | ❌ | ❌ | ✅ |

---

## Estados de Pedido

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓            ↓           ↓
    └─────────┴────────────┴───────────┴──→ CANCELLED
```

| Estado | Descripcion |
|--------|-------------|
| PENDING | Pedido creado, esperando confirmacion de pago |
| CONFIRMED | Pago confirmado |
| PROCESSING | En preparacion |
| SHIPPED | Enviado (en camino) |
| DELIVERED | Entregado |
| CANCELLED | Cancelado |

---

## Estructura de API Routes

> Listado completo y actualizado de rutas en [docs/PAGES.md](./PAGES.md). Resumen del arbol base:

```
apps/web/src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts   # NextAuth.js handlers (login/sesion)
│   └── register/route.ts
├── users/, customers/, addresses/
│   └── route.ts, [id]/route.ts
├── categories/, brands/, attributes/
│   └── route.ts, [id]/route.ts
├── products/
│   ├── route.ts, [id]/route.ts
│   ├── [id]/variants/route.ts
│   ├── export/route.ts
│   └── import/route.ts, import/validate/route.ts
├── orders/, checkout/, webhook/wompi/
│   └── route.ts
├── suppliers/, purchase-orders/
│   └── route.ts, [id]/route.ts
├── terminals/, cash-sessions/, cash-movements/, pos/checkout/
│   └── route.ts, [id]/route.ts
├── upload/route.ts
└── admin/
    ├── dashboard/, orders/, payments/, cash-flow/, settings/, permissions/
    ├── roles/route.ts, [id]/route.ts
    └── hero-slides/route.ts, [id]/route.ts
```
