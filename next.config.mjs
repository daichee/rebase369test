/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // React 19 & Next.js 15 ハイドレーション問題の緩和
    serverComponentsExternalPackages: ['zustand']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // React Error #130 対策: デバッグ情報保持とハイドレーション改善
  compiler: {
    removeConsole: false,
  },
  // ハイドレーション警告の抑制（React 19互換性問題対応）
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
