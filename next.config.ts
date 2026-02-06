import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images (Strava profile pictures)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dgalywyr863hv.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.strava.com",
      },
    ],
  },
  // Server external packages that need native Node.js APIs
  serverExternalPackages: ["pg"],
};

export default nextConfig;
