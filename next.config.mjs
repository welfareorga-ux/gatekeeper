/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // La landing estática /landing fue eliminada; redirige a la home unificada.
  async redirects() {
    return [{ source: "/landing", destination: "/", permanent: true }]
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.culqi.com",
              "style-src 'self' 'unsafe-inline' https://checkout.culqi.com",
              "img-src 'self' data: blob: https://checkout.culqi.com",
              "font-src 'self' https://checkout.culqi.com",
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
