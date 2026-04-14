"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
