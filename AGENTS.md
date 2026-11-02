<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

GitHub issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/`). See `docs/agents/domain.md`.

## Database-First & Zero-Mock Policy (STRICT)

1. **Real Database Required**:
   Semua fitur, server actions, route handlers, dan antarmuka pengguna di Solulu WAJIB terhubung ke database PostgreSQL real (Supabase via Drizzle ORM di `@/db`) sesuai variabel lingkungan (`DATABASE_URL`).
2. **Larangan Mutlak Data Mock**:
   - DILARANG membuat, menyimpan, mengimpor, atau menggunakan data tiruan (*mock data*) di direktori aplikasi produksi (`app/`, `lib/`, `components/`).
   - DILARANG membuat fallback dummy ketika query database tidak menemukan data (misal: `if (!data) return MOCK_DATA`). Jika data kosong, kembalikan array kosong `[]` atau `null` dan tampilkan Empty State di antarmuka pengguna.
3. **Pemisahan Tipe Data (Type Contracts)**:
   - Tipe data harus diinferensi langsung dari skema Drizzle di `@/db/schema.ts` (`$inferSelect`, `$inferInsert`) atau diimpor dari `@/lib/types/`.
   - Dilarang membuat file tipe yang mengikutsertakan mock data.
4. **Isolasi Pengujian**:
   - Mocking hanya diperbolehkan di dalam folder `tests/` menggunakan fitur mock Vitest (`vi.fn()`, `vi.mock()`) untuk mengisolasi gateway pihak ketiga (seperti Xendit, Zoom, Resend). Data domain dan logika operasional harus menguji kontrak skema real.

