import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/**
 * Database client configured for Supabase PostgreSQL via Supavisor Transaction Pooler.
 * Supavisor on port 6543 uses transaction mode (pgbouncer=true), requiring `prepare: false`
 * to avoid unsupported prepared statement errors in serverless environments.
 */
const connectionString = process.env.DATABASE_URL || "";

// Maintain a singleton connection client across hot reloads in development
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false, // Mandatory for Supavisor Transaction Pooler (port 6543)
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
export type DbClient = typeof db;
