"use client";

import { useEffect, useState } from "react";
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";
import { CountryEmergencyCard } from "@/components/emergency/CountryEmergencyCard";
import { RoadsideAdviceAccordion } from "@/components/emergency/RoadsideAdviceAccordion";
import { RecommendedGarageCard } from "@/components/emergency/RecommendedGarageCard";
import { PageHeader } from "@/components/ui/PageHeader";

const ROADSIDE_ADVICE = [
  {
    title: "Какво да правите при катастрофа",
    content:
      "1. Спрете на безопасно място\n2. Включете аварийните светлини\n3. Поставете тригълника на 30-100м зад колата\n4. Обадете се на 112\n5. Не мести автомобила без полиция, ако има пострадали",
  },
  {
    title: "Какво да правите при повреда",
    content:
      "1. Отдръпнете се от пътното платно\n2. Сложете жилетка\n3. Поставете предупредителен тригълник\n4. Извикайте пътна помощ\n5. Не правете ремонт на активна лента",
  },
  {
    title: "Задължителни документи за пътуване в ЕС",
    content:
      'Лична карта/паспорт, шофьорска книжка, регистрационен талон, застраховка "Зелена карта", винетка (ако се изисква)',
  },
  {
    title: "Задължително оборудване по страни",
    content:
      "Светлоотразяваща жилетка, тригълник, аптечка, огнегасител (някъде), зимни вериги (в планините)",
  },
  {
    title: "Права на пътника при закъснение",
    content:
      "При закъснение на автобус/влак над 2 часа имате право на храна, нощувка и възстановяване на сума",
  },
  {
    title: "Застраховка в чужбина — какво покрива",
    content:
      "Зелената карта покрива гражданска отговорност. Проверете дали включва планински спасителни операции",
  },
];

const GARAGES = [
  {
    name: "Автоцентър София",
    address: "бул. Цариградско шосе 45, София",
    phone: "+359 2 123 4567",
    mapsLink: "https://maps.google.com/?q=София+Автоцентър",
    speaksBulgarian: true,
  },
  {
    name: "Thessaloniki Auto Service",
    address: "Tsimiski 120, Thessaloniki",
    phone: "+30 2310 123456",
    mapsLink: "https://maps.google.com/?q=Thessaloniki+Auto+Service",
    speaksBulgarian: false,
  },
  {
    name: "Istanbul Oto Tamir",
    address: "Fatih Mah. 15, Istanbul",
    phone: "+90 212 123 4567",
    mapsLink: "https://maps.google.com/?q=Istanbul+Oto+Tamir",
    speaksBulgarian: true,
  },
];

export default function EmergencyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--waze-accent)]">
        Зареждане...
      </div>
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Спешни ситуации"
          subtitle="Телефони, съвети и сервизи в 20+ европейски държави"
        />

        <section className="mb-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
            Спешни телефони
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {EMERGENCY_DATA.map((country) => (
              <CountryEmergencyCard key={country.country} country={country} />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <RoadsideAdviceAccordion adviceSections={ROADSIDE_ADVICE} />
        </section>

        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
            Препоръчани сервизи
          </h2>
          <div className="space-y-3">
            {GARAGES.map((garage, idx) => (
              <RecommendedGarageCard key={idx} {...garage} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
