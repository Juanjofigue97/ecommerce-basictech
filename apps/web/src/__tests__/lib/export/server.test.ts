import { describe, it, expect } from "vitest"
import { csvResponse, excelResponse } from "@/lib/export/server"
import type { ExportConfig } from "@/lib/export/types"

const sampleData = [{ name: "Laptop", price: 1500000 }]
const columns: ExportConfig<typeof sampleData[number]>["columns"] = [
  { key: "name", label: "Nombre" },
  { key: "price", label: "Precio", format: (v) => Number(v) },
]

// ─── csvResponse ─────────────────────────────────────────────────────────────

describe("csvResponse", () => {
  it("retorna Content-Type text/csv con charset utf-8", () => {
    const res = csvResponse({ filename: "test", columns, data: sampleData })
    expect(res.headers.get("Content-Type")).toContain("text/csv")
    expect(res.headers.get("Content-Type")).toContain("utf-8")
  })

  it("retorna Content-Disposition como attachment", () => {
    const res = csvResponse({ filename: "test", columns, data: sampleData })
    const h = res.headers.get("Content-Disposition")
    expect(h).toContain("attachment")
  })

  it("incluye el nombre de archivo con extensión .csv", () => {
    const res = csvResponse({ filename: "reporte", columns, data: sampleData })
    expect(res.headers.get("Content-Disposition")).toContain("reporte.csv")
  })

  it("agrega .csv si el filename no tiene extensión", () => {
    const res = csvResponse({ filename: "sin-extension", columns, data: sampleData })
    expect(res.headers.get("Content-Disposition")).toContain("sin-extension.csv")
  })

  it("no duplica .csv si ya tiene la extensión", () => {
    const res = csvResponse({ filename: "archivo.csv", columns, data: sampleData })
    const h = res.headers.get("Content-Disposition")!
    expect(h).toContain("archivo.csv")
    expect(h).not.toContain("archivo.csv.csv")
  })

  it("el body comienza con BOM UTF-8 (bytes EF BB BF)", async () => {
    const res = csvResponse({ filename: "test", columns, data: sampleData })
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    // UTF-8 BOM = EF BB BF (TextDecoder.text() strips it, hay que verificar bytes crudos)
    expect(bytes[0]).toBe(0xef)
    expect(bytes[1]).toBe(0xbb)
    expect(bytes[2]).toBe(0xbf)
  })

  it("el body contiene la fila de headers", async () => {
    const res = csvResponse({ filename: "test", columns, data: sampleData })
    const text = await res.text()
    expect(text).toContain("Nombre")
    expect(text).toContain("Precio")
  })

  it("el body contiene los datos correctamente", async () => {
    const res = csvResponse({ filename: "test", columns, data: sampleData })
    const text = await res.text()
    expect(text).toContain("Laptop")
    expect(text).toContain("1500000")
  })

  it("el body tiene solo el header cuando data está vacío", async () => {
    const res = csvResponse({ filename: "test", columns, data: [] })
    const text = await res.text()
    const lines = text.replace(/^﻿/, "").split("\r\n").filter(Boolean)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain("Nombre")
  })
})

// ─── excelResponse ───────────────────────────────────────────────────────────

describe("excelResponse", () => {
  it("retorna Content-Type de XLSX correcto", () => {
    const res = excelResponse({ filename: "test", columns, data: sampleData })
    expect(res.headers.get("Content-Type")).toContain("spreadsheetml.sheet")
  })

  it("retorna Content-Disposition como attachment", () => {
    const res = excelResponse({ filename: "test", columns, data: sampleData })
    expect(res.headers.get("Content-Disposition")).toContain("attachment")
  })

  it("incluye el nombre de archivo con extensión .xlsx", () => {
    const res = excelResponse({ filename: "reporte", columns, data: sampleData })
    expect(res.headers.get("Content-Disposition")).toContain("reporte.xlsx")
  })

  it("agrega .xlsx si el filename no tiene extensión", () => {
    const res = excelResponse({ filename: "sin-extension", columns, data: sampleData })
    expect(res.headers.get("Content-Disposition")).toContain("sin-extension.xlsx")
  })

  it("no duplica .xlsx si ya tiene la extensión", () => {
    const res = excelResponse({ filename: "archivo.xlsx", columns, data: sampleData })
    const h = res.headers.get("Content-Disposition")!
    expect(h).toContain("archivo.xlsx")
    expect(h).not.toContain("archivo.xlsx.xlsx")
  })

  it("body no está vacío", async () => {
    const res = excelResponse({ filename: "test", columns, data: sampleData })
    const buf = await res.arrayBuffer()
    expect(buf.byteLength).toBeGreaterThan(0)
  })

  it("body tiene firma ZIP/XLSX válida (PK)", async () => {
    const res = excelResponse({ filename: "test", columns, data: sampleData })
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    expect(bytes[0]).toBe(0x50) // 'P'
    expect(bytes[1]).toBe(0x4b) // 'K'
  })

  it("Content-Length coincide con el tamaño real del buffer", async () => {
    const res = excelResponse({ filename: "test", columns, data: sampleData })
    const buf = await res.arrayBuffer()
    const declared = Number(res.headers.get("Content-Length"))
    expect(declared).toBe(buf.byteLength)
  })
})
