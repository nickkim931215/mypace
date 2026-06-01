"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/firebase/config";
import {
  isInAppBrowser,
  isStandalonePWA,
  openInExternalBrowser,
} from "@/lib/browser-env";

type AuthState =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: User };

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  configured: boolean;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [state, setState] = useState<AuthState>(
    configured ? { status: "loading" } : { status: "unconfigured" },
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const auth = getFirebaseAuth();
    getRedirectResult(auth).catch((err) => {
      console.error("[auth] redirect result failed:", err);
      setError("로그인에 실패했습니다. 다시 시도해주세요.");
    });
    const unsub = onAuthStateChanged(auth, (user) => {
      setState(user ? { status: "signedIn", user } : { status: "signedOut" });
    });
    return unsub;
  }, [configured]);

  const signInGoogle = useCallback(async () => {
    if (!configured) {
      setError("Firebase가 설정되지 않았습니다. .env.local을 확인해주세요.");
      return;
    }
    setError(null);

    // In-app webviews (KakaoTalk/Naver/Instagram/…) are blocked by Google's
    // OAuth "secure browser" policy — the consent screen 403s with
    // `disallowed_useragent`. There is no way to authenticate inside the
    // webview, so hand the user off to the system browser instead of leading
    // them into a dead end.
    if (isInAppBrowser()) {
      const handed = openInExternalBrowser();
      setError(
        handed
          ? "인앱 브라우저에서는 구글 로그인이 안 돼요. 외부 브라우저로 여는 중…"
          : "인앱 브라우저에서는 구글 로그인이 안 돼요. 우측 상단 메뉴에서 ‘다른 브라우저로 열기’(Chrome·Safari)를 선택해 로그인해주세요.",
      );
      return;
    }

    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();

    // Installed PWAs (standalone display mode) can't reliably round-trip a
    // popup — it opens outside the app window and the handshake is lost. Go
    // straight to redirect. With the first-party /__/auth proxy (next.config
    // rewrites) the redirect keeps its session on the way back, which the old
    // cross-domain firebaseapp.com authDomain dropped.
    if (isStandalonePWA()) {
      try {
        await signInWithRedirect(auth, provider);
      } catch (e) {
        console.error("[auth] standalone redirect failed:", e);
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
      return;
    }

    // Browser tab: popup is the primary path. Redirect is the fallback only
    // when the browser truly blocks the popup.
    try {
      await signInWithPopup(auth, provider);
      return;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user") return;
      if (
        code === "auth/popup-blocked" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (e) {
          console.error("[auth] fallback redirect failed:", e);
        }
      }
      setError(
        code === "auth/network-request-failed"
          ? "네트워크 오류가 발생했습니다."
          : "로그인에 실패했습니다. 다시 시도해주세요.",
      );
      console.error("[auth] signIn failed:", err);
    }
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    try {
      await fbSignOut(getFirebaseAuth());
    } catch (err) {
      console.error("[auth] signOut failed:", err);
    }
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: state.status === "signedIn" ? state.user : null,
      configured,
      signInGoogle,
      signOut,
      error,
    }),
    [state, configured, signInGoogle, signOut, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
