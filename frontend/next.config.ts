import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ECS/Fargate 上で `node server.js` として動かすためのスタンドアロン出力
  output: "standalone",
};

export default nextConfig;
