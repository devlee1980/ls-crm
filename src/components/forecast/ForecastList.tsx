"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, TrendingUp, ExternalLink, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

interface Forecast {
  id: string;
  period: string;
  status: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  customer: { id: string; name: string };
  rep: { name: string };
  _count: { items: number };
}

export function ForecastList({
  initialForecasts,
}: {
  initialForecasts: Forecast[];
}) {
  const [forecasts, setForecasts] = useState(initialForecasts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = forecasts.filter((f) => {
    const matchesSearch =
      f.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      f.period.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/forecasts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setForecasts((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      );
      toast.success("Status updated");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this forecast?")) return;
    const res = await fetch(`/api/forecasts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setForecasts((prev) => prev.filter((f) => f.id !== id));
      toast.success("Forecast deleted");
    }
  }

  const totalForecast = filtered.reduce((s, f) => s + f.totalAmount, 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Forecasted</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalForecast)}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Open Forecasts</p>
            <p className="text-2xl font-bold">
              {forecasts.filter((f) => f.status === "DRAFT" || f.status === "SUBMITTED").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">
              {forecasts.filter((f) => f.status === "APPROVED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forecasts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => window.open("/forecast/new", "_blank")}>
              <Plus className="h-4 w-4 mr-2" />
              New Forecast
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {search ? "No forecasts match your search" : "No forecasts yet. Create your first forecast."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.customer.name}</TableCell>
                    <TableCell>{f.period}</TableCell>
                    <TableCell className="text-muted-foreground">{f._count.items} products</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(f.totalAmount)}</TableCell>
                    <TableCell>
                      <Select
                        value={f.status}
                        onValueChange={(v) => v && handleStatusChange(f.id, v)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="SUBMITTED">Submitted</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.rep.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="View forecast"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(f.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </>
  );
}
