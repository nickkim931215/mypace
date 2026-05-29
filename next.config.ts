import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Firebase IDX / Cloud Workstations preview hosts in dev.
  // The exact host changes per workspace, so we allow the wildcard suffix.
  allowedDevOrigins: [
    "*.cloudworkstations.dev",
    "*.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev",
  ],
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
