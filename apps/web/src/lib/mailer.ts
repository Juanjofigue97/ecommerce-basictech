import nodemailer from "nodemailer"

const globalForMailer = globalThis as unknown as {
  mailer: ReturnType<typeof nodemailer.createTransport> | undefined
}

function createMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export const mailer = globalForMailer.mailer ?? createMailer()

if (process.env.NODE_ENV !== "production") {
  globalForMailer.mailer = mailer
}
