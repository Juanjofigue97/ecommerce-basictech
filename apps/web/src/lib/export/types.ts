export interface ExportColumn<T = Record<string, unknown>> {
  /** Key del objeto o path dot-notation ("address.city") */
  key: string
  /** Encabezado visible en el archivo */
  label: string
  /** Ancho de columna en caracteres (Excel). Si se omite se calcula automático. */
  width?: number
  /** Formatea el valor antes de escribirlo. Devuelve string o number. */
  format?: (value: unknown, row: T) => string | number
}

export interface ExportConfig<T = Record<string, unknown>> {
  filename: string
  /** Nombre de la hoja (solo Excel). Default: "Datos" */
  sheetName?: string
  columns: ExportColumn<T>[]
  data: T[]
}
