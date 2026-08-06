import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mailer } from "@/lib/mailer"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const schema = z.object({
  name: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.string().email("El email no es válido"),
  subject: z.string().min(4, "Ingresá un asunto"),
  message: z.string().min(20, "El mensaje debe tener al menos 20 caracteres"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }

    const data = result.data

    const storeSettings = await prisma.storeSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    })

    const recipient = storeSettings.email || process.env.GMAIL_USER

    try {
      await mailer.sendMail({
        from: process.env.GMAIL_USER,
        to: recipient,
        replyTo: data.email,
        subject: `[Contacto Web] ${data.subject}`,
        text: `Nombre: ${data.name}\nEmail: ${data.email}\nAsunto: ${data.subject}\n\n${data.message}`,
        html: `
          <div>
            <p><strong>Nombre:</strong> ${escapeHtml(data.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
            <p><strong>Asunto:</strong> ${escapeHtml(data.subject)}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${escapeHtml(data.message).replace(/\n/g, "<br />")}</p>
          </div>
        `,
      })
    } catch (error) {
      console.error("Error sending contact email:", error)
      return NextResponse.json(
        { error: "No se pudo enviar el mensaje. Intentá nuevamente o escribinos por WhatsApp." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error processing contact request:", error)
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje. Intentá nuevamente o escribinos por WhatsApp." },
      { status: 500 }
    )
  }
}
