"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface BorderStatsChartProps {
  hourlyData: number[]; // [0..23]
  title?: string;
}

export function BorderStatsChart({ hourlyData, title = "Средно изчакване по часове" }: BorderStatsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = hourlyData.map((wait, hour) => ({
    hour: `${hour}:00`,
    minutes: Math.round(wait),
  }));

  if (!mounted) {
    return <div className="h-40 bg-gray-800 rounded-lg flex items-center justify-center">Зареждане...</div>;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
      <h4 className="text-sm font-medium mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            domain={[0, 120]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
            labelStyle={{ color: "#F3F4F6" }}
          />
          <Bar 
            dataKey="minutes" 
            fill="#3B82F6" 
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}