import { Geist } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

import type { Metadata } from "next"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "Solulu — Telekonseling Kesehatan Mental Hangat & Terpercaya",
    template: "%s | Solulu",
  },
  description:
    "Ruang digital yang menenangkan untuk telekonseling kesehatan mental bersama Psikolog Klinis dan Konselor Sebaya. Skrining mandiri SRQ-20, reservasi instan, dan privasi medis terjamin.",
  keywords: [
    "telekonseling",
    "kesehatan mental",
    "psikolog online",
    "konseling sebaya",
    "skrining SRQ-20",
    "konseling jakarta",
    "konseling indonesia",
    "terapi kecemasan",
    "burnout kerja",
  ],
  authors: [{ name: "Solulu Indonesia" }],
  creator: "Solulu Indonesia",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://solulu.id"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://solulu.id",
    title: "Solulu — Ruang Tenang untuk Pulih & Bertumbuh",
    description:
      "Telekonseling kesehatan mental terpercaya tanpa birokrasi rumit. Didampingi Psikolog Klinis dan Konselor Sebaya berpengalaman.",
    siteName: "Solulu",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solulu — Telekonseling Kesehatan Mental",
    description:
      "Ruang digital aman & nyaman untuk bercerita dan pulih bersama konselor terpercaya.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased font-sans", geistSans.variable)}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
