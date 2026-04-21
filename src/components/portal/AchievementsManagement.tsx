'use client';

/**
 * 成果特色办学管理子组件（两层结构：分类 → 项目）
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
import {
  Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff, GripVertical,
  ArrowLeft, FolderOpen, ChevronRight, Sparkles, BookOpen, Music, X, Loader2,
} from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { AchievementCategory, AchievementItem } from './types';

// 成果图标映射
const achievementIconMap: Record<string, React.ElementType> = {
  Sparkles,
  BookOpen,
  Music,
};

// 图标选项
const iconOptions = [
  { value: 'Sparkles', label: '星光（科创）' },
  { value: 'BookOpen', label: '书本（人文）' },
  { value: 'Music', label: '音符（艺体）' },
];

const defaultCategoryForm = {
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
};

const defaultItemForm = (categoryId: string) => ({
  categoryId,
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

export function AchievementsManagement() {
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
  const [categoryForm, setCategoryForm] = useState({ ...defaultCategoryForm });

  // 项目编辑对话框
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item?: AchievementItem | null }>({ open: false });
  const [itemForm, setItemForm] = useState(defaultItemForm(''));

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
