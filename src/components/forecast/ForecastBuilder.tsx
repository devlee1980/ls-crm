"use client";

import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const LITERS_PER_GALLON = 3.78541;

/** Known gallon volumes per pack size. null = user must enter manually. */
const PACK_SIZE_GALLONS: Record<string, number | null> = {
  "Each":        null,
  "Quart":       0.25,
  "Gallon":      1,
  "Gal":         1,
  "5 Gal":       5,
  "Case":        null,
  "Case 2x2.5":  5,
  "Case 4x1":    4,
  "Case 2×5.1L": 10.2 / LITERS_PER_GALLON,
  "Case 2x5.1L": 10.2 / LITERS_PER_GALLON,
  "Drum":        null,
  "Tote":        null,
  "Tote 135 Gal": 135,
  "Tote 265 Gal": 265,
  "Pallet":      null,
};

const PACK_SIZES = Object.keys(PACK_SIZE_GALLONS);

const MONTH_COUNT = 18;

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  uom: string;
  pricePerGallon: number | null;
  gallonsPerCase: number | null;
  litersPerCase: number | null;
}

interface Customer {
  id: string;
  name: string;
  wholesalePercent: number;
  retailPercent: number;
}

interface ForecastRow {
  _key: string;
  productId: string;
  packSize: string;
  /** $/gal (US) or $/L (Canada) — always the per-volume rate */
  pricePerVolume: string;
  /**
   * Gallons (US) or liters (Canada) per unit, derived from pack size.
   * Editable string so user can type for generic sizes (Case, Drum, Tote, Pallet).
   */
  volumePerUnit: string;
  quantities: Record<string, string>; // monthKey -> qty string
}

interface ForecastBuilderProps {
  customers: Customer[];
  products: Product[];
  division: string | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  initialCustomerId?: string;
  saving?: boolean;
}

function generateMonths(startYearMonth: string) {
  if (!startYearMonth) return [];
  const [year, month] = startYearMonth.split("-").map(Number);
  return Array.from({ length: MONTH_COUNT }, (_, i) => {
    const d = new Date(year, month - 1 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      shortLabel: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.getFullYear().toString(),
    };
  });
}

function todayYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Derive pricePerVolume string from the product's stored gallon rate */
function productPricePerVolume(product: Product, isCanada: boolean): string {
  const ppg = product.pricePerGallon;
  if (!ppg) return "";
  if (isCanada) return (ppg / LITERS_PER_GALLON).toFixed(4);
  return ppg.toFixed(4);
}

/**
 * Convert the pack-size gallon count into the correct unit for the division.
 * Returns "" when the pack size has no known volume.
 */
function packSizeVolumePerUnit(packSize: string, isCanada: boolean): string {
  const gal = PACK_SIZE_GALLONS[packSize] ?? null;
  if (gal === null) return "";
  return isCanada ? (gal * LITERS_PER_GALLON).toFixed(4) : gal.toString();
}

function resolveVolumeFields(product: Product, isCanada: boolean) {
  return { pricePerVolume: productPricePerVolume(product, isCanada) };
}

function newRow(product?: Product, isCanada = false): ForecastRow {
  const uom = product?.uom ?? "Each";
  return {
    _key: Math.random().toString(36).slice(2),
    productId: product?.id ?? "",
    packSize: uom,
    pricePerVolume: product ? productPricePerVolume(product, isCanada) : "",
    volumePerUnit: packSizeVolumePerUnit(uom, isCanada),
    quantities: {},
  };
}

/** Returns the effective per-unit price for line total calculation */
function effectiveUnitPrice(row: ForecastRow): number {
  const ppv = parseFloat(row.pricePerVolume) || 0;
  const vpu = parseFloat(row.volumePerUnit) || 0;
  if (ppv > 0 && vpu > 0) return ppv * vpu;
  // No volume pricing — treat pricePerVolume as flat unit price
  return ppv;
}

export function ForecastBuilder({
  customers,
  products,
  division,
  onSave,
  onCancel,
  initialCustomerId,
  saving = false,
}: ForecastBuilderProps) {
  const isCanada = division === "LS_CANADA";
  const volumeLabel = isCanada ? "$/L" : "$/Gal";

  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [startMonth, setStartMonth] = useState(todayYearMonth);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ForecastRow[]>([newRow(undefined, isCanada)]);

  const months = useMemo(() => generateMonths(startMonth), [startMonth]);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  function addRow() {
    setRows((prev) => [...prev, newRow(undefined, isCanada)]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev));
  }

  function updateRow(key: string, field: "productId" | "packSize" | "pricePerVolume" | "volumePerUnit", value: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row._key !== key) return row;
        const updated = { ...row, [field]: value };
        if (field === "productId") {
          const p = products.find((p) => p.id === value);
          if (p) {
            updated.pricePerVolume = productPricePerVolume(p, isCanada);
            updated.packSize = p.uom;
            updated.volumePerUnit = packSizeVolumePerUnit(p.uom, isCanada);
          }
        }
        if (field === "packSize") {
          const knownVolume = packSizeVolumePerUnit(value, isCanada);
          if (knownVolume) updated.volumePerUnit = knownVolume;
        }
        return updated;
      })
    );
  }

  function updateQty(key: string, monthKey: string, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row._key === key
          ? { ...row, quantities: { ...row.quantities, [monthKey]: value } }
          : row
      )
    );
  }

  function getRowTotal(row: ForecastRow): number {
    const price = effectiveUnitPrice(row);
    return Object.values(row.quantities).reduce(
      (s, q) => s + (parseFloat(q) || 0) * price,
      0
    );
  }

  function getMonthTotal(monthKey: string): number {
    return rows.reduce((s, row) => {
      const qty = parseFloat(row.quantities[monthKey] || "0") || 0;
      return s + qty * effectiveUnitPrice(row);
    }, 0);
  }

  const grandTotal = rows.reduce((s, row) => s + getRowTotal(row), 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { alert("Please select a customer."); return; }
    if (months.length === 0) { alert("Please select a start month."); return; }

    const ws = selectedCustomer?.wholesalePercent ?? 0;
    const rt = selectedCustomer?.retailPercent ?? 100;

    const items: Record<string, unknown>[] = [];

    for (const row of rows) {
      if (!row.productId) continue;
      const unitPrice = effectiveUnitPrice(row);
      for (const m of months) {
        const qty = parseFloat(row.quantities[m.key] || "0") || 0;
        if (qty <= 0) continue;
        items.push({
          productId: row.productId,
          quantity: qty,
          unitPrice,
          wholesalePercent: ws,
          retailPercent: rt,
          lineTotal: qty * unitPrice,
          notes: `${m.key}|${row.packSize}`,
        });
      }
    }

    if (items.length === 0) {
      alert("Please enter at least one quantity in the grid.");
      return;
    }

    const startDate = new Date(months[0].key + "-01");
    const lastMonth = months[months.length - 1];
    const endDate = new Date(lastMonth.key + "-01");
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    onSave({
      customerId,
      period: `${months[0].label} – ${lastMonth.label}`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      notes: notes || null,
      items,
    });
  }

  // Group months by year for the header
  const yearGroups = months.reduce<Record<string, number>>((acc, m) => {
    acc[m.year] = (acc[m.year] || 0) + 1;
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ── Header fields ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Customer *</Label>
          <Select
            value={customerId}
            onValueChange={(v) => v && setCustomerId(v)}
            required
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select customer">
                {selectedCustomer ? selectedCustomer.name : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Month *</Label>
          <Input
            className="h-11"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            required
          />
          {months.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {months[0].label} – {months[months.length - 1].label} &nbsp;({MONTH_COUNT} months)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            placeholder="Optional forecast notes"
          />
        </div>
      </div>

      <Separator />

      {/* ── Grid ── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold">18-Month Forecast Grid</p>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Pricing in {isCanada ? "CAD · per Litre" : "USD · per Gallon"}
            </span>
          </div>
          <Button type="button" variant="outline" onClick={addRow} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* ── Mobile card layout (< lg) ── */}
        <div className="lg:hidden flex flex-col gap-3">
          {rows.map((row) => {
            const rowTotal = getRowTotal(row);
            const product = products.find((p) => p.id === row.productId);
            const vpu = parseFloat(row.volumePerUnit) || 0;
            const ppv = parseFloat(row.pricePerVolume) || 0;
            const computedUnitPrice = ppv > 0 && vpu > 0 ? ppv * vpu : null;

            return (
              <div key={row._key} className="rounded-lg border border-border bg-background overflow-hidden">
                {/* Product selector row */}
                <div className="flex items-center gap-1 px-2 pt-2">
                  <button
                    type="button"
                    onClick={() => removeRow(row._key)}
                    disabled={rows.length === 1}
                    className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Select
                    value={row.productId}
                    onValueChange={(v) => v && updateRow(row._key, "productId", v)}
                  >
                    <SelectTrigger className="h-9 text-sm border-0 shadow-none focus:ring-0 px-1 flex-1">
                      <SelectValue placeholder="Select product…">
                        {product ? product.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-[min(420px,90vw)]">
                      {products.map((p) => {
                        const ppv = productPricePerVolume(p, isCanada);
                        const displayPrice = ppv
                          ? `${volumeLabel} ${parseFloat(ppv).toFixed(4)}`
                          : formatCurrency(p.unitPrice);
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex flex-col py-0.5">
                              <span className="font-medium leading-tight">{p.name}</span>
                              <span className="text-xs text-muted-foreground leading-tight">
                                {p.sku} &middot; {displayPrice}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {product && (
                  <p className="text-[11px] text-muted-foreground pl-9 pb-1 leading-tight">
                    {product.sku}
                  </p>
                )}

                {/* Pack Size / $/Vol / Vol/Unit */}
                <div className="grid grid-cols-3 gap-2 px-3 py-2 border-t border-border/60">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Pack Size</p>
                    <Select
                      value={row.packSize}
                      onValueChange={(v) => v && updateRow(row._key, "packSize", v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PACK_SIZES.map((ps) => (
                          <SelectItem key={ps} value={ps}>{ps}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{volumeLabel}</p>
                    <div className="space-y-0.5">
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={row.pricePerVolume}
                        onChange={(e) => updateRow(row._key, "pricePerVolume", e.target.value)}
                        className="h-8 text-xs text-right"
                        placeholder="0.0000"
                      />
                      {computedUnitPrice !== null && computedUnitPrice > 0 && (
                        <p className="text-[10px] text-muted-foreground text-right whitespace-nowrap">
                          {formatCurrency(computedUnitPrice)}/{row.packSize || "unit"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{isCanada ? "L/Unit" : "Gal/Unit"}</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.volumePerUnit}
                      onChange={(e) => updateRow(row._key, "volumePerUnit", e.target.value)}
                      className="h-8 text-xs text-right"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Monthly quantities (horizontal scroll) */}
                <div className="border-t border-border/60 overflow-x-auto">
                  <table className="border-collapse text-xs w-full" style={{ minWidth: "max-content" }}>
                    <thead>
                      <tr className="bg-muted/50">
                        {months.map((m) => (
                          <th
                            key={m.key}
                            className="px-2 py-1.5 text-center font-semibold whitespace-nowrap border-r last:border-r-0"
                            style={{ minWidth: 72 }}
                          >
                            {m.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {months.map((m) => (
                          <td
                            key={m.key}
                            className="px-1 py-1.5 border-r last:border-r-0"
                            style={{ minWidth: 72 }}
                          >
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={row.quantities[m.key] ?? ""}
                              onChange={(e) => updateQty(row._key, m.key, e.target.value)}
                              className="h-8 text-xs text-center w-full"
                              placeholder="—"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Row total */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/20">
                  <span className="text-xs text-muted-foreground font-medium">Row Total</span>
                  <span className="text-sm font-semibold">
                    {rowTotal > 0 ? formatCurrency(rowTotal) : <span className="text-muted-foreground font-normal">—</span>}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Mobile monthly totals */}
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            <p className="px-3 py-2 text-sm font-semibold border-b border-border/60">Monthly Total</p>
            <div className="overflow-x-auto">
              <table className="border-collapse text-xs w-full" style={{ minWidth: "max-content" }}>
                <thead>
                  <tr className="bg-muted/50">
                    {months.map((m) => (
                      <th
                        key={m.key}
                        className="px-2 py-1.5 text-center font-semibold whitespace-nowrap border-r last:border-r-0"
                        style={{ minWidth: 72 }}
                      >
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {months.map((m) => {
                      const total = getMonthTotal(m.key);
                      return (
                        <td
                          key={m.key}
                          className="px-2 py-2 text-center border-r last:border-r-0"
                          style={{ minWidth: 72 }}
                        >
                          {total > 0 ? (
                            <span className="font-semibold">{formatCurrency(total)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Desktop table layout (≥ lg) ── */}
        <div className="hidden lg:block overflow-x-auto rounded-lg border border-border">
          <table className="border-collapse text-sm" style={{ minWidth: "max-content" }}>
            <thead>
              {/* Year grouping row */}
              <tr className="bg-muted/80">
                <th
                  className="sticky left-0 z-30 bg-muted/90 border-b border-r px-3 py-2"
                  style={{ minWidth: 280 }}
                />
                <th
                  className="sticky z-30 bg-muted/90 border-b border-r px-3 py-2"
                  style={{ left: 280, minWidth: 110 }}
                />
                <th
                  className="sticky z-30 bg-muted/90 border-b border-r px-3 py-2 text-right"
                  style={{ left: 390, minWidth: 100 }}
                />
                <th
                  className="sticky z-30 bg-muted/90 border-b border-r px-3 py-2 text-right"
                  style={{ left: 490, minWidth: 80 }}
                />
                {Object.entries(yearGroups).map(([year, count]) => (
                  <th
                    key={year}
                    colSpan={count}
                    className="border-b border-r px-3 py-2 text-center font-bold text-sm tracking-wide"
                    style={{ minWidth: count * 84 }}
                  >
                    {year}
                  </th>
                ))}
                <th
                  className="sticky right-0 z-30 bg-muted/90 border-b px-3 py-2"
                  style={{ minWidth: 120 }}
                />
              </tr>

              {/* Column labels row */}
              <tr className="bg-muted/60">
                <th
                  className="sticky left-0 z-20 bg-muted/70 border-b border-r px-3 py-3 text-left font-semibold"
                  style={{ minWidth: 280 }}
                >
                  Product
                </th>
                <th
                  className="sticky z-20 bg-muted/70 border-b border-r px-3 py-3 text-left font-semibold"
                  style={{ left: 280, minWidth: 110 }}
                >
                  Pack Size
                </th>
                <th
                  className="sticky z-20 bg-muted/70 border-b border-r px-3 py-3 text-right font-semibold"
                  style={{ left: 390, minWidth: 100 }}
                >
                  {volumeLabel}
                </th>
                <th
                  className="sticky z-20 bg-muted/70 border-b border-r px-3 py-3 text-right font-semibold"
                  style={{ left: 490, minWidth: 80 }}
                >
                  {isCanada ? "L/Unit" : "Gal/Unit"}
                </th>
                {months.map((m) => (
                  <th
                    key={m.key}
                    className="border-b border-r px-2 py-3 text-center font-semibold whitespace-nowrap"
                    style={{ minWidth: 84 }}
                  >
                    {m.shortLabel}
                  </th>
                ))}
                <th
                  className="sticky right-0 z-20 bg-muted/70 border-b px-3 py-3 text-right font-semibold"
                  style={{ minWidth: 120 }}
                >
                  Row Total
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const rowTotal = getRowTotal(row);
                const product = products.find((p) => p.id === row.productId);
                const vpu = parseFloat(row.volumePerUnit) || 0;
                const ppv = parseFloat(row.pricePerVolume) || 0;
                const computedUnitPrice = ppv > 0 && vpu > 0 ? ppv * vpu : null;

                return (
                  <tr key={row._key} className="border-b hover:bg-muted/10 group">
                    {/* Product */}
                    <td
                      className="sticky left-0 z-10 bg-background border-r px-2 py-2"
                      style={{ minWidth: 280 }}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => removeRow(row._key)}
                          disabled={rows.length === 1}
                          className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <Select
                          value={row.productId}
                          onValueChange={(v) => v && updateRow(row._key, "productId", v)}
                        >
                          <SelectTrigger className="h-9 text-sm border-0 shadow-none focus:ring-0 px-1 flex-1">
                            <SelectValue placeholder="Select product…">
                              {product ? product.name : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="w-[420px]">
                            {products.map((p) => {
                              const ppv = productPricePerVolume(p, isCanada);
                              const displayPrice = ppv
                                ? `${volumeLabel} ${parseFloat(ppv).toFixed(4)}`
                                : formatCurrency(p.unitPrice);
                              return (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex flex-col py-0.5">
                                    <span className="font-medium leading-tight">{p.name}</span>
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      {p.sku} &middot; {displayPrice}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {product && (
                        <p className="text-[11px] text-muted-foreground pl-7 leading-tight mt-0.5">
                          {product.sku}
                        </p>
                      )}
                    </td>

                    {/* Pack Size */}
                    <td
                      className="sticky z-10 bg-background border-r px-2 py-2"
                      style={{ left: 280, minWidth: 110 }}
                    >
                      <Select
                        value={row.packSize}
                        onValueChange={(v) => v && updateRow(row._key, "packSize", v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PACK_SIZES.map((ps) => (
                            <SelectItem key={ps} value={ps}>
                              {ps}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* $/Gal or $/L */}
                    <td
                      className="sticky z-10 bg-background border-r px-2 py-2"
                      style={{ left: 390, minWidth: 100 }}
                    >
                      <div className="space-y-0.5">
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={row.pricePerVolume}
                          onChange={(e) => updateRow(row._key, "pricePerVolume", e.target.value)}
                          className="h-9 text-xs text-right"
                          placeholder="0.0000"
                        />
                        {computedUnitPrice !== null && computedUnitPrice > 0 && (
                          <p className="text-[10px] text-muted-foreground text-right pr-1 whitespace-nowrap">
                            {formatCurrency(computedUnitPrice)}/{row.packSize || "unit"}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Gal/Unit or L/Unit */}
                    <td
                      className="sticky z-10 bg-background border-r px-2 py-2"
                      style={{ left: 490, minWidth: 80 }}
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.volumePerUnit}
                        onChange={(e) => updateRow(row._key, "volumePerUnit", e.target.value)}
                        className="h-9 text-xs text-right"
                        placeholder="0"
                      />
                    </td>

                    {/* Monthly quantity inputs */}
                    {months.map((m) => (
                      <td
                        key={m.key}
                        className="border-r px-1 py-2 text-center"
                        style={{ minWidth: 84 }}
                      >
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.quantities[m.key] ?? ""}
                          onChange={(e) => updateQty(row._key, m.key, e.target.value)}
                          className="h-9 text-xs text-center w-full"
                          placeholder="—"
                        />
                      </td>
                    ))}

                    {/* Row total */}
                    <td
                      className="sticky right-0 z-10 bg-background px-3 py-2 text-right font-semibold text-sm"
                      style={{ minWidth: 120 }}
                    >
                      {rowTotal > 0 ? (
                        formatCurrency(rowTotal)
                      ) : (
                        <span className="text-muted-foreground font-normal">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Monthly totals row */}
              <tr className="border-t-2 bg-muted/40 font-semibold">
                <td
                  className="sticky left-0 z-10 bg-muted/60 px-3 py-3 text-sm border-r"
                  colSpan={4}
                  style={{ minWidth: 570 }}
                >
                  Monthly Total
                </td>
                {months.map((m) => {
                  const total = getMonthTotal(m.key);
                  return (
                    <td
                      key={m.key}
                      className="border-r px-1 py-3 text-center text-xs"
                      style={{ minWidth: 84 }}
                    >
                      {total > 0 ? (
                        <span className="font-semibold">{formatCurrency(total)}</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">—</span>
                      )}
                    </td>
                  );
                })}
                <td
                  className="sticky right-0 z-10 bg-muted/60 px-3 py-3 text-right text-sm"
                  style={{ minWidth: 120 }}
                >
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Separator />

      {/* ── Footer ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">18-Month Total:</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="flex gap-3 sm:justify-end">
          <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={saving} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={saving} className="flex-1 sm:flex-none">
            {saving ? "Saving…" : "Save Forecast"}
          </Button>
        </div>
      </div>
    </form>
  );
}
