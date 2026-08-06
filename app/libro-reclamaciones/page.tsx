"use client"

import { useState } from "react"
import Link from "next/link"
import { Shield, BookOpen, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Estado = "idle" | "enviando" | "ok" | "error"

export default function LibroReclamacionesPage() {
  const [estado, setEstado] = useState<Estado>("idle")
  const [nroReclamo, setNroReclamo] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado("enviando")

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch("/api/reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setNroReclamo(json.nroReclamo)
      setEstado("ok")
      form.reset()
    } catch {
      setEstado("error")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Gatekeeper</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* Encabezado */}
        <div className="flex items-start gap-4">
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg shrink-0">
            <BookOpen className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Libro de Reclamaciones</h1>
            <p className="text-muted-foreground text-sm">
              Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y los
              lineamientos de INDECOPI.
            </p>
          </div>
        </div>

        {/* Aviso informativo */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-semibold">Antes de registrar tu reclamo:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Una <strong>queja</strong> es la disconformidad con la atención recibida (no involucra un producto o servicio específico).</li>
            <li>Un <strong>reclamo</strong> es la disconformidad relacionada con un producto o servicio adquirido.</li>
            <li>Responderemos a tu reclamo en un plazo máximo de <strong>15 días hábiles</strong>.</li>
          </ul>
        </div>

        {estado === "ok" ? (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Reclamo registrado correctamente</h2>
            <p className="text-sm text-green-700 dark:text-green-300">
              Tu número de reclamo es: <strong className="font-mono text-base">{nroReclamo}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Hemos enviado una confirmación al correo indicado. Responderemos en un plazo máximo de 15 días hábiles.
            </p>
            <Button variant="outline" onClick={() => setEstado("idle")}>
              Registrar otro reclamo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos del reclamante */}
            <fieldset className="border rounded-lg p-6 space-y-4">
              <legend className="text-sm font-semibold px-1">Datos del reclamante</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombres">Nombres y apellidos *</Label>
                  <Input id="nombres" name="nombres" required placeholder="Juan Pérez García" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dni">DNI / Carné de extranjería *</Label>
                  <Input id="dni" name="dni" required placeholder="12345678" maxLength={12} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono de contacto</Label>
                  <Input id="telefono" name="telefono" placeholder="987654321" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección del reclamante</Label>
                <Input id="direccion" name="direccion" placeholder="Av. Los Pinos 123, Lima" />
              </div>
            </fieldset>

            {/* Bien contratado */}
            <fieldset className="border rounded-lg p-6 space-y-4">
              <legend className="text-sm font-semibold px-1">Bien o servicio contratado</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="servicio">Servicio / Plan contratado *</Label>
                  <select
                    id="servicio"
                    name="servicio"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Plan Gratis">Plan Gratis</option>
                    <option value="Plan Pro - S/ 89/mes">Plan Pro — S/ 89/mes</option>
                    <option value="Plan Premium - S/ 149/mes">Plan Premium — S/ 149/mes</option>
                    <option value="Onboarding y Configuración - S/ 59">Onboarding y Configuración — S/ 59</option>
                    <option value="Capacitación del Personal - S/ 29">Capacitación del Personal — S/ 29</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monto">Monto pagado (S/)</Label>
                  <Input id="monto" name="monto" placeholder="49.00" />
                </div>
              </div>
            </fieldset>

            {/* Tipo y descripción */}
            <fieldset className="border rounded-lg p-6 space-y-4">
              <legend className="text-sm font-semibold px-1">Detalle del reclamo</legend>

              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="tipo" value="RECLAMO" required className="accent-primary" />
                    Reclamo (disconformidad con producto/servicio)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="tipo" value="QUEJA" className="accent-primary" />
                    Queja (mala atención)
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descripcion">Descripción del reclamo / queja *</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  required
                  placeholder="Describe detalladamente lo ocurrido, fechas relevantes y cualquier comunicación previa con soporte..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pedido">¿Qué solución solicitas? *</Label>
                <Textarea
                  id="pedido"
                  name="pedido"
                  required
                  placeholder="Describe qué esperas como resolución (reembolso, corrección del servicio, compensación, etc.)..."
                  className="min-h-[80px]"
                />
              </div>
            </fieldset>

            {estado === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Ocurrió un error al enviar tu reclamo. Por favor contáctanos directamente al +51 964 462 645.
              </div>
            )}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="autorizo"
                name="autorizo"
                required
                className="mt-0.5 accent-primary"
              />
              <label htmlFor="autorizo" className="text-sm text-muted-foreground leading-relaxed">
                Autorizo el tratamiento de mis datos personales para la gestión de este reclamo,
                conforme a la Ley N° 29733 de Protección de Datos Personales.
              </label>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando..." : "Registrar reclamo"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Al enviar, recibirás una confirmación en tu correo y un número de seguimiento.
              Responderemos en máximo 15 días hábiles.
            </p>
          </form>
        )}

        <div className="border-t pt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-primary hover:underline">← Volver al inicio</Link>
          <Link href="/terminos" className="text-primary hover:underline">Términos y condiciones</Link>
          <Link href="/politica-devoluciones" className="text-primary hover:underline">Política de devoluciones</Link>
        </div>
      </main>
    </div>
  )
}
