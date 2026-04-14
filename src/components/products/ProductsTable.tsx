"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { ProductForm } from "./ProductForm";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unitPrice: number;
  uom: string;
  pricePerGallon: number | null;
  gallonsPerCase: number | null;
  litersPerCase: number | null;
  market: string;
  isActive: boolean;
  _count: { forecastItems: number };
}

export function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(data: Partial<Product>) {
    if (editing) {
      const res = await fetch(`/api/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p)));
        toast.success("Product updated");
      } else {
        toast.error("Failed to update product");
      }
    } else {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [{ ...created, _count: { forecastItems: 0 } }, ...prev]);
        toast.success("Product created");
      } else {
        const err = await res.json();
        toast.error(err?.error?.fieldErrors?.sku?.[0] ?? "Failed to create product");
      }
    }
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } else {
      toast.error("Cannot delete product — it may be used in forecasts");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-72"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>In Forecasts</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {search ? "No products match your search" : "No products yet. Add your first product."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        product.market === "Canada"
                          ? "border-red-300 text-red-700 bg-red-50"
                          : product.market === "Both"
                          ? "border-purple-300 text-purple-700 bg-purple-50"
                          : "border-blue-300 text-blue-700 bg-blue-50"
                      }
                    >
                      {product.market === "US"
                        ? "LS-US"
                        : product.market === "Canada"
                        ? "LS-Canada"
                        : "Both"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.category ?? "—"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(product.unitPrice)}</TableCell>
                  <TableCell>{product.uom}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product._count.forecastItems}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(product);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editing}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
