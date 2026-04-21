'use client';

/**
 * 公告新闻管理子组件
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff, Bell, Newspaper, Loader2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { AnnouncementItem, AnnouncementType, PublishStatus } from './types';

const defaultFormData = {
  title: '',
  summary: '',
  content: '',
  type: 'announcement' as AnnouncementType,
  category: '',
  mediaLevel: '',
  department: '学校办公室',
  coverImage: '',
  coverImageKey: '',
  publishStatus: 'pending' as PublishStatus,
  publishedAt: '',
  scheduledPublishAt: '',
  autoUnpublish: false,
  autoUnpublishAt: '',
  isPinned: false,
  pinOrder: 0,
};

export function AnnouncementsManagement() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'announcement' | 'news'>('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: AnnouncementItem | null }>({ open: false });
  const [formData, setFormData] = useState({ ...defaultFormData });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/portal/announcements?type=${typeFilter}`);
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('请输入标题');
      return;
    }

    try {
      const url = '/api/admin/portal/announcements';
      const method = editDialog.item ? 'PUT' : 'POST';
      
      let publishStatus = formData.publishStatus;
      let publishedAt = null;
      let scheduledPublishAt = null;
      
      if (formData.publishStatus === 'published') {
        publishedAt = new Date().toISOString();
      } else if (formData.publishStatus === 'scheduled' && formData.scheduledPublishAt) {
        scheduledPublishAt = new Date(formData.scheduledPublishAt).toISOString();
      }
      
      const body = editDialog.item
        ? {
            id: editDialog.item.id,
            title: formData.title,
            summary: formData.summary,
            content: formData.content,
            type: formData.type,
            category: formData.category || null,
            mediaLevel: formData.mediaLevel || null,
            department: formData.department,
            coverImage: formData.coverImage || null,
            publishStatus,
            publishedAt,
            scheduledPublishAt,
            autoUnpublish: formData.autoUnpublish,
            autoUnpublishAt: formData.autoUnpublish ? (formData.autoUnpublishAt ? new Date(formData.autoUnpublishAt).toISOString() : null) : null,
            isPinned: formData.isPinned,
            pinOrder: formData.pinOrder,
          }
        : {
            title: formData.title,
            summary: formData.summary,
            content: formData.content,
            type: formData.type,
            category: formData.category || null,
            mediaLevel: formData.mediaLevel || null,
            department: formData.department,
            coverImage: formData.coverImage || null,
            publishStatus,
            publishedAt,
            scheduledPublishAt,
            autoUnpublish: formData.autoUnpublish,
            autoUnpublishAt: formData.autoUnpublish ? (formData.autoUnpublishAt ? new Date(formData.autoUnpublishAt).toISOString() : null) : null,
            isPinned: formData.isPinned,
            pinOrder: formData.pinOrder,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        fetchData();
        setEditDialog({ open: false, item: null });
        resetForm();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项吗？')) return;
    try {
      const res = await fetch(`/api/admin/portal/announcements?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleTogglePublish = async (item: AnnouncementItem) => {
    try {
      const newStatus = item.publishStatus === 'published' ? 'unpublished' : 'published';
      const res = await fetch('/api/admin/portal/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          publishStatus: newStatus,
          publishedAt: newStatus === 'published' ? new Date().toISOString() : item.publishedAt,
        }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleTogglePin = async (item: AnnouncementItem) => {
    try {
      const res = await fetch('/api/admin/portal/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isPinned: !item.isPinned }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const resetForm = () => {
    setFormData({ ...defaultFormData });
  };

  const openEdit = (item?: AnnouncementItem) => {
    if (item) {
      setFormData({
        title: item.title,
        summary: item.summary || '',
        content: item.content || '',
        type: item.type,
        category: item.category || '',
        mediaLevel: item.mediaLevel || '',
        department: item.department || '学校办公室',
        coverImage: item.coverImage || '',
        coverImageKey: '',
        publishStatus: item.publishStatus,
        publishedAt: item.publishedAt || '',
        scheduledPublishAt: item.scheduledPublishAt || '',
        autoUnpublish: item.autoUnpublish || false,
        autoUnpublishAt: item.autoUnpublishAt || '',
        isPinned: item.isPinned,
        pinOrder: item.pinOrder,
      });
      setEditDialog({ open: true, item });
    } else {
      resetForm();
      setEditDialog({ open: true, item: null });
    }
  };

  const getCategoryLabel = (category?: string) => {
    const categoryMap: Record<string, string> = {
      '校园新闻': '校园新闻',
      '荣誉喜报': '荣誉喜报',
      '教育教学': '教育教学',
      '媒体附小': '媒体附小',
    };
    return category ? categoryMap[category] || category : '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700">已发布</Badge>;
      case 'unpublished':
        return <Badge className="bg-gray-100 text-gray-600">已下架</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700">定时发布</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">待发布</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>公告新闻管理</CardTitle>
            <CardDescription>管理发布到主页的校园公告和新闻动态</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'announcement' | 'news')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="announcement">公告</SelectItem>
                <SelectItem value="news">新闻</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => openEdit()}>
              <Plus className="h-4 w-4 mr-1" />
              新增
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无数据
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  item.isPinned ? 'bg-amber-50 border-amber-200' : 'bg-white'
                }`}
              >
                {item.coverImage && (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-20 h-14 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === 'announcement' ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Newspaper className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="font-medium truncate">{item.title}</span>
                    {item.isPinned && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 text-xs">
                        置顶
                      </Badge>
                    )}
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    )}
                    {item.mediaLevel && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        {item.mediaLevel}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{item.department}</span>
                    <span>·</span>
                    <span>{item.viewCount} 次浏览</span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(item.publishStatus)}
                    {item.publishStatus === 'scheduled' && item.scheduledPublishAt && (
                      <span className="text-xs text-blue-600">
                        {new Date(item.scheduledPublishAt).toLocaleString()}
                      </span>
                    )}
                    {item.autoUnpublish && item.autoUnpublishAt && (
                      <span className="text-xs text-orange-600">
                        下架: {new Date(item.autoUnpublishAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(item)}
                    title={item.isPinned ? '取消置顶' : '置顶'}
                  >
                    {item.isPinned ? (
                      <EyeOff className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(item)}
                    title={item.publishStatus === 'published' ? '下架' : '发布'}
                  >
                    {item.publishStatus === 'published' ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 编辑对话框 */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, item: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.item ? '编辑' : '新增'}{formData.type === 'announcement' ? '公告' : '新闻'}</DialogTitle>
            <DialogDescription>填写内容信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>类型</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as AnnouncementType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">校园公告</SelectItem>
                  <SelectItem value="news">新闻动态</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>标题 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入标题"
              />
            </div>
            <div className="grid gap-2">
              <Label>摘要</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="用于列表页展示的简短描述"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>正文内容</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="详细内容"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'news' ? (
                      <>
                        <SelectItem value="校园新闻">校园新闻</SelectItem>
                        <SelectItem value="荣誉喜报">荣誉喜报</SelectItem>
                        <SelectItem value="教育教学">教育教学</SelectItem>
                        <SelectItem value="媒体附小">媒体附小</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="学校通知">学校通知</SelectItem>
                        <SelectItem value="教务通知">教务通知</SelectItem>
                        <SelectItem value="德育通知">德育通知</SelectItem>
                        <SelectItem value="总务通知">总务通知</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {formData.category === '媒体附小' && (
                <div className="grid gap-2">
                  <Label>媒体级别</Label>
                  <Select
                    value={formData.mediaLevel}
                    onValueChange={(v) => setFormData({ ...formData, mediaLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="国家级">国家级</SelectItem>
                      <SelectItem value="省级">省级</SelectItem>
                      <SelectItem value="市级">市级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>封面图</Label>
              <ImageUpload
                value={formData.coverImage}
                onChange={(url, key) => setFormData({ ...formData, coverImage: url, coverImageKey: key || '' })}
                label=""
              />
            </div>
            <div className="grid gap-2">
              <Label>发布部门</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="如：学校办公室"
              />
            </div>
            <div className="grid gap-2">
              <Label>发布状态</Label>
              <Select
                value={formData.publishStatus}
                onValueChange={(v) => setFormData({ ...formData, publishStatus: v as PublishStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待发布</SelectItem>
                  <SelectItem value="published">立即发布</SelectItem>
                  <SelectItem value="scheduled">定时发布</SelectItem>
                  <SelectItem value="unpublished">已下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.publishStatus === 'scheduled' && (
              <div className="grid gap-2">
                <Label>定时发布时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledPublishAt}
                  onChange={(e) => setFormData({ ...formData, scheduledPublishAt: e.target.value })}
                />
                <p className="text-xs text-gray-500">到达设定时间后将自动发布</p>
              </div>
            )}
            
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Switch
                  checked={formData.autoUnpublish}
                  onCheckedChange={(v) => setFormData({ ...formData, autoUnpublish: v })}
                />
                <Label>启用定时下架</Label>
              </div>
              {formData.autoUnpublish && (
                <div className="grid gap-2">
                  <Label>定时下架时间</Label>
                  <Input
                    type="datetime-local"
                    value={formData.autoUnpublishAt}
                    onChange={(e) => setFormData({ ...formData, autoUnpublishAt: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">到达设定时间后将自动下架</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isPinned}
                  onCheckedChange={(v) => setFormData({ ...formData, isPinned: v })}
                />
                <Label>置顶显示</Label>
              </div>
              {formData.isPinned && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">排序</Label>
                  <Input
                    type="number"
                    value={formData.pinOrder}
                    onChange={(e) => setFormData({ ...formData, pinOrder: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, item: null })}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
