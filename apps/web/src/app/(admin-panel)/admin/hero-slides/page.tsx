"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useHeroSlidesStore } from "@/stores/hero-slides-store"

export default function AdminHeroSlidesPage() {
  const { slides, loading, fetchSlides, deleteSlide, updateSlide } = useHeroSlidesStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => { fetchSlides() }, [fetchSlides])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError("")
    try {
      await deleteSlide(deleteId)
      setDeleteId(null)
    } catch (e) {
      setDeleteError((e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await updateSlide(id, { isActive: !current })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Slider Principal</h1>
          <p className="text-muted-foreground">Configura los slides del banner de inicio</p>
        </div>
        <Button asChild>
          <Link href="/admin/hero-slides/new">
            <Plus className="mr-2 h-4 w-4" />Nuevo Slide
          </Link>
        </Button>
      </div>

      {loading && slides.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : slides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No hay slides configurados todavía</p>
            <Button asChild>
              <Link href="/admin/hero-slides/new">
                <Plus className="mr-2 h-4 w-4" />Crear primer slide
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <Card key={slide.id} className={!slide.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab" />

                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
                    {slide.image && (
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover opacity-40"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{slide.title}</p>
                      {slide.badge && (
                        <Badge variant="secondary" className="text-xs">{slide.badge}</Badge>
                      )}
                      {!slide.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Oculto</Badge>
                      )}
                    </div>
                    {slide.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{slide.subtitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Orden: {slide.order} · CTA: <span className="font-mono">{slide.ctaHref}</span>
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/hero-slides/${slide.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(slide.id, slide.isActive)}>
                        {slide.isActive ? (
                          <><EyeOff className="mr-2 h-4 w-4" />Ocultar</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" />Mostrar</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => { setDeleteId(slide.id); setDeleteError("") }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) { setDeleteId(null); setDeleteError("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar slide?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive px-1">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
