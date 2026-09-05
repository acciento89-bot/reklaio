import type { NextConfig } from "next";

const noIndexRoutes = [
  "/admin/:path*",
  "/anmelden",
  "/dashboard/:path*",
  "/dokumente/:path*",
  "/einstellungen/:path*",
  "/faelle/:path*",
  "/fristen/:path*",
  "/neuer-fall/:path*",
  "/onboarding/:path*",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/preise/checkout/:path*",
  "/registrieren"
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }
      ]
    },
    ...noIndexRoutes.flatMap((source) => [source, `/en${source}`]).map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
    }))
  ]
};

export default nextConfig;
