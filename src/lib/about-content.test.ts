import { describe, it, expect } from "vitest";
import { pickBi, withCacheBust, defaultAboutContent, DEFAULT_ABOUT_STATS } from "./about-store";
import { aboutPlainText } from "@/components/site/AboutRichText";

describe("About content resolution and dynamic helpers", () => {
  it("resolves bilingual fields with graceful fallbacks", () => {
    expect(pickBi({ en: "Vision", ar: "الرؤية" }, "en")).toBe("Vision");
    expect(pickBi({ en: "Vision", ar: "الرؤية" }, "ar")).toBe("الرؤية");
    expect(pickBi({ en: "Vision", ar: "" }, "ar")).toBe("Vision");
    expect(pickBi({ en: "", ar: "الرؤية" }, "en")).toBe("الرؤية");
    expect(pickBi(null, "en", "Fallback")).toBe("Fallback");
    expect(pickBi(undefined, "ar", "Fallback")).toBe("Fallback");
  });

  it("extracts plain text from rich HTML safely without wrappers or tags", () => {
    expect(aboutPlainText("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
    expect(aboutPlainText("<div><h3>Leadership</h3><p>Overview paragraph.</p></div>")).toBe("Leadership Overview paragraph.");
    expect(aboutPlainText("<script>alert('xss')</script>Safe Text")).toBe("Safe Text");
  });

  it("attaches cache-busting timestamps to media assets", () => {
    const url = "https://example.com/team/karim.jpg";
    const timestamp = "2026-11-10T12:00:00Z";
    const busted = withCacheBust(url, timestamp);
    expect(busted).toContain("?v=");
    expect(withCacheBust(null, timestamp)).toBeNull();
  });

  it("includes all required dynamic sections in defaultAboutContent", () => {
    expect(defaultAboutContent.eyebrow).toBeDefined();
    expect(defaultAboutContent.title).toBeDefined();
    expect(defaultAboutContent.sub).toBeDefined();
    expect(defaultAboutContent.overviewT).toBeDefined();
    expect(defaultAboutContent.overviewD).toBeDefined();
    expect(defaultAboutContent.visionT).toBeDefined();
    expect(defaultAboutContent.missionT).toBeDefined();
    expect(defaultAboutContent.valuesT).toBeDefined();
    expect(defaultAboutContent.values.length).toBeGreaterThanOrEqual(3);
    expect(defaultAboutContent.team.length).toBeGreaterThan(0);
    expect(defaultAboutContent.stats).toEqual(DEFAULT_ABOUT_STATS);
  });
});

