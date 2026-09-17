import { describe, it, expect } from "vitest";
import * as schema from "../db/schema";
import fs from "fs";
import path from "path";

describe("Drizzle ORM Schema & Migrations", () => {
  it("defines all 11 required tables", () => {
    expect(schema.zoomAccounts).toBeDefined();
    expect(schema.platformPricing).toBeDefined();
    expect(schema.vouchers).toBeDefined();
    expect(schema.screenings).toBeDefined();
    expect(schema.counselorApplications).toBeDefined();
    expect(schema.counselors).toBeDefined();
    expect(schema.schedules).toBeDefined();
    expect(schema.bookings).toBeDefined();
    expect(schema.transactions).toBeDefined();
    expect(schema.sessionReports).toBeDefined();
    expect(schema.publicDocumentations).toBeDefined();
  });

  it("defines all 6 required PostgreSQL enums", () => {
    expect(schema.roleEnum).toBeDefined();
    expect(schema.counselorTypeEnum).toBeDefined();
    expect(schema.scheduleStatusEnum).toBeDefined();
    expect(schema.bookingStatusEnum).toBeDefined();
    expect(schema.transactionStatusEnum).toBeDefined();
    expect(schema.applicationStatusEnum).toBeDefined();

    expect(schema.roleEnum.enumValues).toEqual(["admin", "counselor"]);
    expect(schema.counselorTypeEnum.enumValues).toEqual(["peer", "psychologist"]);
    expect(schema.scheduleStatusEnum.enumValues).toEqual([
      "available",
      "reserved",
      "booked",
      "cancelled",
    ]);
    expect(schema.bookingStatusEnum.enumValues).toEqual([
      "pending_payment",
      "confirmed",
      "completed",
      "cancelled",
    ]);
    expect(schema.transactionStatusEnum.enumValues).toEqual([
      "PENDING",
      "PAID",
      "EXPIRED",
      "FAILED",
    ]);
    expect(schema.applicationStatusEnum.enumValues).toEqual([
      "pending",
      "approved",
      "rejected",
    ]);
  });

  it("includes all spec overrides on counselorApplications, transactions, and schedules", () => {
    // counselorApplications mandatory overrides
    expect(schema.counselorApplications.ktpR2Key).toBeDefined();
    expect(schema.counselorApplications.diplomaR2Key).toBeDefined();

    // transactions voucherId override
    expect(schema.transactions.voucherId).toBeDefined();

    // schedules 90-min model & 17-min reservation hold
    expect(schema.schedules.endTime).toBeDefined();
    expect(schema.schedules.reservedUntil).toBeDefined();
  });

  it("has generated migration files in drizzle/ directory", () => {
    const drizzleDir = path.resolve(__dirname, "../drizzle");
    expect(fs.existsSync(drizzleDir)).toBe(true);

    const files = fs.readdirSync(drizzleDir);
    const sqlMigrations = files.filter((f) => f.endsWith(".sql"));
    expect(sqlMigrations.length).toBeGreaterThanOrEqual(2);

    // Initial schema migration
    const hasInitialMigration = sqlMigrations.some((f) =>
      f.includes("0000") || f.includes("square_morgan_stark")
    );
    expect(hasInitialMigration).toBe(true);

    // RLS policy migration
    const hasRlsMigration = sqlMigrations.some((f) =>
      f.includes("0001") || f.includes("session_reports_rls")
    );
    expect(hasRlsMigration).toBe(true);
  });
});
