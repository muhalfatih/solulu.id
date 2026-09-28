import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/zoom",
        destination: "/admin/zoom-settings",
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
}

export default nextConfig
