"use client";

import { useState } from "react";
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

interface CustomerData {
  name?: string;
  accountNumber?: string | null;
  industry?: string | null;
  type?: string;
  status?: string;
  wholesalePercent?: number;
  retailPercent?: number;
  rating?: number;
  notes?: string | null;
  website?: string | null;
  assignedRepId?: string | null;
}

interface Rep {
  id: string;
  name: string;
}

const INDUSTRIES = [
  "Agriculture",
  "Crop Inputs",
  "Distribution",
  "Retail Ag",
  "Seed",
  "Specialty Crop",
  "Other",
];

export function CustomerForm({
  initialData,
  reps,
  onSave,
  onCancel,
}: {
  initialData?: CustomerData | null;
  reps: Rep[];
  onSave: (data: CustomerData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    accountNumber: initialData?.accountNumber ?? "",
    industry: initialData?.industry ?? "",
    type: initialData?.type ?? "DISTRIBUTOR",
    status: initialData?.status ?? "ACTIVE",
    wholesalePercent: initialData?.wholesalePercent?.toString() ?? "0",
    retailPercent: initialData?.retailPercent?.toString() ?? "100",
    notes: initialData?.notes ?? "",
    website: initialData?.website ?? "",
    assignedRepId: initialData?.assignedRepId ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: form.name,
      accountNumber: form.accountNumber || null,
      industry: form.industry || null,
      type: form.type,
      status: form.status,
      wholesalePercent: parseFloat(form.wholesalePercent),
      retailPercent: parseFloat(form.retailPercent),
      notes: form.notes || null,
      website: form.website || null,
      assignedRepId: form.assignedRepId || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="name">Customer Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ABC Agri Supply"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
            placeholder="ACC-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={form.industry}
            onValueChange={(v) => setForm((f) => ({ ...f, industry: v ?? "" }))}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Customer Type</Label>
          <Select value={form.type} onValueChange={(v) => v && setForm((f) => ({ ...f, type: v }))}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
              <SelectItem value="RETAILER">Retailer</SelectItem>
              <SelectItem value="DIRECT">Direct</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wholesale">Wholesale %</Label>
          <Input
            id="wholesale"
            type="number"
            min="0"
            max="100"
            value={form.wholesalePercent}
            onChange={(e) => {
              const ws = e.target.value;
              setForm((f) => ({
                ...f,
                wholesalePercent: ws,
                retailPercent: (100 - parseFloat(ws || "0")).toString(),
              }));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="retail">Retail %</Label>
          <Input
            id="retail"
            type="number"
            min="0"
            max="100"
            value={form.retailPercent}
            onChange={(e) => {
              const rt = e.target.value;
              setForm((f) => ({
                ...f,
                retailPercent: rt,
                wholesalePercent: (100 - parseFloat(rt || "0")).toString(),
              }));
            }}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="rep">Assigned Rep</Label>
          <Select
            value={form.assignedRepId}
            onValueChange={(v) => setForm((f) => ({ ...f, assignedRepId: v ?? "" }))}
          >
            <SelectTrigger id="rep">
              <SelectValue placeholder="Select rep" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {reps.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Internal notes about this customer"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Customer</Button>
      </div>
    </form>
  );
}
