import { describe, it, expect } from "vitest"
import { parseCSV } from "@/lib/export/csv-parser"

describe("parseCSV", () => {
  it("parsea un CSV básico con headers y una fila", () => {
    const csv = "name,slug,price\nLaptop,laptop,1500000"
    const { headers, rows } = parseCSV(csv)
    expect(headers).toEqual(["name", "slug", "price"])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ name: "Laptop", slug: "laptop", price: "1500000" })
  })

  it("normaliza headers a lowercase", () => {
    const csv = "Name,Slug,CategorySlug\ntest,test-slug,electronics"
    const { headers, rows } = parseCSV(csv)
    expect(headers).toEqual(["name", "slug", "categoryslug"])
    expect(rows[0]["categoryslug"]).toBe("electronics")
  })

  it("maneja campos entre comillas que contienen comas", () => {
    const csv = 'name,description\nLaptop,"Rápido, confiable, portátil"'
    const { rows } = parseCSV(csv)
    expect(rows[0].description).toBe("Rápido, confiable, portátil")
  })

  it("maneja comillas dobles escapadas dentro de campos", () => {
    const csv = 'name,description\nLaptop,"El ""mejor"" producto"'
    const { rows } = parseCSV(csv)
    expect(rows[0].description).toBe('El "mejor" producto')
  })

  it("elimina el BOM (U+FEFF) al inicio del archivo", () => {
    const csv = "﻿name,slug\nLaptop,laptop"
    const { headers } = parseCSV(csv)
    expect(headers[0]).toBe("name")
    expect(headers[0].charCodeAt(0)).not.toBe(0xfeff)
  })

  it("maneja saltos de línea Windows (CRLF)", () => {
    const csv = "name,slug\r\nLaptop,laptop\r\nMouse,mouse"
    const { rows } = parseCSV(csv)
    expect(rows).toHaveLength(2)
    expect(rows[1].slug).toBe("mouse")
  })

  it("maneja saltos de línea Mac (CR)", () => {
    const csv = "name,slug\rLaptop,laptop"
    const { rows } = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe("Laptop")
  })

  it("ignora líneas vacías", () => {
    const csv = "name,slug\nLaptop,laptop\n\nMouse,mouse\n"
    const { rows } = parseCSV(csv)
    expect(rows).toHaveLength(2)
  })

  it("retorna resultado vacío para string vacío", () => {
    const { headers, rows } = parseCSV("")
    expect(headers).toEqual([])
    expect(rows).toEqual([])
  })

  it("retorna rows vacío si solo hay header", () => {
    const { headers, rows } = parseCSV("name,slug,price")
    expect(headers).toEqual(["name", "slug", "price"])
    expect(rows).toEqual([])
  })

  it("maneja valores vacíos entre comas", () => {
    const csv = "name,description,price\nLaptop,,1500000"
    const { rows } = parseCSV(csv)
    expect(rows[0].description).toBe("")
  })

  it("recorta espacios alrededor de los valores", () => {
    const csv = "name,slug\n  Laptop  ,  laptop  "
    const { rows } = parseCSV(csv)
    expect(rows[0].name).toBe("Laptop")
    expect(rows[0].slug).toBe("laptop")
  })

  it("parsea múltiples filas correctamente", () => {
    const csv = "name,price\nLaptop,1500000\nMouse,25000\nTeclado,80000"
    const { rows } = parseCSV(csv)
    expect(rows).toHaveLength(3)
    expect(rows[2].name).toBe("Teclado")
  })

  it("asigna string vacío para columnas faltantes en una fila corta", () => {
    const csv = "name,slug,price\nLaptop,laptop"
    const { rows } = parseCSV(csv)
    expect(rows[0].price).toBe("")
  })
})
