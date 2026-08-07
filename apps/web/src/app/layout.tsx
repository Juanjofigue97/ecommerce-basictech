import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { unstable_cache } from "next/cache"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { prisma } from "@/lib/prisma"

const getStoreMetadata = unstable_cache(
  async () => {
    try {
      return await prisma.storeSettings.findUnique({ where: { id: "singleton" } })
    } catch {
      return null
    }
  },
  ["root-metadata"],
  { revalidate: 3600, tags: ["store-settings"] },
)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreMetadata()

  const name = settings?.name ?? "Nahiara Sport"
  const description =
    settings?.description ??
    "Uniformes importados y calzado deportivo y urbano, calidad premium, en Pasto."

  return {
    title: `${name} - Uniformes y Calzado Deportivo`,
    description,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
