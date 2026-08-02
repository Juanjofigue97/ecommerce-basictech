"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useCashMovementsStore } from "@/stores/cash-movements-store"
import type { CashSession } from "@/stores/cash-sessions-store"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Controller } from "react-hook-form"

interface UserOption {
  id: string
  name: string
  email: string
}

const schema = z.object({
  sessionId: z.string().min(1, "Selecciona una sesión"),
  userId: z.string().min(1, "Selecciona el responsable"),
  type: z.enum(["INCOME", "EXPENSE"], { error: "Selecciona el tipo" }),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  concept: z.string().min(1, "El concepto es requerido").max(200),
})
type FormData = z.infer<typeof schema>

export default function NewCashMovementPage() {
  const router = useRouter()
  const { createMovement } = useCashMovementsStore()
  const [openSessions, setOpenSessions] = useState<CashSession[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const {
    register, handleSubmit, setValue, watch, control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "EXPENSE" },
  })

  useEffect(() => {
    fetch("/api/cash-sessions?status=OPEN")
      .then((r) => r.json())
      .then((data) => setOpenSessions(Array.isArray(data) ? data : []))
      .catch(() => setOpenSessions([]))

    fetch("/api/users?role=ADMIN&status=ACTIVE")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
  }, [])

  async function onSubmit(data: FormData) {
    setSaving(true)
    setError("")
    try {
      await createMovement(data)
      router.push("/admin/cash-movements")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const typeValue = watch("type")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cash-movements"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Movimiento</h1>
          <p className="text-muted-foreground">Registra un egreso o ingreso en una sesión activa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Datos del Movimiento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={typeValue}
                onValueChange={(v) => setValue("type", v as "INCOME" | "EXPENSE")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Egreso — salida de dinero</SelectItem>
                  <SelectItem value="INCOME">Ingreso — entrada de dinero</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Sesión activa *</Label>
              <Select
                value={watch("sessionId") ?? ""}
                onValueChange={(v) => setValue("sessionId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la sesión" />
                </SelectTrigger>
                <SelectContent>
                  {openSessions.length === 0 && (
                    <SelectItem value="_none" disabled>No hay sesiones abiertas</SelectItem>
                  )}
                  {openSessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.terminal.name} — {s.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sessionId && (
                <p className="text-sm text-destructive">{errors.sessionId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Responsable *</Label>
              <Select
                value={watch("userId") ?? ""}
                onValueChange={(v) => setValue("userId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el responsable" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-destructive">{errors.userId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto *</Label>
              <Input
                id="concept"
                placeholder="Ej: Compra de insumos, Pago domiciliario..."
                {...register("concept")}
              />
              {errors.concept && (
                <p className="text-sm text-destructive">{errors.concept.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto (COP) *</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="amount"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="$ 0"
                  />
                )}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Movimiento
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/cash-movements">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
