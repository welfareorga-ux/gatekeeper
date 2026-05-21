import { Rol } from "@prisma/client"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      nombre: string
      rol: Rol
      direccion?: string
      condominioId: string | null
      isSuperAdmin: boolean
    }
  }

  interface User {
    rol: Rol
    direccion?: string
    condominioId: string | null
    isSuperAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    rol: Rol
    nombre: string
    direccion?: string
    condominioId: string | null
    isSuperAdmin: boolean
    suscripcionEstado: string
    trialEndsAt: string | null
  }
}
