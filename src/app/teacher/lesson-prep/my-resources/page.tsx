/**
 * 我的教学资源库
 * 
 * 教师个人教学资源管理页面
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  FolderOpen, 
  BookOpen, 
  Trash2, 
  Eye, 
  Clock,
  Filter,
  Search,
  FileText,
  Mic2,
  PenTool,
  MessageCircle,
  Calculator,
} from 'lucide-react';
import type { ResourceListItem, ResourceStatistics, ResourceCategory } from '@/types/teaching-resource';

// 分类名称映射
const CATEGORY_NAMES: Record<ResourceCategory, string> = {
  chinese_character: '语文·生字专项',
  chinese_reading: '语文·朗读教学',
  chinese_writing: '语文·习作专项',
  chinese_chat: '语文·备课智能体',
  math: '数学·备课中心',
  math_concept: '数学·概念教学',
  math_problem: '数学·问题设计',
  other: '其他',
};

// 分类图标映射
const CATEGORY_ICONS: Record<ResourceCategory, React.ElementType> = {
  chinese_character: FileText,
  chinese_reading: Mic2,
  chinese_writing: PenTool,
  chinese_chat: MessageCircle,
  math: Calculator,
  math_concept: Calculator,
  math_problem: Calculator,
  other: FolderOpen,
};

// 分类颜色映射
const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  chinese_character: 'bg-blue-500',
  chinese_reading: 'bg-green-500',
  chinese_writing: 'bg-purple-500',
  chinese_chat: 'bg-red-500',
  math: 'bg-indigo-500',
  math_concept: 'bg-indigo-500',
  math_problem: 'bg-cyan-500',
  other: 'bg-gray-500',
};

export default function MyResourcesPage() {
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [statistics, setStatistics] = useState<ResourceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [category, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载列表和统计
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/teaching-resources?category=${category}&search=${encodeURIComponent(search)}&pageSize=50`),
        fetch('/api/teaching-resources/statistics'),
      ]);

      const listData = await listRes.json();
      const statsData = await statsRes.json();

      if (listData.success) {
        setResources(listData.data || []);
      }
      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('加载资源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个资源吗？')) return;

    try {
      const res = await fetch(`/api/teaching-resources/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep">
              <Button variant="ghost" size="sm" className="hover:bg-white/60">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                我的教学资源库
              </h1>
              <p className="text-sm text-gray-500 mt-1">保存和管理您的教学素材，随时调用</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">资源总数</div>
                <div className="text-3xl font-bold text-indigo-600">{statistics.total}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">近7天新增</div>
                <div className="text-3xl font-bold text-green-600">{statistics.recentCount}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">语文资源</div>
                <div className="text-3xl font-bold text-blue-600">
                  {statistics.byCategory['chinese_character'] || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">其他学科</div>
                <div className="text-3xl font-bold text-purple-600">
                  {statistics.total - (statistics.byCategory['chinese_character'] || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 筛选栏 */}
        <Card className="border-0 shadow-md bg-white/80">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">筛选：</span>
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="资源分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  <SelectItem value="chinese_character">语文·生字专项</SelectItem>
                  <SelectItem value="chinese_reading">语文·朗读教学</SelectItem>
                  <SelectItem value="chinese_writing">语文·习作专项</SelectItem>
                  <SelectItem value="chinese_chat">语文·备课智能体</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索资源标题..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资源列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : resources.length === 0 ? (
          <Card className="border-0 shadow-md bg-white/80">
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">暂无资源</h3>
              <p className="text-sm text-gray-400 mb-4">
                在各学科专项工具中生成素材后，点击"保存到资源库"即可在此查看
              </p>
              <Link href="/teacher/lesson-prep/chinese/character">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  去生成教学素材
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const Icon = CATEGORY_ICONS[resource.category] || FolderOpen;
              const colorClass = CATEGORY_COLORS[resource.category] || 'bg-gray-500';
              
              return (
                <Link key={resource.id} href={`/teacher/lesson-prep/my-resources/${resource.id}`} className="block">
                  <Card className="border-0 shadow-md bg-white/90 hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer h-full">
                    <div className={`${colorClass} p-3`}>
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {CATEGORY_NAMES[resource.category]}
                          </span>
                        </div>
                        {resource.grade && (
                          <Badge className="bg-white/20 text-white border-0">
                            {resource.grade}年级
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {resource.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(resource.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
