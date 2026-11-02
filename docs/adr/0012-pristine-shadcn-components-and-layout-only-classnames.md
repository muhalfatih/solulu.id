---
status: accepted
---

# 12. Komponen shadcn Dibiarkan Asli; `className` Hanya untuk Layout

Date: 2026-11-02

Delapan komponen di `components/ui/` sempat dimodifikasi (mis. `card` kehilangan padding vertikal, `button`/`accordion` diberi varian ungu untuk situs publik) dan `.theme-admin` menimpa token preset, ditambah ratusan override `className` di halaman portal. Hasilnya padding tidak konsisten dan skeleton tidak seimbang; prototype `prototype/admin-dashboard-v9` membuktikan `card` versi registry langsung memperbaikinya. Kami memutuskan `components/ui/` selalu identik dengan registry `@shadcn` gaya `radix-vega` (diperbarui hanya lewat CLI), token mengikuti preset `b2BoVg35U` kecuali `--chart-1..5` yang memakai palet kategori tervalidasi, dan di portal internal `className` pada komponen shadcn hanya untuk layout (grid, gap, lebar), tidak untuk padding/border/radius/shadow/warna. Kebutuhan visual situs publik dipenuhi oleh token `.theme-public` dan wrapper di `components/public/`, bukan varian tambahan di `components/ui/`.

## Consequences

- `npm run lint:ui` menggagalkan build bila portal memakai `animate-pulse` buatan sendiri atau override styling pada `Card*`; aturan ini juga menjadi coding standard untuk `/code-review`.
- Setiap route portal punya `loading.tsx` yang bentuknya identik dengan halamannya, disusun dari `Card` + `Skeleton` asli.
- `TooltipProvider` dipasang di root layout, bukan di dalam `sidebar.tsx`.
