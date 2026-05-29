"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mypace-install-dismissed";

export function Pwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

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
    setDismissed(false);

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window);
    if (isIos) {
      setShowIosHint(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const close = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    close();
  };

  if (dismissed || (!deferred && !showIosHint)) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface-1/95 backdrop-blur px-4 py-3 shadow-2xl max-w-md w-full">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <Download size={18} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground">
            홈 화면에 MyPace 설치
          </p>
          {showIosHint ? (
            <p className="text-[12px] text-foreground-muted leading-snug flex items-center gap-1 flex-wrap">
              공유 <Share size={12} className="inline" /> → &ldquo;홈 화면에
              추가&rdquo;
            </p>
          ) : (
            <p className="text-[12px] text-foreground-muted leading-snug">
              앱처럼 빠르게 실행하고 오프라인에서도 사용하세요.
            </p>
          )}
        </div>
        {!showIosHint && (
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
