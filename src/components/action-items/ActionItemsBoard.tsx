"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Clock,
  User,
  Building2,
  Trash2,
  GripVertical,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  customer: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

interface ActionItemsBoardProps {
  initialItems: ActionItem[];
  customers: { id: string; name: string }[];
  reps: { id: string; name: string }[];
}

const COLUMNS = [
  { id: "TODO", label: "To Do", color: "border-t-slate-400" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-t-blue-500" },
  { id: "DONE", label: "Done", color: "border-t-primary" },
];

const priorityVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  URGENT: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export function ActionItemsBoard({ initialItems, customers, reps }: ActionItemsBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
    customerId: "",
    assignedToId: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        dueDate: form.dueDate || null,
        customerId: form.customerId || null,
        assignedToId: form.assignedToId || null,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      toast.success("Action item created");
      setDialogOpen(false);
      setForm({ title: "", description: "", priority: "MEDIUM", status: "TODO", dueDate: "", customerId: "", assignedToId: "" });
    } else {
      toast.error("Failed to create action item");
    }
  }

  async function handleMove(itemId: string, newStatus: string) {
    const res = await fetch(`/api/action-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i)));
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm("Delete this action item?")) return;
    const res = await fetch(`/api/action-items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Action item deleted");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          {items.filter((i) => i.status !== "DONE").length} open ·{" "}
          {items.filter((i) => i.status === "DONE").length} completed
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Action Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col.id);
          return (
            <div key={col.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {colItems.length}
                </Badge>
              </div>

              <div
                className={cn("border-t-4 rounded-lg bg-muted/30 min-h-[200px] p-3 space-y-2", col.color)}
              >
                {colItems.length === 0 ? (
                  <div className="h-24 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No items</p>
                  </div>
                ) : (
                  colItems.map((item) => (
                    <Card key={item.id} className="border shadow-sm bg-background">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-snug">{item.title}</p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant={priorityVariant[item.priority]} className="text-xs">
                            {item.priority}
                          </Badge>
                          {item.customer && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {item.customer.name}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.assignedTo && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {item.assignedTo.name}
                            </span>
                          )}
                        </div>

                        {/* Quick move buttons */}
                        <div className="flex gap-1 mt-2">
                          {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleMove(item.id, c.id)}
                              className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
                            >
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Action Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Follow up on contract renewal"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Customer</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) => setForm((f) => ({ ...f, customerId: v ?? "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Assign To</Label>
                <Select
                  value={form.assignedToId}
                  onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v ?? "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {reps.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
