"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, User, Phone, Mail, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import type { ContactItem } from "../CustomerDetail";

export function ContactsTab({
  customerId,
  initialContacts,
}: {
  customerId: string;
  initialContacts: ContactItem[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    phone: "",
    email: "",
    isPrimary: false,
    decisionMaker: false,
    notes: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/customers/${customerId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        title: form.title || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      const contact = await res.json();
      setContacts((prev) => [
        contact,
        ...prev.map((c) => (form.isPrimary ? { ...c, isPrimary: false } : c)),
      ]);
      toast.success("Contact added");
      setDialogOpen(false);
      setForm({ firstName: "", lastName: "", title: "", phone: "", email: "", isPrimary: false, decisionMaker: false, notes: "" });
    } else {
      toast.error("Failed to add contact");
    }
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Remove this contact?")) return;
    const res = await fetch(`/api/customers/${customerId}/contacts?contactId=${contactId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      toast.success("Contact removed");
    } else {
      toast.error("Failed to remove contact");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Contacts ({contacts.length})</h3>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Contact
          </Button>
        </div>

        {contacts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No contacts added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-start gap-3 border rounded-lg p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.isPrimary && (
                      <Badge className="text-xs">Primary</Badge>
                    )}
                    {contact.decisionMaker && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Decision Maker
                      </Badge>
                    )}
                  </div>
                  {contact.title && (
                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(contact.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First Name *</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Last Name *</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Title / Role</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="VP of Sales, Purchasing Manager, etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPrimary}
                    onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                    className="rounded"
                  />
                  Primary contact
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.decisionMaker}
                    onChange={(e) => setForm((f) => ({ ...f, decisionMaker: e.target.checked }))}
                    className="rounded"
                  />
                  Primary decision maker
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Contact</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
