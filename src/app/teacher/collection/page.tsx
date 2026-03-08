'use client';

/**
 * 班主任信息收集管理页面
 * 
 * 功能：
 * - 创建/编辑信息收集表单
 * - 发布信息收集
 * - 查看响应统计和详情
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  GripVertical,
  X,
  ChevronDown,
  ChevronUp,
  BarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// 表单字段类型
interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

// 信息收集类型
interface InformationCollection {
  id: string;
  title: string;
  description: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'closed';
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  responseCount: number;
}

// 响应类型
interface Response {
  id: string;
  studentName: string;
  parentName: string;
  responses: Record<string, string>;
  submittedAt: string;
}

// 字段类型选项
const FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉选择' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'date', label: '日期' },
];

// 状态配置
const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  published: { label: '已发布', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-amber-100 text-amber-700' },
};

export default function InformationCollectionPage() {
  const { user } = useAuth();
  
  // 列表状态
  const [collections, setCollections] = useState<InformationCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<InformationCollection | null>(null);
  
  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formDeadline, setFormDeadline] = useState('');
  const [formPublishNow, setFormPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 响应详情
  const [responses, setResponses] = useState<Response[]>([]);
  const [responseCollection, setResponseCollection] = useState<InformationCollection | null>(null);
  const [responsesLoading, setResponsesLoading] = useState(false);

  // 加载列表
  const fetchCollections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/information-collections?${params}`);
      const data = await res.json();
      if (data.success) {
        setCollections(data.data);
      }
    } catch (error) {
      console.error('获取列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [statusFilter]);

  // 打开创建/编辑对话框
  const handleOpenEditDialog = (collection?: InformationCollection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormTitle(collection.title);
      setFormDescription(collection.description || '');
      setFormFields(collection.fields);
      setFormDeadline(collection.deadline ? collection.deadline.slice(0, 16) : '');
      setFormPublishNow(collection.status === 'published');
    } else {
      setEditingCollection(null);
      setFormTitle('');
      setFormDescription('');
      setFormFields([]);
      setFormDeadline('');
      setFormPublishNow(false);
    }
    setEditDialogOpen(true);
  };

  // 添加字段
  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      placeholder: '',
      options: [],
    };
    setFormFields([...formFields, newField]);
  };

  // 更新字段
  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...formFields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormFields(newFields);
  };

  // 删除字段
  const handleRemoveField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // 移动字段
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFields.length) return;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFormFields(newFields);
  };

  // 保存信息收集
  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('请输入标题');
      return;
    }
    if (formFields.length === 0) {
      alert('请至少添加一个字段');
      return;
    }
    if (formFields.some(f => !f.label.trim())) {
      alert('请填写所有字段的标签');
      return;
    }

    setSaving(true);
    try {
      const url = editingCollection
        ? `/api/information-collections/${editingCollection.id}`
        : '/api/information-collections';

      const body = {
        title: formTitle,
        description: formDescription,
        fields: formFields,
        deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
        status: formPublishNow ? 'published' : 'draft',
      };

      const res = await fetch(url, {
        method: editingCollection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        fetchCollections();
        setEditDialogOpen(false);
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 发布信息收集
  const handlePublish = async (id: string) => {
    if (!confirm('确定要发布此信息收集吗？发布后将通知班级所有家长。')) return;

    try {
      const res = await fetch(`/api/information-collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      const data = await res.json();
      if (data.success) {
        fetchCollections();
      } else {
        alert(data.error || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败');
    }
  };

  // 删除信息收集
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此信息收集吗？')) return;

    try {
      const res = await fetch(`/api/information-collections/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        fetchCollections();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 查看响应
  const handleViewResponses = async (collection: InformationCollection) => {
    setResponseCollection(collection);
    setResponseDialogOpen(true);
    setResponsesLoading(true);
    
    try {
      const res = await fetch(`/api/information-collections/${collection.id}/responses`);
      const data = await res.json();
      if (data.success) {
        setResponses(data.data);
      }
    } catch (error) {
      console.error('获取响应失败:', error);
    } finally {
      setResponsesLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              信息收集
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">
            创建自定义表单 · 收集家长信息
          </p>
        </div>
      </div>

      {/* 筛选和操作 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label className="text-gray-600">状态</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-white/80 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="closed">已关闭</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => handleOpenEditDialog()}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
        >
          <Plus className="h-4 w-4 mr-2" />
          新建收集
        </Button>
      </div>

      {/* 列表 */}
      {loading ? (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center text-gray-500">
            加载中...
          </CardContent>
        </Card>
      ) : collections.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无信息收集</p>
            <p className="text-sm text-gray-400 mt-1">点击"新建收集"创建第一个表单</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map(collection => {
            const statusConfig = STATUS_CONFIG[collection.status];
            
            return (
              <Card key={collection.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{collection.title}</h3>
                        <Badge className={cn('font-medium', statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      {collection.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{collection.fields.length} 个字段</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{collection.responseCount} 人已提交</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                        </div>
                        {collection.deadline && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>截止：{new Date(collection.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {collection.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handlePublish(collection.id)}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          发布
                        </Button>
                      )}
                      {collection.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResponses(collection)}
                        >
                          <BarChart className="h-3.5 w-3.5 mr-1" />
                          查看响应
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditDialog(collection)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(collection.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollection ? '编辑信息收集' : '新建信息收集'}</DialogTitle>
            <DialogDescription>
              创建自定义表单，收集家长信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 基本信息 */}
            <div className="space-y-2">
              <Label>标题 *</Label>
              <Input
                placeholder="输入标题，如：学生健康信息登记"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>描述（可选）</Label>
              <Textarea
                placeholder="输入描述信息"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>截止时间（可选）</Label>
              <Input
                type="datetime-local"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
              />
            </div>

            <Separator />

            {/* 表单字段 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>表单字段</Label>
                <Button variant="outline" size="sm" onClick={handleAddField}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加字段
                </Button>
              </div>

              {formFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>暂无字段，点击"添加字段"开始</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={index === 0}
                            onClick={() => handleMoveField(index, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={index === formFields.length - 1}
                            onClick={() => handleMoveField(index, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex-1 grid gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">字段类型</Label>
                              <Select
                                value={field.type}
                                onValueChange={(v) => handleUpdateField(index, { type: v as FormField['type'] })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FIELD_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">字段标签 *</Label>
                              <Input
                                placeholder="如：学生姓名"
                                value={field.label}
                                onChange={e => handleUpdateField(index, { label: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">占位提示</Label>
                              <Input
                                placeholder="如：请输入姓名"
                                value={field.placeholder || ''}
                                onChange={e => handleUpdateField(index, { placeholder: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.required}
                                  onCheckedChange={(checked) => handleUpdateField(index, { required: checked as boolean })}
                                />
                                <span className="text-sm">必填</span>
                              </label>
                            </div>
                          </div>

                          {/* 选项配置 */}
                          {['select', 'radio', 'checkbox'].includes(field.type) && (
                            <div>
                              <Label className="text-xs">选项（每行一个）</Label>
                              <Textarea
                                placeholder="选项1&#10;选项2&#10;选项3"
                                value={field.options?.join('\n') || ''}
                                onChange={e => handleUpdateField(index, { options: e.target.value.split('\n').filter(Boolean) })}
                              />
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* 发布选项 */}
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm text-amber-700">
                  发布后将自动通知班级所有家长
                </p>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formPublishNow}
                  onCheckedChange={(checked) => setFormPublishNow(checked as boolean)}
                />
                <span className="text-sm font-medium">立即发布</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {saving ? '保存中...' : (formPublishNow ? '发布' : '保存')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 响应对话框 */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>响应详情 - {responseCollection?.title}</DialogTitle>
            <DialogDescription>
              共 {responses.length} 人已提交
            </DialogDescription>
          </DialogHeader>

          {responsesLoading ? (
            <div className="py-12 text-center text-gray-500">加载中...</div>
          ) : responses.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              暂无响应
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {responses.map(response => (
                  <Card key={response.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{response.studentName}</span>
                        <span className="text-sm text-gray-500">({response.parentName})</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(response.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {responseCollection?.fields.map(field => (
                        <div key={field.id} className="text-sm">
                          <span className="text-gray-500">{field.label}：</span>
                          <span className="ml-2">
                            {Array.isArray(response.responses[field.id])
                              ? (response.responses[field.id] as unknown as string[]).join('、')
                              : String(response.responses[field.id] || '-')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
