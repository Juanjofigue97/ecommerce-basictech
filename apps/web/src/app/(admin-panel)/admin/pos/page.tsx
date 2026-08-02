"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Monitor, Receipt } from "lucide-react"
import { useTerminalsStore, type Terminal } from "@/stores/terminals-store"
import type { CashSession } from "@/stores/cash-sessions-store"

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n)
}

export default function POSSelectionPage() {
  const { terminals, fetchTerminals } = useTerminalsStore()
  const [sessions, setSessions] = useState<CashSession[]>([])

  useEffect(() => {
    fetchTerminals()
    fetch("/api/cash-sessions?status=OPEN")
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]))
  }, [fetchTerminals])

  const activeTerminals = terminals.filter((t) => t.isActive)

  function getSession(t: Terminal) {
    return sessions.find((s) => s.terminal.id === t.id) ?? null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Factura en caja</h1>
          <p className="text-muted-foreground">Selecciona una terminal para iniciar</p>
        </div>
      </div>

      {activeTerminals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Monitor className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No hay terminales activas.</p>
          <Link href="/admin/terminals/new" className="text-sm text-primary underline mt-1 inline-block">
            Crear terminal
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {activeTerminals.map((terminal) => {
            const session = getSession(terminal)
            const hasSession = session !== null
            const balance = hasSession
              ? (session.expectedBalance ?? session.openingBalance)
              : null

            return (
              <Link
                key={terminal.id}
                href={hasSession ? `/admin/pos/${terminal.id}` : "#"}
                onClick={(e) => { if (!hasSession) e.preventDefault() }}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-6 text-center transition-all ${
                  hasSession
                    ? "hover:border-primary hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <Monitor
                  className={`h-8 w-8 ${hasSession ? "text-cyan-500" : "text-muted-foreground"}`}
                />
                <span className="font-semibold text-sm">{terminal.name}</span>
                {hasSession && balance !== null ? (
                  <span className="text-sm font-bold text-cyan-500">{formatCOP(balance)}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin sesión</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {activeTerminals.some((t) => !getSession(t)) && (
        <p className="text-xs text-muted-foreground">
          Las terminales sin sesión activa no están disponibles.{" "}
          <Link href="/admin/cash-sessions/new" className="text-primary underline">
            Abrir sesión
          </Link>
        </p>
      )}
    </div>
  )
}
