'use client';

/**
 * 班主任信息收集管理页面
 * 
 * 功能：
 * - 创建/编辑信息收集表单
 * - 发布信息收集
 * - 查看响应统计和详情
 * 
 * 界面：使用页面切换而非弹窗
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronDown,
  ChevronUp,
  BarChart,
  ArrowLeft,
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  List,
  CheckSquare,
  Circle,
  Calendar,
  Settings2,
  Sparkles,
  EyeOff,
  Copy,
  MoreHorizontal,
  Timer,
  ToggleLeft,
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

// 字段类型配置
const FIELD_TYPES = [
  { value: 'text', label: '单行文本', icon: Type, description: '适用于姓名、电话等短文本' },
  { value: 'textarea', label: '多行文本', icon: AlignLeft, description: '适用于详细描述、备注等' },
  { value: 'number', label: '数字', icon: Hash, description: '适用于年龄、数量等' },
  { value: 'select', label: '下拉选择', icon: List, description: '从多个选项中选择一个' },
  { value: 'radio', label: '单选', icon: Circle, description: '从选项中单选，全部展示' },
  { value: 'checkbox', label: '多选', icon: CheckSquare, description: '可同时选择多个选项' },
  { value: 'date', label: '日期', icon: Calendar, description: '选择日期' },
];

// 状态配置
const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-700', icon: FileText },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  closed: { label: '已关闭', color: 'bg-amber-100 text-amber-700', icon: Timer },
};

// 视图类型
type ViewType = 'list' | 'create' | 'edit' | 'responses';

export default function InformationCollectionPage() {
  const { user } = useAuth();
  
  // 视图状态
  const [view, setView] = useState<ViewType>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 列表状态
  const [collections, setCollections] = useState<InformationCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formDeadline, setFormDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 响应详情
  const [responses, setResponses] = useState<Response[]>([]);
  const [responseCollection, setResponseCollection] = useState<InformationCollection | null>(null);
  const [responsesLoading, setResponsesLoading] = useState(false);
  
  // 字段拖拽状态
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
    if (view === 'list') {
      fetchCollections();
    }
  }, [statusFilter, view]);

  // 切换到创建视图
  const handleCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormFields([]);
    setFormDeadline('');
    setView('create');
  };

  // 切换到编辑视图
  const handleEdit = (collection: InformationCollection) => {
    setEditingId(collection.id);
    setFormTitle(collection.title);
    setFormDescription(collection.description || '');
    setFormFields([...collection.fields]);
    setFormDeadline(collection.deadline ? collection.deadline.slice(0, 16) : '');
    setView('edit');
  };

  // 返回列表
  const handleBack = () => {
    setView('list');
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormFields([]);
    setFormDeadline('');
  };

  // 添加字段
  const handleAddField = (type: FormField['type'] = 'text') => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['选项1', '选项2'] : [],
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

  // 复制字段
  const handleDuplicateField = (index: number) => {
    const fieldToCopy = formFields[index];
    const newField: FormField = {
      ...fieldToCopy,
      id: `field_${Date.now()}`,
      label: `${fieldToCopy.label}（副本）`,
    };
    const newFields = [...formFields];
    newFields.splice(index + 1, 0, newField);
    setFormFields(newFields);
  };

  // 保存信息收集
  const handleSave = async (publishNow: boolean = false) => {
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
      const url = editingId
        ? `/api/information-collections/${editingId}`
        : '/api/information-collections';

      const body = {
        title: formTitle,
        description: formDescription,
        fields: formFields,
        deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
        status: publishNow ? 'published' : 'draft',
      };

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        handleBack();
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
    setResponsesLoading(true);
    setView('responses');
    
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

  // 渲染列表视图
  const renderListView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/30">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-transparent">
                信息收集
              </h1>
              <p className="text-muted-foreground text-sm">
                创建自定义表单，高效收集家长信息
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-100">
                <ClipboardList className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-700">{collections.length}</p>
                <p className="text-xs text-violet-600">总收集数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{collections.filter(c => c.status === 'draft').length}</p>
                <p className="text-xs text-amber-600">草稿</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{collections.filter(c => c.status === 'published').length}</p>
                <p className="text-xs text-emerald-600">已发布</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{collections.reduce((sum, c) => sum + c.responseCount, 0)}</p>
                <p className="text-xs text-blue-600">总响应</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和操作 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label className="text-gray-600 font-medium">状态筛选</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/80 border-gray-200 shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="closed">已关闭</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/30"
        >
          <Plus className="h-4 w-4 mr-2" />
          新建收集
        </Button>
      </div>

      {/* 列表 */}
      {loading ? (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center text-gray-500">
            <div className="animate-pulse space-y-3">
              <div className="h-8 w-32 bg-gray-200 rounded mx-auto" />
              <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
            </div>
          </CardContent>
        </Card>
      ) : collections.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-10 w-10 text-violet-400" />
            </div>
            <p className="text-gray-600 font-medium">暂无信息收集</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">点击"新建收集"创建第一个表单</p>
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              新建收集
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map(collection => {
            const statusConfig = STATUS_CONFIG[collection.status];
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={collection.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{collection.title}</h3>
                        <Badge className={cn('font-medium gap-1', statusConfig.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      {collection.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{collection.fields.length} 个字段</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full text-blue-600">
                          <Users className="h-3.5 w-3.5" />
                          <span>{collection.responseCount} 人已提交</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                        </div>
                        {collection.deadline && (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
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
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
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
                          className="text-violet-600 border-violet-200 hover:bg-violet-50"
                          onClick={() => handleViewResponses(collection)}
                        >
                          <BarChart className="h-3.5 w-3.5 mr-1" />
                          查看响应
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(collection)}
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
    </div>
  );

  // 渲染表单编辑视图
  const renderFormView = () => (
    <div className="animate-in slide-in-from-right duration-300">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存草稿'}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/30"
          >
            <Send className="h-4 w-4 mr-2" />
            {saving ? '发布中...' : '保存并发布'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：表单预览 */}
        <div className="col-span-5">
          <Card className="border-0 shadow-xl bg-white sticky top-6">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Eye className="h-4 w-4" />
                表单预览
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formTitle || '未命名表单'}
                  </h2>
                  {formDescription && (
                    <p className="text-gray-500 text-sm mt-1">{formDescription}</p>
                  )}
                </div>

                {formDeadline && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <Timer className="h-4 w-4" />
                    截止时间：{new Date(formDeadline).toLocaleString()}
                  </div>
                )}

                <Separator />

                {formFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>暂无字段</p>
                    <p className="text-xs">在右侧添加字段开始创建</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formFields.map((field, index) => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {index + 1}. {field.label || '未命名字段'}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.placeholder && (
                          <p className="text-xs text-gray-400">{field.placeholder}</p>
                        )}
                        {field.type === 'text' && (
                          <div className="h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        {field.type === 'textarea' && (
                          <div className="h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        {field.type === 'number' && (
                          <div className="h-10 w-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        {field.type === 'date' && (
                          <div className="h-10 w-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        {(field.type === 'select' || field.type === 'radio') && field.options && (
                          <div className="space-y-2">
                            {field.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-gray-600">{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {field.type === 'checkbox' && field.options && (
                          <div className="space-y-2">
                            {field.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded border-2 border-gray-300" />
                                <span className="text-sm text-gray-600">{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：表单配置 */}
        <div className="col-span-7 space-y-6">
          {/* 基本信息 */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-violet-500" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">表单标题 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="如：学生健康信息登记表"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">表单说明</Label>
                <Textarea
                  placeholder="填写说明，将显示在表单开头"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">截止时间（可选）</Label>
                  <Input
                    type="datetime-local"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 添加字段 */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-violet-500" />
                添加字段
              </CardTitle>
              <CardDescription>选择字段类型添加到表单</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {FIELD_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleAddField(type.value as FormField['type'])}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200 group"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-violet-100 transition-colors">
                        <Icon className="h-5 w-5 text-gray-600 group-hover:text-violet-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-violet-700">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 字段列表 */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-500" />
                  字段列表
                </CardTitle>
                <Badge variant="outline" className="text-gray-600">
                  {formFields.length} 个字段
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {formFields.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="font-medium text-gray-500">暂无字段</p>
                  <p className="text-xs mt-1">点击上方按钮添加字段</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formFields.map((field, index) => {
                    const FieldTypeConfig = FIELD_TYPES.find(t => t.value === field.type);
                    const FieldIcon = FieldTypeConfig?.icon || Type;
                    
                    return (
                      <div
                        key={field.id}
                        className="group relative bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                      >
                        {/* 字段序号和操作 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div className="p-1.5 rounded-lg bg-gray-100">
                              <FieldIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">
                              {FieldTypeConfig?.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={index === 0}
                              onClick={() => handleMoveField(index, 'up')}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={index === formFields.length - 1}
                              onClick={() => handleMoveField(index, 'down')}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDuplicateField(index)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveField(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* 字段配置 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block">字段标签 *</Label>
                            <Input
                              placeholder="如：学生姓名"
                              value={field.label}
                              onChange={e => handleUpdateField(index, { label: e.target.value })}
                              className="bg-white border-gray-200"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block">占位提示</Label>
                            <Input
                              placeholder="如：请输入姓名"
                              value={field.placeholder || ''}
                              onChange={e => handleUpdateField(index, { placeholder: e.target.value })}
                              className="bg-white border-gray-200"
                            />
                          </div>
                        </div>

                        {/* 选项配置 */}
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div className="mt-3">
                            <Label className="text-xs text-gray-500 mb-1 block">选项（每行一个）</Label>
                            <Textarea
                              placeholder="选项1&#10;选项2&#10;选项3"
                              value={field.options?.join('\n') || ''}
                              onChange={e => handleUpdateField(index, { options: e.target.value.split('\n').filter(Boolean) })}
                              className="bg-white border-gray-200 min-h-[80px]"
                            />
                          </div>
                        )}

                        {/* 必填选项 */}
                        <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => handleUpdateField(index, { required: checked })}
                            />
                            <span className="text-sm text-gray-600">必填字段</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 提示信息 */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="p-2 rounded-lg bg-amber-100">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">发布提示</p>
              <p className="text-xs text-amber-600 mt-1">
                发布后将自动通知班级所有家长，家长可在"信息收集"模块查看并填写
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染响应视图
  const renderResponsesView = () => (
    <div className="animate-in slide-in-from-right duration-300">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700">
            <Users className="h-3 w-3 mr-1" />
            {responses.length} 人已提交
          </Badge>
        </div>
      </div>

      {/* 表单信息 */}
      {responseCollection && (
        <Card className="border-0 shadow-lg bg-white mb-6">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{responseCollection.title}</h2>
            {responseCollection.description && (
              <p className="text-gray-600">{responseCollection.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 响应列表 */}
      {responsesLoading ? (
        <Card className="border-0 shadow-lg bg-white/80">
          <CardContent className="p-12 text-center text-gray-500">
            加载中...
          </CardContent>
        </Card>
      ) : responses.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/80">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无响应</p>
            <p className="text-sm text-gray-400 mt-1">等待家长填写提交</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {responses.map(response => (
            <Card key={response.id} className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{response.studentName}</p>
                      <p className="text-sm text-gray-500">{response.parentName}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(response.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  {responseCollection?.fields.map(field => (
                    <div key={field.id} className="text-sm">
                      <span className="text-gray-500 font-medium">{field.label}：</span>
                      <span className="ml-2 text-gray-700">
                        {Array.isArray(response.responses[field.id])
                          ? (response.responses[field.id] as unknown as string[]).join('、')
                          : String(response.responses[field.id] || '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 主渲染
  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-violet-50/30 via-white to-purple-50/30 min-h-screen">
      {view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'responses' && renderResponsesView()}
    </div>
  );
}
