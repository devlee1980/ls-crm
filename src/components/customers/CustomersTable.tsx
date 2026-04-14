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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, Search, Users, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { formatCurrency } from "@/lib/formatters";
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
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
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
              <TableHead className="w-[50px]" />
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
                  <TableCell className="font-medium">{formatCurrency(c.totalRevenue)}</TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link href={`/customers/${c.id}`} className="flex items-center gap-2">
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </Link>
                          }
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            reps={reps}
            userRole={userRole}
            userDivision={userDivision}
            onSave={handleCreate}
            onCancel={() => setDialogOpen(false)}
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
