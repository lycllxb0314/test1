'use client';

/**
 * 轮播图管理子组件
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Image as ImageIcon, Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff, GripVertical } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { CarouselItem, CarouselItemType } from './types';

const defaultFormData = {
  type: 'image' as CarouselItemType,
  image: '',
  imageKey: '',
  videoUrl: '',
  bilibiliUrl: '',
  bilibiliBvid: '',
  title: '',
  subtitle: '',
  tag: '',
  sortOrder: 0,
  isActive: true,
};

export function CarouselManagement() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: CarouselItem | null }>({ open: false });
  const [formData, setFormData] = useState({ ...defaultFormData });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portal/carousel?includeInactive=true');
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch carousel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const url = '/api/admin/portal/carousel';
      const method = editDialog.item ? 'PUT' : 'POST';
      const body = editDialog.item
        ? { id: editDialog.item.id, ...formData }
        : formData;

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
      const res = await fetch(`/api/admin/portal/carousel?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleActive = async (item: CarouselItem) => {
    try {
      const res = await fetch('/api/admin/portal/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const resetForm = () => {
    setFormData({ ...defaultFormData });
  };

  const openEdit = (item?: CarouselItem) => {
    if (item) {
      setFormData({
        type: item.type,
        image: item.image,
        imageKey: '',
        videoUrl: item.video_url || '',
        bilibiliUrl: item.bilibili_url || '',
        bilibiliBvid: item.bilibili_bvid || '',
        title: item.title,
        subtitle: item.subtitle || '',
        tag: item.tag || '',
        sortOrder: item.sort_order,
        isActive: item.is_active,
      });
      setEditDialog({ open: true, item });
    } else {
      resetForm();
      setEditDialog({ open: true, item: null });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>轮播图管理</CardTitle>
            <CardDescription>管理门户首页轮播图内容，支持图片上传</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
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
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-shrink-0">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">{item.title}</span>
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    {item.tag && <Badge className="text-xs">{item.tag}</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(item)}
                    title={item.is_active ? '点击下架' : '点击发布'}
                  >
                    {item.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.item ? '编辑轮播图' : '新增轮播图'}</DialogTitle>
            <DialogDescription>填写轮播图信息，支持图片上传</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>类型</Label>
              <Select value={formData.type} onValueChange={(v: CarouselItemType) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">图片</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="bilibili">B站视频</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ImageUpload
              value={formData.image}
              onChange={(url, key) => setFormData({ ...formData, image: url, imageKey: key || '' })}
              label="封面图片"
            />
            {formData.type === 'bilibili' && (
              <>
                <div className="grid gap-2">
                  <Label>B站嵌入地址</Label>
                  <Input value={formData.bilibiliUrl} onChange={(e) => setFormData({ ...formData, bilibiliUrl: e.target.value })} placeholder="https://player.bilibili.com/..." />
                </div>
                <div className="grid gap-2">
                  <Label>BV号</Label>
                  <Input value={formData.bilibiliBvid} onChange={(e) => setFormData({ ...formData, bilibiliBvid: e.target.value })} placeholder="BV1WdPczBEVv" />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label>标题 *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="轮播图标题" />
            </div>
            <div className="grid gap-2">
              <Label>副标题</Label>
              <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="简短描述" />
            </div>
            <div className="grid gap-2">
              <Label>标签</Label>
              <Input value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} placeholder="如：科创特色" />
            </div>
            <div className="grid gap-2">
              <Label>排序</Label>
              <Input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />
              <Label>启用</Label>
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
