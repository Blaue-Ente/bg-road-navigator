"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  AccountCard,
  AppearanceCard,
  LocationCard,
  NotificationsCard,
  PrivacyCard,
  RetentionCard,
} from "@/components/settings/SettingsPanels";

export default function SettingsPage() {
  const m = useMessages();
  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader title={m.settings.title} subtitle={m.settings.subtitle} />
        <AppearanceCard />
        <LocationCard />
        <NotificationsCard />
        <PrivacyCard />
        <RetentionCard />
        <AccountCard />
      </div>
    </div>
  );
}
