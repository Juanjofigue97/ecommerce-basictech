"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2 } from "lucide-react"

const schema = z.object({
  name: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.string().email("El email no es válido"),
  subject: z.string().min(4, "Ingresá un asunto"),
  message: z.string().min(20, "El mensaje debe tener al menos 20 caracteres"),
})

type FormData = z.infer<typeof schema>

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setErrorMsg("")
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const { error } = await response.json()
        setErrorMsg(error || "No se pudo enviar el mensaje. Intentá nuevamente.")
        return
      }

      setSent(true)
    } catch {
      setErrorMsg("No se pudo enviar el mensaje. Intentá nuevamente.")
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="font-semibold">¡Mensaje enviado!</p>
        <p className="text-sm text-muted-foreground">
          Te vamos a responder a la brevedad.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" placeholder="Juan Pérez" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="juan@ejemplo.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Asunto</Label>
        <Input id="subject" placeholder="¿En qué podemos ayudarte?" {...register("subject")} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea
          id="message"
          placeholder="Describí tu consulta con el mayor detalle posible..."
          rows={5}
          {...register("message")}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar mensaje
      </Button>
    </form>
  )
}
