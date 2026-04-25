import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "termin.workforall.sk",
          },
        ],
        destination: "/booking",
      },
    ];
  },
};

export default nextConfig;