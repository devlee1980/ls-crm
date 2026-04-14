"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
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

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
const WARNING_BEFORE_MS = 60_000; // warn 1 minute before logout

export function SessionTimeoutWatcher() {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const lastActivityRef = useRef(0);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeoutMs = ((session?.user as { sessionTimeoutMinutes?: number })?.sessionTimeoutMinutes ?? 5) * 60_000;

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const scheduleLogout = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    const warningDelay = Math.max(timeoutMs - WARNING_BEFORE_MS, 0);
    const countdownSeconds = Math.min(Math.floor(WARNING_BEFORE_MS / 1000), Math.floor(timeoutMs / 1000));

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(countdownSeconds);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
          }
          return s - 1;
        });
      }, 1000);

      logoutTimerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, WARNING_BEFORE_MS);
    }, warningDelay);
  }, [clearTimers, timeoutMs]);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) return; // don't reset while warning is shown
    scheduleLogout();
  }, [showWarning, scheduleLogout]);

  // Mount activity listeners and start the initial timer
  useEffect(() => {
    if (!session) return;

    lastActivityRef.current = Date.now();

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) scheduleLogout();
    });

    const onActivity = () => handleActivity();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      cancelled = true;
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [session, scheduleLogout, handleActivity, clearTimers]);

  function handleStayLoggedIn() {
    setShowWarning(false);
    scheduleLogout();
  }

  function handleLogoutNow() {
    signOut({ callbackUrl: "/login" });
  }

  if (!session) return null;

  const minutes = Math.floor(timeoutMs / 60_000);

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in{" "}
            <span className="font-semibold tabular-nums">{secondsLeft}</span> second
            {secondsLeft !== 1 ? "s" : ""} due to inactivity ({minutes} min timeout).
            <br />
            Click <strong>Stay Logged In</strong> to continue your session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogoutNow}>
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
