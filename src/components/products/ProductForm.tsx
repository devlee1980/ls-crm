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
  pricePerGallon?: number | null;
  gallonsPerCase?: number | null;
  litersPerCase?: number | null;
  market?: string;
  isActive?: boolean;
}

interface ProductFormProps {
  initialData?: ProductData | null;
  onSave: (data: ProductData) => void;
  onCancel: () => void;
}

const LITERS_PER_GALLON = 3.78541;

/** UOM options with their known gallon volumes (null = not volume-based) */
const UOM_OPTIONS: { label: string; gallons: number | null }[] = [
  { label: "Each",         gallons: null },
  { label: "Case 2x2.5",  gallons: 5    },
  { label: "Case 4x1",    gallons: 4    },
  { label: "Case",        gallons: null },
  { label: "Pallet",      gallons: null },
  { label: "Gallon",      gallons: 1    },
  { label: "Quart",       gallons: 0.25 },
  { label: "Pound",       gallons: null },
  { label: "Ounce",       gallons: null },
  { label: "Bag",         gallons: null },
  { label: "Ton",         gallons: null },
  { label: "Tote 135 Gal", gallons: 135 },
  { label: "Tote 265 Gal", gallons: 265 },
  { label: "Tote",        gallons: null },
];

const CATEGORY_OPTIONS = [
  "Herbicide",
  "Fungicide",
  "Insecticide",
  "Seed Treatment",
  "Adjuvant",
  "Fertilizer",
  "Other",
];

function uomGallons(uom: string): number | null {
  return UOM_OPTIONS.find((u) => u.label === uom)?.gallons ?? null;
}

export function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
  const [form, setForm] = useState({
    sku: initialData?.sku ?? "",
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    unitPrice: initialData?.unitPrice?.toString() ?? "",
    uom: initialData?.uom ?? "Each",
    pricePerGallon: initialData?.pricePerGallon?.toString() ?? "",
    gallonsPerCase: initialData?.gallonsPerCase?.toString() ?? "1",
    litersPerCase: initialData?.litersPerCase?.toString() ?? LITERS_PER_GALLON.toFixed(4),
    market: initialData?.market ?? "US",
    isActive: initialData?.isActive ?? true,
  });

  function handleUomChange(uom: string) {
    const knownGallons = uomGallons(uom);
    setForm((f) => {
      const gallons = knownGallons !== null ? knownGallons.toString() : f.gallonsPerCase;
      const liters =
        knownGallons !== null
          ? (knownGallons * LITERS_PER_GALLON).toFixed(4)
          : f.litersPerCase;
      return { ...f, uom, gallonsPerCase: gallons, litersPerCase: liters };
    });
  }

  function handleGallonsChange(val: string) {
    const gallons = parseFloat(val);
    const liters = !isNaN(gallons) && gallons > 0
      ? (gallons * LITERS_PER_GALLON).toFixed(4)
      : "";
    setForm((f) => ({ ...f, gallonsPerCase: val, litersPerCase: liters }));
  }

  const pricePerGallon = parseFloat(form.pricePerGallon) || 0;
  const gallonsVal = parseFloat(form.gallonsPerCase) || 0;
  const litersVal = parseFloat(form.litersPerCase) || 0;

  const usUnitPrice = pricePerGallon > 0 && gallonsVal > 0
    ? pricePerGallon * gallonsVal
    : null;
  const pricePerLiter = pricePerGallon > 0 ? pricePerGallon / LITERS_PER_GALLON : 0;
  const canadaUnitPrice = pricePerLiter > 0 && litersVal > 0
    ? pricePerLiter * litersVal
    : null;

  const isVolumeBased = uomGallons(form.uom) !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ppg = form.pricePerGallon ? parseFloat(form.pricePerGallon) : null;
    const gpc = form.gallonsPerCase ? parseFloat(form.gallonsPerCase) : null;
    const lpc = form.litersPerCase ? parseFloat(form.litersPerCase) : null;

    const computedUnitPrice =
      ppg && gpc ? ppg * gpc : parseFloat(form.unitPrice);

    onSave({
      ...form,
      unitPrice: computedUnitPrice,
      description: form.description || null,
      category: form.category || null,
      pricePerGallon: ppg,
      gallonsPerCase: gpc,
      litersPerCase: lpc,
      market: form.market,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
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
          <Select value={form.uom} onValueChange={(v) => v && handleUomChange(v)}>
            <SelectTrigger id="uom">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UOM_OPTIONS.map((u) => (
                <SelectItem key={u.label} value={u.label}>
                  {u.label}
                  {u.gallons !== null && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({u.gallons} gal)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="market">Market *</Label>
          <Select value={form.market} onValueChange={(v) => v && setForm((f) => ({ ...f, market: v }))}>
            <SelectTrigger id="market">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">LS-US</SelectItem>
              <SelectItem value="Canada">LS-Canada</SelectItem>
              <SelectItem value="Both">Both (US &amp; Canada)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Market this item is sold in</p>
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
        {!isVolumeBased && (
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
            <p className="text-xs text-muted-foreground">
              Selling price per {form.uom}
            </p>
          </div>
        )}
      </div>

      {/* Volume pricing — shown for all UOMs so reps can always fill in gallon rates */}
      <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
        <div>
          <p className="text-sm font-semibold">Volume Pricing</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter the gallon rate and volume to automatically calculate the{" "}
            {isVolumeBased ? form.uom : "unit"} selling price.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pricePerGallon">Price / Gal (US $)</Label>
            <Input
              id="pricePerGallon"
              type="number"
              step="0.0001"
              min="0"
              value={form.pricePerGallon}
              onChange={(e) => setForm((f) => ({ ...f, pricePerGallon: e.target.value }))}
              placeholder="0.0000"
            />
            <p className="text-xs text-muted-foreground">US base rate per gallon</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gallonsPerCase">
              Gals / {isVolumeBased ? form.uom : "Unit"}
            </Label>
            <Input
              id="gallonsPerCase"
              type="number"
              step="0.01"
              min="0"
              value={form.gallonsPerCase}
              onChange={(e) => handleGallonsChange(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              {isVolumeBased
                ? "US gallons per unit — auto-filled from UOM"
                : "US gallons contained in one unit"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="litersPerCase">
              Liters / {isVolumeBased ? form.uom : "Unit"}{" "}
              <span className="text-muted-foreground font-normal">(Canada)</span>
            </Label>
            <Input
              id="litersPerCase"
              type="number"
              step="0.0001"
              min="0"
              value={form.litersPerCase}
              onChange={(e) => setForm((f) => ({ ...f, litersPerCase: e.target.value }))}
              placeholder="0.0000"
            />
            <p className="text-xs text-muted-foreground">
              Liters per unit — auto-converted from gallons
            </p>
          </div>
        </div>

        {(usUnitPrice !== null || canadaUnitPrice !== null) && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Computed Unit Price
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {usUnitPrice !== null && (
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">
                    US — per {form.uom}
                  </p>
                  <p className="text-base font-semibold">${usUnitPrice.toFixed(2)}</p>
                  <p className="text-muted-foreground text-xs">
                    ${pricePerGallon.toFixed(4)}/gal × {gallonsVal} gal
                  </p>
                </div>
              )}
              {canadaUnitPrice !== null && (
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">
                    Canada — per {form.uom}
                  </p>
                  <p className="text-base font-semibold">${canadaUnitPrice.toFixed(2)}</p>
                  <p className="text-muted-foreground text-xs">
                    ${pricePerLiter.toFixed(4)}/L × {litersVal} L
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
