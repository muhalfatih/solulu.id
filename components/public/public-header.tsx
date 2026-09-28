"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, X, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export const PUBLIC_NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Katalog Konselor", href: "/counselors" },
  { label: "Biaya Layanan", href: "/pricing" },
  { label: "Cek Sesi", href: "/cek-sesi" },
] as const

export function PublicHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0"
          id="link-header-logo"
        >
          <div className="size-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-tight text-foreground">
              Solulu
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <span>Ruang Aman untuk Cerita</span>
              <Heart className="size-2.5 text-purple-600 dark:text-purple-400 fill-purple-600/40 shrink-0" />
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-1.5 text-xs font-medium"
        >
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-full transition-colors",
                  isActive
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions: Theme Toggle, CTA, and Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Button
            asChild
            size="sm"
            className="hidden sm:inline-flex text-xs font-semibold h-9 px-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm shadow-purple-600/20"
            id="btn-header-cta"
          >
            <Link href="/counselors">
              <span>Mulai Cerita</span>
              <ArrowRight className="size-3.5" data-icon="inline-end" />
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9 rounded-lg"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            id="btn-mobile-menu-toggle"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-border/80 bg-background/98 backdrop-blur-xl px-4 py-4 flex flex-col gap-2 shadow-lg animate-in slide-in-from-top-2 duration-150"
          id="nav-mobile-dropdown"
        >
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between",
                  isActive
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="size-1.5 rounded-full bg-purple-600" />
                )}
              </Link>
            )
          })}

          <div className="pt-2 border-t border-border/60">
            <Button
              asChild
              className="w-full text-xs font-semibold h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
              id="btn-mobile-menu-cta"
            >
              <Link
                href="/counselors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Mulai Cerita Sekarang</span>
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
