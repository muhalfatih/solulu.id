"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  Tag,
  ImageIcon,
  Menu,
  X,
  Search,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  LogOut,
  User,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | null
  badgeVariant?: "default" | "destructive" | "secondary" | "outline"
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operasional Klinis",
    items: [
      {
        href: "/admin/dashboard",
        label: "Ringkasan",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/sessions",
        label: "Jadwal Sesi",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Kemitraan & Konten",
    items: [
      {
        href: "/admin/counselors",
        label: "Konselor",
        icon: Users,
      },
      {
        href: "/admin/pricing",
        label: "Tarif & Voucher",
        icon: Tag,
      },
      {
        href: "/admin/gallery",
        label: "Galeri Publik",
        icon: ImageIcon,
      },
      {
        href: "/admin/testimonials",
        label: "Testimoni",
        icon: MessageSquareQuote,
      },
    ],
  },
  {
    title: "Sistem & Integrasi",
    items: [
      {
        href: "/admin/zoom-settings",
        label: "Pengaturan Zoom",
        icon: Video,
        badge: "Safety Lock",
        badgeVariant: "secondary",
      },
    ],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 md:static ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          {!collapsed ? (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  Solulu Admin
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Grounding Sanctuary
                </span>
              </div>
            </Link>
          ) : (
            <div className="mx-auto flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
              S
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden size-7 text-muted-foreground hover:text-foreground md:flex"
            aria-label={collapsed ? "Perluas menu" : "Perkecil menu"}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="size-7 text-muted-foreground md:hidden"
            aria-label="Tutup menu samping"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/admin/zoom-settings" &&
                    pathname?.startsWith("/admin/zoom"))
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && (
                      <div className="flex flex-1 items-center justify-between">
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant ?? "secondary"}
                            className="px-1.5 py-0 text-[10px] font-normal"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="shrink-0 border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex w-full cursor-pointer items-center rounded-lg p-2 text-left transition-colors outline-none hover:bg-muted ${
                  collapsed ? "justify-center" : "justify-between"
                }`}
              >
                {!collapsed ? (
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                      AD
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="truncate text-xs font-semibold text-foreground">
                        Admin Solulu
                      </span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        admin@solulu.id
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                    AD
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? "right" : "top"}
              align={collapsed ? "end" : "start"}
              className="w-56 text-xs"
            >
              <DropdownMenuLabel>
                <p className="font-semibold">Admin Solulu</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  admin@solulu.id
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/prototype/admin/zoom"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Lihat Prototipe UI</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  const { logoutAction } = await import("@/app/(auth)/login/actions");
                  await logoutAction();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="mr-2 size-3.5" />
                <span>Keluar Sesi</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/75 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="size-8 text-muted-foreground md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Portal Admin</span>
              <span>/</span>
              <span className="text-foreground capitalize">
                {pathname
                  ?.split("/")
                  .filter(Boolean)
                  .pop()
                  ?.replace("-", " ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 sm:flex dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
              <span>RBAC Admin Terverifikasi</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
