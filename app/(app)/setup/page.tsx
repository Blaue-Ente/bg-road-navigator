"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { ServicesStatusPanel } from "@/components/setup/ServicesStatusPanel";
import { UserServicesPanel } from "@/components/setup/UserServicesPanel";
import { useMemo } from "react";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";

export default function SetupPage() {
  const m = useMessages();
  const steps = useMemo(
    () => [
      {
        title: m.setupPage.msg2583aaa834,
        body: m.setupPage.msgb59eb38f69,
      },
      {
        title: m.setupPage.msgc21aaeb67a,
        body: m.setupPage.databaseUrlBettere609,
      },
      {
        title: m.setupPage.msg4f5691117d,
        body: m.setupPage.neonSqlEditor4f2c,
      },
      {
        title: m.setupPage.msg97eac21326,
        body: m.setupPage.googleApple63e8,
      },
      {
        title: m.setupPage.msg5280667df9,
        body: m.setupPage.msga056f1154b,
      },
      {
        title: m.setupPage.msg313003e804,
        body: m.setupPage.ai20cb,
      },
      {
        title: m.setupPage.msg2cb809dcb7,
        body: m.setupPage.msg7448f6dd4b,
      },
    ],
    [m]
  );
  const { enabled } = useOperatorMode();

  if (!enabled) {
    return (
      <div className="waze-page">
        <div className="mx-auto max-w-2xl space-y-4">
          <PageHeader
            title={m.nav.services}
            subtitle={m.setupPage.msg3735feec74}
          />
          <UserServicesPanel />
          <p className="text-center text-xs text-[var(--waze-text-muted)]">{m.setupPage.msgc8680e81d3}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title={m.nav.setup}
          subtitle={m.setupPage.msgfa46c58a10}
        />

        <WazeCard className="border-[var(--waze-accent)]/20 bg-[var(--waze-accent-muted)]">
          <p className="text-sm text-[var(--waze-text)]">
            {m.setupPage.msgc26e797ae9}
          </p>
        </WazeCard>

        <WazeCard>
          <h2 className="mb-3 text-sm font-semibold text-[var(--waze-text)]">{m.setupPage.msgac53c37992}</h2>
          <ul className="space-y-2 text-sm text-[var(--waze-text-secondary)]">
            <li>
              <strong className="text-[var(--waze-text)]">{m.setupPage.msg49f69233f5}</strong>{" "}
              {m.setupPage.neonb90f}
            </li>
            <li>
              <strong className="text-[var(--waze-text)]">{m.setupPage.msg1e2ed2f5fe}</strong>{" "}
              {m.setupPage.msg084e7e9ec7}
            </li>
            <li>
              <strong className="text-[var(--waze-text)]">{m.setupPage.msgf80880a220}</strong> AI{" "}
              {m.setupPage.msgfe71881e46}
            </li>
            <li>
              <strong className="text-[var(--waze-text)]">{m.setupPage.msg14d4d136bb}</strong>{" "}
              {m.setupPage.msg404dca6cff} {m.setupPage.msgf5be8292a7}
            </li>
          </ul>
        </WazeCard>

        <ServicesStatusPanel />

        <WazeCard>
          <h2 className="mb-3 text-sm font-semibold text-[var(--waze-text)]">{m.setupPage.msg3256fb15a9}</h2>
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.title}>
                <p className="text-sm font-medium text-[var(--waze-text)]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--waze-text-secondary)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </WazeCard>

        <WazeCard>
          <h2 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">{m.setupPage.msgbe8d768a22}</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/vignettes"
                className="text-[var(--waze-accent-text)] hover:underline"
              >{m.checklist.vignettes}</Link>
              {" · "}
              <Link
                href="/borders"
                className="text-[var(--waze-accent-text)] hover:underline"
              >{m.nav.borders}</Link>
              {" · "}
              <Link
                href="/profile"
                className="text-[var(--waze-accent-text)] hover:underline"
              >{m.nav.profile}</Link>
            </li>
          </ul>
        </WazeCard>
      </div>
    </div>
  );
}
