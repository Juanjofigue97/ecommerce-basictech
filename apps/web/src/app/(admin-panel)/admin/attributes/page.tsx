"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AttributeValue {
  id: string
  value: string
  slug: string
}

interface Attribute {
  id: string
  name: string
  slug: string
  values: AttributeValue[]
  _count: { values: number }
}

function AttributesSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Valores</TableHead>
          <TableHead>Vista previa</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-8" /></TableCell>
            <TableCell><div className="flex gap-1"><Skeleton className="h-6 w-10" /><Skeleton className="h-6 w-10" /><Skeleton className="h-6 w-10" /></div></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/attributes")
      .then((r) => r.json())
      .then(setAttributes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/attributes/${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error || "Error al eliminar")
        setDeleting(false)
        return
      }
      setAttributes((prev) => prev.filter((a) => a.id !== deleteId))
      setDeleteId(null)
    } catch {
      setDeleteError("Error al eliminar el atributo")
    } finally {
      setDeleting(false)
    }
  }

  const filtered = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalValues = attributes.reduce((sum, a) => sum + a._count.values, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atributos</h1>
          <p className="text-muted-foreground">
            Define los filtros y características de tus productos
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/attributes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Atributo
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Atributos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{attributes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalValues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sin valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">
              {attributes.filter((a) => a._count.values === 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar atributos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <AttributesSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Valores</TableHead>
                  <TableHead>Vista previa</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {searchQuery ? "No se encontraron atributos" : "No hay atributos aún. Crea el primero."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((attr) => (
                    <TableRow key={attr.id}>
                      <TableCell className="font-medium">{attr.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {attr.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{attr._count.values}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {attr.values.slice(0, 4).map((v) => (
                            <Badge key={v.id} variant="secondary" className="text-xs">
                              {v.value}
                            </Badge>
                          ))}
                          {attr._count.values > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{attr._count.values - 4}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/attributes/${attr.id}`}>
                                <ChevronRight className="mr-2 h-4 w-4" />
                                Gestionar valores
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/attributes/${attr.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setDeleteError(null); setDeleteId(attr.id) }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteError(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar atributo</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán el atributo y todos sus valores. Esta acción no se puede deshacer.
              {deleteError && (
                <span className="mt-2 block font-medium text-destructive">{deleteError}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
