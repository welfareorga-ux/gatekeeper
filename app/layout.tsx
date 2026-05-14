import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "sonner"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: {
    default: "Gatekeeper — Control de Visitas",
    template: "%s — Gatekeeper",
  },
  description: "Sistema de gestión de visitas vehiculares para condominios cerrados",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gatekeeper",
  },
}

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthSessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
