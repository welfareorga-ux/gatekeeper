import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { HelpWidget } from "@/components/help-widget"
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
  metadataBase: new URL("https://www.gatekeeper-app.org"),
  title: {
    default: "Gatekeeper — Control de Visitas",
    template: "%s — Gatekeeper",
  },
  description: "Sistema de gestión de visitas vehiculares para condominios cerrados",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://www.gatekeeper-app.org",
    siteName: "Gatekeeper",
    title: "Gatekeeper — Control de visitas y accesos para condominios",
    description: "Más seguridad y menos conflictos en la puerta de tu condominio. Sin instalar nada.",
  },
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
          <HelpWidget />
          <Toaster richColors position="top-right" />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
