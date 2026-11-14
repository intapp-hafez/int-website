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

  it("filters out empty pillars so blank pills do not render on the frontend", () => {
    const pillars = [
      { en: "", ar: "" },
      { en: "Direct Oversight", ar: "إشراف تنفيذي مباشر" },
      { en: "Tier-1 OEM Alliances", ar: "شراكات OEM كبرى" },
    ];
    const validEn = pillars.filter((p) => Boolean(p.en.trim()));
    expect(validEn).toHaveLength(2);
    expect(validEn.map((p) => p.en)).toEqual(["Direct Oversight", "Tier-1 OEM Alliances"]);

    const validAr = pillars.filter((p) => Boolean(p.ar.trim()));
    expect(validAr).toHaveLength(2);
    expect(validAr.map((p) => p.ar)).toEqual(["إشراف تنفيذي مباشر", "شراكات OEM كبرى"]);
  });
});