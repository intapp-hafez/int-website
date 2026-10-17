import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { rejectedCredential } from "./identity-security-checks";

describe("identity security evidence", () => {
  it("only treats explicit auth denials as successful token rejection", () => {
    expect(rejectedCredential({ status: 401 })).toBe(true);
    expect(rejectedCredential({ status: 403 })).toBe(true);
    expect(rejectedCredential(null)).toBe(false);
  });
  it("does not mark outages or network failures as passing", () => {
    expect(rejectedCredential({ status: 500 })).toBeNull();
    expect(rejectedCredential({ status: 429 })).toBeNull();
    expect(rejectedCredential({})).toBeNull();
  });
});