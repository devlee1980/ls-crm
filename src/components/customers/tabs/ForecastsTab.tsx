"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, divisionCurrency } from "@/lib/formatters";
import type { ForecastItem } from "../CustomerDetail";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function ForecastsTab({
  customerId,
  initialForecasts,
  division,
}: {
  customerId: string;
  initialForecasts: ForecastItem[];
  division?: string | null;
}) {
  const currency = divisionCurrency(division);
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Forecasts ({initialForecasts.length})</h3>
          <Link href={`/forecast/new?customerId=${customerId}`}>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Forecast
            </Button>
          </Link>
        </div>

        {initialForecasts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No forecasts yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {initialForecasts.map((forecast) => (
              <div
                key={forecast.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{forecast.period}</span>
                    <Badge variant={statusVariant[forecast.status]} className="text-xs">
                      {forecast.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(forecast.startDate)} – {formatDate(forecast.endDate)}
                    {forecast.rep && ` · ${forecast.rep.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(forecast.totalAmount, currency)}</span>
                  <Link href={`/forecast/${forecast.id}`}>
                    <Button size="icon" variant="ghost">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
