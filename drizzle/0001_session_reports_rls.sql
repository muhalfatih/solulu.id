-- Row Level Security (RLS) Policies for Clinical Session Reports
-- Acceptance criterion: counselor can only read/write own reports; admin full access

ALTER TABLE "session_reports" ENABLE ROW LEVEL SECURITY;

-- 1. Counselor can view own session reports
CREATE POLICY "counselor_select_own_session_reports"
ON "session_reports"
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT "user_id" FROM "counselors" WHERE "id" = "session_reports"."counselor_id"
  )
);

-- 2. Counselor can insert own session reports
CREATE POLICY "counselor_insert_own_session_reports"
ON "session_reports"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT "user_id" FROM "counselors" WHERE "id" = "session_reports"."counselor_id"
  )
);

-- 3. Counselor can update own session reports
CREATE POLICY "counselor_update_own_session_reports"
ON "session_reports"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT "user_id" FROM "counselors" WHERE "id" = "session_reports"."counselor_id"
  )
);

-- 4. Admin has full access to session reports
CREATE POLICY "admin_all_session_reports"
ON "session_reports"
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
