import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the share-card route reads its fonts from disk at render time: make sure deploy bundles include them
  outputFileTracingIncludes: { "/share/score/card": ["./src/assets/fonts/**/*"] },
};

export default nextConfig;
