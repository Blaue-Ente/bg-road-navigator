"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";
import { CountryEmergencyCard } from "@/components/emergency/CountryEmergencyCard";
import { RoadsideAdviceAccordion } from "@/components/emergency/RoadsideAdviceAccordion";
import { RecommendedGarageCard } from "@/components/emergency/RecommendedGarageCard";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const ROADSIDE_ADVICE = [
  {
    title: "Какво да правите при катастрофа",
    content: "1. Спрете на безопасно място\n2. Включете аварийните светлини\n3. Поставете тригълника на 30-100м зад колата\n4. Обадете се на 112\n5. Не мести автомобила без полиция, ако има пострадали"
  },
  {
    title: "Какво да правите при повреда",
    content: "1. Отдръпнете се от пътното платно\n2. Сложете жилетка\n3. Поставете предупредителен тригълник\n4. Извикайте пътна помощ\n5. Не правете ремонт на активна лента"
  },
  {
    title: "Задължителни документи за пътуване в ЕС",
    content: "Лична карта/паспорт, шофьорска книжка, регистрационен талон, застраховка \"Зелена карта\", винетка (ако се изисква)"
  },
  {
    title: "Задължително оборудване по страни",
    content: "Светлоотразяваща жилетка, тригълник, аптечка, огнегасител (някъде), зимни вериги (в планините)"
  },
  {
    title: "Права на пътника при закъснение",
    content: "При закъснение на автобус/влак над 2 часа имате право на храна, нощувка и възстановяване на сума"
  },
  {
    title: "Застраховка в чужбина — какво покрива",
    content: "Зелената карта покрива гражданска отговорност. Задължително проверете дали включва планински спасителни операции"
  }
];

const GARAGES = [
  {
    name: "Автоцентър София",
    address: "бул. Цариградско шосе 45, София",
    phone: "+359 2 123 4567",
    mapsLink: "https://maps.google.com/?q=София+Автоцентър",
    speaksBulgarian: true
  },
  {
    name: "Thessaloniki Auto Service",
    address: "Tsimiski 120, Thessaloniki",
    phone: "+30 2310 123456",
    mapsLink: "https://maps.google.com/?q=Thessaloniki+Auto+Service",
    speaksBulgarian: false
  },
  {
    name: "Istanbul Oto Tamir",
    address: "Fatih Mah. 15, Istanbul",
    phone: "+90 212 123 4567",
    mapsLink: "https://maps.google.com/?q=Istanbul+Oto+Tamir",
    speaksBulgarian: true
  }
];

export default function EmergencyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-4">
        <div className="text-center text-blue-400">Зареждане на спешни номера...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 bg-gray-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Спешни ситуации и пътна помощ</h1>

        {/* Emergency numbers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Спешни телефони по държави</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMERGENCY_DATA.map((country) => (
              <CountryEmergencyCard key={country.country} country={country} />
            ))}
          </div>
        </div>

        {/* Roadside advice */}
        <div className="mb-8">
          <RoadsideAdviceAccordion adviceSections={ROADSIDE_ADVICE} />
        </div>

        {/* Recommended garages */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Препоръчани сервизи</h2>
          <div className="space-y-4">
            {GARAGES.map((garage, idx) => (
              <RecommendedGarageCard key={idx} {...garage} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}