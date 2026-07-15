"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface RoadsideAdviceAccordionProps {
  adviceSections: Array<{ title: string; content: string }>;
}

export function RoadsideAdviceAccordion({ adviceSections }: RoadsideAdviceAccordionProps) {
  return (
    <div className="waze-panel p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
        Съвети при инцидент
      </h2>
      <Accordion>
        {adviceSections.map((section, idx) => (
          <AccordionItem key={idx} value={section.title}>
            <AccordionTrigger>{section.title}</AccordionTrigger>
            <AccordionContent>
              <p className="whitespace-pre-line">{section.content}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
