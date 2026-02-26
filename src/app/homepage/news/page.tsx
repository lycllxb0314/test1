'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Newspaper,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

interface News {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  cover_image: string;
  is_top: boolean;
  view_count: number;
  publish_date: string;
  created_at: string;
}

export default function NewsManagementPage() {
  const { user } = useAuth();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // 编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '新闻',
    cover_image: '',
    is_top: false,
  });

  useEffect(() => {
    fetchNews();
  }, [page, categoryFilter]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/homepage/news?${params}`);
      const data = await res.json();
      setNewsList(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: '新闻',
      cover_image: '',
      is_top: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (news: News) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary || '',
      content: news.content || '',
      category: news.category || '新闻',
      cover_image: news.cover_image || '',
      is_top: news.is_top,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) return;

    try {
      if (editingNews) {
        // 更新
        await fetch('/api/homepage/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNews.id,
            ...formData,
          }),
        });
      } else {
        // 创建
        await fetch('/api/homepage/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            publish_date: new Date().toISOString(),
            created_by: user?.name,
          }),
        });
      }
      setDialogOpen(false);
      fetchNews();
    } catch (error) {
      console.error('Failed to save news:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条新闻吗？')) return;

    try {
      await fetch(`/api/homepage/news?id=${id}`, { method: 'DELETE' });
      fetchNews();
    } catch (error) {
      console.error('Failed to delete news:', error);
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

  const filteredNews = newsList.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / pageSize);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新闻管理</h1>
            <p className="text-gray-500 mt-1">发布和管理学校新闻动态</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            发布新闻
          </Button>
        </div>

        {/* 筛选和搜索 */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索新闻标题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部分类</SelectItem>
                  <SelectItem value="新闻">新闻</SelectItem>
                  <SelectItem value="喜讯">喜讯</SelectItem>
                  <SelectItem value="活动">活动</SelectItem>
                  <SelectItem value="通知">通知</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 新闻列表 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">新闻列表</CardTitle>
            <CardDescription>共 {total} 条新闻</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Newspaper className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>暂无新闻</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNews.map((news) => (
                  <div
                    key={news.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {news.is_top && (
                          <Badge className="bg-red-500 text-white text-xs">置顶</Badge>
                        )}
                        <p className="font-medium text-gray-900">{news.title}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <Badge className={getCategoryColor(news.category || '新闻')}>
                          {news.category || '新闻'}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {news.publish_date?.split('T')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {news.view_count || 0} 次浏览
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(news)}
                        className="text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(news.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  第 {page + 1} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 编辑弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNews ? '编辑新闻' : '发布新闻'}</DialogTitle>
              <DialogDescription>
                {editingNews ? '修改新闻内容' : '填写新闻信息发布新新闻'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">标题 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入新闻标题"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">分类</label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="新闻">新闻</SelectItem>
                      <SelectItem value="喜讯">喜讯</SelectItem>
                      <SelectItem value="活动">活动</SelectItem>
                      <SelectItem value="通知">通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">封面图片</label>
                  <Input
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="图片URL"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">摘要</label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="新闻摘要..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">正文内容</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="新闻正文..."
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_top"
                  checked={formData.is_top}
                  onChange={(e) => setFormData({ ...formData, is_top: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_top" className="text-sm text-gray-700">
                  置顶显示
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingNews ? '保存修改' : '发布新闻'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
