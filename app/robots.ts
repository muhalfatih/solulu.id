import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solulu.id"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/counselors", "/screening", "/pricing", "/cek-sesi", "/apply", "/privacy", "/terms"],
        disallow: ["/admin/", "/counselor/", "/session/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
