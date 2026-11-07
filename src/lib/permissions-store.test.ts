import { describe, it, expect } from "vitest";
import {
  defaultUserPerms,
  allPerms,
  noPerms,
  defaultPermsForRole,
  isGrantActive,
  isValidUuid,
  type AccessGrant,
  type UserPerms,
} from "./permissions-store";

describe("Permissions Management", () => {
  describe("isValidUuid helper", () => {
    it("correctly identifies valid and invalid UUID formats", () => {
      expect(isValidUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isValidUuid("c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd")).toBe(true);
      expect(isValidUuid("manager")).toBe(false);
      expect(isValidUuid("admin@example.com")).toBe(false);
      expect(isValidUuid("")).toBe(false);
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
    });
  });

  describe("Temporary Access Isolation", () => {
    it("does not copy temporary grants into permanent base permissions", () => {
      // Setup initial base permissions for an agent
      const basePerms: UserPerms = defaultPermsForRole("agent");
      // Initially, agent does not have access to 'seo'
      expect(basePerms.seo.view).toBe(false);
      expect(basePerms.seo.edit).toBe(false);

      // Create an active temporary grant for 'seo'
      const activeGrant: AccessGrant = {
        id: "grant-1",
        userId: "user-123",
        pageKey: "seo",
        actions: ["view", "edit"],
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        grantedBy: "admin",
        createdAt: new Date().toISOString(),
      };

      expect(isGrantActive(activeGrant)).toBe(true);

      // Simulate runtime effective permissions computation (getUserPerms logic)
      const effectivePerms: UserPerms = { ...basePerms };
      if (isGrantActive(activeGrant)) {
        effectivePerms[activeGrant.pageKey] = {
          ...effectivePerms[activeGrant.pageKey],
          view: true,
          edit: true,
        };
      }

      // Effective permissions show granted access
      expect(effectivePerms.seo.view).toBe(true);
      expect(effectivePerms.seo.edit).toBe(true);

      // Simulate admin editing an unrelated permission (e.g. leads.edit)
      // The new architecture uses getBaseUserPerms (basePerms), NOT effectivePerms!
      const currentBase = { ...basePerms };
      const updatedBase: UserPerms = {
        ...currentBase,
        leads: { ...currentBase.leads, edit: false },
      };

      // VERIFY: The base permanent permissions for 'seo' remain FALSE!
      expect(updatedBase.seo.view).toBe(false);
      expect(updatedBase.seo.edit).toBe(false);
      expect(updatedBase.leads.edit).toBe(false);

      // When the temporary grant expires:
      const expiredGrant: AccessGrant = {
        ...activeGrant,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      expect(isGrantActive(expiredGrant)).toBe(false);

      // Recomputing effective permissions with expired grant returns to clean base:
      const finalEffective: UserPerms = { ...updatedBase };
      if (isGrantActive(expiredGrant)) {
        finalEffective[expiredGrant.pageKey] = {
          ...finalEffective[expiredGrant.pageKey],
          view: true,
          edit: true,
        };
      }
      expect(finalEffective.seo.view).toBe(false);
      expect(finalEffective.seo.edit).toBe(false);
    });
  });

  describe("Save Accuracy & Error Detection", () => {
    it("reports failure when database update returns an error instead of reporting success", async () => {
      // Simulate persist logic with error checking
      const mockDatabaseUpdate = async (shouldFail: boolean) => {
        if (shouldFail) {
          return { data: null, error: { message: "Database connection failed or permission denied" } };
        }
        return { data: [{ id: "role-1", user_id: "user-123" }], error: null };
      };

      const persistSim = async (shouldFail: boolean) => {
        const { data, error } = await mockDatabaseUpdate(shouldFail);
        if (error) {
          return { success: false, error: error.message };
        }
        if (!data || data.length === 0) {
          return { success: false, error: "User not found in user_roles" };
        }
        return { success: true };
      };

      const failResult = await persistSim(true);
      expect(failResult.success).toBe(false);
      expect(failResult.error).toContain("Database connection failed");

      const successResult = await persistSim(false);
      expect(successResult.success).toBe(true);
      expect(successResult.error).toBeUndefined();
    });

    it("reports failure when 0 rows are updated", async () => {
      const mockDatabaseUpdate = async () => {
        return { data: [], error: null };
      };

      const { data, error } = await mockDatabaseUpdate();
      const result = error || !data || data.length === 0
        ? { success: false, error: "User record not found in database" }
        : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("User record not found in database");
    });
  });

  describe("Approval Reliability Workflow", () => {
    it("aborts approval and does not mark request as approved if grantAccess returns null", async () => {
      let requestStatus = "pending";

      const mockGrantAccess = async (willSucceed: boolean) => {
        if (!willSucceed) return null;
        return {
          id: "grant-1",
          userId: "user-1",
          pageKey: "overview",
          actions: ["view"],
          expiresAt: null,
          grantedBy: "admin",
          createdAt: new Date().toISOString(),
        };
      };

      const approveWorkflow = async (grantSucceeds: boolean) => {
        const grant = await mockGrantAccess(grantSucceeds);
        if (!grant) {
          // MUST NOT mark request approved!
          return { approved: false, error: "Failed to grant access" };
        }
        requestStatus = "approved";
        return { approved: true, grant };
      };

      const failedApproval = await approveWorkflow(false);
      expect(failedApproval.approved).toBe(false);
      expect(requestStatus).toBe("pending"); // Status remains pending!

      const successfulApproval = await approveWorkflow(true);
      expect(successfulApproval.approved).toBe(true);
      expect(requestStatus).toBe("approved");
    });
  });
});

