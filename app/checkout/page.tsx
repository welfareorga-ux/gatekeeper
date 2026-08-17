import { Suspense } from "react"
import Link from "next/link"
import { Shield, Loader2 } from "lucide-react"
import { CheckoutForm } from "./checkout-form"

export const metadata = {
  robots: { index: false, follow: true }, title: "Contratar Plan — Gatekeeper" }

export default function CheckoutPage() {
  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
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

        <main className="container max-w-4xl mx-auto px-4 py-10">
          <Suspense fallback={
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }>
            <CheckoutForm />
          </Suspense>
        </main>
      </div>
    </>
  )
}
