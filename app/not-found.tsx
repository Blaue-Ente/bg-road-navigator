import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--waze-bg)] p-6 text-center text-[var(--waze-text)]">
      <h1 className="text-xl font-semibold">Страницата не е намерена</h1>
      <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
        Проверете адреса или се върнете към картата.
      </p>
      <Link href="/" className="waze-btn-primary mt-4 px-5 py-2.5 text-sm">
        Към картата
      </Link>
    </div>
  );
}
