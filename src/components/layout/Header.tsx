"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut, useSession } from "next-auth/react";
import { Bell, Settings, CalendarDays, Menu, Clock } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { toast } from "sonner";

const DIVISION_LABELS: Record<string, string> = {
  LS_US: "LS US",
  LS_CANADA: "LS Canada",
};

const DIVISION_COLORS: Record<string, string> = {
  LS_US: "bg-amber-50 text-amber-700 border border-amber-200",
  LS_CANADA: "bg-red-50 text-red-700 border border-red-200",
};

const TIMEOUT_OPTIONS = [
  { value: 5,   label: "5 minutes (default)" },
  { value: 15,  label: "15 minutes" },
  { value: 30,  label: "30 minutes" },
  { value: 60,  label: "1 hour" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session, update } = useSession();
  const { toggle } = useSidebar();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const user = session?.user;
  const extUser = user as { role?: string; division?: string; sessionTimeoutMinutes?: number } | undefined;
  const currentTimeout = extUser?.sessionTimeoutMinutes ?? 5;
  const [selectedTimeout, setSelectedTimeout] = useState(currentTimeout);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const division = extUser?.division;

  async function handleSaveSettings() {
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionTimeoutMinutes: selectedTimeout }),
    });
    setSaving(false);

    if (res.ok) {
      // Update the client-side session so the watcher picks up the new value
      await update({ sessionTimeoutMinutes: selectedTimeout });
      toast.success(`Session timeout set to ${TIMEOUT_OPTIONS.find((o) => o.value === selectedTimeout)?.label}`);
      setSettingsOpen(false);
    } else {
      toast.error("Failed to save settings");
    }
  }

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={toggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{today}</span>
        </div>

        {division && DIVISION_LABELS[division] && (
          <span className={`hidden md:inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${DIVISION_COLORS[division]}`}>
            {DIVISION_LABELS[division]}
          </span>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar className="h-8 w-8">
              {user?.image && <AvatarImage src={user.image} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{user?.name}</p>
              <Badge variant="secondary" className="text-xs h-4">
                {extUser?.role ?? "REP"}
              </Badge>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {division && DIVISION_LABELS[division] && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {DIVISION_LABELS[division]}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your personal session preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Session Timeout
              </Label>
              <Select
                value={String(selectedTimeout)}
                onValueChange={(v) => v && setSelectedTimeout(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You will be automatically logged out after this period of inactivity.
                A warning appears 1 minute before.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
