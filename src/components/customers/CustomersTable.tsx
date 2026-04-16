"use client";

import { useState } from "react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Users, ExternalLink, Trash2, Pencil } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { formatCurrency, divisionCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { CustomerForm } from "./CustomerForm";

interface Customer {
  id: string;
  name: string;
  accountNumber: string | null;
  industry: string | null;
  type: string;
  status: string;
  rating: number;
  wholesalePercent: number;
  retailPercent: number;
  totalRevenue: number;
  assignedRep: { name: string } | null;
  _count: { locations: number; contacts: number; actionItems: number };
}

interface Rep {
  id: string;
  name: string;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  PROSPECT: "outline",
};

export function CustomersTable({
  initialCustomers,
  reps,
  userRole,
  userDivision,
}: {
  initialCustomers: Customer[];
  reps: Rep[];
  userRole?: string;
  userDivision?: string | null;
}) {
  const currency = divisionCurrency(userDivision);
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Customer deleted");
    } else {
      toast.error("Failed to delete customer");
    }
    setDeleteId(null);
  }

  async function handleCreate(data: Partial<Customer>) {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      setCustomers((prev) => [
        { ...created, totalRevenue: 0, assignedRep: null, _count: { locations: 0, contacts: 0, actionItems: 0 } },
        ...prev,
      ]);
      toast.success("Customer created");
      setDialogOpen(false);
    } else {
      toast.error("Failed to create customer");
    }
  }

  async function handleUpdate(data: Partial<Customer>) {
    if (!editCustomer) return;
    const res = await fetch(`/api/customers/${editCustomer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomers((prev) => prev.map((c) => (c.id === editCustomer.id ? { ...c, ...updated } : c)));
      toast.success("Customer updated");
      setEditCustomer(null);
      setDialogOpen(false);
    } else {
      toast.error("Failed to update customer");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Channel Split</TableHead>
              <TableHead>Rep</TableHead>
              <TableHead className="w-[110px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {search ? "No customers match your search" : "No customers yet. Add your first customer."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.accountNumber ?? c.industry ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.type}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <StarRating rating={c.rating} size="sm" />
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(c.totalRevenue, currency)}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <p>
                        <span className="text-muted-foreground">WS:</span>{" "}
                        <span className="font-medium">{c.wholesalePercent}%</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">RT:</span>{" "}
                        <span className="font-medium">{c.retailPercent}%</span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.assignedRep?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/customers/${c.id}`}
                        title="View"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Edit"
                        onClick={() => { setEditCustomer(c); setDialogOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(c.id)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditCustomer(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            reps={reps}
            userRole={userRole}
            userDivision={userDivision}
            initialData={editCustomer}
            onSave={editCustomer ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditCustomer(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer and all associated contacts, locations, action items, and revenue records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
