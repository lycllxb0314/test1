'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Trophy, Plus, Edit, Trash2, Award } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface Honor {
  id: number;
  title: string;
  year: string;
  organization: string;
  level: string;
  image: string;
  sort_order: number;
}

export default function HonorsManagementPage() {
  const [honorsList, setHonorsList] = useState<Honor[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHonor, setEditingHonor] = useState<Honor | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear().toString(),
    organization: '',
    level: '市级',
    image: '',
  });

  useEffect(() => {
    fetchHonors();
  }, []);

  const fetchHonors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/homepage/honors');
      const data = await res.json();
      setHonorsList(data.data || []);
    } catch (error) {
      console.error('Failed to fetch honors:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingHonor(null);
    setFormData({
      title: '',
      year: new Date().getFullYear().toString(),
      organization: '',
      level: '市级',
      image: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (honor: Honor) => {
    setEditingHonor(honor);
    setFormData({
      title: honor.title,
      year: honor.year,
      organization: honor.organization || '',
      level: honor.level || '市级',
      image: honor.image || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) return;

    try {
      if (editingHonor) {
        await fetch('/api/homepage/honors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingHonor.id,
            ...formData,
          }),
        });
      } else {
        await fetch('/api/homepage/honors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setDialogOpen(false);
      fetchHonors();
    } catch (error) {
      console.error('Failed to save honor:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条荣誉吗？')) return;

    try {
      await fetch(`/api/homepage/honors?id=${id}`, { method: 'DELETE' });
      fetchHonors();
    } catch (error) {
      console.error('Failed to delete honor:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case '国家级': return 'bg-red-100 text-red-700 border-red-200';
      case '省级': return 'bg-orange-100 text-orange-700 border-orange-200';
      case '市级': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">荣誉管理</h1>
            <p className="text-gray-500 mt-1">管理学校获得的荣誉展示</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            添加荣誉
          </Button>
        </div>

        {/* 荣誉列表 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">荣誉列表</CardTitle>
            <CardDescription>共 {honorsList.length} 项荣誉</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : honorsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>暂无荣誉，点击添加</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {honorsList.map((honor) => (
                  <div
                    key={honor.id}
                    className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getLevelColor(honor.level || '校级')}>
                        {honor.level || '校级'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(honor)}
                          className="h-8 w-8 p-0 text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(honor.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{honor.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{honor.organization}</span>
                      <span>{honor.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 编辑弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHonor ? '编辑荣誉' : '添加荣誉'}</DialogTitle>
              <DialogDescription>
                {editingHonor ? '修改荣誉信息' : '填写荣誉信息'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">荣誉名称 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：全国文明校园"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">获奖年份</label>
                  <Input
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2024"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">级别</label>
                  <Select
                    value={formData.level}
                    onValueChange={(v) => setFormData({ ...formData, level: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="国家级">国家级</SelectItem>
                      <SelectItem value="省级">省级</SelectItem>
                      <SelectItem value="市级">市级</SelectItem>
                      <SelectItem value="区级">区级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">颁发机构</label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="例如：中央文明办"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">证书图片</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="图片URL（可选）"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editingHonor ? '保存修改' : '添加荣誉'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
