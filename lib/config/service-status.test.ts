import { describe, expect, it } from "vitest";
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
});
