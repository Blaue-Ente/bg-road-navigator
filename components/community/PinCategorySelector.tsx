"use client";

import { CommunityPin } from "@/types/community.types";

const CATEGORIES: Array<[CommunityPin["category"], string]> = [
  ["police", "Полиция"],
  ["accident", "Авария"],
  ["hazard", "Опасност"],
  ["road_works", "Работи"],
  ["traffic_jam", "Трафик"],
  ["fuel_issue", "Гориво"],
  ["border_info", "Граница"],
  ["rest_area", "Почивна зона"],
  ["point_of_interest", "Точка интерес"],
  ["other", "Друго"]
];

export function PinCategorySelector({ value, onChange }: {
  value: CommunityPin["category"];
  onChange: (category: CommunityPin["category"]) => void;
}) {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value as CommunityPin["category"])}
      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
    >
      <option value="" className="bg-gray-900">Изберете категория</option>
      {CATEGORIES.map(([category, label]) => (
        <option key={category} value={category} className="bg-gray-900">
          {label}
        </option>
      ))}
    </select>
  );
}