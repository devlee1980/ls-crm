"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserForm } from "./UserForm";
import { toast } from "sonner";
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Users,
  Flag,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/formatters";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  division: string | null;
  region: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { customers: number; actionItems: number };
}

const DIVISION_LABELS: Record<string, string> = {
  LS_US: "LS US",
  LS_CANADA: "LS Canada",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  REP: "Sales Rep",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  REP: "bg-gray-50 text-gray-700 border-gray-200",
};

const DIVISION_COLORS: Record<string, string> = {
  LS_US: "bg-amber-50 text-amber-700 border-amber-200",
  LS_CANADA: "bg-red-50 text-red-700 border-red-200",
};

interface UsersTableProps {
  initialUsers: UserRow[];
  currentUserId: string;
}

export function UsersTable({ initialUsers, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchDiv =
      divisionFilter === "all" || u.division === divisionFilter;
    return matchSearch && matchDiv;
  });

  // Group by division for display
  const grouped = {
    LS_US: filtered.filter((u) => u.division === "LS_US"),
    LS_CANADA: filtered.filter((u) => u.division === "LS_CANADA"),
    unassigned: filtered.filter((u) => !u.division),
  };

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        let message = "Failed to delete user.";
        try { message = JSON.parse(text)?.error ?? message; } catch { /* non-JSON error */ }
        toast.error(message);
        return;
      }
      toast.success(`${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  const totalUS = users.filter((u) => u.division === "LS_US").length;
  const totalCA = users.filter((u) => u.division === "LS_CANADA").length;

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-amber-50 p-3 rounded-xl">
              <Flag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUS}</p>
              <p className="text-sm text-muted-foreground">LS US</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-red-50 p-3 rounded-xl">
              <Flag className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCA}</p>
              <p className="text-sm text-muted-foreground">LS Canada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                {divisionFilter !== "all" ? ` in ${DIVISION_LABELS[divisionFilter]}` : ""}
              </CardDescription>
            </div>
            <Button onClick={() => { setEditUser(null); setShowForm(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={divisionFilter} onValueChange={(v) => v && setDivisionFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="LS_US">LS US</SelectItem>
                <SelectItem value="LS_CANADA">LS Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Grouped sections */}
          {(["LS_US", "LS_CANADA", "unassigned"] as const).map((key) => {
            const group = grouped[key];
            if (group.length === 0) return null;
            const label =
              key === "unassigned" ? "No Division Assigned" : DIVISION_LABELS[key];

            return (
              <div key={key}>
                <div className="px-6 py-2 bg-muted/40 border-y text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label} — {group.length} member{group.length !== 1 ? "s" : ""}
                </div>
                <div className="divide-y">
                  {group.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                        {getInitials(user.name)}
                      </div>

                      {/* Name & Email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {user.name}
                            {user.id === currentUserId && (
                              <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                            )}
                          </span>
                          {!user.isActive && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.region && (
                          <p className="text-xs text-muted-foreground">{user.region}</p>
                        )}
                      </div>

                      {/* Role */}
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${ROLE_COLORS[user.role] ?? ""}`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>

                      {/* Division */}
                      {user.division && (
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${DIVISION_COLORS[user.division] ?? ""}`}
                        >
                          {DIVISION_LABELS[user.division]}
                        </Badge>
                      )}

                      {/* Counts */}
                      <div className="hidden md:flex gap-4 text-xs text-muted-foreground shrink-0">
                        <span>{user._count.customers} customers</span>
                        <span>{user._count.actionItems} actions</span>
                      </div>

                      {/* Joined */}
                      <p className="hidden lg:block text-xs text-muted-foreground shrink-0 w-24 text-right">
                        {formatDate(user.createdAt)}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setEditUser(user); setShowForm(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(user)}
                          disabled={user.id === currentUserId}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No users match your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) { setShowForm(false); setEditUser(null); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <UserForm
            user={editUser ?? undefined}
            onSuccess={() => { setShowForm(false); setEditUser(null); refresh(); }}
            onCancel={() => { setShowForm(false); setEditUser(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <strong>{deleteTarget?.email}</strong>. Their assigned customers and
              action items will remain but become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
