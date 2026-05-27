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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useCashSessionsStore } from "@/stores/cash-sessions-store"
import { useTerminalsStore } from "@/stores/terminals-store"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Controller } from "react-hook-form"

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

const schema = z.object({
  terminalId: z.string().min(1, "Selecciona una terminal"),
  userId: z.string().min(1, "Selecciona el responsable"),
  openingBalance: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
})
type FormData = z.infer<typeof schema>

export default function NewCashSessionPage() {
  const router = useRouter()
  const { openSession } = useCashSessionsStore()
  const { terminals, fetchTerminals } = useTerminalsStore()
  const [users, setUsers] = useState<UserOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const {
    register, handleSubmit, setValue, watch, control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { openingBalance: 0 },
  })

  useEffect(() => {
    fetchTerminals()
    fetch("/api/users?role=ADMIN&status=ACTIVE")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
  }, [fetchTerminals])

  async function onSubmit(data: FormData) {
    setSaving(true)
    setError("")
    try {
      await openSession(data)
      router.push("/admin/cash-sessions")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const activeTerminals = terminals.filter((t) => t.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cash-sessions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Abrir Sesión de Caja</h1>
          <p className="text-muted-foreground">Inicia un nuevo turno en una terminal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Datos de la Sesión</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-2">
              <Label>Terminal *</Label>
              <Select
                value={watch("terminalId") ?? ""}
                onValueChange={(v) => setValue("terminalId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una terminal" />
                </SelectTrigger>
                <SelectContent>
                  {activeTerminals.length === 0 && (
                    <SelectItem value="_none" disabled>No hay terminales activas</SelectItem>
                  )}
                  {activeTerminals.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.terminalId && (
                <p className="text-sm text-destructive">{errors.terminalId.message}</p>
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
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-destructive">{errors.userId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingBalance">Base inicial (COP)</Label>
              <Controller
                name="openingBalance"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="openingBalance"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="$ 0"
                  />
                )}
              />
              {errors.openingBalance && (
                <p className="text-sm text-destructive">{errors.openingBalance.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Abrir Sesión
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/cash-sessions">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
