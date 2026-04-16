import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
    // 开启图片优化
    formats: ['image/webp'],
    // 图片缓存时间
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 增加 API 请求体大小限制
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  
  // 优化配置
  reactStrictMode: true,
  
  // 外部包配置 - 跳过 Babel 编译以避免兼容性问题（docx ESM与Next 16 Babel常量折叠冲突）
  serverExternalPackages: ['docx'],
  
  // 编译优化
  compiler: {
    // 移除 console.log (仅生产环境)
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 模块导入优化
  // 注意: lucide-react 的图标文件名格式为 'calendar.js' 而非 'calendar-icon.js'
  // 暂时禁用 modularizeImports 以避免构建错误
  // modularizeImports: {
  //   'lucide-react': {
  //     transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
  //     skipDefaultConversion: true,
  //   },
  // },
  
  // 生产环境头部配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // 静态资源缓存
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 图片资源缓存
        source: '/:path(.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  
  // 重定向配置
  async redirects() {
    return [
      // 可以在这里添加重定向规则
    ];
  },
};

export default nextConfig;
