// FILE: apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@studio/shared", "@studio/db", "@studio/providers"],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;