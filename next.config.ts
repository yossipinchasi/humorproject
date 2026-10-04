import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/**`),
    ],
  },
  experimental: {
    serverActions: {
      // Photos are downscaled in the browser first, this is just headroom.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
