"use client"

import { buildExcelBuffer, buildCSV } from "./builder"
import type { ExportConfig } from "./types"

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Descarga un archivo .xlsx directamente desde el browser */
export function downloadExcel<T>(config: ExportConfig<T>) {
  const buffer = buildExcelBuffer(config)
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const filename = config.filename.endsWith(".xlsx")
    ? config.filename
    : `${config.filename}.xlsx`
  triggerDownload(blob, filename)
}

/** Descarga un archivo .csv directamente desde el browser */
export function downloadCSV<T>(config: ExportConfig<T>, separator = ",") {
  const csv = buildCSV(config, separator)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const filename = config.filename.endsWith(".csv")
    ? config.filename
    : `${config.filename}.csv`
  triggerDownload(blob, filename)
}
