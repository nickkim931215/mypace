import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MyPace — 나만의 페이스 운동 타이머",
    short_name: "MyPace",
    description:
      "인터벌 타이머 · 메트로놈 · AI 추천 운동 · 커뮤니티. 나만의 페이스로 운동하세요.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // "any" so the installed app follows the device rotation (portrait + landscape).
    // Was "portrait", which locked Galaxy Tab / phones to a single orientation.
    orientation: "any",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    lang: "ko",
    dir: "ltr",
    categories: ["health", "fitness", "sports", "lifestyle"],
    icons: [
      // Raster icons (required for TWA / Play Store / Android install).
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable: the mark sits inside the safe zone so Android can crop it to
      // any shape (circle / squircle) without clipping.
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      // Scalable fallback for browsers that prefer SVG.
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    // App preview screenshots (richer install UI + required by PWABuilder /
    // Play store packaging). Narrow = phone form factor.
    screenshots: [
      {
        src: "/screenshots/sc-1.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "인터벌 운동 타이머",
      },
      {
        src: "/screenshots/sc-2.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "AI 부위별 루틴 추천",
      },
      {
        src: "/screenshots/sc-3.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "기록 · 레벨 · 커뮤니티",
      },
    ],
    shortcuts: [
      {
        name: "타이머 시작",
        short_name: "타이머",
        description: "인터벌 타이머 빌더로 이동",
        url: "/timer",
      },
      {
        name: "AI 운동 추천",
        short_name: "추천",
        description: "부위별 AI 루틴 추천",
        url: "/discover",
      },
    ],
  };
}
