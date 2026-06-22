import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/lib/i18n";
import { SyncBridge } from "@/components/sync-bridge";
import { Pwa } from "@/components/pwa";
import { UiSounds } from "@/components/ui-sounds";
import { AnalyticsProvider } from "@/components/analytics-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyPace — Rhythm-Driven Workout Timer",
  description:
    "나만의 페이스로. 인터벌 타이머 · 메트로놈 · AI 추천 운동 · 커뮤니티.",
  applicationName: "MyPace",
  appleWebApp: {
    capable: true,
    title: "MyPace",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Capture the install prompt as early as possible. The browser can fire
            `beforeinstallprompt` before React hydrates and attaches its listener;
            stashing it here (then replaying via a custom event) is what makes the
            install banner reliably appear on phones, not just tablets. */}
        <script
          id="bip-capture"
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bipEvent=e;window.dispatchEvent(new Event('bipready'));});window.addEventListener('appinstalled',function(){window.__bipEvent=null;window.dispatchEvent(new Event('bipinstalled'));});",
          }}
        />
        <LocaleProvider>
          <AuthProvider>
            <SyncBridge />
            <UiSounds />
            <AnalyticsProvider />
            {children}
            <Pwa />
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
