/** @type {import('next').NextConfig} */
const nextConfig = {
  // @oneix/shared is an unbuilt workspace package (ships raw .ts) -- Next
  // needs to transpile it like it would its own source.
  transpilePackages: ["@oneix/shared"],
};

export default nextConfig;
