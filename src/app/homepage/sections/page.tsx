'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Save, Eye, Settings } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Section {
  id: number;
  section_type: string;
  section_title: string;
  section_subtitle: string;
  content: any;
  is_active: boolean;
  updated_at: string;
}

const sectionTypes = [
  { type: 'hero', name: '顶部横幅', description: '学校名称、简介等' },
  { type: 'motto', name: '校训内涵', description: '明德、博学、笃行、创新' },
  { type: 'five_education', name: '五育并举', description: '德智体美劳展示' },
  { type: 'teacher_dev', name: '教师发展', description: '教师风采展示' },
  { type: 'activities', name: '校园活动', description: '活动图片展示' },
  { type: 'smart_campus', name: '智慧校园', description: '系统介绍' },
  { type: 'contact', name: '联系方式', description: '学校联系方式' },
];

export default function SectionsManagementPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    section_title: '',
    section_subtitle: '',
    content: '',
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/homepage');
      const data = await res.json();
      setSections(data.data || []);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (section: Section) => {
    setEditingSection(section);
    setFormData({
      section_title: section.section_title || '',
      section_subtitle: section.section_subtitle || '',
      content: typeof section.content === 'string' ? section.content : JSON.stringify(section.content, null, 2),
    });
    setDialogOpen(true);
  };

  const openCreateDialog = (type: string) => {
    setEditingSection({ section_type: type } as Section);
    setFormData({
      section_title: '',
      section_subtitle: '',
      content: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingSection?.section_type) return;

    try {
      let content = formData.content;
      try {
        content = JSON.parse(formData.content);
      } catch {
        // 保持字符串格式
      }

      await fetch('/api/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: editingSection.section_type,
          section_title: formData.section_title,
          section_subtitle: formData.section_subtitle,
          content,
          updated_by: user?.name,
        }),
      });
      setDialogOpen(false);
      fetchSections();
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  };

  const getSectionName = (type: string) => {
    return sectionTypes.find(s => s.type === type)?.name || type;
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">区块设置</h1>
            <p className="text-gray-500 mt-1">管理主页各内容区块的设置</p>
          </div>
        </div>

        {/* 区块列表 */}
        <div className="grid gap-4">
          {sectionTypes.map((sectionType) => {
            const existingSection = sections.find(s => s.section_type === sectionType.type);
            return (
              <Card key={sectionType.type} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Settings className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{sectionType.name}</h3>
                          {existingSection && (
                            <Badge className="bg-green-100 text-green-700">已配置</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{sectionType.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => existingSection ? openEditDialog(existingSection) : openCreateDialog(sectionType.type)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {existingSection ? '编辑' : '配置'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 编辑弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                编辑{editingSection && getSectionName(editingSection.section_type)}
              </DialogTitle>
              <DialogDescription>
                配置该区块的标题、副标题和内容
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">区块标题</label>
                <Input
                  value={formData.section_title}
                  onChange={(e) => setFormData({ ...formData, section_title: e.target.value })}
                  placeholder="区块标题"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">区块副标题</label>
                <Input
                  value={formData.section_subtitle}
                  onChange={(e) => setFormData({ ...formData, section_subtitle: e.target.value })}
                  placeholder="区块副标题"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">内容 (JSON 格式)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  请输入 JSON 格式的内容，用于存储区块的具体数据
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                <Save className="h-4 w-4" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
