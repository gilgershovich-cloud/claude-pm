import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project is nested inside another repo that also has a lockfile, so pin
  // the workspace root here to avoid Turbopack inferring the parent directory.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
