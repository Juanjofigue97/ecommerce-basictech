"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Upload, Download, FileDown, CheckCircle2,
  XCircle, AlertCircle, Loader2, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { downloadCSV } from "@/lib/export/client"
import { MAX_ROWS } from "@/lib/products/import-types"
import type { ValidationReport, ValidatedRow } from "@/lib/products/import-types"

// ─── tipos de entidades de referencia ───────────────────────────────────────

interface RefItem { id: string; name: string; slug: string }

// ─── estado de la página ────────────────────────────────────────────────────

type PageStatus = "idle" | "validating" | "reviewing" | "importing" | "done"
type FilterTab = "all" | "valid" | "invalid"

// ─── columnas del CSV ────────────────────────────────────────────────────────

const CSV_COLUMNS = [
  { key: "name", label: "name" },
  { key: "slug", label: "slug" },
  { key: "description", label: "description" },
  { key: "price", label: "price" },
  { key: "comparePrice", label: "comparePrice" },
  { key: "stock", label: "stock" },
  { key: "isNew", label: "isNew" },
  { key: "isFeatured", label: "isFeatured" },
  { key: "isActive", label: "isActive" },
  { key: "categorySlug", label: "categorySlug" },
  { key: "brandSlug", label: "brandSlug" },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCOP(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n
  if (isNaN(num)) return n
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(num)
}

// ─── componente ──────────────────────────────────────────────────────────────

export default function ProductImportExportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<PageStatus>("idle")
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [importError, setImportError] = useState("")
  const [createdCount, setCreatedCount] = useState(0)
  const [categories, setCategories] = useState<RefItem[]>([])
  const [brands, setBrands] = useState<RefItem[]>([])
  const [exportingAll, setExportingAll] = useState(false)

  // Cargar categorías y marcas para mostrar slugs disponibles
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/brands").then((r) => r.json()),
    ]).then(([cats, brs]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setBrands(Array.isArray(brs) ? brs : [])
    }).catch(() => {})
  }, [])

  // ── exportar todos los productos ──────────────────────────────────────────

  async function handleExportAll() {
    setExportingAll(true)
    try {
      const res = await fetch("/api/products/export")
      if (!res.ok) throw new Error("Error al exportar")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "productos.csv"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportingAll(false)
    }
  }

  // ── descargar plantilla ──────────────────────────────────────────────────

  function handleDownloadTemplate() {
    const exampleRows: {
      name: string
      slug: string
      description: string
      price: number
      comparePrice: number | string
      stock: number
      isNew: string
      isFeatured: string
      isActive: string
      categorySlug: string
      brandSlug: string
    }[] =
      categories.length > 0 && brands.length > 0
        ? categories.map((category, i) => {
            const brand = brands[i % brands.length]
            return {
              name: `Producto Ejemplo - ${category.name}`,
              slug: `producto-ejemplo-${category.slug}`,
              description: `Producto de ejemplo para la categoría ${category.name}`,
              price: 100000 * (i + 1),
              comparePrice: "",
              stock: 10,
              isNew: i % 2 === 0 ? "true" : "false",
              isFeatured: i % 2 === 0 ? "true" : "false",
              isActive: "true",
              categorySlug: category.slug,
              brandSlug: brand.slug,
            }
          })
        : [
            {
              name: "Laptop Gamer Pro",
              slug: "laptop-gamer-pro",
              description: "Laptop de alto rendimiento para gaming",
              price: 2500000,
              comparePrice: 2800000,
              stock: 5,
              isNew: "true",
              isFeatured: "true",
              isActive: "true",
              categorySlug: "slug-categoria",
              brandSlug: "slug-marca",
            },
          ]
    downloadCSV({ filename: "plantilla-productos", columns: CSV_COLUMNS, data: exampleRows })
  }

  // ── manejo de archivo ────────────────────────────────────────────────────

  async function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      alert("Solo se aceptan archivos .csv")
      return
    }
    setStatus("validating")
    setReport(null)
    setImportError("")
    setFilter("all")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/products/import/validate", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error ?? "Error al validar el archivo")
        setStatus("idle")
        return
      }

      setReport(data as ValidationReport)
      setStatus("reviewing")
    } catch {
      alert("Error de conexión al validar el archivo")
      setStatus("idle")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── importar ─────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!report) return
    const validRows = report.rows
      .filter((r): r is ValidatedRow & { resolved: NonNullable<ValidatedRow["resolved"]> } =>
        r.status === "valid" && r.resolved != null
      )
      .map((r) => r.resolved)

    if (validRows.length === 0) return

    setStatus("importing")
    setImportError("")

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json()

      if (!res.ok) {
        setImportError(data.error ?? "Error al importar")
        setStatus("reviewing")
        return
      }

      setCreatedCount(data.created)
      setStatus("done")
    } catch {
      setImportError("Error de conexión al importar")
      setStatus("reviewing")
    }
  }

  // ── filas filtradas ──────────────────────────────────────────────────────

  const filteredRows = report?.rows.filter((r) => {
    if (filter === "valid") return r.status === "valid"
    if (filter === "invalid") return r.status === "invalid"
    return true
  }) ?? []

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import / Export de Productos</h1>
          <p className="text-muted-foreground text-sm">
            Cargá o descargá el catálogo en CSV. Máximo {MAX_ROWS} productos por importación.
          </p>
        </div>
      </div>

      {/* ── EXPORT ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Exportar
          </CardTitle>
          <CardDescription>
            Descargá la plantilla para ver el formato esperado, o exportá todos los productos existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <FileText className="mr-2 h-4 w-4" />
              Descargar plantilla
            </Button>
            <Button variant="outline" onClick={handleExportAll} disabled={exportingAll}>
              {exportingAll
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando...</>
                : <><Download className="mr-2 h-4 w-4" />Exportar todos los productos</>
              }
            </Button>
          </div>

          {/* Slugs disponibles */}
          {(categories.length > 0 || brands.length > 0) && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Slugs disponibles para el archivo CSV
              </p>
              {categories.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5">Categorías (categorySlug)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <code key={c.id} className="rounded bg-background border px-2 py-0.5 text-xs font-mono">
                        {c.slug}
                      </code>
                    ))}
                  </div>
                </div>
              )}
              {brands.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5">Marcas (brandSlug)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brands.map((b) => (
                      <code key={b.id} className="rounded bg-background border px-2 py-0.5 text-xs font-mono">
                        {b.slug}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── IMPORT ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar
          </CardTitle>
          <CardDescription>
            Subí un archivo CSV con el formato de la plantilla. Las imágenes se agregan después desde el detalle de cada producto.
          </CardDescription>
        </CardHeader>
        <CardContent>

          {/* ── idle: zona de carga ── */}
          {status === "idle" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-14 cursor-pointer transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Arrastrá tu archivo CSV aquí</p>
                  <p className="text-sm text-muted-foreground">o hacé clic para seleccionarlo</p>
                </div>
                <p className="text-xs text-muted-foreground">Máximo {MAX_ROWS} filas · Solo .csv</p>
              </div>
            </>
          )}

          {/* ── validating ── */}
          {status === "validating" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Validando archivo...</p>
            </div>
          )}

          {/* ── importing ── */}
          {status === "importing" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Importando productos...</p>
            </div>
          )}

          {/* ── done ── */}
          {status === "done" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {createdCount} {createdCount === 1 ? "producto importado" : "productos importados"}
                </p>
                <p className="text-sm text-muted-foreground">Podés verlos en el catálogo de productos.</p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/admin/products">Ver productos</Link>
                </Button>
                <Button onClick={() => { setStatus("idle"); setReport(null) }}>
                  Nueva importación
                </Button>
              </div>
            </div>
          )}

          {/* ── reviewing ── */}
          {status === "reviewing" && report && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {report.validCount} válidos
                </div>
                {report.invalidCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    <XCircle className="h-4 w-4" />
                    {report.invalidCount} con errores
                  </div>
                )}
                <span className="text-sm text-muted-foreground ml-auto">
                  {report.totalRows} filas en total
                </span>
              </div>

              {/* Error de importación previo */}
              {importError && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {importError}
                </div>
              )}

              {/* Filtro */}
              <div className="flex gap-1.5">
                {(["all", "valid", "invalid"] as FilterTab[]).map((tab) => {
                  const labels = {
                    all: `Todos (${report.totalRows})`,
                    valid: `Válidos (${report.validCount})`,
                    invalid: `Con errores (${report.invalidCount})`,
                  }
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        filter === tab
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  )
                })}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Errores</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Sin filas que mostrar
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row) => (
                        <TableRow
                          key={row.rowIndex}
                          className={row.status === "invalid" ? "bg-destructive/5" : ""}
                        >
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {row.rowIndex}
                          </TableCell>
                          <TableCell className="max-w-35 truncate text-sm font-medium">
                            {row.raw.name || <span className="text-muted-foreground italic">—</span>}
                          </TableCell>
                          <TableCell className="max-w-30 truncate font-mono text-xs">
                            {row.raw.slug || <span className="text-muted-foreground italic">—</span>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.raw.categoryslug || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.raw.brandslug || "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {row.raw.price ? formatCOP(row.raw.price) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {row.raw.stock || "—"}
                          </TableCell>
                          <TableCell>
                            {row.status === "valid" ? (
                              <Badge className="bg-green-600 text-white">Válido</Badge>
                            ) : (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-70">
                            {row.errors.length > 0 && (
                              <ul className="space-y-0.5">
                                {row.errors.map((e, i) => (
                                  <li key={i} className="text-xs text-destructive">
                                    · {e}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Acciones */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setStatus("idle"); setReport(null); setImportError("") }}
                >
                  Cancelar
                </Button>
                <div className="flex items-center gap-3">
                  {report.invalidCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Solo se importarán las {report.validCount} filas válidas.
                    </p>
                  )}
                  <Button
                    disabled={report.validCount === 0}
                    onClick={handleImport}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {report.validCount} producto{report.validCount !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
