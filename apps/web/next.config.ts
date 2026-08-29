import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.VERCEL ? undefined : "standalone",
  async rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
