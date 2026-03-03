import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: {
    default: '龙岩师范附属小学 | 智慧校园',
    template: '%s | 龙岩师范附属小学智慧校园',
  },
  description:
    '龙岩师范附属小学智慧校园管理平台，统一门户、统一身份认证、统一数据管理。总务后勤、教务教研、德育管理、教师空间一体化。',
  keywords: [
    '龙岩师范附属小学',
    '智慧校园',
    '校园管理',
    '教务系统',
    '德育管理',
    '总务后勤',
    '班主任工作台',
    '家校沟通',
  ],
  authors: [{ name: '龙岩师范附属小学', url: 'https://lysf.fx.edu.cn' }],
  generator: 'Coze Code',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: '龙岩师范附属小学 | 智慧校园管理平台',
    description:
      '百年名校，薪火相传。以"修身、力学、博雅、聪慧"为校训，打造有温度的智慧校园。',
    url: 'https://lysf.fx.edu.cn',
    siteName: '龙岩师范附属小学智慧校园',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <AuthProvider>
          <MainLayout>
            {isDev && <Inspector />}
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
