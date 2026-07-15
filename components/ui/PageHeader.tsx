interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--waze-text)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
