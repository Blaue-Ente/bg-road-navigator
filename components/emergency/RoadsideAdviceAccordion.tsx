"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface RoadsideAdviceAccordionProps {
  adviceSections: Array<{ title: string; content: string }>;
}

export function RoadsideAdviceAccordion({ adviceSections }: RoadsideAdviceAccordionProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <h2 className="text-xl font-bold mb-4">Какво да правите при пътни възпроизшествия</h2>
      <Accordion type="single" collapsible={false}>
        {adviceSections.map((section, idx) => (
          <AccordionItem key={idx} value={section.title}>
            <AccordionTrigger className="w-full text-left text-sm font-medium">
              {section.title}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-300">
              <p>{section.content}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}