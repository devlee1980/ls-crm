"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import { FlaskConical, Loader2, AlertCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

type ErrorState =
  | { type: "invalid" }
  | { type: "locked" }
  | { type: "disabled" }
  | null;

function getErrorMessage(error: ErrorState): React.ReactNode {
  if (!error) return null;
  if (error.type === "locked") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Your account has been temporarily locked due to too many failed
          attempts. Please try again in 15 minutes or contact your administrator.
        </span>
      </div>
    );
  }
  if (error.type === "disabled") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Your account has been disabled. Please contact your administrator.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Invalid email or password. Please try again.</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (!result?.error) {
      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (result.code === "account_locked") {
      setError({ type: "locked" });
    } else if (result.code === "account_disabled") {
      setError({ type: "disabled" });
    } else {
      setError({ type: "invalid" });
    }
  }

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
              <h1 className="text-3xl font-bold text-white tracking-tight">
                LS Nexus
              </h1>
              <p className="text-orange-300 text-sm">LifeScientific CRM</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && getErrorMessage(error)}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@lifescientific.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-orange-300/60 text-xs mt-6">
          © {new Date().getFullYear()} LifeScientific. All rights reserved.
        </p>
      </div>
    </div>
  );
}
