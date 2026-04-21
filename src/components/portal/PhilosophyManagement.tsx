'use client';

/**
 * 童心教育管理子组件（两层结构：板块 → 活动）
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
import { Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff, GripVertical, ArrowLeft, FolderOpen, ChevronRight } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { PhilosophyCategory, PhilosophyActivity } from './types';
import { philosophyIconOptions } from './types';

const defaultCategoryForm = {
  icon: 'Shield',
  title: '',
  subtitle: '',
  image: '',
  imageKey: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

const defaultActivityForm = (categoryId: string) => ({
  categoryId,
  title: '',
  image: '',
  imageKey: '',
  date: '',
  summary: '',
  content: '',
  sortOrder: 0,
  isActive: true,
});

export function PhilosophyManagement() {
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
  const [categoryForm, setCategoryForm] = useState({ ...defaultCategoryForm });

  // 活动编辑对话框
  const [activityDialog, setActivityDialog] = useState<{ open: boolean; item?: PhilosophyActivity | null }>({ open: false });
  const [activityForm, setActivityForm] = useState(defaultActivityForm(''));

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
    setCategoryForm({ ...defaultCategoryForm });
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
    setActivityForm(defaultActivityForm(selectedCategory?.id || ''));
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
                  {philosophyIconOptions.map(opt => (
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
