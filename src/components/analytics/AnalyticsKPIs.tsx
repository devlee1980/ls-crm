import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users, TrendingUp, Activity } from "lucide-react";

interface AnalyticsKPIsProps {
  totalViews: number;
  uniqueUserCount: number;
  topPageCount: number;
  activeRoles: number;
}

export function AnalyticsKPIs({
  totalViews,
  uniqueUserCount,
  topPageCount,
  activeRoles,
}: AnalyticsKPIsProps) {
  const cards = [
    {
      label: "Total Page Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Unique Users",
      value: uniqueUserCount.toLocaleString(),
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Distinct Pages",
      value: topPageCount.toLocaleString(),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-orange-50",
    },
    {
      label: "Active Roles",
      value: activeRoles.toLocaleString(),
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
