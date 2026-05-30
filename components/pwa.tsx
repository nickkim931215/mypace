"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, MoreVertical } from "lucide-react";

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

type Mode = "prompt" | "ios" | "manual";

export function Pwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [mode, setMode] = useState<Mode | null>(null);

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

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    if (isIos) {
      setMode("ios");
      return;
    }

    // Use the event captured by the early inline script (it can fire before this
    // component mounts), and also keep listening in case it fires later.
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

    // Fallback: if no install event arrives shortly (common on Android Chrome
    // when the mini-infobar was previously dismissed, or on in-app browsers),
    // still surface a manual "add to home screen" hint so phones aren't left
    // without any install affordance.
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

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    close();
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface-1/95 backdrop-blur px-4 py-3 shadow-2xl max-w-md w-full">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <Download size={18} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground">
            앱으로 보시겠어요?
          </p>
          {mode === "ios" ? (
            <p className="text-[12px] text-foreground-muted leading-snug flex items-center gap-1 flex-wrap">
              공유 <Share size={12} className="inline" /> → &ldquo;홈 화면에
              추가&rdquo;
            </p>
          ) : mode === "manual" ? (
            <p className="text-[12px] text-foreground-muted leading-snug flex items-center gap-1 flex-wrap">
              메뉴 <MoreVertical size={12} className="inline" /> → &ldquo;앱
              설치&rdquo; 또는 &ldquo;홈 화면에 추가&rdquo;
            </p>
          ) : (
            <p className="text-[12px] text-foreground-muted leading-snug">
              홈 화면에 설치하고 앱처럼 빠르게 실행하세요.
            </p>
          )}
        </div>
        {mode === "prompt" && (
          <button
            onClick={install}
            className="shrink-0 h-9 px-4 rounded-full bg-accent text-black text-[13px] font-semibold active:scale-95 transition-transform"
          >
            설치
          </button>
        )}
        <button
          onClick={close}
          aria-label="닫기"
          className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-foreground-dim hover:text-foreground hover:bg-surface-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
