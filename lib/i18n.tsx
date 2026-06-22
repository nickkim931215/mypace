"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "ko" | "en";

const STORAGE_KEY = "mypace.locale";

/**
 * The active UI language. Defaults to Korean — existing users are Korean and the
 * product copy is authored in Korean. The choice is persisted to localStorage so
 * it survives reloads, and broadcast across tabs via the `storage` event.
 *
 * Translation is intentionally inline: components call `const t = useT()` and wrap
 * source strings as `t("로그인", "Sign in")`. The Korean string is the key *and* the
 * fallback, so a missing English value simply renders Korean — never a blank or a
 * raw key. This keeps the 800+ existing strings translatable without a separate
 * key registry to drift out of sync.
 */
interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ko",
  setLocale: () => {},
});

function isLocale(value: unknown): value is Locale {
  return value === "ko" || value === "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always start from "ko" so server and first client render agree (no hydration
  // mismatch). The persisted choice is applied in an effect, after mount.
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      // localStorage can throw in private mode / sandboxed iframes — ignore.
    }

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && isLocale(e.newValue)) {
        setLocaleState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Keep <html lang> in sync so screen readers and the browser pick the right
  // language for the document.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export type TranslateFn = (ko: string, en?: string) => string;

/**
 * Returns a translator bound to the active locale.
 *
 * Usage: `const t = useT();` then `t("로그인", "Sign in")`.
 * When the locale is English and an English string is provided, returns it;
 * otherwise falls back to the Korean source string.
 */
export function useT(): TranslateFn {
  const { locale } = useLocale();
  return useCallback(
    (ko: string, en?: string) => (locale === "en" && en != null ? en : ko),
    [locale],
  );
}
