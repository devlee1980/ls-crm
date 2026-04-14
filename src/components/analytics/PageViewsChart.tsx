"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PageViewsChartProps {
  data: { day: string; count: number }[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary font-bold">
          {payload[0].value.toLocaleString()} views
        </p>
      </div>
    );
  }
  return null;
}

export function PageViewsChart({ data }: PageViewsChartProps) {
  const formatted = data.map((d) => ({
    day: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: d.count,
  }));

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Page Views Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {formatted.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            No data yet for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#viewsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
