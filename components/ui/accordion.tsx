"use client";

import { useState } from "react";

interface AccordionProps {
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ className, children }: AccordionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <details 
      className={`border border-gray-700 rounded-md p-3 mb-2 last:mb-0 ${className || ""}`}
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
    <summary className={`cursor-pointer text-sm font-medium text-gray-400 hover:text-white list-none ${className || ""}`}>
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
    <div className={`mt-2 p-2 bg-gray-800 text-gray-200 rounded-md ${className || ""}`}>
      {children}
    </div>
  );
}