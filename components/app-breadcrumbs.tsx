"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getBreadcrumbTrail } from "@/lib/navigation"

interface AppBreadcrumbsProps {
  portal: "admin" | "counselor"
  className?: string
}

export function AppBreadcrumbs({ portal, className }: AppBreadcrumbsProps) {
  const pathname = usePathname()
  const trail = React.useMemo(
    () => getBreadcrumbTrail(pathname || `/${portal}`, portal),
    [pathname, portal]
  )

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1

          return (
            <React.Fragment key={`${item.href}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
