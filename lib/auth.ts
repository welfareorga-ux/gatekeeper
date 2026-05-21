import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { Rol } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const xff = req?.headers?.["x-forwarded-for"]
        const ip = (Array.isArray(xff) ? xff[0] : xff?.split(",")[0])?.trim() ?? "unknown"
        const emailKey = `login:email:${credentials.email.toLowerCase().trim()}`
        const ipKey = `login:ip:${ip}`

        const { allowed: ipOk } = checkRateLimit(ipKey, 20, 15 * 60_000)
        const { allowed: emailOk } = checkRateLimit(emailKey, 5, 15 * 60_000)
        if (!ipOk || !emailOk) throw new Error("TooManyRequests")

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        if (!user || !user.activo) return null

        const passwordValida = await bcrypt.compare(credentials.password, user.password)
        if (!passwordValida) return null

        await prisma.logActividad.create({
          data: {
            userId: user.id,
            accion: "LOGIN",
            detalle: `Inicio de sesión - Rol: ${user.rol}`,
          },
        }).catch(() => null)

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          rol: user.rol,
          direccion: user.direccion ?? undefined,
          condominioId: user.condominioId ?? null,
          isSuperAdmin: user.isSuperAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.rol = (user as { rol: Rol }).rol
        token.nombre = user.name ?? ""
        token.direccion = (user as { direccion?: string }).direccion
        token.condominioId = (user as { condominioId: string | null }).condominioId
        token.isSuperAdmin = (user as { isSuperAdmin: boolean }).isSuperAdmin
      }

      // Re-fetch suscripcionEstado on login OR when the client calls update()
      const condominioId = token.condominioId as string | null
      const rol = token.rol as Rol | undefined
      if (condominioId && rol === "ADMIN" && (user || trigger === "update")) {
        const condominio = await prisma.condominio.findUnique({
          where: { id: condominioId },
          select: { suscripcionEstado: true, trialEndsAt: true },
        })
        let estado = condominio?.suscripcionEstado ?? "activa"
        if (estado === "trial" && condominio?.trialEndsAt && condominio.trialEndsAt < new Date()) {
          estado = "trial_expirado"
        }
        token.suscripcionEstado = estado
        token.trialEndsAt = condominio?.trialEndsAt?.toISOString() ?? null
      } else if (user) {
        token.suscripcionEstado = "activa"
        token.trialEndsAt = null
      }

      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.rol = token.rol as Rol
      session.user.nombre = token.nombre as string
      session.user.direccion = token.direccion as string | undefined
      session.user.condominioId = token.condominioId as string | null
      session.user.isSuperAdmin = token.isSuperAdmin as boolean
      return session
    },
  },
}
