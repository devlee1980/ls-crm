"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Star, Pencil } from "lucide-react";
import {
  ScoreFields,
  EMPTY_SCORE_FIELDS,
  computeWeightedScore,
  scoreTier,
  MAX_SCORE,
} from "@/lib/scoring";
import { ScoringForm } from "./ScoringForm";

interface CustomerRow {
  id: string;
  name: string;
  status: string;
  assignedRep?: { name: string } | null;
  accountScore?: (ScoreFields & { id: string; customerId: string; notes?: string | null; updatedAt: string | Date }) | null;
}

interface ScoringTableProps {
  initialCustomers: CustomerRow[];
}

function tierBadgeClass(tier: string) {
  if (tier === "Tier 1") return "border-green-300 text-green-700 bg-green-50";
  if (tier === "Tier 2") return "border-yellow-300 text-yellow-800 bg-yellow-50";
  return "border-slate-300 text-slate-600 bg-slate-50";
}

function scoreBarColor(tier: string) {
  if (tier === "Tier 1") return "bg-green-500";
  if (tier === "Tier 2") return "bg-yellow-500";
  return "bg-slate-400";
}

export function ScoringTable({ initialCustomers }: ScoringTableProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.assignedRep?.name?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (tierFilter !== "All") {
      const score = c.accountScore ? computeWeightedScore(c.accountScore) : 0;
      const tier = scoreTier(score);
      return tier === tierFilter;
    }
    return true;
  });

  function handleSaved(saved: ScoreFields & { id?: string; customerId: string; notes?: string | null }) {
    setCustomers((prev) =>
      prev.map((c): CustomerRow =>
        c.id === saved.customerId
          ? {
              ...c,
              accountScore: {
                ...EMPTY_SCORE_FIELDS,
                ...saved,
                id: saved.id ?? "",
                customerId: saved.customerId,
                updatedAt: new Date().toISOString(),
              },
            }
          : c
      )
    );
    setDialogOpen(false);
    setSelected(null);
  }

  const tier1Count = customers.filter((c) => {
    const s = c.accountScore ? computeWeightedScore(c.accountScore) : 0;
    return scoreTier(s) === "Tier 1";
  }).length;

  const tier2Count = customers.filter((c) => {
    const s = c.accountScore ? computeWeightedScore(c.accountScore) : 0;
    return scoreTier(s) === "Tier 2";
  }).length;

  const scoredCount = customers.filter((c) => c.accountScore).length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", value: customers.length },
          { label: "Scored", value: scoredCount },
          { label: "Tier 1", value: tier1Count },
          { label: "Tier 2", value: tier2Count },
        ].map(({ label, value }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts or rep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Tier 1", "Tier 2", "Tier 3"].map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tierFilter === t ? "default" : "outline"}
                onClick={() => setTierFilter(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {search || tierFilter !== "All"
                      ? "No accounts match your filters"
                      : "No US customers found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((customer) => {
                  const scoreData = customer.accountScore;
                  const score = scoreData ? computeWeightedScore(scoreData) : 0;
                  const tier = scoreTier(score);
                  const pct = Math.round((score / MAX_SCORE) * 100);
                  const isScored = !!scoreData;

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {customer.assignedRep?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {isScored ? (
                          <span className="font-semibold tabular-nums">{score}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scored</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isScored ? (
                          <Badge variant="outline" className={tierBadgeClass(tier)}>
                            {tier}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isScored ? (
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${scoreBarColor(tier)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {scoreData?.updatedAt
                          ? new Date(String(scoreData.updatedAt)).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(customer);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account Scorecard</DialogTitle>
          </DialogHeader>
          {selected && (
            <ScoringForm
              customerId={selected.id}
              customerName={selected.name}
              initialData={selected.accountScore
                ? { ...EMPTY_SCORE_FIELDS, ...selected.accountScore }
                : null
              }
              onSaved={handleSaved}
              onCancel={() => { setDialogOpen(false); setSelected(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
