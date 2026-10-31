import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development bundles separate from production builds. Running `next build`
  // while `next dev` is active can otherwise leave the dev runtime pointing at
  // production vendor chunks that are not present in its output.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    "@tensorflow/tfjs",
    "@tensorflow-models/blazeface",
  ],
};

export default nextConfig;
