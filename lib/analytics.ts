"use client";

import posthog from "posthog-js";

// Thin, provider-agnostic analytics wrapper around PostHog. Everything no-ops
// gracefully when NEXT_PUBLIC_POSTHOG_KEY is absent (local dev / unconfigured),
// so the app never depends on analytics being set up.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let ready = false;

export function initAnalytics(): void {
  if (ready || !KEY || typeof window === "undefined") return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // captured manually for the App Router
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  ready = true;
}

export function trackEvent(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (!ready) return;
  posthog.capture(event, props);
}

export function trackPageview(url: string): void {
  if (!ready) return;
  posthog.capture("$pageview", { $current_url: url });
}

export function identifyUser(id: string): void {
  if (!ready) return;
  posthog.identify(id);
}

export function resetUser(): void {
  if (!ready) return;
  posthog.reset();
}
