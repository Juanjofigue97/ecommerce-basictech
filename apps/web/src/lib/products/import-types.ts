export const MAX_ROWS = 500

export interface ResolvedRow {
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  stock: number
  isNew: boolean
  isFeatured: boolean
  isActive: boolean
  categoryId: string
  brandId: string
}

export interface ValidatedRow {
  rowIndex: number
  raw: Record<string, string>
  status: "valid" | "invalid"
  errors: string[]
  resolved?: ResolvedRow
}

export interface ValidationReport {
  totalRows: number
  validCount: number
  invalidCount: number
  rows: ValidatedRow[]
}
