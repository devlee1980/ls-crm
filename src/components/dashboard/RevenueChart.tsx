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
import { formatCurrency, divisionCurrency, type CurrencyCode } from "@/lib/formatters";

interface RevenueChartProps {
  data: { period: string; revenue: number }[];
  division?: string | null;
}

function CustomTooltip({ active, payload, label, currency }: { active?: boolean; payload?: { value: number }[]; label?: string; currency: CurrencyCode }) {
  if (active && payload?.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary font-bold">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  }
  return null;
}

export function RevenueChart({ data, division }: RevenueChartProps) {
  const currency = divisionCurrency(division);
  const currencySymbol = currency === "CAD" ? "CA$" : "$";
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Revenue by Period</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            No revenue data yet. Add revenue records to customers to see trends here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.44 0.15 155)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="oklch(0.44 0.15 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.44 0.15 155)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
