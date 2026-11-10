import { describe, expect, it } from "vitest";
import {
  accountLinking,
  buildSocialProviders,
  enabledSocialProviders,
  resolveAuthBaseUrl,
  resolveTrustedOrigins,
} from "@/lib/auth/config";

const preview = {
  VERCEL_ENV: "preview",
  VERCEL_URL: "bg-road-navigator-git-preview.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL: "bg-road-navigator.vercel.app",
};

describe("resolveAuthBaseUrl", () => {
  it("uses the preview host when BETTER_AUTH_URL is unset", () => {
    expect(resolveAuthBaseUrl(preview)).toBe(
      "https://bg-road-navigator-git-preview.vercel.app"
    );
  });

  it("keeps an explicit BETTER_AUTH_URL on preview", () => {
    expect(
      resolveAuthBaseUrl({
        ...preview,
        BETTER_AUTH_URL: "https://auth.example.com",
      })
    ).toBe("https://auth.example.com");
  });

  it("uses the production host outside preview", () => {
    expect(
      resolveAuthBaseUrl({
        VERCEL_ENV: "production",
        VERCEL_URL: "bg-road-navigator-abc.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "bg-road-navigator.vercel.app",
      })
    ).toBe("https://bg-road-navigator.vercel.app");
  });
});

describe("resolveTrustedOrigins", () => {
  it("accepts the current preview origin and Apple", () => {
    const origins = resolveTrustedOrigins({
      ...preview,
      BETTER_AUTH_URL: "https://bg-road-navigator.vercel.app",
    });
    expect(origins).toContain(
      "https://bg-road-navigator-git-preview.vercel.app"
    );
    expect(origins).toContain("https://appleid.apple.com");
    expect(origins).toContain("http://localhost:3000");
  });
});

describe("social provider gating", () => {
  it("hides a provider until both of its keys are present", () => {
    expect(enabledSocialProviders({})).toEqual([]);
    expect(
      enabledSocialProviders({ GOOGLE_CLIENT_ID: "google-id" })
    ).toEqual([]);
    expect(
      enabledSocialProviders({
        GOOGLE_CLIENT_ID: " google-id ",
        GOOGLE_CLIENT_SECRET: "google-secret",
        APPLE_CLIENT_ID: "apple-id",
      })
    ).toEqual(["google"]);
  });

  it("enables Apple only with id and secret and keeps the bundle id optional", () => {
    expect(
      buildSocialProviders({
        APPLE_CLIENT_ID: "app.bg.web",
        APPLE_CLIENT_SECRET: "jwt",
        APPLE_APP_BUNDLE_IDENTIFIER: " app.bg ",
      }).apple
    ).toEqual({
      clientId: "app.bg.web",
      clientSecret: "jwt",
      appBundleIdentifier: "app.bg",
    });
    expect(
      buildSocialProviders({
        APPLE_CLIENT_ID: "app.bg.web",
        APPLE_CLIENT_SECRET: "jwt",
      }).apple
    ).toEqual({
      clientId: "app.bg.web",
      clientSecret: "jwt",
    });
  });

  it("links Google and Apple to an existing email/password user", () => {
    expect(accountLinking.enabled).toBe(true);
    expect(accountLinking.trustedProviders).toEqual(["google", "apple"]);
    expect(accountLinking.requireLocalEmailVerified).toBe(false);
  });
});
