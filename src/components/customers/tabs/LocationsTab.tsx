"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MapPin, Trash2, Phone, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { LocationItem } from "../CustomerDetail";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const CANADIAN_PROVINCES = [
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT",
];

export function LocationsTab({
  customerId,
  initialLocations,
  customerDivision,
}: {
  customerId: string;
  initialLocations: LocationItem[];
  customerDivision?: string | null;
}) {
  const isCanada = customerDivision === "LS_CANADA";

  const emptyForm = {
    label: "Main",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: isCanada ? "Canada" : "US",
    phone: "",
    isPrimary: false,
  };

  const [locations, setLocations] = useState(initialLocations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(loc: LocationItem) {
    setEditingId(loc.id);
    setForm({
      label: loc.label,
      address1: loc.address1,
      address2: loc.address2 ?? "",
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      country: loc.country,
      phone: loc.phone ?? "",
      isPrimary: loc.isPrimary,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, phone: form.phone || null, address2: form.address2 || null };

    if (editingId) {
      const res = await fetch(`/api/customers/${customerId}/locations?locationId=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocations((prev) =>
          prev.map((l) =>
            l.id === editingId ? updated : form.isPrimary ? { ...l, isPrimary: false } : l
          )
        );
        toast.success("Location updated");
        setDialogOpen(false);
      } else {
        toast.error("Failed to update location");
      }
    } else {
      const res = await fetch(`/api/customers/${customerId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const loc = await res.json();
        setLocations((prev) => [loc, ...prev.map((l) => (form.isPrimary ? { ...l, isPrimary: false } : l))]);
        toast.success("Location added");
        setDialogOpen(false);
        setForm(emptyForm);
      } else {
        toast.error("Failed to add location");
      }
    }
  }

  async function handleDelete(locationId: string) {
    if (!confirm("Remove this location?")) return;
    const res = await fetch(`/api/customers/${customerId}/locations?locationId=${locationId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLocations((prev) => prev.filter((l) => l.id !== locationId));
      toast.success("Location removed");
    } else {
      toast.error("Failed to remove location");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Physical Locations ({locations.length})</h3>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Location
          </Button>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No locations added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locations.map((loc) => (
              <div key={loc.id} className="border rounded-lg p-4 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm">{loc.label}</span>
                    {loc.isPrimary && <Badge className="text-xs">Primary</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(loc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(loc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{loc.address1}</p>
                {loc.address2 && <p className="text-sm">{loc.address2}</p>}
                <p className="text-sm">
                  {loc.city}, {loc.state} {loc.zip}
                </p>
                {loc.country !== "US" && <p className="text-sm">{loc.country}</p>}
                {loc.phone && (
                  <div className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {loc.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Location" : "Add Location"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Location Label</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Main Office, Warehouse, etc."
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={form.address1}
                    onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={form.address2}
                    onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
                    placeholder="Suite, Unit, etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label>City *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{isCanada ? "Province / Territory *" : "State *"}</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    required
                  >
                    <option value="">{isCanada ? "Select province/territory" : "Select state"}</option>
                    {(isCanada ? CANADIAN_PROVINCES : US_STATES).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{isCanada ? "Postal Code *" : "ZIP Code *"}</Label>
                  <Input
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    required
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
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                  className="rounded"
                />
                Set as primary location
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Save Changes" : "Add Location"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
