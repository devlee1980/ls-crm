"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { PipelineDeal, PipelineStage } from "./PipelineBoard";

interface DealFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (deal: PipelineDeal) => void;
  deal?: PipelineDeal | null;
  customers: { id: string; name: string }[];
  reps: { id: string; name: string }[];
}

const STAGE_OPTIONS: { value: PipelineStage; label: string; probability: number }[] = [
  { value: "LEAD",        label: "Lead",        probability: 10 },
  { value: "QUALIFIED",   label: "Qualified",   probability: 25 },
  { value: "PROPOSAL",    label: "Proposal",    probability: 50 },
  { value: "NEGOTIATION", label: "Negotiation", probability: 75 },
  { value: "WON",         label: "Won",         probability: 100 },
  { value: "LOST",        label: "Lost",        probability: 0 },
];

const emptyForm = {
  title: "",
  customerId: "",
  assignedRepId: "",
  stage: "LEAD" as PipelineStage,
  value: "",
  probability: "10",
  expectedClose: "",
  notes: "",
};

export function DealForm({ open, onClose, onSaved, deal, customers, reps }: DealFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title,
        customerId: deal.customer?.id ?? "",
        assignedRepId: deal.assignedRep?.id ?? "",
        stage: deal.stage,
        value: deal.value ? String(deal.value) : "",
        probability: String(deal.probability),
        expectedClose: deal.expectedClose
          ? new Date(deal.expectedClose).toISOString().split("T")[0]
          : "",
        notes: deal.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [deal, open]);

  function handleStageChange(stage: PipelineStage) {
    const match = STAGE_OPTIONS.find((s) => s.value === stage);
    setForm((f) => ({ ...f, stage, probability: String(match?.probability ?? f.probability) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        customerId: form.customerId || null,
        assignedRepId: form.assignedRepId || null,
        stage: form.stage,
        value: parseFloat(form.value) || 0,
        probability: parseInt(form.probability) || 0,
        expectedClose: form.expectedClose || null,
        notes: form.notes || null,
      };

      const url = deal ? `/api/pipeline/${deal.id}` : "/api/pipeline";
      const method = deal ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save deal");

      const saved = await res.json();
      onSaved(saved);
      toast.success(deal ? "Deal updated" : "Deal created");
    } catch {
      toast.error("Failed to save deal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? "Edit Deal" : "New Pipeline Deal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Deal Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. ABC Corp – Spring Product Launch"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => v && handleStageChange(v as PipelineStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Probability (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value }))}
                placeholder="50"
              />
            </div>

            <div className="space-y-1">
              <Label>Deal Value ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1">
              <Label>Expected Close</Label>
              <Input
                type="date"
                value={form.expectedClose}
                onChange={(e) => setForm((f) => ({ ...f, expectedClose: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Customer</Label>
            <Select
              value={form.customerId}
              onValueChange={(v) => setForm((f) => ({ ...f, customerId: v ?? "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Assigned Rep</Label>
            <Select
              value={form.assignedRepId}
              onValueChange={(v) => setForm((f) => ({ ...f, assignedRepId: v ?? "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {reps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Any additional details about this deal..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : deal ? "Update Deal" : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
