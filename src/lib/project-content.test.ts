import { describe, it, expect } from "vitest";
import { formatProjectContent, decodeHtmlEntities, stripHtmlTags } from "./project-content";

describe("decodeHtmlEntities", () => {
  it("decodes &amp;, &lt;, &gt;, &quot;, &#39;", () => {
    expect(decodeHtmlEntities("A &amp; B &lt;C&gt; &#39;test&#39; &quot;quote&quot;")).toBe(
      "A & B <C> 'test' \"quote\""
    );
  });
});

describe("stripHtmlTags", () => {
  it("strips tags and cleans entities and whitespace", () => {
    expect(stripHtmlTags("<p>Hello <span>&amp;</span> <strong>World</strong></p>")).toBe(
      "Hello & World"
    );
  });
});

describe("formatProjectContent", () => {
  it("correctly parses rich HTML project description (like Gouna Hotel project 25)", () => {
    const rawHtml = `<h3 data-pm-slice="1 3 []"><span>Project Overview</span></h3><p><span>Integrated Technics delivered a comprehensive low-current systems package for Gouna Hotel – Tawila Island Resort in the Red Sea Governorate. The project encompassed the supply and integration of a wide range of building management, security, communication, and guest room technology systems to support the resort's operational requirements and enhance the guest experience.<br><br></span></p><h3><span>Scope of Work</span></h3><ul data-spread="false"><li><p><span>Building Management System (BMS)</span></p></li><li><p><span>Fire Alarm System</span></p></li><li><p><span>CCTV System</span></p></li><li><p><span>Central Monitoring &amp; Control Room</span></p></li></ul>`;

    const result = formatProjectContent(rawHtml);
    expect(result.isHtml).toBe(true);
    expect(result.overview).toContain("Integrated Technics delivered a comprehensive low-current systems package");
    expect(result.overview).toContain("enhance the guest experience.");
    expect(result.overview).not.toContain("Scope of Work");
    expect(result.overview).not.toContain("Building Management System");
    expect(result.scopeBullets).toEqual([
      "Building Management System (BMS)",
      "Fire Alarm System",
      "CCTV System",
      "Central Monitoring & Control Room",
    ]);
  });

  it("handles plain bullet-separated legacy descriptions", () => {
    const rawPlain = "Fire Alarm Systems • Access Control System • CCTV System • Car Parking Management";
    const result = formatProjectContent(rawPlain);
    expect(result.isHtml).toBe(false);
    expect(result.scopeBullets).toEqual([
      "Fire Alarm Systems",
      "Access Control System",
      "CCTV System",
      "Car Parking Management",
    ]);
    expect(result.overview).toBe("");
  });

  it("handles empty or null inputs safely", () => {
    expect(formatProjectContent("")).toEqual({ overview: "", scopeBullets: [], isHtml: false });
    expect(formatProjectContent(null)).toEqual({ overview: "", scopeBullets: [], isHtml: false });
    expect(formatProjectContent(undefined)).toEqual({ overview: "", scopeBullets: [], isHtml: false });
  });
});

