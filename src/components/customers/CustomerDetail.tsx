"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  Globe,
  Building2,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  CheckSquare,
  DollarSign,
  Paperclip,
} from "lucide-react";
import { LocationsTab } from "./tabs/LocationsTab";
import { ContactsTab } from "./tabs/ContactsTab";
import { RevenueTab } from "./tabs/RevenueTab";
import { ActionItemsTab } from "./tabs/ActionItemsTab";
import { ForecastsTab } from "./tabs/ForecastsTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { CustomerForm } from "./CustomerForm";

interface CustomerDetailProps {
  customer: {
    id: string;
    name: string;
    accountNumber: string | null;
    industry: string | null;
    type: string;
    status: string;
    rating: number;
    wholesalePercent: number;
    retailPercent: number;
    notes: string | null;
    website: string | null;
    division: string | null;
    assignedRep: { id: string; name: string } | null;
    assignedRepId: string | null;
    locations: LocationItem[];
    contacts: ContactItem[];
    actionItems: ActionItem[];
    forecasts: ForecastItem[];
    revenueRecords: RevenueRecord[];
    attachments: Attachment[];
  };
  reps: { id: string; name: string }[];
  products: { id: string; name: string; sku: string; unitPrice: number; uom: string }[];
}

export interface LocationItem {
  id: string;
  label: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  isPrimary: boolean;
}

export interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  decisionMaker: boolean;
  notes: string | null;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  assignedTo: { id: string; name: string } | null;
}

export interface ForecastItem {
  id: string;
  period: string;
  status: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  rep: { name: string };
}

export interface RevenueRecord {
  id: string;
  period: string;
  date: Date;
  totalAmount: number;
  notes: string | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: { name: string; sku: string };
  }[];
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Url: string;
  createdAt: Date;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  PROSPECT: "outline",
};

export function CustomerDetail({ customer, reps, products }: CustomerDetailProps) {
  const router = useRouter();
  const [rating, setRating] = useState(customer.rating);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customerData, setCustomerData] = useState(customer);

  const totalRevenue = customer.revenueRecords.reduce((s, r) => s + r.totalAmount, 0);

  async function handleRatingChange(newRating: number) {
    setRating(newRating);
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: newRating }),
    });
    if (res.ok) {
      toast.success("Rating updated");
    } else {
      toast.error("Failed to update rating");
      setRating(customer.rating);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("Customer deleted");
      router.push("/customers");
    } else {
      toast.error("Failed to delete customer");
      setDeleteOpen(false);
    }
  }

  async function handleEdit(data: Partial<typeof customer>) {
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomerData((prev) => ({ ...prev, ...updated }));
      toast.success("Customer updated");
      setEditOpen(false);
    } else {
      toast.error("Failed to update customer");
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-xl p-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{customerData.name}</h2>
                  <Badge variant={statusVariant[customerData.status]}>{customerData.status}</Badge>
                  <Badge variant="outline">{customerData.type}</Badge>
                </div>
                {customerData.accountNumber && (
                  <p className="text-sm text-muted-foreground">
                    Account #{customerData.accountNumber}
                  </p>
                )}
                {customerData.industry && (
                  <p className="text-sm text-muted-foreground">{customerData.industry}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <StarRating
                    rating={rating}
                    interactive
                    onChange={handleRatingChange}
                    size="md"
                  />
                  <span className="text-xs text-muted-foreground">({rating}/5)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit Customer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Wholesale</p>
              <p className="text-lg font-bold">{formatPercent(customerData.wholesalePercent)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Retail</p>
              <p className="text-lg font-bold">{formatPercent(customerData.retailPercent)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Assigned Rep</p>
              <p className="text-sm font-medium">{customerData.assignedRep?.name ?? "—"}</p>
            </div>
          </div>

          {customerData.website && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <a
                href={customerData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                {customerData.website}
              </a>
            </div>
          )}

          {customerData.notes && (
            <div className="mt-3 bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{customerData.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="locations">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="locations" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" />
            Action Items
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Forecasts
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Quotes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <LocationsTab customerId={customer.id} initialLocations={customer.locations} customerDivision={customer.division} />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab customerId={customer.id} initialContacts={customer.contacts} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueTab
            customerId={customer.id}
            initialRecords={customer.revenueRecords}
            products={products}
          />
        </TabsContent>

        <TabsContent value="actions">
          <ActionItemsTab
            customerId={customer.id}
            initialItems={customer.actionItems}
            reps={reps}
          />
        </TabsContent>

        <TabsContent value="forecasts">
          <ForecastsTab customerId={customer.id} initialForecasts={customer.forecasts} />
        </TabsContent>

        <TabsContent value="quotes">
          <AttachmentsTab
            customerId={customer.id}
            initialAttachments={customer.attachments}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            initialData={{ ...customerData, assignedRepId: customerData.assignedRep?.id }}
            reps={reps}
            onSave={handleEdit}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {customerData.name}?</AlertDialogTitle>
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
    </div>
  );
}
