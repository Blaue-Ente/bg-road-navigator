"use client";

interface AccordionProps {
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ className, children }: AccordionProps) {
  return <div className={className}>{children}</div>;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ children, className }: AccordionItemProps) {
  return (
    <details
      className={`mb-2 rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] last:mb-0 ${className || ""}`}
    >
      {children}
    </details>
  );
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  return (
    <summary
      className={`cursor-pointer list-none px-4 py-3 text-sm font-medium text-[var(--waze-text)] hover:text-[var(--waze-accent)] ${className || ""}`}
    >
      {children}
    </summary>
  );
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  return (
    <div
      className={`border-t border-[var(--waze-border)] px-4 py-3 text-sm text-[var(--waze-text-secondary)] ${className || ""}`}
    >
      {children}
    </div>
  );
}
