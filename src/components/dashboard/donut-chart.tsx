"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatBRL, formatPercent } from "@/lib/format";
import type { ChartDatum } from "@/lib/portfolio";

const COLORS = [
  "#003d2d",
  "#0b5d44",
  "#1d7a58",
  "#3d9b74",
  "#64b795",
  "#8fd0b4",
  "#4f7a6a",
  "#2e5e4e",
];

export function DonutChart({
  data,
  emptyMessage,
}: {
  data: ChartDatum[];
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatBRL(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full max-w-xs space-y-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="font-medium">{entry.name}</span>
            <span className="ml-auto text-muted-foreground">
              {formatBRL(entry.value)}
            </span>
            <span className="w-16 text-right">
              {formatPercent(entry.percent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
