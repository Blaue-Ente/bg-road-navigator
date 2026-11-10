import { betterAuth } from "better-auth";
import { Pool } from "pg";
import {
  accountLinking,
  buildSocialProviders,
  resolveAuthBaseUrl,
  resolveTrustedOrigins,
} from "@/lib/auth/config";
import { ensureProfile } from "@/lib/db/profiles";

const socialProviders = buildSocialProviders();

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: resolveAuthBaseUrl(),
  trustedOrigins: resolveTrustedOrigins(),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  account: { accountLinking },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          try {
            await ensureProfile({
              userId: created.id,
              displayName: created.name,
              email: created.email,
              avatarUrl: created.image,
            });
          } catch (error) {
            console.error("Profile seed failed:", error);
          }
        },
      },
    },
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
});
