import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Firebase IDX / Cloud Workstations preview hosts in dev.
  // The exact host changes per workspace, so we allow the wildcard suffix.
  allowedDevOrigins: [
    "*.cloudworkstations.dev",
    "*.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev",
  ],
  // Proxy Firebase Auth's helper endpoints through our own origin so the
  // sign-in handler/iframe are first-party. Required for signInWithRedirect to
  // survive in installed PWAs and third-party-cookie-blocking browsers: when
  // authDomain points at <project>.firebaseapp.com (a different origin), the
  // redirect round-trip loses its session via storage partitioning. With this
  // proxy in place, set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN to this app's own
  // domain (e.g. mypace-wiqy.vercel.app) so the SDK hits these local paths.
  async rewrites() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return [];
    const authHost = `https://${projectId}.firebaseapp.com`;
    return {
      beforeFiles: [
        {
          source: "/__/auth/:path*",
          destination: `${authHost}/__/auth/:path*`,
        },
        {
          source: "/__/firebase/:path*",
          destination: `${authHost}/__/firebase/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Required so Firebase Google sign-in popup can postMessage back
          // through window.opener. Without this, restrictive defaults in
          // some preview environments sever the opener relationship and the
          // SDK reports the success as "auth/popup-closed-by-user".
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        // Always revalidate the service worker so updates ship immediately.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
