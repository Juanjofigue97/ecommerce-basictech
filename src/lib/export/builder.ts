import * as XLSX from "xlsx"
import type { ExportConfig } from "./types"

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc != null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function resolveCell<T>(
  row: T,
  col: ExportConfig<T>["columns"][number],
): string | number {
  const raw = getNestedValue(row as Record<string, unknown>, col.key)
  if (col.format) return col.format(raw, row)
  if (raw == null) return ""
  if (typeof raw === "number") return raw
  return String(raw)
}

/** Devuelve un Workbook de SheetJS listo para serializar */
export function buildWorkbook<T>(config: ExportConfig<T>): XLSX.WorkBook {
  const { columns, data, sheetName = "Datos" } = config

  const header = columns.map((c) => c.label)
  const rows = data.map((row) => columns.map((col) => resolveCell(row, col)))

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])

  // Auto-width: el máximo entre el label y el contenido de cada columna
  ws["!cols"] = columns.map((col, idx) => {
    if (col.width) return { wch: col.width }
    const maxLen = Math.max(
      col.label.length,
      ...data.map((row) => String(resolveCell(row, col)).length),
    )
    // cap at 60 chars
    return { wch: Math.min(maxLen + 2, 60) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  return wb
}

/** Devuelve el contenido Excel como Uint8Array */
export function buildExcelBuffer<T>(config: ExportConfig<T>): Uint8Array {
  const wb = buildWorkbook(config)
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array
}

/** Devuelve el contenido CSV como string */
export function buildCSV<T>(config: ExportConfig<T>, separator = ","): string {
  const { columns, data } = config

  function escape(value: string | number): string {
    const str = String(value)
    if (str.includes(separator) || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.map((c) => escape(c.label)).join(separator)
  const rows = data.map((row) =>
    columns.map((col) => escape(resolveCell(row, col))).join(separator),
  )

  return [header, ...rows].join("\r\n")
}
