"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FlaskConical, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Invalid reset link</p>
          <p className="text-sm text-muted-foreground mt-1">
            This link is missing required information. Please request a new password reset.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Request new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Password updated</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your password has been changed. You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Set new password
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#080d14] via-[#0f1923] to-[#162032]">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#E85A1E] rounded-xl p-3">
              <FlaskConical className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">LS Nexus</h1>
              <p className="text-orange-300 text-sm">LifeScientific CRM</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-orange-300/60 text-xs mt-6">
          © {new Date().getFullYear()} LifeScientific. All rights reserved.
        </p>
      </div>
    </div>
  );
}
