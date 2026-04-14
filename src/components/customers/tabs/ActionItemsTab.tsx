"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckSquare, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import type { ActionItem } from "../CustomerDetail";

const priorityVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  URGENT: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export function ActionItemsTab({
  customerId,
  initialItems,
  reps,
}: {
  customerId: string;
  initialItems: ActionItem[];
  reps: { id: string; name: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assignedToId: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        customerId,
        description: form.description || null,
        dueDate: form.dueDate || null,
        assignedToId: form.assignedToId || null,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      toast.success("Action item created");
      setDialogOpen(false);
      setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" });
    } else {
      toast.error("Failed to create action item");
    }
  }

  async function handleStatusChange(itemId: string, status: string) {
    const res = await fetch(`/api/action-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status } : i)));
      toast.success("Status updated");
    }
  }

  const open = items.filter((i) => i.status !== "DONE");
  const done = items.filter((i) => i.status === "DONE");

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Action Items <span className="text-muted-foreground font-normal text-sm">({open.length} open)</span>
          </h3>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Action Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No action items yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {open.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Open</p>
                <div className="space-y-2">
                  {open.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 border rounded-lg p-3">
                      <button
                        onClick={() => handleStatusChange(item.id, "DONE")}
                        className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-colors shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{item.title}</span>
                          <Badge variant={priorityVariant[item.priority]} className="text-xs">
                            {item.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{item.status}</Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {item.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.assignedTo && (
                            <span>Assigned: {item.assignedTo.name}</span>
                          )}
                        </div>
                      </div>
                      <Select
                        value={item.status}
                        onValueChange={(v) => v && handleStatusChange(item.id, v)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {done.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Completed ({done.length})
                </p>
                <div className="space-y-2 opacity-60">
                  {done.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border rounded-lg p-3">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm line-through text-muted-foreground">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Action Item</DialogTitle>
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
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
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
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
