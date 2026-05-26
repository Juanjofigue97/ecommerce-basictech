"use client"

import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function CustomerModal({ open, onClose, onSelect, currentCustomerId }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/customers?limit=100")
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d.customers) ? d.customers : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [open])

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
          <DialogTitle>Clientes</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron clientes
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
      </DialogContent>
    </Dialog>
  )
}
