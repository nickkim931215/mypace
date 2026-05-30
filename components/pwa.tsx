"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, MoreVertical, ExternalLink } from "lucide-react";

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

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = navigator.userAgent;
    // In-app browsers (very common in Korea — links opened from KakaoTalk,
    // Naver, Instagram, etc.). These webviews never fire beforeinstallprompt
    // and cannot install a PWA, so we must guide the user to a real browser.
    const inApp =
      /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|everytimeApp|Snapchat|Twitter|; wv\)/i.test(
        ua,
      );
    const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);

    if (inApp) {
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

  // Break out of an in-app webview into the system browser.
  const openExternal = () => {
    const url = window.location.href;
    const ua = navigator.userAgent;
    if (/KAKAOTALK/i.test(ua)) {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
      return;
    }
    if (/Android/i.test(ua)) {
      // Hand off to Chrome via an Android intent URL.
      const noScheme = url.replace(/^https?:\/\//, "");
      window.location.href =
        "intent://" +
        noScheme +
        "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }
    // iOS in-app webview can't be auto-handed off — show instructions instead.
    setShowSteps(true);
  };

  const onPrimary = () => {
    if (mode === "prompt") return void install();
    if (mode === "inapp") return openExternal();
    setShowSteps((s) => !s); // ios / manual → toggle steps
  };

  if (!mode) return null;

  const title =
    mode === "inapp" ? "기본 브라우저에서 설치하세요" : "앱으로 설치하시겠어요?";

  const subtitle =
    mode === "inapp"
      ? "지금은 앱 안의 브라우저라 설치가 안 돼요."
      : "홈 화면에 추가하면 앱처럼 빠르게 실행돼요.";

  const primaryLabel =
    mode === "prompt"
      ? "설치"
      : mode === "inapp"
        ? "브라우저로 열기"
        : "설치 방법";

  const stepsText =
    mode === "ios"
      ? "사파리 공유 버튼 → ‘홈 화면에 추가’를 누르세요."
      : mode === "inapp"
        ? "우측 상단 메뉴(⋮) → ‘다른 브라우저로 열기’(Chrome·Safari)를 선택하세요."
        : "브라우저 메뉴(⋮) → ‘앱 설치’ 또는 ‘홈 화면에 추가’를 누르세요.";

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
            aria-label="닫기"
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
