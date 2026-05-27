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
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/firebase/config";

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
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user") return;
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
