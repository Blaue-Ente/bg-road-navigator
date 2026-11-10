import { RegisterForm } from "@/components/auth/RegisterForm";
import { enabledSocialProviders } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <RegisterForm providers={enabledSocialProviders()} />;
}
