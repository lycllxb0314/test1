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
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';
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
  Newspaper,
  Bell,
  Megaphone,
  GraduationCap,
  Star,
  Users,
  Award,
  Heart,
  Lightbulb,
  Sun,
  Palette,
  Sprout,
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

      const res = await fetch('/api/upload', {
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
        accept={FILE_TYPE_CONFIGS.image.accept}
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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="announcements" className="gap-2">
            <Newspaper className="h-4 w-4" />
            公告新闻管理
          </TabsTrigger>
          <TabsTrigger value="teacherExcellence" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            卓越教师
          </TabsTrigger>
          <TabsTrigger value="studentShowcase" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            附小少年
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

        <TabsContent value="announcements" className="mt-4">
          <AnnouncementsManagement />
        </TabsContent>

        <TabsContent value="teacherExcellence" className="mt-4">
          <TeacherExcellenceManagement />
        </TabsContent>

        <TabsContent value="studentShowcase" className="mt-4">
          <StudentShowcaseManagement />
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
              <Select value={formData.type} onValueChange={(v: 'image' | 'video' | 'bilibili') => setFormData({ ...formData, type: v })}>
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

// ==================== 附小少年管理 ====================

import { CATEGORY_CONFIGS } from '@/types/student-showcase';
import type { ShowcaseCategory } from '@/types/student-showcase';

const showcaseCategoryOptions: { value: ShowcaseCategory; label: string; icon: React.ElementType }[] = [
  { value: 'virtue', label: '善行少年', icon: Heart },
  { value: 'wisdom', label: '求知少年', icon: Lightbulb },
  { value: 'vitality', label: '阳光少年', icon: Sun },
  { value: 'art', label: '艺韵少年', icon: Palette },
  { value: 'practice', label: '躬行少年', icon: Sprout },
];

interface ShowcaseItem {
  id: string;
  category: ShowcaseCategory;
  studentName: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  achievements: string[];
  tags: string[];
  className?: string;
  grade?: string;
  sortOrder: number;
  isActive: boolean;
}

function StudentShowcaseManagement() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; item: ShowcaseItem | null }>({ open: false, item: null });
  const [form, setForm] = useState({
    category: 'virtue' as ShowcaseCategory,
    studentName: '',
    title: '',
    subtitle: '',
    description: '',
    image: '',
    achievements: [] as string[],
    tags: [] as string[],
    className: '',
    grade: '',
    sortOrder: 0,
    isActive: true,
  });
  const [newAchievement, setNewAchievement] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student-showcase?admin=true&limit=200');
      const result = await res.json();
      if (result.success) setItems(result.data || []);
    } catch (e) {
      console.error('Fetch student showcase error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm({ category: 'virtue', studentName: '', title: '', subtitle: '', description: '', image: '', achievements: [], tags: [], className: '', grade: '', sortOrder: 0, isActive: true });
    setDialog({ open: true, item: null });
  };

  const openEdit = (item: ShowcaseItem) => {
    setForm({
      category: item.category,
      studentName: item.studentName,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      image: item.image || '',
      achievements: item.achievements || [],
      tags: item.tags || [],
      className: item.className || '',
      grade: item.grade || '',
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialog({ open: true, item });
  };

  const saveItem = async () => {
    const payload = { ...form };
    if (dialog.item) {
      await fetch(`/api/student-showcase/${dialog.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/student-showcase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setDialog({ open: false, item: null });
    fetchData();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/student-showcase/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setForm({ ...form, achievements: [...form.achievements, newAchievement.trim()] });
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setForm({ ...form, achievements: form.achievements.filter((_, i) => i !== index) });
  };

  const getCategoryLabel = (key: ShowcaseCategory) => {
    const opt = showcaseCategoryOptions.find(o => o.value === key);
    return opt ? opt.label : key;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[#C9A96E]" />附小少年管理</CardTitle>
        <CardDescription>管理善行少年、求知少年、阳光少年、艺韵少年、躬行少年五大板块内容</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">共 {items.length} 条记录</div>
          <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" />新增</Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : (
          <div className="space-y-3">
            {showcaseCategoryOptions.map(opt => {
              const categoryItems = items.filter(i => i.category === opt.value);
              if (categoryItems.length === 0) return null;
              const CategoryIcon = opt.icon;
              return (
                <div key={opt.value}>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[#5C4A3A]">
                    <CategoryIcon className="h-4 w-4" />
                    {opt.label} ({categoryItems.length})
                  </div>
                  <div className="space-y-2">
                    {categoryItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-[#FEFBF6] rounded-lg border border-[#C9A96E]/10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#5C4A3A]">{item.studentName}</span>
                            <span className="text-xs text-muted-foreground">{item.title}</span>
                            {item.subtitle && <Badge variant="outline" className="text-xs">{item.subtitle}</Badge>}
                            {!item.isActive && <Badge variant="secondary" className="text-xs">未启用</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.className} · 排序: {item.sortOrder}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 编辑弹窗 */}
        <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ open, item: null })}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialog.item ? '编辑' : '新增'}附小少年</DialogTitle>
              <DialogDescription>填写学生风采信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>类别</Label>
                <Select value={form.category} onValueChange={(v) => {
                  const cat = v as ShowcaseCategory;
                  setForm({ ...form, category: cat, tags: CATEGORY_CONFIGS.find(c => c.key === cat)?.tags.slice(0, 1) || [] });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {showcaseCategoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>学生姓名 *</Label>
                <Input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>标题 *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如：爱心小使者" />
              </div>
              <div className="grid gap-2">
                <Label>子分类标签</Label>
                <Select value={form.tags[0] || ''} onValueChange={(v) => setForm({ ...form, tags: [v] })}>
                  <SelectTrigger><SelectValue placeholder="选择子分类" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_CONFIGS.find(c => c.key === form.category)?.tags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>班级</Label>
                <Input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="如：六年1班" />
              </div>
              <div className="grid gap-2">
                <Label>年级</Label>
                <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="如：六年级" />
              </div>
              <div className="grid gap-2">
                <Label>事迹描述</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="照片" />
              <div className="grid gap-2">
                <Label>荣誉成就</Label>
                <div className="flex gap-2">
                  <Input value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} placeholder="输入后按回车添加" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAchievement(); } }} />
                  <Button type="button" variant="outline" size="sm" onClick={addAchievement}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.achievements.map((a, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeAchievement(i)}>
                      {a} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>排序</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>启用</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog({ open: false, item: null })}>取消</Button>
              <Button onClick={saveItem}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
// ==================== 卓越教师管理 ====================

type ProfileForm = {
  name: string;
  title: string;
  subject: string;
  image: string;
  description: string;
  achievements: string;
  motto: string;
  sortOrder: number;
  isActive: boolean;
};

type TeamForm = {
  name: string;
  subject: string;
  description: string;
  image: string;
  members: string;
  achievements: string;
  sortOrder: number;
  isActive: boolean;
};

type AwardForm = {
  teacherName: string;
  awardName: string;
  awardLevel: string;
  awardDate: string;
  subject: string;
  description: string;
  image: string;
  certificateUrl: string;
  sortOrder: number;
  isActive: boolean;
};

function TeacherExcellenceManagement() {
  const [subTab, setSubTab] = useState('profiles');
  const [profiles, setProfiles] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [awards, setAwards] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  // 对话框状态
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [awardDialog, setAwardDialog] = useState<{ open: boolean; id?: string }>({ open: false });

  // 表单状态
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: '', title: '', subject: '', image: '', description: '', achievements: '', motto: '', sortOrder: 0, isActive: true,
  });
  const [teamForm, setTeamForm] = useState<TeamForm>({
    name: '', subject: '', description: '', image: '', members: '', achievements: '', sortOrder: 0, isActive: true,
  });
  const [awardForm, setAwardForm] = useState<AwardForm>({
    teacherName: '', awardName: '', awardLevel: '', awardDate: '', subject: '', description: '', image: '', certificateUrl: '', sortOrder: 0, isActive: true,
  });

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/teacher-excellence/profiles?admin=true');
      const result = await res.json();
      if (result.success) setProfiles(result.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teacher-excellence/teams?admin=true');
      const result = await res.json();
      if (result.success) setTeams(result.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAwards = async () => {
    try {
      const res = await fetch('/api/teacher-excellence/awards?admin=true');
      const result = await res.json();
      if (result.success) setAwards(result.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfiles(), fetchTeams(), fetchAwards()]).finally(() => setLoading(false));
  }, []);

  // 名师风采 CRUD
  const openProfileDialog = (item?: Record<string, unknown>) => {
    if (item) {
      setProfileForm({
        name: (item.name as string) || '',
        title: (item.title as string) || '',
        subject: (item.subject as string) || '',
        image: (item.image as string) || '',
        description: (item.description as string) || '',
        achievements: Array.isArray(item.achievements) ? (item.achievements as string[]).join('\n') : '',
        motto: (item.motto as string) || '',
        sortOrder: (item.sortOrder as number) || 0,
        isActive: item.isActive !== false,
      });
      setProfileDialog({ open: true, id: item.id as string });
    } else {
      setProfileForm({ name: '', title: '', subject: '', image: '', description: '', achievements: '', motto: '', sortOrder: 0, isActive: true });
      setProfileDialog({ open: true });
    }
  };

  const saveProfile = async () => {
    const payload = {
      ...profileForm,
      achievements: profileForm.achievements.split('\n').filter(s => s.trim()),
    };
    try {
      if (profileDialog.id) {
        await fetch(`/api/teacher-excellence/profiles/${profileDialog.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/teacher-excellence/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setProfileDialog({ open: false });
      fetchProfiles();
    } catch (e) { console.error(e); }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('确定删除此名师风采记录？')) return;
    try {
      await fetch(`/api/teacher-excellence/profiles/${id}`, { method: 'DELETE' });
      fetchProfiles();
    } catch (e) { console.error(e); }
  };

  // 教师团队 CRUD
  const openTeamDialog = (item?: Record<string, unknown>) => {
    if (item) {
      setTeamForm({
        name: (item.name as string) || '',
        subject: (item.subject as string) || '',
        description: (item.description as string) || '',
        image: (item.image as string) || '',
        members: Array.isArray(item.members) ? JSON.stringify(item.members, null, 2) : '[]',
        achievements: Array.isArray(item.achievements) ? (item.achievements as string[]).join('\n') : '',
        sortOrder: (item.sortOrder as number) || 0,
        isActive: item.isActive !== false,
      });
      setTeamDialog({ open: true, id: item.id as string });
    } else {
      setTeamForm({ name: '', subject: '', description: '', image: '', members: '[]', achievements: '', sortOrder: 0, isActive: true });
      setTeamDialog({ open: true });
    }
  };

  const saveTeam = async () => {
    let membersArr: unknown[] = [];
    try { membersArr = JSON.parse(teamForm.members); } catch { membersArr = []; }
    const payload = {
      ...teamForm,
      members: membersArr,
      achievements: teamForm.achievements.split('\n').filter(s => s.trim()),
    };
    try {
      if (teamDialog.id) {
        await fetch(`/api/teacher-excellence/teams/${teamDialog.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/teacher-excellence/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setTeamDialog({ open: false });
      fetchTeams();
    } catch (e) { console.error(e); }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('确定删除此教师团队记录？')) return;
    try {
      await fetch(`/api/teacher-excellence/teams/${id}`, { method: 'DELETE' });
      fetchTeams();
    } catch (e) { console.error(e); }
  };

  // 教师获奖 CRUD
  const openAwardDialog = (item?: Record<string, unknown>) => {
    if (item) {
      setAwardForm({
        teacherName: (item.teacherName as string) || '',
        awardName: (item.awardName as string) || '',
        awardLevel: (item.awardLevel as string) || '',
        awardDate: (item.awardDate as string) || '',
        subject: (item.subject as string) || '',
        description: (item.description as string) || '',
        image: (item.image as string) || '',
        certificateUrl: (item.certificateUrl as string) || '',
        sortOrder: (item.sortOrder as number) || 0,
        isActive: item.isActive !== false,
      });
      setAwardDialog({ open: true, id: item.id as string });
    } else {
      setAwardForm({ teacherName: '', awardName: '', awardLevel: '', awardDate: '', subject: '', description: '', image: '', certificateUrl: '', sortOrder: 0, isActive: true });
      setAwardDialog({ open: true });
    }
  };

  const saveAward = async () => {
    try {
      if (awardDialog.id) {
        await fetch(`/api/teacher-excellence/awards/${awardDialog.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(awardForm) });
      } else {
        await fetch('/api/teacher-excellence/awards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(awardForm) });
      }
      setAwardDialog({ open: false });
      fetchAwards();
    } catch (e) { console.error(e); }
  };

  const deleteAward = async (id: string) => {
    if (!confirm('确定删除此获奖记录？')) return;
    try {
      await fetch(`/api/teacher-excellence/awards/${id}`, { method: 'DELETE' });
      fetchAwards();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#C9A96E]" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[#C9A96E]" />卓越教师管理</CardTitle>
        <CardDescription>管理名师风采、教师团队和教师获奖信息</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={subTab} onValueChange={setSubTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="profiles" className="gap-1"><Star className="h-3.5 w-3.5" />名师风采</TabsTrigger>
            <TabsTrigger value="teams" className="gap-1"><Users className="h-3.5 w-3.5" />教师团队</TabsTrigger>
            <TabsTrigger value="awards" className="gap-1"><Award className="h-3.5 w-3.5" />教师获奖</TabsTrigger>
          </TabsList>

          {/* 名师风采列表 */}
          <TabsContent value="profiles">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openProfileDialog()} size="sm" className="gap-1"><Plus className="h-4 w-4" />新增名师</Button>
            </div>
            <div className="space-y-2">
              {profiles.map((item) => (
                <div key={item.id as string} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-[#C9A96E]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name as string}</p>
                      <p className="text-sm text-muted-foreground">{item.title as string} · {item.subject as string}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openProfileDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteProfile(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {profiles.length === 0 && <p className="text-center text-muted-foreground py-8">暂无名师风采数据</p>}
            </div>
          </TabsContent>

          {/* 教师团队列表 */}
          <TabsContent value="teams">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openTeamDialog()} size="sm" className="gap-1"><Plus className="h-4 w-4" />新增团队</Button>
            </div>
            <div className="space-y-2">
              {teams.map((item) => (
                <div key={item.id as string} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8B7355]/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#8B7355]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name as string}</p>
                      <p className="text-sm text-muted-foreground">{item.subject as string}学科教研组</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openTeamDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTeam(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="text-center text-muted-foreground py-8">暂无教师团队数据</p>}
            </div>
          </TabsContent>

          {/* 教师获奖列表 */}
          <TabsContent value="awards">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openAwardDialog()} size="sm" className="gap-1"><Plus className="h-4 w-4" />新增获奖</Button>
            </div>
            <div className="space-y-2">
              {awards.map((item) => (
                <div key={item.id as string} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#A08060]/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-[#A08060]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.awardName as string}</p>
                      <p className="text-sm text-muted-foreground">{item.teacherName as string} · {item.awardLevel as string}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openAwardDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAward(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {awards.length === 0 && <p className="text-center text-muted-foreground py-8">暂无教师获奖数据</p>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* 名师风采编辑对话框 */}
      <Dialog open={profileDialog.open} onOpenChange={(open) => setProfileDialog({ open })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profileDialog.id ? '编辑名师' : '新增名师'}</DialogTitle>
            <DialogDescription>填写名师风采信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>姓名</Label><Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>职称</Label><Input value={profileForm.title} onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })} /></div>
              <div><Label>学科</Label><Input value={profileForm.subject} onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })} /></div>
            </div>
            <ImageUpload value={profileForm.image} onChange={(url) => setProfileForm({ ...profileForm, image: url })} label="照片" />
            <div><Label>简介</Label><Textarea value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} rows={3} /></div>
            <div><Label>荣誉成就（每行一条）</Label><Textarea value={profileForm.achievements} onChange={(e) => setProfileForm({ ...profileForm, achievements: e.target.value })} rows={3} placeholder="全国优秀教师&#10;省特级教师" /></div>
            <div><Label>教育格言</Label><Input value={profileForm.motto} onChange={(e) => setProfileForm({ ...profileForm, motto: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>排序</Label><Input type="number" value={profileForm.sortOrder} onChange={(e) => setProfileForm({ ...profileForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={profileForm.isActive} onCheckedChange={(v) => setProfileForm({ ...profileForm, isActive: v })} /><Label>启用</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialog({ open: false })}>取消</Button>
            <Button onClick={saveProfile}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 教师团队编辑对话框 */}
      <Dialog open={teamDialog.open} onOpenChange={(open) => setTeamDialog({ open })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{teamDialog.id ? '编辑团队' : '新增团队'}</DialogTitle>
            <DialogDescription>填写教师团队信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>团队名称</Label><Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} /></div>
              <div><Label>学科</Label><Input value={teamForm.subject} onChange={(e) => setTeamForm({ ...teamForm, subject: e.target.value })} /></div>
            </div>
            <ImageUpload value={teamForm.image} onChange={(url) => setTeamForm({ ...teamForm, image: url })} label="封面图" />
            <div><Label>团队介绍</Label><Textarea value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} rows={3} /></div>
            <div><Label>成员（JSON格式）</Label><Textarea value={teamForm.members} onChange={(e) => setTeamForm({ ...teamForm, members: e.target.value })} rows={4} placeholder='[{"name":"张老师","role":"组长","title":"高级教师"}]' /></div>
            <div><Label>团队荣誉（每行一条）</Label><Textarea value={teamForm.achievements} onChange={(e) => setTeamForm({ ...teamForm, achievements: e.target.value })} rows={3} placeholder="省优秀教研组&#10;市教学研究基地" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>排序</Label><Input type="number" value={teamForm.sortOrder} onChange={(e) => setTeamForm({ ...teamForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={teamForm.isActive} onCheckedChange={(v) => setTeamForm({ ...teamForm, isActive: v })} /><Label>启用</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialog({ open: false })}>取消</Button>
            <Button onClick={saveTeam}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 教师获奖编辑对话框 */}
      <Dialog open={awardDialog.open} onOpenChange={(open) => setAwardDialog({ open })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{awardDialog.id ? '编辑获奖' : '新增获奖'}</DialogTitle>
            <DialogDescription>填写教师获奖信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>教师姓名</Label><Input value={awardForm.teacherName} onChange={(e) => setAwardForm({ ...awardForm, teacherName: e.target.value })} /></div>
              <div><Label>学科</Label><Input value={awardForm.subject} onChange={(e) => setAwardForm({ ...awardForm, subject: e.target.value })} /></div>
            </div>
            <div><Label>获奖名称</Label><Input value={awardForm.awardName} onChange={(e) => setAwardForm({ ...awardForm, awardName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>获奖等级</Label>
                <Select value={awardForm.awardLevel} onValueChange={(v) => setAwardForm({ ...awardForm, awardLevel: v })}>
                  <SelectTrigger><SelectValue placeholder="选择等级" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="国家级">国家级</SelectItem>
                    <SelectItem value="省级">省级</SelectItem>
                    <SelectItem value="市级">市级</SelectItem>
                    <SelectItem value="区级">区级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>获奖时间</Label><Input value={awardForm.awardDate} onChange={(e) => setAwardForm({ ...awardForm, awardDate: e.target.value })} placeholder="2024-09" /></div>
            </div>
            <div><Label>详细描述</Label><Textarea value={awardForm.description} onChange={(e) => setAwardForm({ ...awardForm, description: e.target.value })} rows={3} /></div>
            <ImageUpload value={awardForm.certificateUrl} onChange={(url) => setAwardForm({ ...awardForm, certificateUrl: url })} label="荣誉证书" />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>排序</Label><Input type="number" value={awardForm.sortOrder} onChange={(e) => setAwardForm({ ...awardForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={awardForm.isActive} onCheckedChange={(v) => setAwardForm({ ...awardForm, isActive: v })} /><Label>启用</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardDialog({ open: false })}>取消</Button>
            <Button onClick={saveAward}>保存</Button>
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

// ==================== 公告新闻管理 ====================

interface AnnouncementItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  type: 'announcement' | 'news';
  category?: string;
  mediaLevel?: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  isExternal: boolean;
  publishStatus: 'pending' | 'scheduled' | 'published' | 'unpublished';
  publishedAt?: string;
  scheduledPublishAt?: string;
  autoUnpublish?: boolean;
  autoUnpublishAt?: string;
  unpublishedAt?: string;
  isPinned: boolean;
  pinOrder: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

function AnnouncementsManagement() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'announcement' | 'news'>('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; item?: AnnouncementItem | null }>({ open: false });
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    type: 'announcement' as 'announcement' | 'news',
    category: '',
    mediaLevel: '',
    department: '学校办公室',
    coverImage: '',
    coverImageKey: '',
    publishStatus: 'pending' as 'pending' | 'scheduled' | 'published' | 'unpublished',
    publishedAt: '',
    scheduledPublishAt: '',
    autoUnpublish: false,
    autoUnpublishAt: '',
    isPinned: false,
    pinOrder: 0,
  });

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
      
      // 处理发布状态
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
    setFormData({
      title: '',
      summary: '',
      content: '',
      type: 'announcement',
      category: '',
      mediaLevel: '',
      department: '学校办公室',
      coverImage: '',
      coverImageKey: '',
      publishStatus: 'pending',
      publishedAt: '',
      scheduledPublishAt: '',
      autoUnpublish: false,
      autoUnpublishAt: '',
      isPinned: false,
      pinOrder: 0,
    });
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
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
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
                onValueChange={(v) => setFormData({ ...formData, type: v as 'announcement' | 'news' })}
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
                onValueChange={(v) => setFormData({ ...formData, publishStatus: v as any })}
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
            
            {/* 定时发布时间 */}
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
            
            {/* 定时下架 */}
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

