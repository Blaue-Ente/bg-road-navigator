export type SocialProviderId = "google" | "apple";

export interface AuthEnv {
  [key: string]: string | undefined;
  BETTER_AUTH_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  APPLE_APP_BUNDLE_IDENTIFIER?: string;
}

export interface SocialProviderConfig {
  google?: { clientId: string; clientSecret: string };
  apple?: {
    clientId: string;
    clientSecret: string;
    appBundleIdentifier?: string;
  };
}

/** Same email from Google or Apple joins the email/password user. */
export const accountLinking = {
  enabled: true,
  trustedProviders: ["google", "apple"] as Array<"google" | "apple">,
  requireLocalEmailVerified: false,
};

function trimmed(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function httpsHost(host: string | undefined): string | undefined {
  const value = trimmed(host);
  return value ? `https://${value}` : undefined;
}

/**
 * Preview deployments must not inherit the production auth URL.
 * An explicit BETTER_AUTH_URL still wins.
 */
export function resolveAuthBaseUrl(env: AuthEnv = process.env): string | undefined {
  const explicit = trimmed(env.BETTER_AUTH_URL);
  if (explicit) return explicit;
  if (env.VERCEL_ENV === "preview") {
    return httpsHost(env.VERCEL_URL);
  }
  return (
    httpsHost(env.VERCEL_PROJECT_PRODUCTION_URL) ?? httpsHost(env.VERCEL_URL)
  );
}

export function resolveTrustedOrigins(env: AuthEnv = process.env): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "https://appleid.apple.com",
  ]);
  const base = resolveAuthBaseUrl(env);
  if (base) origins.add(base);
  if (env.VERCEL_ENV === "preview") {
    const preview = httpsHost(env.VERCEL_URL);
    if (preview) origins.add(preview);
  }
  const production = httpsHost(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (production) origins.add(production);
  const appUrl = trimmed(env.NEXT_PUBLIC_APP_URL);
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // Ignore a malformed public URL. Auth still has the other origins.
    }
  }
  return [...origins];
}

/** A provider is on only when both its client id and secret are set. */
export function buildSocialProviders(env: AuthEnv = process.env): SocialProviderConfig {
  const providers: SocialProviderConfig = {};
  const googleId = trimmed(env.GOOGLE_CLIENT_ID);
  const googleSecret = trimmed(env.GOOGLE_CLIENT_SECRET);
  if (googleId && googleSecret) {
    providers.google = { clientId: googleId, clientSecret: googleSecret };
  }
  const appleId = trimmed(env.APPLE_CLIENT_ID);
  const appleSecret = trimmed(env.APPLE_CLIENT_SECRET);
  if (appleId && appleSecret) {
    const bundle = trimmed(env.APPLE_APP_BUNDLE_IDENTIFIER);
    providers.apple = {
      clientId: appleId,
      clientSecret: appleSecret,
      ...(bundle ? { appBundleIdentifier: bundle } : {}),
    };
  }
  return providers;
}

export function enabledSocialProviders(
  env: AuthEnv = process.env
): SocialProviderId[] {
  const configured = buildSocialProviders(env);
  return (["google", "apple"] as const).filter((id) => configured[id]);
}
