"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  trialEndsAt: string
}

export function TrialBanner({ trialEndsAt }: Props) {
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 0) return null

  const mensaje = daysLeft === 1
    ? "¡Hoy vence tu prueba gratuita!"
    : `Te quedan ${daysLeft} días de prueba gratuita.`

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <Clock className="h-4 w-4 shrink-0" />
        <span>{mensaje} Elige un plan para continuar sin interrupciones.</span>
      </div>
      <Link href="/admin/suscripcion">
        <Button size="sm" className="shrink-0 h-7 text-xs">Elegir plan</Button>
      </Link>
    </div>
  )
}
