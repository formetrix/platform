import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js walks up looking for a lockfile to infer the workspace
  // root, and finds an unrelated one in the user's home directory
  // before this project's. Pin it explicitly to silence that warning.
  outputFileTracingRoot: path.join(__dirname),
  // mapbox-gl ships modern ESM; keep it in the app transpile graph for
  // consistent client bundling (FM-0015).
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
