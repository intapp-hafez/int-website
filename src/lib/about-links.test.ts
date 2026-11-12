import { describe, expect, it } from "vitest";
import { safeAboutLink } from "./about-store";

describe("editable founder links", () => {
  it("allows a same-site consultation path and a LinkedIn web address", () => {
    expect(safeAboutLink("/contact")).toBe("/contact");
    expect(safeAboutLink("https://www.linkedin.com/in/founder")).toBe("https://www.linkedin.com/in/founder");
  });
  it("rejects executable links and ambiguous external paths", () => {
    expect(safeAboutLink("javascript:alert(1)")).toBeUndefined();
    expect(safeAboutLink("//evil.example")).toBeUndefined();
    expect(safeAboutLink("/\\evil.example")).toBeUndefined();
  });
  it("hides actions when their destination is explicitly cleared", () => {
    expect(safeAboutLink("")).toBeUndefined();
  });
});