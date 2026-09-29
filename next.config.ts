import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin workspace root so Turbopack never walks up to C:\Users\MENTOR
    // looking for a lockfile.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
