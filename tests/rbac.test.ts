import { describe, it, expect } from "vitest";
import { evaluateRbac, type UserWithRoles } from "../lib/supabase/rbac";

describe("RBAC Evaluation Engine", () => {
  const adminUser: UserWithRoles = {
    id: "user-admin-1",
    app_metadata: { role: "admin" },
  };

  const counselorUser: UserWithRoles = {
    id: "user-counselor-1",
    app_metadata: { role: "counselor" },
  };

  const regularUser: UserWithRoles = {
    id: "user-regular-1",
    app_metadata: { role: "authenticated" },
  };

  describe("Public Routes", () => {
    it("allows unauthenticated access to public routes", () => {
      expect(evaluateRbac(null, "/")).toEqual({ type: "allow" });
      expect(evaluateRbac(null, "/login")).toEqual({ type: "allow" });
      expect(evaluateRbac(null, "/session/token-123")).toEqual({ type: "allow" });
      expect(evaluateRbac(null, "/cek-sesi")).toEqual({ type: "allow" });
    });
  });

  describe("Admin Routes (/admin/*)", () => {
    it("redirects unauthenticated users to /login with redirect param", () => {
      const decision = evaluateRbac(null, "/admin/dashboard");
      expect(decision).toEqual({
        type: "redirect",
        destination: "/login?redirect=%2Fadmin%2Fdashboard",
      });
    });

    it("allows admin users to access /admin routes", () => {
      const decision = evaluateRbac(adminUser, "/admin/dashboard");
      expect(decision).toEqual({ type: "allow" });

      const subRouteDecision = evaluateRbac(adminUser, "/admin/zoom-settings");
      expect(subRouteDecision).toEqual({ type: "allow" });
    });

    it("redirects counselor users trying to access /admin to /counselor/dashboard", () => {
      const decision = evaluateRbac(counselorUser, "/admin/dashboard");
      expect(decision).toEqual({
        type: "redirect",
        destination: "/counselor/dashboard",
      });
    });

    it("redirects other roles trying to access /admin to /unauthorized", () => {
      const decision = evaluateRbac(regularUser, "/admin/dashboard");
      expect(decision).toEqual({
        type: "redirect",
        destination: "/unauthorized",
      });
    });
  });

  describe("Counselor Routes (/counselor/*)", () => {
    it("redirects unauthenticated users to /login with redirect param", () => {
      const decision = evaluateRbac(null, "/counselor/dashboard");
      expect(decision).toEqual({
        type: "redirect",
        destination: "/login?redirect=%2Fcounselor%2Fdashboard",
      });
    });

    it("allows counselor users to access /counselor routes", () => {
      const decision = evaluateRbac(counselorUser, "/counselor/dashboard");
      expect(decision).toEqual({ type: "allow" });

      const schedulesDecision = evaluateRbac(counselorUser, "/counselor/schedules");
      expect(schedulesDecision).toEqual({ type: "allow" });
    });

    it("redirects admin users trying to access /counselor to /admin/dashboard", () => {
      const decision = evaluateRbac(adminUser, "/counselor/dashboard");
      expect(decision).toEqual({
        type: "redirect",
        destination: "/admin/dashboard",
      });
    });

    it("redirects other roles trying to access /counselor to /unauthorized", () => {
      const decision = evaluateRbac(regularUser, "/counselor/dashboard");
      expect(decision).toEqual({
        type: "redirect",
        destination: "/unauthorized",
      });
    });
  });
});
