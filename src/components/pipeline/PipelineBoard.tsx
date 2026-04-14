"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  DollarSign,
  Calendar,
  User,
  Building2,
  MoreHorizontal,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { DealForm } from "./DealForm";

export type PipelineStage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";

export interface PipelineDeal {
  id: string;
  title: string;
  stage: PipelineStage;
  value: number;
  probability: number;
  expectedClose: Date | null;
  notes: string | null;
  customer: { id: string; name: string } | null;
  assignedRep: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineBoardProps {
  initialDeals: PipelineDeal[];
  customers: { id: string; name: string }[];
  reps: { id: string; name: string }[];
}

const STAGES: { id: PipelineStage; label: string; color: string; headerColor: string; probability: number }[] = [
  { id: "LEAD",        label: "Lead",        color: "border-t-slate-400",   headerColor: "bg-slate-100 text-slate-700",   probability: 10 },
  { id: "QUALIFIED",   label: "Qualified",   color: "border-t-blue-400",    headerColor: "bg-blue-50 text-blue-700",      probability: 25 },
  { id: "PROPOSAL",    label: "Proposal",    color: "border-t-violet-400",  headerColor: "bg-violet-50 text-violet-700",  probability: 50 },
  { id: "NEGOTIATION", label: "Negotiation", color: "border-t-amber-400",   headerColor: "bg-amber-50 text-amber-700",    probability: 75 },
  { id: "WON",         label: "Won",         color: "border-t-primary",     headerColor: "bg-orange-50 text-primary",     probability: 100 },
  { id: "LOST",        label: "Lost",        color: "border-t-destructive", headerColor: "bg-red-50 text-destructive",    probability: 0 },
];

export function PipelineBoard({ initialDeals, customers, reps }: PipelineBoardProps) {
  const [deals, setDeals] = useState<PipelineDeal[]>(initialDeals);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<PipelineDeal | null>(null);

  const totalPipelineValue = deals
    .filter((d) => d.stage !== "LOST")
    .reduce((sum, d) => sum + d.value, 0);

  const weightedValue = deals
    .filter((d) => d.stage !== "LOST")
    .reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  async function handleMove(dealId: string, newStage: PipelineStage) {
    const stage = STAGES.find((s) => s.id === newStage);
    const res = await fetch(`/api/pipeline/${dealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage, probability: stage?.probability }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    } else {
      toast.error("Failed to move deal");
    }
  }

  async function handleDelete(dealId: string) {
    if (!confirm("Delete this deal?")) return;
    const res = await fetch(`/api/pipeline/${dealId}`, { method: "DELETE" });
    if (res.ok) {
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
      toast.success("Deal deleted");
    } else {
      toast.error("Failed to delete deal");
    }
  }

  function handleSaved(deal: PipelineDeal) {
    setDeals((prev) => {
      const exists = prev.find((d) => d.id === deal.id);
      return exists ? prev.map((d) => (d.id === deal.id ? deal : d)) : [deal, ...prev];
    });
    setFormOpen(false);
    setEditingDeal(null);
  }

  function openEdit(deal: PipelineDeal) {
    setEditingDeal(deal);
    setFormOpen(true);
  }

  return (
    <>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/40 rounded-xl border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Pipeline:</span>
          <span className="font-semibold text-primary">{formatCurrency(totalPipelineValue)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Weighted Value:</span>
          <span className="font-semibold">{formatCurrency(weightedValue)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Open Deals:</span>
          <span className="font-semibold">{deals.filter((d) => d.stage !== "WON" && d.stage !== "LOST").length}</span>
        </div>
        <div className="ml-auto">
          <Button onClick={() => { setEditingDeal(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[500px]">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);

          return (
            <div key={stage.id} className="flex flex-col gap-2">
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold", stage.headerColor)}>
                <span>{stage.label}</span>
                <span className="opacity-70">{stageDeals.length}</span>
              </div>
              {stageValue > 0 && (
                <p className="text-xs text-muted-foreground px-1">{formatCurrency(stageValue)}</p>
              )}

              {/* Cards */}
              <div className={cn(
                "flex-1 border-t-4 rounded-lg bg-muted/20 p-2 space-y-2 min-h-[120px]",
                stage.color
              )}>
                {stageDeals.length === 0 ? (
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No deals</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stages={STAGES}
                      currentStage={stage.id}
                      onMove={handleMove}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DealForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingDeal(null); }}
        onSaved={handleSaved}
        deal={editingDeal}
        customers={customers}
        reps={reps}
      />
    </>
  );
}

function DealCard({
  deal,
  stages,
  currentStage,
  onMove,
  onEdit,
  onDelete,
}: {
  deal: PipelineDeal;
  stages: typeof STAGES;
  currentStage: PipelineStage;
  onMove: (id: string, stage: PipelineStage) => void;
  onEdit: (deal: PipelineDeal) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border shadow-sm bg-background hover:shadow-md transition-shadow">
      <CardContent className="p-2.5">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <p className="font-medium text-xs leading-snug line-clamp-2 flex-1">{deal.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon" variant="ghost" className="h-5 w-5 shrink-0 text-muted-foreground" />}>
              <MoreHorizontal className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(deal)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit Deal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {stages.filter((s) => s.id !== currentStage).map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => onMove(deal.id, s.id)}>
                  <ChevronRight className="h-3.5 w-3.5 mr-2" />
                  Move to {s.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(deal.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {deal.value > 0 && (
          <div className="flex items-center gap-1 text-xs text-primary font-semibold mb-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(deal.value)}
          </div>
        )}

        <div className="space-y-0.5">
          {deal.customer && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{deal.customer.name}</span>
            </div>
          )}
          {deal.assignedRep && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{deal.assignedRep.name}</span>
            </div>
          )}
          {deal.expectedClose && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-2.5 w-2.5 shrink-0" />
              {formatDate(deal.expectedClose)}
            </div>
          )}
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">{deal.probability}% likely</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
