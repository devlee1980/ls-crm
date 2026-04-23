import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
  },
  async redirects() {
    return [
      // Permanently send legacy ls-nexus.com hostnames to the new
      // crm.lifescientific.com primary so the parent domain's reputation
      // (registered 2010, "Business" in every URL filter) shields users
      // sitting behind enterprise web filters that flag freshly-registered
      // domains as "New Domains".
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(www\\.)?ls-nexus\\.com",
          },
        ],
        destination: "https://crm.lifescientific.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
