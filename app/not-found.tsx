import Link from "next/link";
import { serverMessages } from "@/lib/i18n/server-catalog";

export default async function NotFound() {
  const m = await serverMessages();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--waze-bg)] p-6 text-center text-[var(--waze-text)]">
      <h1 className="text-xl font-semibold">{m.misc.msg859ea41011}</h1>
      <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
        {m.misc.msg1fbd103aa0}
      </p>
      <Link href="/" className="waze-btn-primary mt-4 px-5 py-2.5 text-sm">
        {m.misc.msg201fbadf60}
      </Link>
    </div>
  );
}