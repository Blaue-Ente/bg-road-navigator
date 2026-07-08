"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { FuelType, FUEL_TYPE_MAP } from "@/lib/constants/fuel-types";

interface FuelTypeSelectorProps {
  value: FuelType;
  onChange: (value: FuelType) => void;
}

export function FuelTypeSelector({ value, onChange }: FuelTypeSelectorProps) {
  return (
    <Tabs.Root defaultValue={value} onValueChange={(v) => onChange(v as FuelType)} className="w-full">
      <Tabs.List className="grid grid-cols-5 gap-2">
        {FUEL_TYPE_MAP.map(({ type, label_bg }) => (
          <Tabs.Trigger
            key={type}
            value={type}
            className={`h-10 px-3 py-2 rounded-md text-sm font-medium ${
              value === type
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {label_bg}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content className="space-y-2">
        {/* Content will be rendered by parent based on selected type */}
      </Tabs.Content>
    </Tabs.Root>
  );
}