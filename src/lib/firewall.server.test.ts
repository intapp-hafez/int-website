import { describe, it, expect } from "vitest";
import { isBlocked, recordHit, isStaticAsset } from "./firewall.server";

describe("firewall", () => {
  it("blocks a listed IP and allows others", () => {
    expect(isBlocked("198.51.100.42", ["198.51.100.42"])).toBe(true);
    expect(isBlocked("198.51.100.43", ["198.51.100.42"])).toBe(false);
  });
  it("stops a visitor after the per-minute limit", () => {
    const store = new Map<string, number[]>();
    for (let i = 0; i < 120; i++) expect(recordHit("1.1.1.1", 120, 1000, store)).toBe(true);
    expect(recordHit("1.1.1.1", 120, 1000, store)).toBe(false);
    expect(recordHit("1.1.1.1", 120, 62_000, store)).toBe(true);
  });
  it("does not count static files", () => {
    expect(isStaticAsset("/assets/app.js")).toBe(true);
    expect(isStaticAsset("/products")).toBe(false);
  });
});
