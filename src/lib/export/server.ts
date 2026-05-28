import { buildExcelBuffer, buildCSV } from "./builder"
import type { ExportConfig } from "./types"

/** Devuelve un Response con el archivo .xlsx — usar desde Route Handlers */
export function excelResponse<T>(config: ExportConfig<T>): Response {
  const buffer = buildExcelBuffer(config)
  const filename = config.filename.endsWith(".xlsx")
    ? config.filename
    : `${config.filename}.xlsx`

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  })
}

/** Devuelve un Response con el archivo .csv — usar desde Route Handlers */
export function csvResponse<T>(config: ExportConfig<T>, separator = ","): Response {
  const csv = buildCSV(config, separator)
  const bom = "﻿"
  const body = bom + csv
  const filename = config.filename.endsWith(".csv")
    ? config.filename
    : `${config.filename}.csv`

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
