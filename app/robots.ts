import type { MetadataRoute } from "next"

const BASE = "https://www.gatekeeper-app.org"

/**
 * Hasta ahora /robots.txt devolvía 404. Google lo pide expresamente para el
 * rastreador de AdSense (Mediapartners-Google), y sin él la parte privada de la
 * app se rastrea sin necesidad: cada URL con login es una página sin contenido
 * a ojos del revisor.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Zonas con sesión o de trámite: no aportan contenido indexable.
        disallow: [
          "/api/",
          "/admin/",
          "/residente/",
          "/superadmin/",
          "/vigilante/",
          "/checkout",
          "/contratar-servicio",
          "/no-autorizado",
          "/reset-password",
          "/forgot-password",
        ],
      },
      // El rastreador de AdSense necesita ver las páginas donde hay anuncios.
      { userAgent: "Mediapartners-Google", allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
