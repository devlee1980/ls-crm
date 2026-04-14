"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  SCORING_FACTORS,
  ScoreFields,
  EMPTY_SCORE_FIELDS,
  computeWeightedScore,
  scoreTier,
  MAX_SCORE,
} from "@/lib/scoring";
import { toast } from "sonner";

interface AccountScoreData extends ScoreFields {
  id?: string;
  customerId: string;
  notes?: string | null;
}

interface ScoringFormProps {
  customerId: string;
  customerName: string;
  initialData?: AccountScoreData | null;
  onSaved?: (score: ScoreFields & { id?: string; customerId: string; notes?: string | null }) => void;
  onCancel?: () => void;
}

const SCORE_OPTIONS = [
  { value: 0, label: "0 — Not rated" },
  { value: 1, label: "1 — Poor" },
  { value: 2, label: "2 — Below average" },
  { value: 3, label: "3 — Average" },
  { value: 4, label: "4 — Good" },
  { value: 5, label: "5 — Excellent" },
];

function tierColor(tier: string) {
  if (tier === "Tier 1") return "bg-green-100 text-green-800 border-green-300";
  if (tier === "Tier 2") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

const CATEGORIES = ["Strategic Alignment", "Demand Creation", "Route-to-Market", "Commercial", "Operational", "Financial"];

export function ScoringForm({ customerId, customerName, initialData, onSaved, onCancel }: ScoringFormProps) {
  const [fields, setFields] = useState<ScoreFields>({
    ...EMPTY_SCORE_FIELDS,
    ...(initialData ?? {}),
  });
  const [notes, setNotes] = useState<string>(initialData?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const weightedScore = computeWeightedScore(fields);
  const tier = scoreTier(weightedScore);
  const pct = Math.round((weightedScore / MAX_SCORE) * 100);

  function setField(key: keyof ScoreFields, val: number) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = { customerId, ...fields, notes: notes || null };
    const res = await fetch("/api/scoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      toast.success("Score saved");
      onSaved?.(saved);
    } else {
      toast.error("Failed to save score");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
        <div>
          <p className="text-sm text-muted-foreground">Account</p>
          <p className="font-semibold text-base">{customerName}</p>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl font-bold">{weightedScore}</span>
            <span className="text-muted-foreground text-sm">/ {MAX_SCORE}</span>
            <Badge variant="outline" className={tierColor(tier)}>{tier}</Badge>
          </div>
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                tier === "Tier 1" ? "bg-green-500" : tier === "Tier 2" ? "bg-yellow-500" : "bg-slate-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{pct}% of max score</p>
        </div>
      </div>

      {/* Factor groups */}
      {CATEGORIES.map((category) => {
        const factors = SCORING_FACTORS.filter((f) => f.category === category);
        const catScore = factors.reduce((sum, f) => sum + fields[f.key] * f.weight, 0);
        const catMax = factors.reduce((sum, f) => sum + f.weight * 5, 0);

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <span className="text-xs text-muted-foreground">{catScore} / {catMax} pts</span>
            </div>
            <div className="space-y-3">
              {factors.map((factor) => (
                <div key={factor.key} className="grid grid-cols-[1fr_auto] gap-4 items-start">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{factor.label}</Label>
                    <p className="text-xs text-muted-foreground">{factor.guideline}</p>
                    <p className="text-xs text-muted-foreground">Weight: {factor.weight}</p>
                  </div>
                  <div className="w-44">
                    <Select
                      value={String(fields[factor.key])}
                      onValueChange={(v) => v && setField(factor.key, parseInt(v))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCORE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-right text-muted-foreground mt-0.5">
                      {fields[factor.key] * factor.weight} weighted pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Strategic notes, context, or next steps..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Score"}
        </Button>
      </div>
    </div>
  );
}
