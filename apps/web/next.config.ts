import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["next-auth", "@peakIntel/database"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  output: process.env.VERCEL ? undefined : "standalone",
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://peakin-publi-wyhvz0nrfxzp-317908020.ap-south-1.elb.amazonaws.com/:path*",
        },
        {
          source: "/socket.io",
          destination: "http://peakin-publi-wyhvz0nrfxzp-317908020.ap-south-1.elb.amazonaws.com/socket.io/",
        },
        {
          source: "/socket.io/:path*",
          destination: "http://peakin-publi-wyhvz0nrfxzp-317908020.ap-south-1.elb.amazonaws.com/socket.io/:path*",
        },
      ],
    };
  },
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || "true",
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
