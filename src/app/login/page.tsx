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
import {
  AlertCircle,
  ArrowLeft,
  FlaskConical,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

type ErrorState =
  | { type: "invalid" }
  | { type: "locked" }
  | { type: "disabled" }
  | { type: "mfa_invalid" }
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
  if (error.type === "mfa_invalid") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>That code didn&apos;t match. Please try again.</span>
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

type Step = "credentials" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const [step, setStep] = useState<Step>("credentials");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [mfaMode, setMfaMode] = useState<"totp" | "backup">("totp");
  const [mfaCode, setMfaCode] = useState("");

  async function attemptSignIn(extra?: { totp?: string; backupCode?: string }) {
    return signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      ...(extra?.totp ? { totp: extra.totp } : {}),
      ...(extra?.backupCode ? { backupCode: extra.backupCode } : {}),
      redirect: false,
    });
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string) ?? "";
    const password = (formData.get("password") as string) ?? "";
    setCredentials({ email, password });

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result?.error) {
      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (result.code === "mfa_required") {
      setStep("mfa");
      setMfaMode("totp");
      setMfaCode("");
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

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await attemptSignIn(
      mfaMode === "totp"
        ? { totp: mfaCode }
        : { backupCode: mfaCode.replace(/\s|-/g, "").toUpperCase() }
    );

    setLoading(false);

    if (!result?.error) {
      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (result.code === "account_locked") {
      setError({ type: "locked" });
      setStep("credentials");
    } else if (result.code === "mfa_invalid" || result.code === "mfa_required") {
      setError({ type: "mfa_invalid" });
      setMfaCode("");
    } else {
      setError({ type: "invalid" });
      setStep("credentials");
    }
  }

  function backToCredentials() {
    setStep("credentials");
    setError(null);
    setMfaCode("");
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
            {step === "credentials" ? (
              <>
                <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl font-bold">
                    Two-factor authentication
                  </CardTitle>
                </div>
                <CardDescription>
                  {mfaMode === "totp"
                    ? "Enter the 6-digit code from your authenticator app."
                    : "Enter one of the backup codes you saved during setup."}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {error && getErrorMessage(error)}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                {error && getErrorMessage(error)}

                <div className="space-y-2">
                  <Label htmlFor="mfa-code">
                    {mfaMode === "totp" ? "Verification code" : "Backup code"}
                  </Label>
                  <Input
                    // `key` forces a fresh DOM node when the mode toggles so
                    // browser/password-manager autofill from the prior render
                    // (e.g. an email autofilled into the field) is discarded.
                    key={`mfa-${mfaMode}`}
                    id="mfa-code"
                    name="mfa-code"
                    type="text"
                    inputMode={mfaMode === "totp" ? "numeric" : "text"}
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    pattern={mfaMode === "totp" ? "\\d{6}" : undefined}
                    maxLength={mfaMode === "totp" ? 6 : 12}
                    placeholder={mfaMode === "totp" ? "123456" : "ABCD-EFGH"}
                    value={mfaCode}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMfaCode(
                        mfaMode === "totp"
                          ? v.replace(/\D/g, "").slice(0, 6)
                          : v.toUpperCase().slice(0, 12)
                      );
                    }}
                    disabled={loading}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    loading ||
                    (mfaMode === "totp" ? mfaCode.length !== 6 : mfaCode.length < 6)
                  }
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
                    onClick={backToCredentials}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
                    onClick={() => {
                      setMfaMode((m) => (m === "totp" ? "backup" : "totp"));
                      setMfaCode("");
                      setError(null);
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {mfaMode === "totp"
                      ? "Use a backup code"
                      : "Use authenticator app"}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-orange-300/60 text-xs mt-6">
          © {new Date().getFullYear()} LifeScientific. All rights reserved.
        </p>
      </div>
    </div>
  );
}
