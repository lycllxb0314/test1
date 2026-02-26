'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Save, Settings, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
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

const sectionConfigs: Record<string, {
  name: string;
  description: string;
  icon: string;
  fields?: { key: string; label: string; type: string; placeholder: string }[];
  subItems?: { keyPrefix: string; label: string; color?: string; fields?: string[] }[];
}> = {
  hero: {
    name: '顶部横幅',
    description: '学校名称、简介等顶部展示内容',
    icon: '🏫',
    fields: [
      { key: 'schoolName', label: '学校全称', type: 'text', placeholder: '福建省龙岩师范附属小学' },
      { key: 'schoolSubtitle', label: '学校副标题', type: 'text', placeholder: '创建于1914年 · 福建省示范小学' },
      { key: 'welcomeText', label: '欢迎语', type: 'textarea', placeholder: '百年名校，薪火相传...' },
    ],
  },
  motto: {
    name: '校训内涵',
    description: '明德、博学、笃行、创新四项校训的含义解释',
    icon: '📚',
    fields: [
      { key: 'mottoText', label: '校训文字', type: 'text', placeholder: '明德 博学 笃行 创新' },
    ],
    subItems: [
      { keyPrefix: 'mingde', label: '明德', fields: ['character', 'meaning', 'desc'] },
      { keyPrefix: 'boxue', label: '博学', fields: ['character', 'meaning', 'desc'] },
      { keyPrefix: 'duxing', label: '笃行', fields: ['character', 'meaning', 'desc'] },
      { keyPrefix: 'chuangxin', label: '创新', fields: ['character', 'meaning', 'desc'] },
    ],
  },
  five_education: {
    name: '五育并举',
    description: '德智体美劳五育的培养目标和实践方式',
    icon: '🎯',
    subItems: [
      { keyPrefix: 'deyu', label: '德育', color: '#B22222' },
      { keyPrefix: 'zhiyu', label: '智育', color: '#1565C0' },
      { keyPrefix: 'tiyu', label: '体育', color: '#E65100' },
      { keyPrefix: 'meiyu', label: '美育', color: '#6A1B9A' },
      { keyPrefix: 'laoyu', label: '劳育', color: '#2E7D32' },
    ],
  },
  smart_campus: {
    name: '智慧校园',
    description: '四大系统的介绍文字',
    icon: '💻',
    fields: [
      { key: 'title', label: '区块标题', type: 'text', placeholder: '智慧校园' },
      { key: 'subtitle', label: '区块副标题', type: 'text', placeholder: '一体化管理平台' },
    ],
  },
  teachers: {
    name: '师资队伍',
    description: '教师团队介绍和统计数据',
    icon: '👨‍🏫',
    fields: [
      { key: 'title', label: '区块标题', type: 'text', placeholder: '师资队伍' },
      { key: 'subtitle', label: '区块描述', type: 'textarea', placeholder: '百年名校，名师荟萃...' },
    ],
    subItems: [
      { keyPrefix: 'stats', label: '师资数据统计', fields: ['total', 'senior', 'backbone', 'master'] },
    ],
  },
  contact: {
    name: '联系方式',
    description: '学校地址、电话等信息',
    icon: '📞',
    fields: [
      { key: 'address', label: '学校地址', type: 'text', placeholder: '福建省龙岩市新罗区...' },
      { key: 'phone', label: '联系电话', type: 'text', placeholder: '0597-XXXXXXX' },
      { key: 'email', label: '电子邮箱', type: 'text', placeholder: 'xxx@lysf.fx.edu.cn' },
    ],
  },
};

export default function SectionsManagementPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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

  const openEditDialog = (sectionType: string) => {
    const section = sections.find(s => s.section_type === sectionType);
    const config = sectionConfigs[sectionType as keyof typeof sectionConfigs];
    
    setCurrentSection(sectionType);
    
    // 初始化表单数据
    if (section?.content) {
      setFormData(typeof section.content === 'string' ? JSON.parse(section.content) : section.content);
    } else {
      setFormData({});
    }
    
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const section = sections.find(s => s.section_type === currentSection);
      
      await fetch('/api/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: currentSection,
          section_title: section?.section_title || sectionConfigs[currentSection as keyof typeof sectionConfigs]?.name,
          content: formData,
          updated_by: user?.name,
        }),
      });
      setDialogOpen(false);
      fetchSections();
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderFields = (config: typeof sectionConfigs[keyof typeof sectionConfigs]) => {
    return (
      <div className="space-y-4">
        {/* 基础字段 */}
        {config.fields?.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            {field.type === 'textarea' ? (
              <Textarea
                value={formData[field.key] || ''}
                onChange={(e) => updateFormData(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="mt-1"
              />
            ) : (
              <Input
                value={formData[field.key] || ''}
                onChange={(e) => updateFormData(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="mt-1"
              />
            )}
          </div>
        ))}

        {/* 子项（如校训的四项、五育的五项） */}
        {config.subItems?.map((item, idx) => {
          const isExpanded = expandedItems[item.keyPrefix];
          const itemData = formData.items?.[idx] || formData[item.keyPrefix] || {};
          
          return (
            <div key={item.keyPrefix} className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpand(item.keyPrefix)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {item.color && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  )}
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {isExpanded && (
                <div className="p-4 space-y-3 bg-white">
                  {/* 根据区块类型显示不同的字段 */}
                  {currentSection === 'motto' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">字词</label>
                        <Input
                          value={itemData.character || ''}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...itemData, character: e.target.value };
                            updateFormData('items', newItems);
                          }}
                          placeholder="明德"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">含义</label>
                        <Input
                          value={itemData.meaning || ''}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...itemData, meaning: e.target.value };
                            updateFormData('items', newItems);
                          }}
                          placeholder="明德修身，立德树人"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">描述</label>
                        <Textarea
                          value={itemData.desc || ''}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...itemData, desc: e.target.value };
                            updateFormData('items', newItems);
                          }}
                          placeholder="以德为先，培养学生健全人格..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  
                  {currentSection === 'five_education' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">类别名称</label>
                        <Input
                          value={itemData.category || item.label}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...itemData, category: e.target.value };
                            updateFormData('items', newItems);
                          }}
                          placeholder="德育"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">培养目标</label>
                        <Textarea
                          value={itemData.goal || ''}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...itemData, goal: e.target.value };
                            updateFormData('items', newItems);
                          }}
                          placeholder="培养有理想、有道德、有担当的时代新人"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">实践方式</label>
                        <Textarea
                          value={itemData.practice || ''}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...itemData, practice: e.target.value };
                            updateFormData('items', newItems);
                          }}
                          placeholder="少先队活动、主题班会、社会实践、红色教育"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  
                  {currentSection === 'teachers' && item.keyPrefix === 'stats' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">教师总数</label>
                          <Input
                            type="number"
                            value={itemData.total || ''}
                            onChange={(e) => {
                              const newItems = [...(formData.items || [])];
                              newItems[idx] = { ...itemData, total: e.target.value };
                              updateFormData('items', newItems);
                            }}
                            placeholder="120"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">高级教师数</label>
                          <Input
                            type="number"
                            value={itemData.senior || ''}
                            onChange={(e) => {
                              const newItems = [...(formData.items || [])];
                              newItems[idx] = { ...itemData, senior: e.target.value };
                              updateFormData('items', newItems);
                            }}
                            placeholder="35"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">骨干教师数</label>
                          <Input
                            type="number"
                            value={itemData.backbone || ''}
                            onChange={(e) => {
                              const newItems = [...(formData.items || [])];
                              newItems[idx] = { ...itemData, backbone: e.target.value };
                              updateFormData('items', newItems);
                            }}
                            placeholder="28"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">研究生学历数</label>
                          <Input
                            type="number"
                            value={itemData.master || ''}
                            onChange={(e) => {
                              const newItems = [...(formData.items || [])];
                              newItems[idx] = { ...itemData, master: e.target.value };
                              updateFormData('items', newItems);
                            }}
                            placeholder="15"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">区块设置</h1>
            <p className="text-gray-500 mt-1">管理主页各内容区块的文字内容</p>
          </div>
        </div>

        {/* 使用提示 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">使用说明</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>点击下方区块的"编辑"按钮，可以修改该区块显示的文字内容</li>
                  <li>修改后点击"保存"，内容会立即更新到主页</li>
                  <li>点击折叠项可以展开编辑详细的子项内容</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 区块列表 */}
        <div className="grid gap-4">
          {Object.entries(sectionConfigs).map(([type, config]) => {
            const existingSection = sections.find(s => s.section_type === type);
            return (
              <Card key={type} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{config.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{config.name}</h3>
                          {existingSection && (
                            <Badge className="bg-green-100 text-green-700">已配置</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{config.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => openEditDialog(type)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      编辑
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 编辑弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                编辑{sectionConfigs[currentSection as keyof typeof sectionConfigs]?.name || '内容'}
              </DialogTitle>
              <DialogDescription>
                修改区块的文字内容，保存后会立即更新到主页
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {currentSection && sectionConfigs[currentSection as keyof typeof sectionConfigs] && (
                renderFields(sectionConfigs[currentSection as keyof typeof sectionConfigs])
              )}
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
  );
}
