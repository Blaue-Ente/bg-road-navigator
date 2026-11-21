import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/server/security-headers";

describe("security headers", () => {
  it("lets the map worker fetch TomTom traffic-flow tiles", () => {
    const csp = SECURITY_HEADERS.find((h) => h.key === "Content-Security-Policy")!.value;
    const connect = csp.split("; ").find((d) => d.startsWith("connect-src"))!;
    expect(connect).toContain("https://api.tomtom.com");
  });
});
