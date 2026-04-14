"use client";

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
import { useState } from "react";

interface ProductData {
  sku?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  unitPrice?: number;
  uom?: string;
  isActive?: boolean;
}

interface ProductFormProps {
  initialData?: ProductData | null;
  onSave: (data: ProductData) => void;
  onCancel: () => void;
}

const UOM_OPTIONS = ["Each", "Case", "Pallet", "Gallon", "Quart", "Pound", "Ounce", "Bag", "Ton"];
const CATEGORY_OPTIONS = [
  "Herbicide",
  "Fungicide",
  "Insecticide",
  "Seed Treatment",
  "Adjuvant",
  "Fertilizer",
  "Other",
];

export function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
  const [form, setForm] = useState({
    sku: initialData?.sku ?? "",
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    unitPrice: initialData?.unitPrice?.toString() ?? "",
    uom: initialData?.uom ?? "Each",
    isActive: initialData?.isActive ?? true,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      unitPrice: parseFloat(form.unitPrice),
      description: form.description || null,
      category: form.category || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder="LS-001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uom">Unit of Measure *</Label>
          <Select value={form.uom} onValueChange={(v) => v && setForm((f) => ({ ...f, uom: v }))}>
            <SelectTrigger id="uom">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UOM_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Product name"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? "" }))}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ($) *</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0"
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional product description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={form.isActive ? "active" : "inactive"}
          onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "active" }))}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Product</Button>
      </div>
    </form>
  );
}
