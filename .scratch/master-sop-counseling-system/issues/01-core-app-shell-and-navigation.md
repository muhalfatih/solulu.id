# 01: Core App Shell and Navigation

**What to build:**
A unified, production-grade Shadcn UI App Shell replacing the legacy backend layout for both the Admin and Counselor portals. Users see a modern, collapsible sidebar with role-aware navigation, clean breadcrumbs, user profile header, and theme toggle, providing an accessible structure for all subsequent feature pages.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Legacy custom layouts in `app/admin` and `app/counselor` are replaced with standard Shadcn UI App Shell architecture.
- [x] Sidebar uses official Shadcn `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, and `SidebarFooter`.
- [x] Dynamic breadcrumb component (`Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`) reflects the current active route hierarchy.
- [x] Responsive navigation drawer works seamlessly on mobile and tablet viewports.
- [x] Admin sidebar contains structured links to: Dashboard, Counselors Directory, Manual Payments, Financial Reports, Bookings, System Settings, and Zoom Accounts.
- [x] Counselor sidebar contains structured links to: Dashboard (Today's Sessions), Weekly Schedule, and Counselor Profile.
- [x] TypeScript check passes with zero errors and no layout shift occurs on page transitions.
