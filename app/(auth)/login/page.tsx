import { LoginForm } from "@/components/auth/LoginForm";
import { enabledSocialProviders } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm providers={enabledSocialProviders()} />;
}
