"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, MoreVertical, ExternalLink } from "lucide-react";
import {
  isInAppBrowser,
  isStandalonePWA,
  openInExternalBrowser,
} from "@/lib/browser-env";
import { useT } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __bipEvent?: BeforeInstallPromptEvent | null;
  }
}

const DISMISS_KEY = "mypace-install-dismissed";

// prompt = native install available; ios = Safari add-to-home; manual = Android
// browser without a prompt event yet; inapp = in-app webview (KakaoTalk etc.)
// where install is impossible until opened in a real browser.
type Mode = "prompt" | "ios" | "manual" | "inapp";

export function Pwa() {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [mode, setMode] = useState<Mode | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const close = () => {
    setMode(null);
    setDeferred(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore (private mode etc.)
    }
  };

  // Register the service worker (production only — dev caching causes stale chunks).
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures are non-fatal — app still works online.
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandalonePWA()) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = navigator.userAgent;
    // In-app browsers (very common in Korea — links opened from KakaoTalk,
    // Naver, Instagram, etc.). These webviews never fire beforeinstallprompt
    // and cannot install a PWA, so we must guide the user to a real browser.
    const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);

    if (isInAppBrowser()) {
      setMode("inapp");
      return;
    }
    if (isIos) {
      setMode("ios");
      return;
    }

    // Android / desktop: adopt the event captured by the early inline script
    // (it can fire before this component mounts), and keep listening.
    const adopt = (e: BeforeInstallPromptEvent) => {
      setDeferred(e);
      setMode("prompt");
    };
    if (window.__bipEvent) adopt(window.__bipEvent);

    const onReady = () => {
      if (window.__bipEvent) adopt(window.__bipEvent);
    };
    const onPrompt = (e: Event) => {
      e.preventDefault();
      adopt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => close();
    window.addEventListener("bipready", onReady);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("bipinstalled", onInstalled);

    // Fallback: if no install event arrives shortly, still surface a manual
    // "add to home screen" hint so phones aren't left without an affordance.
    const t = window.setTimeout(() => {
      setMode((m) => m ?? "manual");
    }, 3500);

    return () => {
      window.removeEventListener("bipready", onReady);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("bipinstalled", onInstalled);
      window.clearTimeout(t);
    };
  }, []);

  // Native install (Android Chrome / desktop). Must call prompt() inside the
  // click gesture, not after an await.
  const install = async () => {
    const evt = deferred ?? window.__bipEvent ?? null;
    if (!evt) {
      setShowSteps(true);
      return;
    }
    try {
      evt.prompt();
      const { outcome } = await evt.userChoice;
      window.__bipEvent = null;
      setDeferred(null);
      if (outcome === "accepted") close();
      else setShowSteps(true);
    } catch {
      setShowSteps(true);
    }
  };

  // Break out of an in-app webview into the system browser. iOS webviews have
  // no programmatic handoff, so fall back to showing manual instructions.
  const openExternal = () => {
    if (!openInExternalBrowser()) setShowSteps(true);
  };

  const onPrimary = () => {
    if (mode === "prompt") return void install();
    if (mode === "inapp") return openExternal();
    setShowSteps((s) => !s); // ios / manual → toggle steps
  };

  if (!mode) return null;

  const title =
    mode === "inapp"
      ? t("기본 브라우저에서 설치하세요", "Install in your default browser")
      : t("앱으로 설치하시겠어요?", "Install as an app?");

  const subtitle =
    mode === "inapp"
      ? t("지금은 앱 안의 브라우저라 설치가 안 돼요.", "You're in an in-app browser, so installing isn't possible here.")
      : t("홈 화면에 추가하면 앱처럼 빠르게 실행돼요.", "Add it to your home screen to launch fast, just like an app.");

  const primaryLabel =
    mode === "prompt"
      ? t("설치", "Install")
      : mode === "inapp"
        ? t("브라우저로 열기", "Open in browser")
        : t("설치 방법", "How to install");

  const stepsText =
    mode === "ios"
      ? t("사파리 공유 버튼 → ‘홈 화면에 추가’를 누르세요.", "Tap the Safari Share button → 'Add to Home Screen'.")
      : mode === "inapp"
        ? t("우측 상단 메뉴(⋮) → ‘다른 브라우저로 열기’(Chrome·Safari)를 선택하세요.", "Top-right menu (⋮) → choose 'Open in another browser' (Chrome/Safari).")
        : t("브라우저 메뉴(⋮) → ‘앱 설치’ 또는 ‘홈 화면에 추가’를 누르세요.", "Browser menu (⋮) → tap 'Install app' or 'Add to Home Screen'.");

  const PrimaryIcon =
    mode === "inapp" ? ExternalLink : mode === "ios" ? Share : Download;

  // iOS has no programmatic install, so show the steps up front.
  const stepsVisible = showSteps || mode === "ios";

  return (
    <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex justify-center px-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-border-strong bg-surface-1/95 backdrop-blur px-4 py-3 shadow-2xl max-w-md w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
            <Download size={18} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-foreground">{title}</p>
            <p className="text-[12px] text-foreground-muted leading-snug">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onPrimary}
            className="shrink-0 h-9 px-4 rounded-full bg-accent text-black text-[13px] font-semibold active:scale-95 transition-transform inline-flex items-center gap-1.5"
          >
            <PrimaryIcon size={14} />
            {primaryLabel}
          </button>
          <button
            onClick={close}
            aria-label={t("닫기", "Close")}
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-foreground-dim hover:text-foreground hover:bg-surface-2"
          >
            <X size={16} />
          </button>
        </div>

        {stepsVisible && (
          <div className="flex items-start gap-2 rounded-xl bg-surface-2/70 px-3 py-2 text-[12px] text-foreground-muted leading-snug">
            <MoreVertical size={14} className="shrink-0 mt-0.5 text-accent" />
            <span>{stepsText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
