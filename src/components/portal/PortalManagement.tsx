'use client';

/**
 * 门户管理组件
 * 
 * 管理学校门户页面内容：
 * - 轮播图管理（支持图片上传）
 * - 童心教育管理（板块管理 + 活动内容管理）
 * - 成果特色办学管理（支持图片上传）
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  BookOpen,
  Music,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  GripVertical,
  Upload,
  X,
  Loader2,
  ChevronRight,
  ArrowLeft,
  FolderOpen,
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

// 童心教育板块
interface PhilosophyCategory {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  image_key?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

// 童心教育活动内容
interface PhilosophyActivity {
  id: string;
  category_id: string;
  title: string;
  image: string;
  image_key?: string;
  date?: string;
  summary?: string;
  content?: string;
  sort_order: number;
  is_active: boolean;
  category?: PhilosophyCategory;
}

// 成果分类
interface AchievementCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tag?: string;
  description?: string;
  featured_award_title?: string;
  featured_award_content?: string;
  stats?: Array<{ label: string; value: string }>;
  honors_list?: Array<{ title: string; subtitle: string }>;
  sort_order: number;
  is_active: boolean;
}

// 成果项目
interface AchievementItem {
  id: string;
  category_id: string;
  title: string;
  image: string;
  image_key?: string;
  date?: string;
  summary?: string;
  highlights?: string[];
  sort_order: number;
  is_active: boolean;
  category?: AchievementCategory;
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

// 成果图标映射
const achievementIconMap: Record<string, any> = {
  Sparkles,
  BookOpen,
  Music,
};

// ==================== 图片上传组件 ====================

interface ImageUploadProps {
  value: string;
  onChange: (url: string, key?: string) => void;
  label?: string;
}

function ImageUpload({ value, onChange, label = '图片' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、GIF、WEBP 格式的图片');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        onChange(result.data.url, result.data.key);
      } else {
        alert(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-200'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <div className="relative aspect-video">
            <img src={value} alt="预览" className="w-full h-full object-cover rounded-lg" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => onChange('', '')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽图片到此处上传</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、GIF、WEBP，最大 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

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
          <TabsTrigger value="achievements" className="gap-2">
            <Sparkles className="h-4 w-4" />
            成果特色办学
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carousel" className="mt-4">
          <CarouselManagement />
        </TabsContent>

        <TabsContent value="philosophy" className="mt-4">
          <PhilosophyManagement />
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <AchievementsManagement />
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
    imageKey: '',
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
    setFormData({
      type: 'image',
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
    });
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

// ==================== 童心教育管理（两层结构） ====================

function PhilosophyManagement() {
  // 视图状态：'categories' = 板块列表，'activities' = 活动内容列表
  const [view, setView] = useState<'categories' | 'activities'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<PhilosophyCategory | null>(null);

  // 板块数据
  const [categories, setCategories] = useState<PhilosophyCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // 活动数据
  const [activities, setActivities] = useState<PhilosophyActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // 板块编辑对话框
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; item?: PhilosophyCategory | null }>({ open: false });
  const [categoryForm, setCategoryForm] = useState({
    icon: 'Shield',
    title: '',
    subtitle: '',
    image: '',
    imageKey: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  // 活动编辑对话框
  const [activityDialog, setActivityDialog] = useState<{ open: boolean; item?: PhilosophyActivity | null }>({ open: false });
  const [activityForm, setActivityForm] = useState({
    categoryId: '',
    title: '',
    image: '',
    imageKey: '',
    date: '',
    summary: '',
    content: '',
    sortOrder: 0,
    isActive: true,
  });

  // 获取板块列表
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/admin/portal/philosophy?includeInactive=true');
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 获取活动列表
  const fetchActivities = async (categoryId?: string) => {
    setActivitiesLoading(true);
    try {
      const id = categoryId || selectedCategory?.id;
      if (!id) return;
      
      const res = await fetch(`/api/admin/portal/philosophy/activities?includeInactive=true&categoryId=${id}`);
      const result = await res.json();
      if (result.success) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 进入板块查看活动
  const enterCategory = (category: PhilosophyCategory) => {
    setSelectedCategory(category);
    setView('activities');
    setActivities([]);
    fetchActivities(category.id);
  };

  // 返回板块列表
  const backToCategories = () => {
    setView('categories');
    setSelectedCategory(null);
    setActivities([]);
  };

  // ========== 板块管理 ==========

  const saveCategory = async () => {
    try {
      const url = '/api/admin/portal/philosophy';
      const method = categoryDialog.item ? 'PUT' : 'POST';
      const body = categoryDialog.item
        ? { id: categoryDialog.item.id, ...categoryForm }
        : categoryForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        fetchCategories();
        setCategoryDialog({ open: false, item: null });
        resetCategoryForm();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('保存失败');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('确定要删除此板块吗？板块下的所有活动也会被删除！')) return;
    try {
      const res = await fetch(`/api/admin/portal/philosophy?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const toggleCategoryActive = async (item: PhilosophyCategory) => {
    try {
      const res = await fetch('/api/admin/portal/philosophy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      icon: 'Shield',
      title: '',
      subtitle: '',
      image: '',
      imageKey: '',
      description: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openCategoryEdit = (item?: PhilosophyCategory) => {
    if (item) {
      setCategoryForm({
        icon: item.icon,
        title: item.title,
        subtitle: item.subtitle,
        image: item.image,
        imageKey: item.image_key || '',
        description: item.description || '',
        sortOrder: item.sort_order,
        isActive: item.is_active,
      });
      setCategoryDialog({ open: true, item });
    } else {
      resetCategoryForm();
      setCategoryDialog({ open: true, item: null });
    }
  };

  // ========== 活动管理 ==========

  const saveActivity = async () => {
    try {
      const url = '/api/admin/portal/philosophy/activities';
      const method = activityDialog.item ? 'PUT' : 'POST';
      const body = activityDialog.item
        ? { id: activityDialog.item.id, ...activityForm }
        : activityForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        fetchActivities();
        setActivityDialog({ open: false, item: null });
        resetActivityForm();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      alert('保存失败');
    }
  };

  const deleteActivity = async (id: string) => {
    if (!confirm('确定要删除此活动吗？')) return;
    try {
      const res = await fetch(`/api/admin/portal/philosophy/activities?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const toggleActivityActive = async (item: PhilosophyActivity) => {
    try {
      const res = await fetch('/api/admin/portal/philosophy/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const resetActivityForm = () => {
    setActivityForm({
      categoryId: selectedCategory?.id || '',
      title: '',
      image: '',
      imageKey: '',
      date: '',
      summary: '',
      content: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openActivityEdit = (item?: PhilosophyActivity) => {
    if (item) {
      setActivityForm({
        categoryId: item.category_id,
        title: item.title,
        image: item.image,
        imageKey: item.image_key || '',
        date: item.date || '',
        summary: item.summary || '',
        content: item.content || '',
        sortOrder: item.sort_order,
        isActive: item.is_active,
      });
      setActivityDialog({ open: true, item });
    } else {
      resetActivityForm();
      setActivityDialog({ open: true, item: null });
    }
  };

  // ========== 渲染 ==========

  if (view === 'activities' && selectedCategory) {
    // 活动内容列表视图
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={backToCategories}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  {selectedCategory.title}
                </CardTitle>
                <CardDescription>{selectedCategory.subtitle} - 活动内容管理</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchActivities()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => openActivityEdit()}>
                <Plus className="h-4 w-4 mr-1" />
                新增活动
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无活动内容，点击"新增活动"添加
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{item.title}</span>
                      {item.date && <Badge variant="outline" className="text-xs">{item.date}</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActivityActive(item)}
                      title={item.is_active ? '点击下架' : '点击发布'}
                    >
                      {item.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openActivityEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteActivity(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* 活动编辑对话框 */}
        <Dialog open={activityDialog.open} onOpenChange={(open) => setActivityDialog({ open, item: null })}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{activityDialog.item ? '编辑活动' : '新增活动'}</DialogTitle>
              <DialogDescription>板块：{selectedCategory.title}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <ImageUpload
                value={activityForm.image}
                onChange={(url, key) => setActivityForm({ ...activityForm, image: url, imageKey: key || '' })}
                label="活动图片"
              />
              <div className="grid gap-2">
                <Label>活动标题 *</Label>
                <Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="活动名称" />
              </div>
              <div className="grid gap-2">
                <Label>日期</Label>
                <Input value={activityForm.date} onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })} placeholder="如：2025年3月" />
              </div>
              <div className="grid gap-2">
                <Label>简介</Label>
                <Textarea value={activityForm.summary} onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })} placeholder="活动简介" />
              </div>
              <div className="grid gap-2">
                <Label>详细内容</Label>
                <Textarea value={activityForm.content} onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })} placeholder="详细内容描述" rows={4} />
              </div>
              <div className="grid gap-2">
                <Label>排序</Label>
                <Input type="number" value={activityForm.sortOrder} onChange={(e) => setActivityForm({ ...activityForm, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={activityForm.isActive} onCheckedChange={(v) => setActivityForm({ ...activityForm, isActive: v })} />
                <Label>启用</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivityDialog({ open: false, item: null })}>取消</Button>
              <Button onClick={saveActivity}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // 板块列表视图
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>童心教育管理</CardTitle>
            <CardDescription>管理六大板块及其活动内容，点击板块进入管理活动</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCategories}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => openCategoryEdit()}>
              <Plus className="h-4 w-4 mr-1" />
              新增板块
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categoriesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无板块数据</div>
        ) : (
          <div className="space-y-3">
            {categories.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                onClick={() => enterCategory(item)}
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
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleCategoryActive(item)}
                    title={item.is_active ? '点击下架' : '点击发布'}
                  >
                    {item.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openCategoryEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 板块编辑对话框 */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ open, item: null })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{categoryDialog.item ? '编辑板块' : '新增板块'}</DialogTitle>
            <DialogDescription>填写板块信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>图标</Label>
              <Select value={categoryForm.icon} onValueChange={(v) => setCategoryForm({ ...categoryForm, icon: v })}>
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
            <ImageUpload
              value={categoryForm.image}
              onChange={(url, key) => setCategoryForm({ ...categoryForm, image: url, imageKey: key || '' })}
              label="板块封面图"
            />
            <div className="grid gap-2">
              <Label>板块名称 *</Label>
              <Input value={categoryForm.title} onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })} placeholder="如：有效德育引领童心" />
            </div>
            <div className="grid gap-2">
              <Label>副标题 *</Label>
              <Input value={categoryForm.subtitle} onChange={(e) => setCategoryForm({ ...categoryForm, subtitle: e.target.value })} placeholder="如：以德育心" />
            </div>
            <div className="grid gap-2">
              <Label>板块描述</Label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="详细描述板块内容" />
            </div>
            <div className="grid gap-2">
              <Label>排序</Label>
              <Input type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={categoryForm.isActive} onCheckedChange={(v) => setCategoryForm({ ...categoryForm, isActive: v })} />
              <Label>启用</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false, item: null })}>取消</Button>
            <Button onClick={saveCategory}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==================== 成果特色办学管理（两层结构） ====================

function AchievementsManagement() {
  // 视图状态：'categories' = 分类列表，'items' = 项目列表
  const [view, setView] = useState<'categories' | 'items'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | null>(null);

  // 分类数据
  const [categories, setCategories] = useState<AchievementCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // 项目数据
  const [items, setItems] = useState<AchievementItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // 分类编辑对话框
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; item?: AchievementCategory | null }>({ open: false });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    icon: 'Sparkles',
    tag: '',
    description: '',
    featuredAwardTitle: '',
    featuredAwardContent: '',
    stats: [] as Array<{ label: string; value: string }>,
    newStatLabel: '',
    newStatValue: '',
    honorsList: [] as Array<{ title: string; subtitle: string }>,
    newHonorTitle: '',
    newHonorSubtitle: '',
    sortOrder: 0,
    isActive: true,
  });

  // 项目编辑对话框
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item?: AchievementItem | null }>({ open: false });
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    title: '',
    image: '',
    imageKey: '',
    date: '',
    summary: '',
    highlights: [] as string[],
    newHighlight: '',
    sortOrder: 0,
    isActive: true,
  });

  // 图标选项
  const iconOptions = [
    { value: 'Sparkles', label: '星光（科创）' },
    { value: 'BookOpen', label: '书本（人文）' },
    { value: 'Music', label: '音符（艺体）' },
  ];

  // 获取分类列表
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/admin/portal/achievements/categories?includeInactive=true');
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 获取项目列表
  const fetchItems = async (categoryId?: string) => {
    setItemsLoading(true);
    try {
      const id = categoryId || selectedCategory?.id;
      if (!id) return;
      
      const res = await fetch(`/api/admin/portal/achievements?includeInactive=true&categoryId=${id}`);
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 进入分类查看项目
  const enterCategory = (category: AchievementCategory) => {
    setSelectedCategory(category);
    setView('items');
    setItems([]);
    fetchItems(category.id);
  };

  // 返回分类列表
  const backToCategories = () => {
    setView('categories');
    setSelectedCategory(null);
    setItems([]);
  };

  // ========== 分类管理 ==========

  const saveCategory = async () => {
    try {
      const url = '/api/admin/portal/achievements/categories';
      const method = categoryDialog.item ? 'PUT' : 'POST';
      const body = categoryDialog.item
        ? {
            id: categoryDialog.item.id,
            name: categoryForm.name,
            slug: categoryForm.slug,
            icon: categoryForm.icon,
            tag: categoryForm.tag,
            description: categoryForm.description,
            featuredAwardTitle: categoryForm.featuredAwardTitle,
            featuredAwardContent: categoryForm.featuredAwardContent,
            stats: categoryForm.stats,
            honorsList: categoryForm.honorsList,
            sortOrder: categoryForm.sortOrder,
            isActive: categoryForm.isActive,
          }
        : {
            name: categoryForm.name,
            slug: categoryForm.slug,
            icon: categoryForm.icon,
            tag: categoryForm.tag,
            description: categoryForm.description,
            featuredAwardTitle: categoryForm.featuredAwardTitle,
            featuredAwardContent: categoryForm.featuredAwardContent,
            stats: categoryForm.stats,
            honorsList: categoryForm.honorsList,
            sortOrder: categoryForm.sortOrder,
            isActive: categoryForm.isActive,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        fetchCategories();
        setCategoryDialog({ open: false, item: null });
        resetCategoryForm();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('保存失败');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('确定要删除此分类吗？分类下的所有项目也会被删除！')) return;
    try {
      const res = await fetch(`/api/admin/portal/achievements/categories?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchCategories();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const toggleCategoryActive = async (item: AchievementCategory) => {
    try {
      const res = await fetch('/api/admin/portal/achievements/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      icon: 'Sparkles',
      tag: '',
      description: '',
      featuredAwardTitle: '',
      featuredAwardContent: '',
      stats: [],
      newStatLabel: '',
      newStatValue: '',
      honorsList: [],
      newHonorTitle: '',
      newHonorSubtitle: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openCategoryEdit = (item?: AchievementCategory) => {
    if (item) {
      setCategoryForm({
        name: item.name,
        slug: item.slug,
        icon: item.icon,
        tag: item.tag || '',
        description: item.description || '',
        featuredAwardTitle: item.featured_award_title || '',
        featuredAwardContent: item.featured_award_content || '',
        stats: item.stats || [],
        newStatLabel: '',
        newStatValue: '',
        honorsList: item.honors_list || [],
        newHonorTitle: '',
        newHonorSubtitle: '',
        sortOrder: item.sort_order,
        isActive: item.is_active,
      });
      setCategoryDialog({ open: true, item });
    } else {
      resetCategoryForm();
      setCategoryDialog({ open: true, item: null });
    }
  };

  // ========== 项目管理 ==========

  const saveItem = async () => {
    try {
      const url = '/api/admin/portal/achievements';
      const method = itemDialog.item ? 'PUT' : 'POST';
      const body = itemDialog.item
        ? { id: itemDialog.item.id, ...itemForm }
        : itemForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        fetchItems();
        setItemDialog({ open: false, item: null });
        resetItemForm();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('保存失败');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('确定要删除此项目吗？')) return;
    try {
      const res = await fetch(`/api/admin/portal/achievements?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const toggleItemActive = async (item: AchievementItem) => {
    try {
      const res = await fetch('/api/admin/portal/achievements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      categoryId: selectedCategory?.id || '',
      title: '',
      image: '',
      imageKey: '',
      date: '',
      summary: '',
      highlights: [],
      newHighlight: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const openItemEdit = (item?: AchievementItem) => {
    if (item) {
      setItemForm({
        categoryId: item.category_id,
        title: item.title,
        image: item.image,
        imageKey: item.image_key || '',
        date: item.date || '',
        summary: item.summary || '',
        highlights: item.highlights || [],
        newHighlight: '',
        sortOrder: item.sort_order,
        isActive: item.is_active,
      });
      setItemDialog({ open: true, item });
    } else {
      resetItemForm();
      setItemDialog({ open: true, item: null });
    }
  };

  const addHighlight = () => {
    if (itemForm.newHighlight.trim()) {
      setItemForm({
        ...itemForm,
        highlights: [...itemForm.highlights, itemForm.newHighlight.trim()],
        newHighlight: '',
      });
    }
  };

  const removeHighlight = (index: number) => {
    setItemForm({
      ...itemForm,
      highlights: itemForm.highlights.filter((_, i) => i !== index),
    });
  };

  // ========== 渲染 ==========

  if (view === 'items' && selectedCategory) {
    // 项目列表视图
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={backToCategories}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  {selectedCategory.name}
                </CardTitle>
                <CardDescription>{selectedCategory.tag} - 项目管理</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchItems()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => openItemEdit()}>
                <Plus className="h-4 w-4 mr-1" />
                新增项目
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无项目，点击"新增项目"添加
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{item.title}</span>
                      {item.date && <Badge variant="outline" className="text-xs">{item.date}</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.summary}</p>
                    {item.highlights && item.highlights.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.highlights.slice(0, 3).map((h, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleItemActive(item)}
                      title={item.is_active ? '点击下架' : '点击发布'}
                    >
                      {item.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openItemEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* 项目编辑对话框 */}
        <Dialog open={itemDialog.open} onOpenChange={(open) => setItemDialog({ open, item: null })}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{itemDialog.item ? '编辑项目' : '新增项目'}</DialogTitle>
              <DialogDescription>分类：{selectedCategory.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <ImageUpload
                value={itemForm.image}
                onChange={(url, key) => setItemForm({ ...itemForm, image: url, imageKey: key || '' })}
                label="项目图片"
              />
              <div className="grid gap-2">
                <Label>项目标题 *</Label>
                <Input value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} placeholder="项目名称" />
              </div>
              <div className="grid gap-2">
                <Label>日期/年份</Label>
                <Input value={itemForm.date} onChange={(e) => setItemForm({ ...itemForm, date: e.target.value })} placeholder="如：2025年" />
              </div>
              <div className="grid gap-2">
                <Label>简介</Label>
                <Textarea value={itemForm.summary} onChange={(e) => setItemForm({ ...itemForm, summary: e.target.value })} placeholder="项目简介" />
              </div>
              <div className="grid gap-2">
                <Label>亮点标签</Label>
                <div className="flex gap-2">
                  <Input 
                    value={itemForm.newHighlight} 
                    onChange={(e) => setItemForm({ ...itemForm, newHighlight: e.target.value })} 
                    placeholder="输入标签后回车或点击添加"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  />
                  <Button type="button" size="sm" onClick={addHighlight}>添加</Button>
                </div>
                {itemForm.highlights.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {itemForm.highlights.map((h, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {h}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeHighlight(i)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>排序</Label>
                <Input type="number" value={itemForm.sortOrder} onChange={(e) => setItemForm({ ...itemForm, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={itemForm.isActive} onCheckedChange={(v) => setItemForm({ ...itemForm, isActive: v })} />
                <Label>启用</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemDialog({ open: false, item: null })}>取消</Button>
              <Button onClick={saveItem}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // 分类列表视图
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>成果特色办学管理</CardTitle>
            <CardDescription>管理三大分类及其项目内容，点击分类进入管理项目</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCategories}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => openCategoryEdit()}>
              <Plus className="h-4 w-4 mr-1" />
              新增分类
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categoriesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无分类数据</div>
        ) : (
          <div className="space-y-3">
            {categories.map((item) => {
              const Icon = achievementIconMap[item.icon] || Sparkles;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => enterCategory(item)}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{item.name}</span>
                      {item.tag && <Badge className="text-xs">{item.tag}</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleCategoryActive(item)}
                      title={item.is_active ? '点击下架' : '点击发布'}
                    >
                      {item.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openCategoryEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* 分类编辑对话框 */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ open, item: null })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{categoryDialog.item ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>填写分类信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>分类名称 *</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="如：科创教育" />
            </div>
            <div className="grid gap-2">
              <Label>标识符 *</Label>
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="如：science" />
              <p className="text-xs text-gray-500">用于URL和程序标识，只能包含字母</p>
            </div>
            <div className="grid gap-2">
              <Label>图标</Label>
              <Select value={categoryForm.icon} onValueChange={(v) => setCategoryForm({ ...categoryForm, icon: v })}>
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
              <Label>标签</Label>
              <Input value={categoryForm.tag} onChange={(e) => setCategoryForm({ ...categoryForm, tag: e.target.value })} placeholder="如：王牌特色" />
            </div>
            <div className="grid gap-2">
              <Label>描述</Label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="分类描述" />
            </div>
            
            {/* 特色奖项 */}
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">特色奖项（可选）</h4>
              <div className="grid gap-2">
                <Label>奖项标题</Label>
                <Input value={categoryForm.featuredAwardTitle} onChange={(e) => setCategoryForm({ ...categoryForm, featuredAwardTitle: e.target.value })} placeholder="如：全国青少年科创大赛一等奖" />
              </div>
              <div className="grid gap-2 mt-2">
                <Label>奖项内容</Label>
                <Textarea value={categoryForm.featuredAwardContent} onChange={(e) => setCategoryForm({ ...categoryForm, featuredAwardContent: e.target.value })} placeholder="奖项详细描述" />
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">统计数据</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (categoryForm.newStatLabel && categoryForm.newStatValue) {
                      setCategoryForm({
                        ...categoryForm,
                        stats: [...categoryForm.stats, { label: categoryForm.newStatLabel, value: categoryForm.newStatValue }],
                        newStatLabel: '',
                        newStatValue: '',
                      });
                    }
                  }}
                  disabled={!categoryForm.newStatLabel || !categoryForm.newStatValue}
                >
                  添加
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input
                  value={categoryForm.newStatLabel}
                  onChange={(e) => setCategoryForm({ ...categoryForm, newStatLabel: e.target.value })}
                  placeholder="标签（如：获奖人数）"
                />
                <Input
                  value={categoryForm.newStatValue}
                  onChange={(e) => setCategoryForm({ ...categoryForm, newStatValue: e.target.value })}
                  placeholder="数值（如：120+）"
                />
              </div>
              {categoryForm.stats.length > 0 && (
                <div className="space-y-2">
                  {categoryForm.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted px-3 py-2 rounded">
                      <span>{stat.label}: {stat.value}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategoryForm({ ...categoryForm, stats: categoryForm.stats.filter((_, i) => i !== idx) })}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 荣誉列表 */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">荣誉列表</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (categoryForm.newHonorTitle) {
                      setCategoryForm({
                        ...categoryForm,
                        honorsList: [...categoryForm.honorsList, { title: categoryForm.newHonorTitle, subtitle: categoryForm.newHonorSubtitle }],
                        newHonorTitle: '',
                        newHonorSubtitle: '',
                      });
                    }
                  }}
                  disabled={!categoryForm.newHonorTitle}
                >
                  添加
                </Button>
              </div>
              <div className="grid gap-2 mb-2">
                <Input
                  value={categoryForm.newHonorTitle}
                  onChange={(e) => setCategoryForm({ ...categoryForm, newHonorTitle: e.target.value })}
                  placeholder="荣誉名称（如：全国文明校园）"
                />
                <Input
                  value={categoryForm.newHonorSubtitle}
                  onChange={(e) => setCategoryForm({ ...categoryForm, newHonorSubtitle: e.target.value })}
                  placeholder="副标题（如：教育部授予，可选）"
                />
              </div>
              {categoryForm.honorsList.length > 0 && (
                <div className="space-y-2">
                  {categoryForm.honorsList.map((honor, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted px-3 py-2 rounded">
                      <div>
                        <span className="font-medium">{honor.title}</span>
                        {honor.subtitle && <span className="text-sm text-muted-foreground ml-2">- {honor.subtitle}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategoryForm({ ...categoryForm, honorsList: categoryForm.honorsList.filter((_, i) => i !== idx) })}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid gap-2 border-t pt-4 mt-2">
              <Label>排序</Label>
              <Input type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={categoryForm.isActive} onCheckedChange={(v) => setCategoryForm({ ...categoryForm, isActive: v })} />
              <Label>启用</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false, item: null })}>取消</Button>
            <Button onClick={saveCategory}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
