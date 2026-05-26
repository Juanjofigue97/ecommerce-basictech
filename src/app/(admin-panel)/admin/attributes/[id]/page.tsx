"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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

const attributeSchema = z.object({
  name: z.string().min(1, { error: "Requerido" }),
  slug: z.string().min(1, { error: "Requerido" }),
})

const valueSchema = z.object({
  value: z.string().min(1, { error: "Requerido" }),
  slug: z.string().min(1, { error: "Requerido" }),
})

type AttributeFormData = z.infer<typeof attributeSchema>
type ValueFormData = z.infer<typeof valueSchema>

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function AttributeDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [attribute, setAttribute] = useState<Attribute | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingAttr, setSavingAttr] = useState(false)
  const [addingValue, setAddingValue] = useState(false)
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null)
  const [deletingValue, setDeletingValue] = useState(false)
  const [deleteValueError, setDeleteValueError] = useState<string | null>(null)
  const [editingValueId, setEditingValueId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [editingSlug, setEditingSlug] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const attrForm = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
  })

  const valueForm = useForm<ValueFormData>({
    resolver: zodResolver(valueSchema),
  })

  useEffect(() => {
    fetch(`/api/attributes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setAttribute(data)
        attrForm.reset({ name: data.name, slug: data.slug })
      })
      .catch(() => router.push("/admin/attributes"))
      .finally(() => setLoading(false))
  }, [id, router, attrForm])

  const onSaveAttribute = async (data: AttributeFormData) => {
    setSavingAttr(true)
    try {
      const res = await fetch(`/api/attributes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setAttribute(updated)
      attrForm.reset({ name: updated.name, slug: updated.slug })
    } catch {
      console.error("Error saving attribute")
    } finally {
      setSavingAttr(false)
    }
  }

  const onAddValue = async (data: ValueFormData) => {
    setAddingValue(true)
    try {
      const res = await fetch(`/api/attributes/${id}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const newValue = await res.json()
      setAttribute((prev) =>
        prev
          ? {
              ...prev,
              values: [...prev.values, newValue].sort((a, b) => a.value.localeCompare(b.value)),
              _count: { values: prev._count.values + 1 },
            }
          : prev
      )
      valueForm.reset({ value: "", slug: "" })
    } catch {
      console.error("Error adding value")
    } finally {
      setAddingValue(false)
    }
  }

  const onDeleteValue = async () => {
    if (!deleteValueId) return
    setDeletingValue(true)
    setDeleteValueError(null)
    try {
      const res = await fetch(`/api/attributes/${id}/values/${deleteValueId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        setDeleteValueError(data.error || "Error al eliminar")
        setDeletingValue(false)
        return
      }
      setAttribute((prev) =>
        prev
          ? {
              ...prev,
              values: prev.values.filter((v) => v.id !== deleteValueId),
              _count: { values: prev._count.values - 1 },
            }
          : prev
      )
      setDeleteValueId(null)
    } catch {
      setDeleteValueError("Error al eliminar el valor")
    } finally {
      setDeletingValue(false)
    }
  }

  const startEditValue = (v: AttributeValue) => {
    setEditingValueId(v.id)
    setEditingValue(v.value)
    setEditingSlug(v.slug)
  }

  const cancelEdit = () => {
    setEditingValueId(null)
    setEditingValue("")
    setEditingSlug("")
  }

  const saveEditValue = async (valueId: string) => {
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/attributes/${id}/values/${valueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editingValue, slug: editingSlug }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setAttribute((prev) =>
        prev
          ? {
              ...prev,
              values: prev.values
                .map((v) => (v.id === valueId ? updated : v))
                .sort((a, b) => a.value.localeCompare(b.value)),
            }
          : prev
      )
      cancelEdit()
    } catch {
      console.error("Error saving value")
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div><Skeleton className="h-7 w-48" /><Skeleton className="mt-1 h-4 w-64" /></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!attribute) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/attributes"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{attribute.name}</h1>
          <p className="text-muted-foreground">
            {attribute._count.values} valor{attribute._count.values !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attribute info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Atributo</CardTitle>
            <CardDescription>Nombre y slug del atributo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={attrForm.handleSubmit(onSaveAttribute)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  {...attrForm.register("name", {
                    onChange: (e) => attrForm.setValue("slug", generateSlug(e.target.value)),
                  })}
                />
                {attrForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{attrForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...attrForm.register("slug")} />
                {attrForm.formState.errors.slug && (
                  <p className="text-sm text-destructive">{attrForm.formState.errors.slug.message}</p>
                )}
              </div>
              <Button type="submit" disabled={savingAttr}>
                {savingAttr ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Values management */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
            <CardDescription>
              Los valores que puede tomar este atributo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add value form */}
            <form onSubmit={valueForm.handleSubmit(onAddValue)} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Valor (ej: XL)"
                  {...valueForm.register("value", {
                    onChange: (e) => valueForm.setValue("slug", generateSlug(e.target.value)),
                  })}
                />
                {valueForm.formState.errors.value && (
                  <p className="text-xs text-destructive">{valueForm.formState.errors.value.message}</p>
                )}
              </div>
              <div className="w-28 space-y-1">
                <Input
                  placeholder="slug"
                  {...valueForm.register("slug")}
                />
                {valueForm.formState.errors.slug && (
                  <p className="text-xs text-destructive">{valueForm.formState.errors.slug.message}</p>
                )}
              </div>
              <Button type="submit" size="icon" disabled={addingValue}>
                {addingValue ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>

            <Separator />

            {/* Values list */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {attribute.values.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin valores aún. Agrega el primero arriba.
                </p>
              ) : (
                attribute.values.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 rounded-lg border p-2">
                    {editingValueId === v.id ? (
                      <>
                        <Input
                          value={editingValue}
                          onChange={(e) => {
                            setEditingValue(e.target.value)
                            setEditingSlug(generateSlug(e.target.value))
                          }}
                          className="h-7 flex-1 text-sm"
                        />
                        <Input
                          value={editingSlug}
                          onChange={(e) => setEditingSlug(e.target.value)}
                          className="h-7 w-24 text-sm"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600"
                          onClick={() => saveEditValue(v.id)}
                          disabled={savingEdit}
                        >
                          {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={cancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="flex-1 justify-start font-normal">
                          {v.value}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">{v.slug}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditValue(v)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { setDeleteValueError(null); setDeleteValueId(v.id) }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete value dialog */}
      <AlertDialog open={!!deleteValueId} onOpenChange={() => { setDeleteValueId(null); setDeleteValueError(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar valor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
              {deleteValueError && (
                <span className="mt-2 block font-medium text-destructive">{deleteValueError}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingValue}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteValue} disabled={deletingValue}>
              {deletingValue ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
