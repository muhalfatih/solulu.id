# 07: Admin Counselor Directory and STR/SIPP Expiry Radar

**What to build:**
A comprehensive management and verification portal at `/admin/counselors` and `/admin/counselors/[id]`. Admins inspect all 21 counselor profile fields and 8 Cloudflare R2 compliance attachments (KTP, CV, Diploma, STR, SIPP), monitor automated warning badges for STR/SIPP credentials expiring in less than 60 days, and execute approval, rejection, or active/inactive toggles.

**Blocked by:** 01-core-app-shell-and-navigation

**Status:** completed

- [x] Route `/admin/counselors` displays a table of verified and pending counselors queried from PostgreSQL.
- [x] Displays counselor credentials, service type (Peer Counselor vs Clinical Psychologist), and STR/SIPP registration numbers.
- [x] Automated radar badge alerts the admin with high-visibility warning if a counselor's STR or SIPP expires in < 60 days.
- [x] Route `/admin/counselors/[id]` displays all 21 data fields (contact, domicile, education, experience, HIMPSI membership, bio, and hourly rates).
- [x] Displays secure pre-signed viewing links for all 8 Cloudflare R2 attachments (Profile Photo, KTP, CV, S1 Diploma, Professional Diploma, STR, SIPP, Supporting Certificates).
- [x] Actions to approve ("Verifikasi"), reject ("Tolak"), or toggle active status persist immediately to the database.
- [x] Vitest test verifies STR/SIPP expiry calculation and status update actions.
