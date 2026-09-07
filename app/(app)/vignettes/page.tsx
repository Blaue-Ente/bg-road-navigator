"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { VignetteLinks } from "@/components/vignettes/VignetteLinks";

export default function VignettesPage() {
  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Винетки и тол"
          subtitle="Официални портали за електронни винетки — без посредници"
        />
        <VignetteLinks />
      </div>
    </div>
  );
}
