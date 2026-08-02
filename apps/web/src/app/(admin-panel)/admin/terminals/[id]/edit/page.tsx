"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useTerminalsStore } from "@/stores/terminals-store"

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  isActive: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function EditTerminalPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { updateTerminal } = useTerminalsStore()
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  })

  useEffect(() => {
    fetch(`/api/terminals/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoadError(data.error); return }
        reset({ name: data.name, isActive: data.isActive })
      })
      .catch(() => setLoadError("Error al cargar la terminal"))
  }, [id, reset])

  async function onSubmit(data: FormData) {
    setSaving(true)
    setSaveError("")
    try {
      await updateTerminal(id, data)
      router.push("/admin/terminals")
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">{loadError}</p>
        <Button variant="outline" asChild><Link href="/admin/terminals">Volver</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/terminals"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Terminal</h1>
          <p className="text-muted-foreground">Modifica los datos de la terminal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Datos de la Terminal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" placeholder="Caja 1" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label htmlFor="isActive">Terminal activa</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/terminals">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
