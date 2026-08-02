import { describe, it, expect } from "vitest"
import { buildCSV, buildExcelBuffer } from "@/lib/export/builder"
import type { ExportConfig } from "@/lib/export/types"

const sampleData = [
  { name: "Laptop", price: 1500000, category: { slug: "laptops" } },
  { name: "Mouse", price: 25000, category: { slug: "accesorios" } },
]
type Row = typeof sampleData[number]

// ─── buildCSV ────────────────────────────────────────────────────────────────

describe("buildCSV", () => {
  it("genera la fila de headers correctamente", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [
        { key: "name", label: "Nombre" },
        { key: "price", label: "Precio" },
      ],
      data: sampleData,
    }
    const csv = buildCSV(config)
    expect(csv.split("\r\n")[0]).toBe("Nombre,Precio")
  })

  it("mapea los valores de cada fila en orden correcto", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }, { key: "price", label: "Precio" }],
      data: sampleData,
    }
    const lines = buildCSV(config).split("\r\n")
    expect(lines[1]).toBe("Laptop,1500000")
    expect(lines[2]).toBe("Mouse,25000")
  })

  it("resuelve claves con dot-notation", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "category.slug", label: "Categoría" }],
      data: sampleData,
    }
    const lines = buildCSV(config).split("\r\n")
    expect(lines[1]).toBe("laptops")
    expect(lines[2]).toBe("accesorios")
  })

  it("aplica la función format al valor", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [
        { key: "price", label: "Precio", format: (v) => `COP ${Number(v)}` },
      ],
      data: [sampleData[0]],
    }
    const lines = buildCSV(config).split("\r\n")
    expect(lines[1]).toBe("COP 1500000")
  })

  it("escapa valores que contienen comas", () => {
    const data = [{ name: "Laptop, Pro", price: 0, category: { slug: "" } }]
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data,
    }
    const lines = buildCSV(config).split("\r\n")
    expect(lines[1]).toBe('"Laptop, Pro"')
  })

  it("escapa valores que contienen comillas dobles", () => {
    const data = [{ name: 'El "Mejor" Laptop', price: 0, category: { slug: "" } }]
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data,
    }
    const lines = buildCSV(config).split("\r\n")
    expect(lines[1]).toBe('"El ""Mejor"" Laptop"')
  })

  it("escapa valores que contienen saltos de línea", () => {
    const data = [{ name: "Linea1\nLinea2", price: 0, category: { slug: "" } }]
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data,
    }
    const csv = buildCSV(config)
    expect(csv).toContain('"Linea1\nLinea2"')
  })

  it("retorna solo el header cuando data está vacío", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data: [],
    }
    expect(buildCSV(config)).toBe("Nombre")
  })

  it("retorna string vacío para clave anidada inexistente", () => {
    const data = [{ name: "Laptop" }] as Record<string, unknown>[]
    const config: ExportConfig<typeof data[number]> = {
      filename: "test",
      columns: [{ key: "missing.nested.key", label: "Col" }],
      data,
    }
    const lines = buildCSV(config).split("\r\n")
    expect(lines[1]).toBe("")
  })

  it("usa CRLF como separador de líneas", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data: sampleData,
    }
    const csv = buildCSV(config)
    expect(csv).toContain("\r\n")
  })

  it("usa separador personalizado si se especifica", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }, { key: "price", label: "Precio" }],
      data: [sampleData[0]],
    }
    const csv = buildCSV(config, ";")
    expect(csv.split("\r\n")[0]).toBe("Nombre;Precio")
    expect(csv.split("\r\n")[1]).toBe("Laptop;1500000")
  })
})

// ─── buildExcelBuffer ────────────────────────────────────────────────────────

describe("buildExcelBuffer", () => {
  it("retorna una instancia de Uint8Array", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      sheetName: "Datos",
      columns: [{ key: "name", label: "Nombre" }, { key: "price", label: "Precio" }],
      data: sampleData,
    }
    expect(buildExcelBuffer(config)).toBeInstanceOf(Uint8Array)
  })

  it("el buffer comienza con la firma ZIP/XLSX (bytes PK: 0x50, 0x4B)", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data: sampleData,
    }
    const buf = buildExcelBuffer(config)
    expect(buf[0]).toBe(0x50) // 'P'
    expect(buf[1]).toBe(0x4b) // 'K'
  })

  it("produce un buffer no vacío incluso con data vacía", () => {
    const config: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data: [],
    }
    expect(buildExcelBuffer(config).length).toBeGreaterThan(0)
  })

  it("produce un buffer de mayor tamaño con más filas", () => {
    const small: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data: [sampleData[0]],
    }
    const large: ExportConfig<Row> = {
      filename: "test",
      columns: [{ key: "name", label: "Nombre" }],
      data: Array(50).fill(sampleData[0]),
    }
    expect(buildExcelBuffer(large).length).toBeGreaterThan(buildExcelBuffer(small).length)
  })
})
