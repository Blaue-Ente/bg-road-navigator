import { describe, expect, it } from "vitest";
import {
  SUPABASE_MIGRATION_FILES,
  buildConfigStatus,
  getServiceStatusCatalog,
} from "@/lib/config/service-status";

describe("service status catalog", () => {
  it("lists expected services and migrations", () => {
    const catalog = getServiceStatusCatalog();
    expect(catalog.map((s) => s.id)).toContain("supabase");
    expect(catalog.map((s) => s.id)).toContain("nvidia");
    expect(SUPABASE_MIGRATION_FILES[0]).toBe("001_initial_schema.sql");
    expect(SUPABASE_MIGRATION_FILES).toContain(
      "008_community_categories_comments.sql"
    );
    expect(SUPABASE_MIGRATION_FILES).not.toContain("003");
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
