"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCashSessionsStore, type CashSessionDetail } from "@/stores/cash-sessions-store"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Controller } from "react-hook-form"

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

const schema = z.object({
  closingBalance: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  observations: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CashSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getSessionDetail, closeSession } = useCashSessionsStore()
  const [session, setSession] = useState<CashSessionDetail | null>(null)
  const [loadError, setLoadError] = useState("")
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { closingBalance: 0 },
  })

  function loadDetail() {
    return getSessionDetail(id)
      .then(setSession)
      .catch((e) => setLoadError((e as Error).message))
  }

  useEffect(() => { loadDetail() }, [id, getSessionDetail])

  async function handleRefresh() {
    setRefreshing(true)
    await loadDetail()
    setRefreshing(false)
  }

  async function onSubmit(data: FormData) {
    setClosing(true)
    setCloseError("")
    try {
      await closeSession(id, {
        closingBalance: data.closingBalance,
        observations: data.observations || null,
      })
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: "CLOSED",
              closingBalance: data.closingBalance,
              observations: data.observations || null,
            }
          : prev
      )
      router.push("/admin/cash-sessions")
    } catch (e) {
      setCloseError((e as Error).message)
    } finally {
      setClosing(false)
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{loadError}</p>
        <Button variant="outline" asChild><Link href="/admin/cash-sessions">Volver</Link></Button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const diff =
    session.closingBalance !== null && session.expectedBalance !== null
      ? session.closingBalance - session.expectedBalance
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cash-sessions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Sesión — {session.terminal.name}</h1>
            {session.status === "OPEN" ? (
              <Badge className="bg-green-600">Abierta</Badge>
            ) : (
              <Badge variant="secondary">Cerrada</Badge>
            )}
            {session.status === "OPEN" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {session.user.name} · Apertura: {formatDate(session.openedAt)}
            {session.closedAt && ` · Cierre: ${formatDate(session.closedAt)}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — payment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dinero Recibido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Efectivo</span>
              <span className="font-medium">{formatCOP(session.paymentsByMethod.CASH)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tarjeta crédito</span>
              <span className="font-medium">{formatCOP(session.paymentsByMethod.CREDIT_CARD)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tarjeta débito</span>
              <span className="font-medium">{formatCOP(session.paymentsByMethod.DEBIT_CARD)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transferencia</span>
              <span className="font-medium">{formatCOP(session.paymentsByMethod.TRANSFER)}</span>
            </div>

            <Separator />

            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Totales</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total propinas</span>
              <span className="font-medium">{formatCOP(session.totalTips)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total egresos</span>
              <span className="font-medium text-destructive">{formatCOP(session.totalEgresos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total ventas</span>
              <span className="font-medium">{formatCOP(session.totalSales)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Right — close form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cierre de Caja</CardTitle>
              <span className="text-sm text-muted-foreground">Terminal: {session.terminal.name}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Dinero esperado en caja</span>
              <span className="text-lg font-bold">
                {formatCOP(session.expectedBalance ?? 0)}
              </span>
            </div>

            {session.status === "CLOSED" ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base inicial</span>
                  <span>{formatCOP(session.openingBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dinero real contado</span>
                  <span>{session.closingBalance !== null ? formatCOP(session.closingBalance) : "—"}</span>
                </div>
                {diff !== null && (
                  <div className="flex justify-between text-sm font-medium">
                    <span>Diferencia</span>
                    <span className={diff >= 0 ? "text-green-600" : "text-destructive"}>
                      {diff >= 0 ? "+" : ""}{formatCOP(diff)}
                    </span>
                  </div>
                )}
                {session.observations && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Observaciones</p>
                    <p className="text-sm">{session.observations}</p>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {closeError && <p className="text-sm text-destructive">{closeError}</p>}

                <div className="space-y-2">
                  <Label htmlFor="closingBalance">Dinero real en caja (COP) *</Label>
                  <Controller
                    name="closingBalance"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="closingBalance"
                        value={field.value ?? 0}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="$ 0"
                      />
                    )}
                  />
                  {errors.closingBalance && (
                    <p className="text-sm text-destructive">{errors.closingBalance.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    placeholder="Notas del cierre..."
                    rows={3}
                    {...register("observations")}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={closing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cerrar Sesión
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/cash-sessions">Cancelar</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
