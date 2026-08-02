"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, X, UserPlus, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

interface Customer {
  id: string
  name: string
  document: string | null
  phone: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (id: string, name: string) => void
  currentCustomerId: string
}

const newCustomerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  document: z.string().optional(),
  phone: z.string().optional(),
})

type NewCustomerForm = z.infer<typeof newCustomerSchema>

export function CustomerModal({ open, onClose, onSelect, currentCustomerId }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewCustomerForm>({
    resolver: zodResolver(newCustomerSchema),
  })

  useEffect(() => {
    if (!open) {
      setSearch("")
      setShowForm(false)
      setServerError("")
      reset()
      return
    }
    loadCustomers()
  }, [open, reset])

  function loadCustomers() {
    setLoading(true)
    fetch("/api/customers?limit=200")
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d.customers) ? d.customers : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }

  async function onSubmit(data: NewCustomerForm) {
    setSubmitting(true)
    setServerError("")
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          document: data.document || null,
          phone: data.phone || null,
          source: "PHYSICAL",
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setServerError(err.error ?? "Error al crear el cliente")
        return
      }
      const created: Customer = await res.json()
      setCustomers((prev) => [created, ...prev])
      onSelect(created.id, created.name)
      onClose()
    } catch {
      setServerError("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.document ?? "").includes(search) ||
      (c.phone ?? "").includes(search)
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {showForm ? "Nuevo cliente" : "Clientes"}
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="document">Cédula / NIT</Label>
                <Input
                  id="document"
                  placeholder="Ej: 1234567890"
                  {...register("document")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="Ej: +57 300 123 4567"
                  {...register("phone")}
                />
              </div>

              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
            </div>

            <div className="px-6 py-3 border-t flex gap-2 justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowForm(false); setServerError(""); reset() }}
                disabled={submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Crear y seleccionar
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => { setShowForm(true); setSearch("") }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </div>

            <div className="overflow-y-auto max-h-100">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {search ? `Sin resultados para "${search}"` : "No hay clientes"}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => { setShowForm(true); setSearch("") }}
                  >
                    <UserPlus className="mr-1 h-3.5 w-3.5" />
                    Crear nuevo cliente
                  </Button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase text-xs tracking-wide">
                        Identificación
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase text-xs tracking-wide">
                        Nombre
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        className={`border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          c.id === currentCustomerId ? "bg-primary/10" : ""
                        }`}
                        onClick={() => { onSelect(c.id, c.name); onClose() }}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {c.document ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-4 py-3 border-t flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                <X className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
