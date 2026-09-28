import { z } from "zod";
import type { SafetyLockResult } from "@/lib/zoom/safety-lock";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const zoomAccountInputSchema = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi"),
  email: z.string().trim().email("Format email tidak valid"),
  accountId: z.string().trim().min(1, "Account ID wajib diisi"),
  clientId: z.string().trim().min(1, "Client ID wajib diisi"),
  clientSecret: z.string().trim().min(1, "Client Secret wajib diisi"),
});

export type ZoomAccountInput = z.infer<typeof zoomAccountInputSchema>;

export const zoomAccountUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  accountId: z.string().trim().min(1).optional(),
  clientId: z.string().trim().min(1).optional(),
  clientSecret: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type ZoomAccountUpdateInput = z.infer<typeof zoomAccountUpdateSchema>;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  isLocked?: boolean;
  upcomingSessionCount?: number;
}

export interface ZoomAccountView {
  id: string;
  name: string;
  email: string;
  accountId: string;
  clientId: string;
  maskedClientSecret: string;
  decryptedSecret: string;
  isActive: boolean;
  createdAt: string;
  safetyLock: SafetyLockResult;
}
