"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  initAnalytics,
  trackPageview,
  identifyUser,
  resetUser,
} from "@/lib/analytics";

// Boots analytics, captures App-Router pageviews on route change, and ties the
// session to the signed-in user (uid only — no email/PII). No-ops without a key.
export function AnalyticsProvider() {
  const pathname = usePathname();
  const { user } = useAuth();
  const identified = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    trackPageview(window.location.origin + pathname + window.location.search);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      if (identified.current !== user.uid) {
        identifyUser(user.uid);
        identified.current = user.uid;
      }
    } else if (identified.current) {
      resetUser();
      identified.current = null;
    }
  }, [user]);

  return null;
}
