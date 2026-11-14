import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_MIGRATION_FILE,
  buildConfigStatus,
  getServiceStatusCatalog,
} from "@/lib/config/service-status";

describe("service status catalog", () => {
  it("lists expected services and the account migration", () => {
    const catalog = getServiceStatusCatalog();
    expect(catalog.map((s) => s.id)).toContain("postgres");
    expect(catalog.map((s) => s.id)).toContain("nvidia");
    expect(ACCOUNT_MIGRATION_FILE).toBe(
      "drizzle/0001_better_auth_and_community.sql"
    );
  });

  it("never includes secret values in the status payload", () => {
    const status = buildConfigStatus();
    const blob = JSON.stringify(status);
    expect(blob).not.toMatch(/eyJ/); // typical JWT prefix
    expect(status.ok).toBe(true);
    expect(status.summary.ready_for_keys_only).toBe(true);
    for (const service of status.services) {
      expect(typeof service.configured).toBe("boolean");
      expect(service.env_vars.length).toBeGreaterThan(0);
    }
  });

  it("marks OCI geo ready only when both vars are set, and never echoes the key", () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
    vi.stubEnv("OCI_GEO_API_KEY", "super-secret-key-value");
    vi.stubEnv("CRON_SECRET", "cron-secret-value");
    const ready = buildConfigStatus();
    expect(JSON.stringify(ready)).not.toContain("super-secret-key-value");
    expect(JSON.stringify(ready)).not.toContain("cron-secret-value");
    expect(
      ready.services.find((service) => service.id === "cron_warm")?.configured
    ).toBe(true);
    expect(
      ready.services.find((service) => service.id === "oci_geo")?.configured
    ).toBe(true);

    vi.stubEnv("OCI_GEO_API_KEY", "");
    const partial = buildConfigStatus();
    expect(
      partial.services.find((service) => service.id === "oci_geo")?.configured
    ).toBe(false);
    vi.unstubAllEnvs();
  });
});
