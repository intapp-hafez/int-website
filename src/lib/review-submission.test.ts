import { describe, expect, it } from "vitest";
import { pendingReview } from "./review-submission";

const input = { author: " Visitor ", company: " Company ", rating: 4, text: " A real review. " };

describe("visitor review submissions", () => {
  it("always requires Admin approval even if a visitor supplies approved=true", () => {
    expect(pendingReview({ ...input, approved: true })).toEqual({ author: "Visitor", company: "Company", rating: 4, text: "A real review.", approved: false });
  });
  it("rejects empty names and reviews", () => {
    expect(() => pendingReview({ ...input, author: "  " })).toThrow();
    expect(() => pendingReview({ ...input, text: "  " })).toThrow();
  });
  it("accepts only whole ratings from one to five", () => {
    for (const rating of [0, 6, 2.5]) expect(() => pendingReview({ ...input, rating })).toThrow();
    expect(pendingReview({ ...input, rating: 1 }).rating).toBe(1);
    expect(pendingReview({ ...input, rating: 5 }).rating).toBe(5);
  });
  it("bounds all public text fields", () => {
    for (const [field, limit] of [["author", 100], ["company", 150], ["text", 2000]] as const) {
      expect(() => pendingReview({ ...input, [field]: "x".repeat(limit + 1) })).toThrow();
    }
  });
});