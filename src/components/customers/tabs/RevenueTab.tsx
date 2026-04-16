"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, DollarSign, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, divisionCurrency } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueRecord } from "../CustomerDetail";

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  uom: string;
}

export function RevenueTab({
  customerId,
  initialRecords,
  products,
  division,
}: {
  customerId: string;
  initialRecords: RevenueRecord[];
  products: Product[];
  division?: string | null;
}) {
  const currency = divisionCurrency(division);
  const currencySymbol = currency === "CAD" ? "CA$" : "$";
  const [records, setRecords] = useState(initialRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    period: "",
    date: new Date().toISOString().split("T")[0],
    totalAmount: "",
    notes: "",
  });

  const totalRevenue = records.reduce((s, r) => s + r.totalAmount, 0);
  const chartData = records
    .slice()
    .reverse()
    .map((r) => ({ period: r.period, revenue: r.totalAmount }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/customers/${customerId}/revenue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      const record = await res.json();
      setRecords((prev) => [record, ...prev]);
      toast.success("Revenue record added");
      setDialogOpen(false);
      setForm({ period: "", date: new Date().toISOString().split("T")[0], totalAmount: "", notes: "" });
    } else {
      toast.error("Failed to add revenue record");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Revenue History</h3>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-primary">{formatCurrency(totalRevenue, currency)}</span>
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Revenue
          </Button>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v), currency), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="oklch(0.44 0.15 155)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No revenue records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div key={record.id} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-medium text-sm">{record.period}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDate(record.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(record.totalAmount, currency)}</span>
                    {expandedId === record.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>
                {expandedId === record.id && record.items.length > 0 && (
                  <div className="border-t bg-muted/20 p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="text-left pb-1">Product</th>
                          <th className="text-right pb-1">Qty</th>
                          <th className="text-right pb-1">Unit Price</th>
                          <th className="text-right pb-1">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {record.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-1">{item.product.name}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">{formatCurrency(item.unitPrice, currency)}</td>
                            <td className="text-right font-medium">{formatCurrency(item.lineTotal, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{record.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Revenue Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Period *</Label>
                  <Input
                    value={form.period}
                    onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                    placeholder="Q1 2026"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Total Amount ({currency}) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalAmount}
                    onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
