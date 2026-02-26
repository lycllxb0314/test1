'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Newspaper,
  Trophy,
  Image as ImageIcon,
  Edit,
  ArrowRight,
  Eye,
  Plus,
  Clock,
} from 'lucide-react';

interface Stats {
  newsCount: number;
  honorsCount: number;
  imagesCount: number;
  sectionsCount: number;
}

interface News {
  id: number;
  title: string;
  category: string;
  publish_date: string;
  is_top: boolean;
}

interface Honor {
  id: number;
  title: string;
  year: string;
  level: string;
}

export default function HomePageManagement() {
  const [stats, setStats] = useState<Stats>({ newsCount: 0, honorsCount: 0, imagesCount: 0, sectionsCount: 0 });
  const [recentNews, setRecentNews] = useState<News[]>([]);
  const [recentHonors, setRecentHonors] = useState<Honor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsRes, honorsRes] = await Promise.all([
        fetch('/api/homepage/news?limit=5'),
        fetch('/api/homepage/honors'),
      ]);

      const newsData = await newsRes.json();
      const honorsData = await honorsRes.json();

      setRecentNews(newsData.data || []);
      setRecentHonors((honorsData.data || []).slice(0, 6));
      setStats({
        newsCount: newsData.total || 0,
        honorsCount: (honorsData.data || []).length,
        imagesCount: 0,
        sectionsCount: 0,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '喜讯': return 'bg-red-100 text-red-700';
      case '活动': return 'bg-green-100 text-green-700';
      case '通知': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case '国家级': return 'bg-red-100 text-red-700';
      case '省级': return 'bg-orange-100 text-orange-700';
      case '市级': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">主页内容管理</h1>
          <p className="text-gray-500 mt-1">管理学校主页展示的内容、新闻、荣誉等</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              预览主页
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">新闻数量</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newsCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Newspaper className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">荣誉数量</p>
                <p className="text-2xl font-bold text-orange-600">{stats.honorsCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Trophy className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">图片资源</p>
                <p className="text-2xl font-bold text-green-600">{stats.imagesCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <ImageIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">内容区块</p>
                <p className="text-2xl font-bold text-purple-600">{stats.sectionsCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Edit className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">快捷入口</CardTitle>
          <CardDescription>点击进入对应内容管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/homepage/news" className="group">
              <div className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <Newspaper className="h-8 w-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">新闻管理</p>
                <p className="text-sm text-gray-500">发布和管理新闻</p>
              </div>
            </Link>
            <Link href="/homepage/honors" className="group">
              <div className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors">
                <Trophy className="h-8 w-8 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">荣誉管理</p>
                <p className="text-sm text-gray-500">展示学校荣誉</p>
              </div>
            </Link>
            <Link href="/homepage/images" className="group">
              <div className="p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                <ImageIcon className="h-8 w-8 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">图片管理</p>
                <p className="text-sm text-gray-500">管理图片资源</p>
              </div>
            </Link>
            <Link href="/homepage/sections" className="group">
              <div className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                <Edit className="h-8 w-8 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">区块设置</p>
                <p className="text-sm text-gray-500">编辑内容区块</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 最新内容 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最新新闻 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">最新新闻</CardTitle>
              <CardDescription>最近发布的新闻动态</CardDescription>
            </div>
            <Link href="/homepage/news">
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : recentNews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Newspaper className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>暂无新闻，点击添加</p>
                <Link href="/homepage/news">
                  <Button size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" /> 添加新闻
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNews.map((news) => (
                  <div key={news.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 line-clamp-1">{news.title}</p>
                        {news.is_top && <Badge className="bg-red-100 text-red-700 text-xs">置顶</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Badge className={getCategoryColor(news.category)}>{news.category || '新闻'}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {news.publish_date?.split('T')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 荣誉展示 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">荣誉展示</CardTitle>
              <CardDescription>学校获得的荣誉</CardDescription>
            </div>
            <Link href="/homepage/honors">
              <Button variant="ghost" size="sm" className="text-orange-600">
                查看全部 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : recentHonors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>暂无荣誉，点击添加</p>
                <Link href="/homepage/honors">
                  <Button size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" /> 添加荣誉
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentHonors.map((honor) => (
                  <div key={honor.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{honor.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getLevelColor(honor.level)}>{honor.level || '校级'}</Badge>
                      <span className="text-xs text-gray-500">{honor.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
