/**
 * ads.txt — archivo que AdSense exige en la raíz del dominio para verificar
 * que el sitio autoriza a Google a vender su inventario publicitario.
 *
 * Se genera a partir de NEXT_PUBLIC_ADSENSE_CLIENT en vez de ser un archivo
 * estático, para no tener que acordarse de editarlo: al configurar la variable
 * queda publicado solo. Sin cuenta configurada devuelve 404, que es lo correcto
 * (un ads.txt vacío o con datos falsos perjudica la verificación).
 */
export const dynamic = "force-dynamic"

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  if (!client) {
    return new Response("Not found", { status: 404 })
  }

  // El ID va sin el prefijo "ca-": ca-pub-123456 → pub-123456
  const publisherId = client.replace(/^ca-/, "")

  return new Response(
    `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  )
}
