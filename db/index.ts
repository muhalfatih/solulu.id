import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/**
 * Database client configured for Supabase PostgreSQL via Supavisor Transaction Pooler.
 * Supavisor on port 6543 uses transaction mode (pgbouncer=true), requiring `prepare: false`
 * to avoid unsupported prepared statement errors in serverless environments.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test") {
  throw new Error(
    "FATAL: DATABASE_URL is not set. A real PostgreSQL/Supabase database connection is strictly required according to environment config."
  );
}

const safeConnectionString = connectionString || "postgres://localhost:5432/solulu_test";

const isLocal =
  safeConnectionString.includes("localhost") ||
  safeConnectionString.includes("127.0.0.1");

// Maintain a singleton connection client across hot reloads in development
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(safeConnectionString, {
    prepare: false, // Mandatory for Supavisor Transaction Pooler (port 6543)
    ssl: isLocal ? false : "require", // SSL is strictly required for Supabase Transaction Pooler
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
export type DbClient = typeof db;
