import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, CheckSquare } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface KPIs {
  customerCount: number;
  openForecastCount: number;
  totalRevenue: number;
  openActionCount: number;
}

export function DashboardKPIs({ kpis }: { kpis: KPIs }) {
  const cards = [
    {
      label: "Total Customers",
      value: kpis.customerCount.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Open Forecasts",
      value: kpis.openForecastCount.toLocaleString(),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-orange-50",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(kpis.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Open Action Items",
      value: kpis.openActionCount.toLocaleString(),
      icon: CheckSquare,
      color: "text-orange-600",
      bg: "bg-orange-50",
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
