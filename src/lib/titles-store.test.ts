import { describe, it, expect } from "vitest";
import { DEFAULT_TITLES, type TitleEntry } from "./titles-store";

describe("Titles Store & Default Configuration", () => {
  it("contains all essential page and section keys with bilingual translations", () => {
    const requiredKeys = [
      "home.hero",
      "home.wheel",
      "home.solutions",
      "home.services",
      "home.products",
      "home.projects",
      "home.industries",
      "home.partners",
      "home.why",
      "home.testimonials",
      "home.news",
      "home.cta",
      "page.about",
      "page.services",
      "page.solutions",
      "page.products",
      "page.projects",
      "page.industries",
      "page.partners",
      "page.careers",
      "page.news",
      "page.events",
      "page.training",
      "page.contact",
      "page.faqs",
    ];

    for (const key of requiredKeys) {
      const entry = DEFAULT_TITLES[key];
      expect(entry, `Key ${key} should exist in DEFAULT_TITLES`).toBeDefined();
      expect(entry.titleEn, `Key ${key} should have titleEn`).toBeTruthy();
      expect(entry.titleAr, `Key ${key} should have titleAr`).toBeTruthy();
      expect(entry.section, `Key ${key} should have a section name`).toBeTruthy();
      expect(entry.page, `Key ${key} should have a page identifier`).toBeTruthy();
    }
  });

  it("ensures all entries have valid non-empty titles", () => {
    for (const [key, entry] of Object.entries(DEFAULT_TITLES)) {
      expect(entry.key).toBe(key);
      expect(entry.titleEn.trim().length).toBeGreaterThan(0);
      expect(entry.titleAr.trim().length).toBeGreaterThan(0);
    }
  });

  it("preserves correct page category grouping", () => {
    expect(DEFAULT_TITLES["home.hero"].page).toBe("home");
    expect(DEFAULT_TITLES["page.services"].page).toBe("services");
    expect(DEFAULT_TITLES["page.projects"].page).toBe("projects");
    expect(DEFAULT_TITLES["global.footer"].page).toBe("global");
  });
});

