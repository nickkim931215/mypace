// Shared client-side browser/environment detection.
//
// Used by both the PWA install banner (components/pwa.tsx) and the Google
// sign-in flow (lib/auth-context.tsx), which need the same answers:
//   - Are we inside an in-app webview? (KakaoTalk/Naver/Instagram/… — common
//     in Korea. Google's OAuth "secure browser" policy 403s these with
//     `disallowed_useragent`, and PWAs can't be installed from them either.)
//   - Are we running as an installed PWA? (standalone display mode)
//   - Can we hand the user off to the system browser?

// In-app browsers: links opened from chat/social apps render inside an embedded
// webview that blocks both PWA install and Google OAuth. `; wv)` catches generic
// Android WebViews.
const IN_APP_UA_RE =
  /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|everytimeApp|Snapchat|Twitter|; wv\)/i;

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return IN_APP_UA_RE.test(navigator.userAgent);
}

export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

// Try to break out of an in-app webview into the system browser. Returns true
// if a handoff was attempted (navigation triggered), false when no programmatic
// route exists (e.g. iOS in-app webviews) — callers should then show manual
// "open in browser" instructions.
export function openInExternalBrowser(url?: string): boolean {
  if (typeof window === "undefined") return false;
  const target = url ?? window.location.href;
  const ua = navigator.userAgent;

  if (/KAKAOTALK/i.test(ua)) {
    window.location.href =
      "kakaotalk://web/openExternal?url=" + encodeURIComponent(target);
    return true;
  }
  if (/Android/i.test(ua)) {
    // Hand off to Chrome via an Android intent URL.
    const noScheme = target.replace(/^https?:\/\//, "");
    window.location.href =
      "intent://" +
      noScheme +
      "#Intent;scheme=https;package=com.android.chrome;end";
    return true;
  }
  // iOS in-app webviews have no programmatic handoff — caller shows steps.
  return false;
}
