import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tiket", destination: "/cek-sesi", permanent: true },
      { source: "/konselor/register", destination: "/apply", permanent: true },
      { source: "/admin/zoom", destination: "/admin/zoom-settings", permanent: true },
      { source: "/admin/pricing", destination: "/admin/settings?tab=fees", permanent: true },
      { source: "/admin/dashboard", destination: "/admin", permanent: true },
      { source: "/admin/operator", destination: "/operator", permanent: true },
      { source: "/counselor/schedules", destination: "/counselor/schedule", permanent: true },
      {
        source: "/admin/setting",
        destination: "/admin/settings",
        permanent: true,
      },
      {
        source: "/prototype/admin/zoom",
        destination: "/admin/zoom-settings",
        permanent: false,
      },
      {
        source: "/prototype/admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/prototype/admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.solulu.id",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
