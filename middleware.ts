import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequestWithAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const rol = token.rol
    const isSuperAdmin = token.isSuperAdmin as boolean

    if (pathname.startsWith("/superadmin") && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }

    if (pathname.startsWith("/admin") && rol !== "ADMIN" && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }

    // Guard de suscripción: admin con suscripción inactiva → página de bloqueo
    const suscripcionEstado = token.suscripcionEstado as string | undefined
    const ESTADOS_BLOQUEADOS = ["vencida", "fallida"]
    if (
      rol === "ADMIN" &&
      !isSuperAdmin &&
      suscripcionEstado &&
      ESTADOS_BLOQUEADOS.includes(suscripcionEstado) &&
      pathname.startsWith("/admin") &&
      pathname !== "/admin/suscripcion"
    ) {
      return NextResponse.redirect(new URL("/suscripcion-inactiva", req.url))
    }

    if (pathname.startsWith("/vigilante") && rol !== "VIGILANTE" && rol !== "ADMIN" && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }

    if (pathname.startsWith("/residente") && rol !== "RESIDENTE" && rol !== "ADMIN" && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/residente/:path*",
    "/vigilante/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
  ],
}
