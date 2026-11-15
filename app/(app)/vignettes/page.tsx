"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { PageHeader } from "@/components/ui/PageHeader";
import { VignetteLinks } from "@/components/vignettes/VignetteLinks";

export default function VignettesPage() {
  const m = useMessages();
  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title={m.vignettesPage.msg4980c1700f}
          subtitle={m.vignettesPage.msg61bc1e4109}
        />
        <VignetteLinks />
      </div>
    </div>
  );
}
