import { authClient } from "@/lib/auth-client";
import { useUserStore } from "@/lib/stores/user.store";

/** Sign out through Better Auth and clear the client session cache. */
export async function signOut(): Promise<void> {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error("Better Auth signOut failed:", error);
  }

  useUserStore.getState().clearUser();
}
