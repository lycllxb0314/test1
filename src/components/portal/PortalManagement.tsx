'use client';

/**
 * 门户管理组件
 * 
 * 管理学校门户页面内容：
 * - 轮播图管理
 * - 童心教育管理
 * - 办学荣誉管理
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Image as ImageIcon,
  Shield,
  Award,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';

// ==================== 类型定义 ====================

interface CarouselItem {
  id: string;
  type: 'image' | 'video' | 'bilibili';
  image: string;
  video_url?: string;
  bilibili_url?: string;
  bilibili_bvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  sort_order: number;
  is_active: boolean;
}

interface PhilosophyItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

interface HonorItem {
  id: string;
  title: string;
  year?: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}

// 图标选项
const iconOptions = [
  { value: 'Shield', label: '盾牌（德育）' },
  { value: 'Lightbulb', label: '灯泡（智慧）' },
  { value: 'Palette', label: '调色板（艺术）' },
  { value: 'Heart', label: '爱心（心理）' },
  { value: 'BookHeart', label: '书本爱心（阅读）' },
  { value: 'TreePine', label: '松树（环境）' },
];

// ==================== 门户管理主组件 ====================

export function PortalManagement() {
  const [activeTab, setActiveTab] = useState('carousel');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="carousel" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            轮播图管理
          </TabsTrigger>
          <TabsTrigger value="philosophy" className="gap-2">
            <Shield className="h-4 w-4" />
            童心教育管理
          </TabsTrigger>
          <TabsTrigger value="honors" className="gap-2">
            <Award className="h-4 w-4" />
            办学荣誉管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carousel" className="mt-4">
          <CarouselManagement />
        </TabsContent>

        <TabsContent value="philosophy" className="mt-4">
          <PhilosophyManagement />
        </TabsContent>

        <TabsContent value="honors" className="mt-4">
          <HonorsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== 轮播图管理 ====================

function CarouselManagement() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: CarouselItem | null }>({ open: false });
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video' | 'bilibili',
    image: '',
    videoUrl: '',
    bilibiliUrl: '',
    bilibiliBvid: '',
    title: '',
    subtitle: '',
    tag: '',
    sortOrder: 0,
    isActive: true,
  });

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
      }
    } catch (error) {
      console.error('Failed to save:', error);
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
    setFormData({
      type: 'image',
      image: '',
      videoUrl: '',
      bilibiliUrl: '',
      bilibiliBvid: '',
      title: '',
      subtitle: '',
      tag: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openEdit = (item?: CarouselItem) => {
    if (item) {
      setFormData({
        type: item.type,
        image: item.image,
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
            <CardDescription>管理门户首页轮播图内容</CardDescription>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialog.item ? '编辑轮播图' : '新增轮播图'}</DialogTitle>
            <DialogDescription>填写轮播图信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>类型</Label>
              <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
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
            <div className="grid gap-2">
              <Label>图片地址</Label>
              <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
            </div>
            {formData.type === 'bilibili' && (
              <>
                <div className="grid gap-2">
                  <Label>B站嵌入地址</Label>
                  <Input value={formData.bilibiliUrl} onChange={(e) => setFormData({ ...formData, bilibiliUrl: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>BV号</Label>
                  <Input value={formData.bilibiliBvid} onChange={(e) => setFormData({ ...formData, bilibiliBvid: e.target.value })} />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label>标题 *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>副标题</Label>
              <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>标签</Label>
              <Input value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} />
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

// ==================== 童心教育管理 ====================

function PhilosophyManagement() {
  const [items, setItems] = useState<PhilosophyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: PhilosophyItem | null }>({ open: false });
  const [formData, setFormData] = useState({
    icon: 'Shield',
    title: '',
    subtitle: '',
    image: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portal/philosophy?includeInactive=true');
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch philosophy:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const url = '/api/admin/portal/philosophy';
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
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项吗？')) return;
    try {
      const res = await fetch(`/api/admin/portal/philosophy?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleActive = async (item: PhilosophyItem) => {
    try {
      const res = await fetch('/api/admin/portal/philosophy', {
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
    setFormData({
      icon: 'Shield',
      title: '',
      subtitle: '',
      image: '',
      description: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openEdit = (item?: PhilosophyItem) => {
    if (item) {
      setFormData({
        icon: item.icon,
        title: item.title,
        subtitle: item.subtitle,
        image: item.image,
        description: item.description || '',
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
            <CardTitle>童心教育管理</CardTitle>
            <CardDescription>管理童心教育六大路径内容</CardDescription>
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
                    <Badge variant="outline" className="text-xs">{item.subtitle}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{item.description}</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialog.item ? '编辑童心教育' : '新增童心教育'}</DialogTitle>
            <DialogDescription>填写童心教育路径信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>图标</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>图片地址</Label>
              <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>标题 *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>副标题 *</Label>
              <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>描述</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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

// ==================== 办学荣誉管理 ====================

function HonorsManagement() {
  const [items, setItems] = useState<HonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: HonorItem | null }>({ open: false });
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portal/honors?includeInactive=true');
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch honors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const url = '/api/admin/portal/honors';
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
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项吗？')) return;
    try {
      const res = await fetch(`/api/admin/portal/honors?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleActive = async (item: HonorItem) => {
    try {
      const res = await fetch('/api/admin/portal/honors', {
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
    setFormData({
      title: '',
      year: '',
      description: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openEdit = (item?: HonorItem) => {
    if (item) {
      setFormData({
        title: item.title,
        year: item.year || '',
        description: item.description || '',
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
            <CardTitle>办学荣誉管理</CardTitle>
            <CardDescription>管理学校办学荣誉展示</CardDescription>
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
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">{item.title}</span>
                    {item.year && <Badge className="text-xs">{item.year}</Badge>}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                  )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialog.item ? '编辑办学荣誉' : '新增办学荣誉'}</DialogTitle>
            <DialogDescription>填写办学荣誉信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>荣誉名称 *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>年份/次数</Label>
              <Input value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="如：连续8届" />
            </div>
            <div className="grid gap-2">
              <Label>描述</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
