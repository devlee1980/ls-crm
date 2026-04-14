"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ForecastBuilder } from "./ForecastBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  wholesalePercent: number;
  retailPercent: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  uom: string;
}

interface Props {
  customers: Customer[];
  products: Product[];
}

export function ForecastBuilderPage({ customers, products }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Forecast created successfully");
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            router.push("/forecast");
          }
        }, 800);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to create forecast");
        setSaving(false);
      }
    } catch {
      toast.error("Network error — please try again");
      setSaving(false);
    }
  }

  function handleCancel() {
    if (window.opener) {
      window.close();
    } else {
      router.push("/forecast");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-4 px-6 py-3">
          <Button variant="ghost" size="icon" onClick={handleCancel} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
            <div>
              <h1 className="text-base font-semibold leading-tight">New 18-Month Forecast</h1>
              <p className="text-xs text-muted-foreground">
                Select a customer, add products, and enter quantities by month
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </header>

      {/* ── Builder content ── */}
      <main className="flex-1 p-6 overflow-auto">
        <ForecastBuilder
          customers={customers}
          products={products}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      </main>
    </div>
  );
}
