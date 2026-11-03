import type { MetadataRoute } from "next"
import { getAppBaseUrl } from "@/lib/url"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/counselors", "/screening", "/pricing", "/cek-sesi", "/privacy", "/terms"],
        disallow: ["/admin/", "/counselor/", "/session/", "/api/", "/apply"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
