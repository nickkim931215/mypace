import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Firebase IDX / Cloud Workstations preview hosts in dev.
  // The exact host changes per workspace, so we allow the wildcard suffix.
  allowedDevOrigins: [
    "*.cloudworkstations.dev",
    "*.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev",
  ],
};

export default nextConfig;
