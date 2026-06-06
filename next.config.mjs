/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // URL limpia para el landing estático servido desde /public
  async rewrites() {
    return [{ source: "/landing", destination: "/landing.html" }]
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            // camera=(self) habilita el escáner QR del vigilante (mismo origen).
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // cdn.tailwindcss.com + fonts.googleapis/gstatic: usados por /landing (página de marketing estática)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.culqi.com https://cdn.tailwindcss.com",
              "style-src 'self' 'unsafe-inline' https://checkout.culqi.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://checkout.culqi.com",
              "font-src 'self' https://checkout.culqi.com https://fonts.gstatic.com",
              "connect-src 'self' https://api.culqi.com https://checkout.culqi.com",
              "frame-src https://checkout.culqi.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
