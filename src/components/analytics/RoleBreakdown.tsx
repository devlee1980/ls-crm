"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#e85a1e",
  MANAGER: "#3b82f6",
  REP: "#10b981",
  CS_REP: "#a855f7",
  Unknown: "#94a3b8",
};

interface RoleBreakdownProps {
  data: { role: string; count: number }[];
}

export function RoleBreakdown({ data }: RoleBreakdownProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Views by Role</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={({ role, percent }) =>
                  `${role} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.role}
                    fill={ROLE_COLORS[entry.role] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString()} views`,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
