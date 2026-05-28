# Testing — BasicTechShop

## Stack de testing

| Herramienta | Versión | Rol |
|---|---|---|
| `vitest` | 4.1.7 | Runner de tests |
| `vite-tsconfig-paths` | 6.1.1 | Resuelve alias `@/*` en los tests |

### Configuración

**`vitest.config.ts`** (raíz del proyecto):

```ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    reporters: ["verbose"],
  },
})
```

### Comandos

```bash
npm test          # corre todos los tests una vez
npm test -- --watch   # modo watch
npm test -- --run src/__tests__/lib/export/builder.test.ts  # un archivo
```

---

## Cobertura: qué se testea

### Resumen de resultados

```
Test Files  6 passed (6)
     Tests  90 passed (90)
```

---

## Archivos de test

### `src/__tests__/lib/export/csv-parser.test.ts` — 14 tests

**Módulo:** `src/lib/export/csv-parser.ts`  
**Función:** `parseCSV(text: string): ParsedCSV`

| Test | Qué verifica |
|---|---|
| parsea un CSV básico | headers + fila de datos correctamente |
| normaliza headers a minúsculas | `categorySlug` → `categoryslug` |
| parsea valores separados por comas | múltiples columnas en una fila |
| maneja campos con comas entre comillas | `"Laptop, Pro"` no se parte |
| maneja comillas dobles escapadas | `""` dentro de campo → `"` |
| elimina el BOM UTF-8 si está presente | primer byte `﻿` ignorado |
| normaliza CRLF | `\r\n` → separador de filas correcto |
| normaliza CR solo | `\r` antiguo Mac OS |
| ignora líneas vacías al final | sin fila extra en el resultado |
| retorna cero filas con archivo vacío | `{ headers: [], rows: [] }` |
| retorna cero filas con solo headers | sin datos → `rows: []` |
| maneja valores vacíos en columnas | campo vacío → string vacío |
| trimea espacios de headers y valores | ` name ` → `name` |
| parsea múltiples filas correctamente | orden preservado |

---

### `src/__tests__/lib/export/builder.test.ts` — 15 tests

**Módulo:** `src/lib/export/builder.ts`  
**Funciones:** `buildCSV()` y `buildExcelBuffer()`

#### `buildCSV` — 11 tests

| Test | Qué verifica |
|---|---|
| genera la fila de headers correctamente | labels de columnas en orden |
| mapea los valores de cada fila en orden | valores alineados con columnas |
| resuelve claves con dot-notation | `"category.slug"` → `obj.category.slug` |
| aplica la función `format` al valor | `format: (v) => \`COP ${v}\`` |
| escapa valores que contienen comas | `"Laptop, Pro"` → `"\"Laptop, Pro\""` |
| escapa valores que contienen comillas dobles | `El "Mejor"` → `"El ""Mejor"""` |
| escapa valores con saltos de línea | campo con `\n` queda entre comillas |
| retorna solo el header cuando data está vacío | sin filas de datos |
| retorna string vacío para clave anidada inexistente | path inexistente → `""` |
| usa CRLF como separador de líneas | `\r\n` entre filas |
| usa separador personalizado si se especifica | `buildCSV(config, ";")` |

#### `buildExcelBuffer` — 4 tests

| Test | Qué verifica |
|---|---|
| retorna una instancia de `Uint8Array` | tipo de retorno correcto |
| el buffer comienza con firma ZIP/XLSX (PK) | bytes `0x50, 0x4B` |
| produce un buffer no vacío incluso con data vacía | siempre hay estructura XLSX |
| produce un buffer de mayor tamaño con más filas | correlación tamaño/datos |

> **Nota técnica:** `XLSX.write(..., { type: "array" })` retorna un `number[]` (Array plano), no un `Uint8Array`. El builder wrappea el resultado con `new Uint8Array(...)` para garantizar el tipo correcto.

---

### `src/__tests__/lib/export/server.test.ts` — 16 tests

**Módulo:** `src/lib/export/server.ts`  
**Funciones:** `csvResponse()` y `excelResponse()`

#### `csvResponse` — 9 tests

| Test | Qué verifica |
|---|---|
| Content-Type es `text/csv` con `charset=utf-8` | header HTTP correcto |
| Content-Disposition es `attachment` | fuerza descarga en el browser |
| incluye el nombre de archivo con extensión `.csv` | `reporte.csv` en el header |
| agrega `.csv` si el filename no tiene extensión | `sin-extension` → `sin-extension.csv` |
| no duplica `.csv` si ya tiene la extensión | `archivo.csv.csv` nunca ocurre |
| el body comienza con BOM UTF-8 (bytes `EF BB BF`) | verifica bytes crudos vía `arrayBuffer()` |
| el body contiene la fila de headers | labels de columnas presentes |
| el body contiene los datos correctamente | valores del objeto en el CSV |
| el body tiene solo el header cuando data está vacío | una sola línea |

> **Nota técnica:** `Response.text()` usa `TextDecoder` que elimina el BOM por defecto (spec). Por eso el BOM se verifica con `arrayBuffer()` + `Uint8Array`, no con `text().charCodeAt(0)`.

#### `excelResponse` — 7 tests

| Test | Qué verifica |
|---|---|
| Content-Type de XLSX correcto | `spreadsheetml.sheet` |
| Content-Disposition es `attachment` | fuerza descarga |
| incluye el nombre de archivo con extensión `.xlsx` | `reporte.xlsx` |
| agrega `.xlsx` si el filename no tiene extensión | auto-extensión |
| no duplica `.xlsx` si ya tiene la extensión | idempotente |
| body no está vacío | buffer tiene bytes |
| body tiene firma ZIP/XLSX válida (PK) | `bytes[0] = 0x50, bytes[1] = 0x4B` |
| Content-Length coincide con el tamaño real | header y buffer en sync |

---

### `src/__tests__/api/products/export.test.ts` — 10 tests

**Route:** `GET /api/products/export`  
**Archivo:** `src/app/api/products/export/route.ts`  
**Mock:** `@/lib/prisma` — `prisma.product.findMany`

| Test | Qué verifica |
|---|---|
| retorna status 200 | respuesta exitosa |
| Content-Type es `text/csv` con charset `utf-8` | header correcto |
| Content-Disposition es attachment con `productos.csv` | nombre de archivo |
| body contiene todos los headers CSV esperados | `name, slug, price, stock, categorySlug, brandSlug, isNew, isFeatured, isActive` |
| no incluye imágenes en el CSV | columna `image` no aparece |
| exporta el `categorySlug` (no el nombre de categoría) | `laptops`, `accesorios` presentes |
| exporta el `brandSlug` (no el nombre de marca) | `lenovo`, `logitech` presentes |
| exporta `isNew` como `'true'`/`'false'` string | booleanos serializados |
| `comparePrice` null se exporta como string vacío | campo opcional manejado |
| retorna solo la fila de headers cuando no hay productos | lista vacía → 1 línea |
| llama a `prisma.product.findMany` con `include: { category, brand }` | relaciones cargadas |

---

### `src/__tests__/api/products/import-validate.test.ts` — 25 tests

**Route:** `POST /api/products/import/validate`  
**Archivo:** `src/app/api/products/import/validate/route.ts`  
**Mock:** `@/lib/prisma` — `category.findMany`, `brand.findMany`, `product.findMany`

#### Constante

| Test | Qué verifica |
|---|---|
| `MAX_ROWS` es 500 | límite importado desde `import-types.ts` |

#### Errores de estructura

| Test | Qué verifica |
|---|---|
| retorna 400 si no se envía ningún archivo | error `/requerido/i` |
| retorna 400 si el CSV no tiene las columnas obligatorias | error `/faltantes/i` |
| retorna 400 si el archivo no tiene filas de datos | error `/filas/i` |
| retorna 400 si supera `MAX_ROWS` filas | error `/máximo/i` |

#### Fila válida

| Test | Qué verifica |
|---|---|
| marca una fila correcta como válida | `status: "valid"`, `validCount: 1` |
| `resolved` tiene los datos correctamente parseados | price, stock, categoryId, brandId, booleanos |
| retorna el reporte con `totalRows`, `validCount`, `invalidCount` | conteos correctos |

#### Validaciones de slug

| Test | Qué verifica |
|---|---|
| detecta slug con mayúsculas | `Laptop-Test` → inválido, error `/slug/i` |
| detecta slug con espacios | `mi producto` → inválido |
| detecta slug duplicado dentro del mismo archivo | error `/duplicado/i` en segunda fila |
| detecta slug que ya existe en la base de datos | error `/ya existe/i` |

#### Validaciones de categoría y marca

| Test | Qué verifica |
|---|---|
| detecta `categorySlug` inexistente | error `/categor/i` |
| detecta `brandSlug` inexistente | error `/marca/i` |
| detecta `categorySlug` vacío | fila inválida |

#### Validaciones numéricas

| Test | Qué verifica |
|---|---|
| detecta precio no numérico | error `/precio/i` |
| detecta precio igual a cero | inválido (precio debe ser > 0) |
| detecta stock negativo | error `/stock/i` |
| acepta stock igual a cero | válido (sin stock es OK) |
| acepta `comparePrice` vacío (es opcional) | `resolved.comparePrice` es `undefined` |

#### Validaciones de booleanos

| Test | Qué verifica |
|---|---|
| detecta `isNew` con valor inválido (`"si"`) | error `/isNew/i` |
| acepta booleanos `"1"` y `"0"` | `1→true`, `0→false` |
| `rowIndex` empieza en 1 | el índice es 1-based (no 0) |

---

### `src/__tests__/api/products/import.test.ts` — 10 tests

**Route:** `POST /api/products/import`  
**Archivo:** `src/app/api/products/import/route.ts`  
**Mock:** `@/lib/prisma` — `prisma.product.createMany`

| Test | Qué verifica |
|---|---|
| retorna 400 si `rows` es un array vacío | error con mensaje |
| retorna 400 si `rows` es `null` | validación nula |
| retorna 400 si `rows` no viene en el body | campo ausente |
| crea productos y retorna `{ created: n }` | respuesta 200 con count |
| llama a `prisma.product.createMany` con los datos correctos | todos los campos mapeados |
| sets `images: []` y `specs: {}` para cada producto | defaults del schema |
| sets `description` a `null` si viene vacía | `""` → `null` en DB |
| sets `comparePrice` a `null` si es `undefined` en el row | campo opcional → `null` |
| retorna 500 cuando Prisma lanza una excepción | error controlado |
| retorna 400 si `rows` supera `MAX_ROWS` | límite 500 filas |

---

## Decisiones de diseño

### Por qué `environment: "node"` en vitest

Los route handlers de Next.js usan APIs de Node.js (`Request`, `Response` globales en Node 18+, `FormData`, `File`). El entorno `"node"` provee estas APIs sin necesidad de `jsdom`. Los tests de la UI correrían con `"jsdom"`, pero toda esta suite es de lógica de servidor/utilidades.

### Por qué los tipos compartidos están en `import-types.ts`

`ResolvedRow`, `ValidatedRow`, `ValidationReport` y `MAX_ROWS` se usan tanto en los route handlers (`validate/route.ts`, `import/route.ts`) como en el cliente (`import-export/page.tsx`). Si se importaran desde los route handlers, el bundler de Next.js arrastraría `@/lib/prisma` → `pg` → `dns` al bundle del browser, causando un error de build. El archivo neutral `src/lib/products/import-types.ts` tiene cero dependencias de servidor.

### Por qué el BOM se verifica con `arrayBuffer()` y no con `text()`

La especificación `TextDecoder` define que cuando `ignoreBOM: false` (el default), el BOM se elimina durante la decodificación. `Response.text()` usa `TextDecoder` internamente. Por lo tanto, `text().charCodeAt(0)` siempre devolverá el primer carácter útil del contenido, nunca el BOM. La verificación correcta es sobre los bytes crudos: `arrayBuffer()` → `Uint8Array` → `bytes[0] === 0xEF, bytes[1] === 0xBB, bytes[2] === 0xBF`.

### Por qué `XLSX.write` se wrappea con `new Uint8Array(...)`

`XLSX.write(wb, { type: "array" })` retorna un `number[]` (Array de enteros 0-255), no un `Uint8Array`. El cast `as Uint8Array` en TypeScript es solo estático y no convierte el valor en runtime. El constructor `new Uint8Array(numberArray)` realiza la conversión real, garantizando que el tipo de retorno de `buildExcelBuffer` sea correcto tanto en runtime como en los tests.

### Por qué se usa `vi.mock` antes de los imports (hoisting)

Vitest (como Jest) hace hoisting de las llamadas a `vi.mock(...)` al inicio del módulo antes de que se ejecuten los imports. Esto garantiza que cuando se importa el route handler, ya está usando el mock de Prisma en lugar del módulo real. Si el mock se pusiera después de los imports, el route ya habría capturado la referencia al Prisma real.

---

## Estructura de archivos

```
src/
└── __tests__/
    ├── lib/
    │   └── export/
    │       ├── csv-parser.test.ts   (14 tests)
    │       ├── builder.test.ts      (15 tests)
    │       └── server.test.ts       (16 tests)
    └── api/
        └── products/
            ├── export.test.ts           (10 tests)
            ├── import.test.ts           (10 tests)
            └── import-validate.test.ts  (25 tests)
```

**Total: 90 tests, 6 archivos, todos pasando.**
