/** Parsea una línea CSV respetando campos entre comillas */
function parseLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

export interface ParsedCSV {
  headers: string[]
  rows: Record<string, string>[]
}

/**
 * Parsea un string CSV.
 * - Primera fila = headers (normalizados a lowercase)
 * - Soporta campos entre comillas, comas dentro de campos y \r\n / \r / \n
 * - Strips BOM (U+FEFF) del inicio
 */
export function parseCSV(text: string): ParsedCSV {
  const clean = text.replace(/^﻿/, "")
  const lines = clean.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  const nonEmpty = lines.filter((l) => l.trim() !== "")

  if (nonEmpty.length === 0) return { headers: [], rows: [] }

  const headers = parseLine(nonEmpty[0]).map((h) => h.toLowerCase().trim())

  const rows = nonEmpty.slice(1).map((line) => {
    const values = parseLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? ""]))
  })

  return { headers, rows }
}
