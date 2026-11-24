import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same network use the dev server through the computer's IP.
  allowedDevOrigins: ["10.*.*.*", "172.*.*.*", "192.168.*.*"],
  // The floating "N" button sat on top of the mobile back arrow. Errors still show.
  devIndicators: false,
};

export default nextConfig;
