import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gatekeeper — Control de Visitas",
    short_name: "Gatekeeper",
    description: "Sistema de gestión de visitas vehiculares para condominios cerrados",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait-primary",
    categories: ["security", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Buscar Vehículo",
        url: "/vigilante",
        description: "Búsqueda rápida de placa",
      },
      {
        name: "Nueva Visita",
        url: "/residente/nueva-visita",
        description: "Registrar nueva visita",
      },
    ],
  }
}
