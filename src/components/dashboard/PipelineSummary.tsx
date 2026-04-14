import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kanban, ArrowRight, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface StageSummary {
  stage: string;
  label: string;
  count: number;
  value: number;
  color: string;
  badgeClass: string;
}

interface PipelineSummaryProps {
  stages: StageSummary[];
  totalValue: number;
  weightedValue: number;
  openDeals: number;
}

const STAGE_META: Record<string, { label: string; color: string; badgeClass: string }> = {
  LEAD:        { label: "Lead",        color: "bg-slate-400",   badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
  QUALIFIED:   { label: "Qualified",   color: "bg-blue-400",    badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  PROPOSAL:    { label: "Proposal",    color: "bg-violet-400",  badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
  NEGOTIATION: { label: "Negotiation", color: "bg-amber-400",   badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  WON:         { label: "Won",         color: "bg-primary",     badgeClass: "bg-orange-50 text-primary border-orange-200" },
  LOST:        { label: "Lost",        color: "bg-destructive", badgeClass: "bg-red-50 text-destructive border-red-200" },
};

export function PipelineSummary({ stages, totalValue, weightedValue, openDeals }: PipelineSummaryProps) {
  const activeStages = stages.filter((s) => s.stage !== "LOST" && s.count > 0);
  const maxValue = Math.max(...activeStages.map((s) => s.value), 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Kanban className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Sales Pipeline</CardTitle>
          </div>
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Open Deals</p>
            <p className="font-bold text-lg leading-none">{openDeals}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Total Value</p>
            <p className="font-bold text-sm leading-none">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-2.5 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Weighted</p>
            <p className="font-bold text-sm leading-none text-primary">{formatCurrency(weightedValue)}</p>
          </div>
        </div>

        {/* Stage funnel */}
        <div className="space-y-2">
          {stages.map((stage) => {
            const meta = STAGE_META[stage.stage];
            const barWidth = stage.stage === "LOST" ? 0 : Math.round((stage.value / maxValue) * 100);

            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", meta.badgeClass)}>
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{stage.count} deal{stage.count !== 1 ? "s" : ""}</span>
                  </div>
                  {stage.value > 0 && (
                    <span className="text-xs font-medium">{formatCurrency(stage.value)}</span>
                  )}
                </div>
                {stage.stage !== "LOST" && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", meta.color)}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {openDeals === 0 && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No open deals yet</p>
            <Link
              href="/pipeline"
              className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors"
            >
              Add First Deal
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
