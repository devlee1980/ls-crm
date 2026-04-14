"use client";

import { useState, useCallback } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  uom: string;
}

interface Customer {
  id: string;
  name: string;
  wholesalePercent: number;
  retailPercent: number;
}

interface LineItem {
  _key: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  wholesalePercent: string;
  retailPercent: string;
  notes: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ForecastBuilderProps {
  customers: Customer[];
  products: Product[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  initialCustomerId?: string;
}

function newLineItem(product?: Product, customer?: Customer): LineItem {
  return {
    _key: Math.random().toString(36).slice(2),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: product?.unitPrice.toString() ?? "",
    wholesalePercent: customer?.wholesalePercent.toString() ?? "0",
    retailPercent: customer?.retailPercent.toString() ?? "100",
    notes: "",
  };
}

export function ForecastBuilder({
  customers,
  products,
  onSave,
  onCancel,
  initialCustomerId,
}: ForecastBuilderProps) {
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  function addLine() {
    setItems((prev) => [...prev, newLineItem(undefined, selectedCustomer)]);
  }

  function removeLine(key: string) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateLine(key: string, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: value };
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) updated.unitPrice = product.unitPrice.toString();
        }
        if (field === "wholesalePercent") {
          updated.retailPercent = (100 - parseFloat(value || "0")).toString();
        }
        if (field === "retailPercent") {
          updated.wholesalePercent = (100 - parseFloat(value || "0")).toString();
        }
        return updated;
      })
    );
  }

  function getLineTotal(item: LineItem): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  }

  const grandTotal = items.reduce((s, i) => s + getLineTotal(i), 0);

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          wholesalePercent: cust.wholesalePercent.toString(),
          retailPercent: cust.retailPercent.toString(),
        }))
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.productId && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) {
      alert("Please add at least one product line item.");
      return;
    }

    onSave({
      customerId,
      period,
      startDate,
      endDate,
      notes: notes || null,
      items: validItems.map((i) => ({
        productId: i.productId,
        quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        wholesalePercent: parseFloat(i.wholesalePercent),
        retailPercent: parseFloat(i.retailPercent),
        lineTotal: getLineTotal(i),
        notes: i.notes || null,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Customer *</Label>
          <Select value={customerId} onValueChange={(v) => v && handleCustomerChange(v)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
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
          <Label>Period *</Label>
          <Input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Q1 2026, 2026, etc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional forecast notes"
          />
        </div>
      </div>

      <Separator />

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">Product Line Items</Label>
          <Button type="button" size="sm" variant="outline" onClick={addLine}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Product
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const lineTotal = getLineTotal(item);
            return (
              <Card key={item._key} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Line {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {lineTotal > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formatCurrency(lineTotal)}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(item._key)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-2 sm:col-span-3">
                      <Label className="text-xs">Product *</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(v) => v && updateLine(item._key, "productId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.sku} — {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLine(item._key, "quantity", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unit Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLine(item._key, "unitPrice", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Line Total</Label>
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Wholesale %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.wholesalePercent}
                        onChange={(e) => updateLine(item._key, "wholesalePercent", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Retail %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.retailPercent}
                        onChange={(e) => updateLine(item._key, "retailPercent", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Total + submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Total Forecast:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Forecast</Button>
        </div>
      </div>
    </form>
  );
}
