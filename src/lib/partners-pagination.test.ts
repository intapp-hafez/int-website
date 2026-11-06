import { describe, expect, it } from "vitest";
import { paginatePartners } from "./partners-pagination";

describe("Partners pagination", () => {
  it("shows 20 partners per page and places the 21st on the next page", () => {
    const partners = Array.from({ length: 21 }, (_, i) => i + 1);
    expect(paginatePartners(partners, 1).items).toEqual(partners.slice(0, 20));
    expect(paginatePartners(partners, 1).totalPages).toBe(2);
    expect(paginatePartners(partners, 2).items).toEqual([21]);
    expect(paginatePartners(partners.slice(0, 20), 1).totalPages).toBe(1);
  });
  it("clamps the page after filtering or deleting entries", () => {
    expect(paginatePartners([1, 2], 3)).toEqual({ page: 1, totalPages: 1, items: [1, 2] });
    expect(paginatePartners([], 2)).toEqual({ page: 1, totalPages: 1, items: [] });
  });
});