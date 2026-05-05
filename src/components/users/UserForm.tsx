"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  division: string | null;
  region: string | null;
  isActive: boolean;
  mfaEnabled?: boolean;
  mfaEnrolledAt?: string | null;
}

interface UserFormProps {
  user?: UserRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [resettingMfa, setResettingMfa] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(user?.mfaEnabled ?? false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "REP",
    division: user?.division ?? "",
    region: user?.region ?? "",
    isActive: user?.isActive ?? true,
  });

  async function handleResetMfa() {
    if (!user) return;
    if (
      !confirm(
        `Reset MFA for ${user.name}? They will be required to enroll a new authenticator app on their next sign-in.`
      )
    ) {
      return;
    }
    setResettingMfa(true);
    try {
      const res = await fetch("/api/auth/mfa/admin-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to reset MFA.");
        return;
      }
      toast.success("MFA reset. The user will re-enroll on next sign-in.");
      setMfaEnabled(false);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResettingMfa(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      division: form.division || null,
      region: form.region || null,
      isActive: form.isActive,
    };
    if (!isEdit || form.password) payload.password = form.password;

    const url = isEdit ? `/api/users/${user!.id}` : "/api/users";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong.");
      return;
    }

    toast.success(isEdit ? "User updated." : "User created.");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jane@example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          {isEdit ? "New Password (leave blank to keep current)" : "Password"}
        </Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="••••••••"
          minLength={8}
          required={!isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => v && setForm((f) => ({ ...f, role: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="REP">Sales Rep</SelectItem>
              <SelectItem value="CS_REP">Customer Service Rep</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Division Access
            {form.role === "CS_REP" && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (CS Rep region toggle)
              </span>
            )}
          </Label>
          <Select
            value={form.division || "BOTH"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, division: v === "BOTH" ? "" : (v ?? "") }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {form.role === "CS_REP" && (
                <SelectItem value="BOTH">Both (US &amp; Canada)</SelectItem>
              )}
              <SelectItem value="LS_US">LS US</SelectItem>
              <SelectItem value="LS_CANADA">LS Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="region">Region / Territory (optional)</Label>
        <Input
          id="region"
          value={form.region}
          onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
          placeholder="e.g. Midwest, Pacific Northwest"
        />
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.isActive ? "active" : "inactive"}
            onValueChange={(v) => v && setForm((f) => ({ ...f, isActive: v === "active" }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isEdit && (
        <div className="rounded-md border p-3 flex items-center gap-3">
          {mfaEnabled ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {mfaEnabled ? "MFA enrolled" : "MFA not enrolled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {mfaEnabled
                ? "User will be prompted for a 6-digit code on every sign-in."
                : "User will be required to enroll on next sign-in."}
            </p>
          </div>
          {mfaEnabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetMfa}
              disabled={resettingMfa}
            >
              {resettingMfa && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Reset MFA
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
