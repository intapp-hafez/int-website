import { describe, expect, it } from "vitest";
import { bearerToken, isSameOriginRequest } from "./request-security";

describe("API and token request protection", () => {
  it("requires a bearer JWT and rejects missing or malformed credentials", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken("Bearer invalid")).toBeNull();
    expect(bearerToken("Bearer a.b.c extra")).toBeNull();
    expect(bearerToken("Bearer a.b.c")).toBe("a.b.c");
  });
  it("rejects unsigned tokens", () => {
    expect(bearerToken("Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJmYWtlIn0.")).toBeNull();
  });
  it("rejects cross-origin browser actions but allows same-origin requests", () => {
    expect(isSameOriginRequest(new Request("https://app.example/action", { headers: { origin: "https://evil.example" } }))).toBe(false);
    expect(isSameOriginRequest(new Request("https://app.example/action", { headers: { origin: "https://app.example" } }))).toBe(true);
    expect(isSameOriginRequest(new Request("https://app.example/action", { headers: { "sec-fetch-site": "cross-site" } }))).toBe(false);
    expect(isSameOriginRequest(new Request("https://app.example/action"))).toBe(true);
  });
});