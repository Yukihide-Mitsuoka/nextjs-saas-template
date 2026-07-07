import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run runs the standalone server bundle (smallest image, no node_modules copy).
  output: "standalone",
};

export default nextConfig;
