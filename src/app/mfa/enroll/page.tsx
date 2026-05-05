"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
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
import {
  AlertCircle,
  Check,
  Copy,
  FlaskConical,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

type Stage = "loading" | "scan" | "backup" | "done";

interface SetupResponse {
  otpauthUrl: string;
  secret: string;
}

/**
 * Robust response reader: tries JSON first, falls back to text so a non-JSON
 * 5xx (e.g. a server stack-trace HTML page) still surfaces a useful message.
 */
async function readResponse<T = Record<string, unknown>>(
  res: Response
): Promise<T & { error?: string }> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return (await res.json()) as T & { error?: string };
    } catch {
      return {} as T & { error?: string };
    }
  }
  const text = await res.text().catch(() => "");
  return { error: text.slice(0, 200) || res.statusText } as T & { error?: string };
}

export default function MfaEnrollPage() {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [stage, setStage] = useState<Stage>("loading");
  const [secret, setSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  // Strict-mode dev double-runs effects; this guard prevents two /setup calls
  // racing each other and leaving the cookie holding a different secret than
  // the QR code on screen. The ref persists across the strict-mode fake
  // unmount/remount, so only the first effect kicks off the fetch.
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
        const data = await readResponse<SetupResponse>(res);
        if (!res.ok) {
          throw new Error(data.error ?? `Failed to start MFA setup (${res.status})`);
        }
        const dataUrl = await QRCode.toDataURL(data.otpauthUrl, {
          width: 240,
          margin: 1,
        });
        setSecret(data.secret);
        setQrDataUrl(dataUrl);
        setStage("scan");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not start MFA setup.";
        setError(message);
        setStage("scan");
      }
    })();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/verify-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await readResponse<{ backupCodes: string[] }>(res);
      if (res.status === 409) {
        // DB says we're already enrolled; the JWT is stale. The layout will
        // route us correctly on the next navigation.
        window.location.href = "/dashboard";
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Could not verify the code (${res.status}).`);
        return;
      }
      setBackupCodes(data.backupCodes ?? []);
      // Refresh the session so the proxy stops bouncing the user back here.
      await update({ mfa: { mfaEnabled: true, mfaVerified: true } });
      router.refresh();
      setStage("backup");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinish() {
    if (!acknowledged) return;
    setStage("done");
    // Hard navigation guarantees the freshly-signed JWT cookie is included on
    // the next request — `router.push` alone has occasionally been observed to
    // race the Set-Cookie from `update()`.
    window.location.href = "/dashboard";
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      toast.success("Secret copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n")).then(() => {
      toast.success("Backup codes copied to clipboard");
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#080d14] via-[#0f1923] to-[#162032] py-10">
      <div className="w-full max-w-lg px-4">
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
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl font-bold">
                Set up two-factor authentication
              </CardTitle>
            </div>
            <CardDescription>
              {session?.user?.email ? (
                <>Securing <span className="font-medium">{session.user.email}</span>. </>
              ) : null}
              Two-factor authentication is required for every account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {stage === "loading" && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {stage === "scan" && (
              <form onSubmit={handleVerify} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
                  <li>
                    Install an authenticator app on your phone (Google
                    Authenticator, 1Password, Authy, Microsoft Authenticator).
                  </li>
                  <li>Scan the QR code below with the app.</li>
                  <li>Enter the 6-digit code shown in the app.</li>
                </ol>

                {qrDataUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="MFA QR code"
                      className="rounded-lg border bg-white p-2"
                      width={240}
                      height={240}
                    />
                    {secret && (
                      <div className="w-full">
                        <p className="text-xs text-muted-foreground text-center mb-1">
                          Can&apos;t scan? Enter this key manually:
                        </p>
                        <button
                          type="button"
                          onClick={copySecret}
                          className="w-full flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm font-mono hover:bg-muted transition-colors"
                        >
                          <span className="break-all">{secret}</span>
                          {copied ? (
                            <Check className="h-4 w-4 shrink-0 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    disabled={submitting || !secret}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || code.length !== 6 || !secret}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and continue
                </Button>
              </form>
            )}

            {stage === "backup" && (
              <div className="space-y-5">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold mb-1">Save these backup codes</p>
                  <p>
                    Each code can be used once if you lose your authenticator
                    device. Store them somewhere safe — we will never show them
                    again.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-4 font-mono text-sm">
                  {backupCodes.map((c) => (
                    <div key={c} className="text-center tracking-wider">
                      {c}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={copyBackupCodes}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy all codes
                </Button>

                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span>
                    I have saved these backup codes in a safe place.
                  </span>
                </label>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!acknowledged}
                  onClick={handleFinish}
                >
                  Continue to dashboard
                </Button>
              </div>
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
