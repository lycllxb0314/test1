'use client';

/**
 * 附小少年管理子组件
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
import { GraduationCap, Plus, Pencil, Trash2, Heart, Lightbulb, Sun, Palette, Sprout, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { ShowcaseItem } from './types';
import { CATEGORY_CONFIGS } from '@/types/student-showcase';
import type { ShowcaseCategory } from '@/types/student-showcase';

const showcaseCategoryOptions: { value: ShowcaseCategory; label: string; icon: React.ElementType }[] = [
  { value: 'virtue', label: '善行少年', icon: Heart },
  { value: 'wisdom', label: '求知少年', icon: Lightbulb },
  { value: 'vitality', label: '阳光少年', icon: Sun },
  { value: 'art', label: '艺韵少年', icon: Palette },
  { value: 'practice', label: '躬行少年', icon: Sprout },
];

const defaultForm = {
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
};

export function StudentShowcaseManagement() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; item: ShowcaseItem | null }>({ open: false, item: null });
  const [form, setForm] = useState({ ...defaultForm });
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
    setForm({ ...defaultForm });
    setDialog({ open: true, item: null });
  };

  const openEdit = (item: ShowcaseItem) => {
    setForm({
      category: item.category as ShowcaseCategory,
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

  const getCategoryLabel = (key: string) => {
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
