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
  Star,
  Sliders,
  Phone,
  CreditCard,
  Upload,
  Image,
  Clock3,
  MapPin,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// 表单字段类型（参考问卷星）
interface FormField {
  id: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'date' | 'time' | 'datetime' | 'number' | 'rating' | 'scale' | 'phone' | 'idcard' | 'file' | 'image_select';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  // 评分题配置
  maxRating?: number;
  // 量表题配置
  minLabel?: string;
  maxLabel?: string;
  // 文件上传配置
  maxFiles?: number;
  fileType?: string;
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

// 未提交学生类型
interface NotSubmittedStudent {
  studentId: string;
  studentName: string;
  parentId: string | null;
  parentName: string;
}

// 统计类型
interface ResponseStatistics {
  total: number;
  submitted: number;
  notSubmitted: number;
}

// 字段类型配置（参考问卷星）
const FIELD_TYPES = [
  // 基础题型
  { value: 'radio', label: '单选题', icon: Circle, description: '选项少时平铺，多时下拉', category: 'basic' },
  { value: 'checkbox', label: '多选题', icon: CheckSquare, description: '可多选', category: 'basic' },
  { value: 'text', label: '填空题', icon: Type, description: '单行文本输入', category: 'basic' },
  { value: 'textarea', label: '简答题', icon: AlignLeft, description: '多行文本输入', category: 'basic' },
  
  // 评分题型
  { value: 'rating', label: '评分题', icon: Star, description: '星级评分', category: 'rating' },
  { value: 'scale', label: '量表题', icon: Sliders, description: '滑动量表评分', category: 'rating' },
  
  // 时间日期
  { value: 'date', label: '日期', icon: Calendar, description: '选择日期', category: 'time' },
  { value: 'time', label: '时间', icon: Clock3, description: '选择时间', category: 'time' },
  { value: 'datetime', label: '日期时间', icon: Calendar, description: '选择日期和时间', category: 'time' },
  
  // 特殊题型
  { value: 'number', label: '数字题', icon: Hash, description: '仅限数字输入', category: 'special' },
  { value: 'phone', label: '手机号', icon: Phone, description: '手机号验证', category: 'special' },
  { value: 'idcard', label: '身份证号', icon: CreditCard, description: '身份证号验证', category: 'special' },
  
  // 上传题型
  { value: 'file', label: '文件上传', icon: Upload, description: '上传文件附件', category: 'upload' },
  { value: 'image_select', label: '图片选择', icon: Image, description: '图片形式选项', category: 'upload' },
] as const;

// 字段类型分组
const FIELD_CATEGORIES = [
  { key: 'basic', label: '基础题型' },
  { key: 'rating', label: '评分题型' },
  { key: 'time', label: '时间日期' },
  { key: 'special', label: '特殊题型' },
  { key: 'upload', label: '上传题型' },
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
  const [notSubmitted, setNotSubmitted] = useState<NotSubmittedStudent[]>([]);
  const [statistics, setStatistics] = useState<ResponseStatistics>({ total: 0, submitted: 0, notSubmitted: 0 });
  const [responseCollection, setResponseCollection] = useState<InformationCollection | null>(null);
  const [responsesLoading, setResponsesLoading] = useState(false);
  
  // 响应视图Tab
  const [responseTab, setResponseTab] = useState<'submitted' | 'notSubmitted'>('submitted');
  
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
  const handleAddField = (type: FormField['type'] = 'radio') => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      required: false,
      placeholder: '',
      // 选项类字段默认选项
      options: ['radio', 'checkbox', 'image_select'].includes(type) ? ['选项1', '选项2'] : undefined,
      // 评分题默认配置
      maxRating: type === 'rating' ? 5 : undefined,
      // 量表题默认配置
      minLabel: type === 'scale' ? '非常不满意' : undefined,
      maxLabel: type === 'scale' ? '非常满意' : undefined,
      // 文件上传默认配置
      maxFiles: type === 'file' ? 1 : undefined,
      fileType: type === 'file' ? 'all' : undefined,
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
    setResponseTab('submitted');
    
    try {
      const res = await fetch(`/api/information-collections/${collection.id}/responses`);
      const result = await res.json();
      if (result.success) {
        // API 返回 { data: { data: responses, notSubmitted, statistics } }
        const apiData = result.data;
        setResponses(apiData.data || []);
        setNotSubmitted(apiData.notSubmitted || []);
        setStatistics(apiData.statistics || { total: 0, submitted: 0, notSubmitted: 0 });
      }
    } catch (error) {
      console.error('获取响应失败:', error);
    } finally {
      setResponsesLoading(false);
    }
  };

  // 导出数据为Excel (CSV格式)
  const handleExportData = () => {
    if (!responseCollection || responses.length === 0) return;

    // 构建CSV表头
    const headers = ['序号', '学生姓名', '家长姓名', '提交时间'];
    responseCollection.fields.forEach(field => {
      headers.push(field.label);
    });

    // 构建CSV数据行
    const rows = responses.map((response, index) => {
      const row = [
        String(index + 1),
        response.studentName,
        response.parentName,
        new Date(response.submittedAt).toLocaleString(),
      ];
      
      responseCollection.fields.forEach(field => {
        const value = response.responses[field.id];
        if (Array.isArray(value)) {
          row.push(value.join('、'));
        } else {
          row.push(String(value || ''));
        }
      });
      
      return row;
    });

    // 转义CSV字段（处理逗号、引号、换行）
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // 生成CSV内容
    const csvContent = '\uFEFF' + // BOM for Excel to recognize UTF-8
      [headers.map(escapeCSV).join(','), ...rows.map(row => row.map(escapeCSV).join(','))].join('\n');

    // 创建下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${responseCollection.title}_收集数据_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
                  <div className="space-y-5">
                    {formFields.map((field, index) => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {index + 1}. {field.label || '未命名字段'}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.placeholder && (
                          <p className="text-xs text-gray-400">{field.placeholder}</p>
                        )}
                        
                        {/* 文本类字段 */}
                        {field.type === 'text' && (
                          <div className="h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        {field.type === 'textarea' && (
                          <div className="h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        
                        {/* 数字字段 */}
                        {field.type === 'number' && (
                          <div className="h-10 w-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                        )}
                        
                        {/* 特殊字段 */}
                        {field.type === 'phone' && (
                          <div className="h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center px-3">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-400">手机号格式验证</span>
                          </div>
                        )}
                        {field.type === 'idcard' && (
                          <div className="h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center px-3">
                            <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-400">身份证号格式验证</span>
                          </div>
                        )}
                        
                        {/* 时间日期字段 */}
                        {(field.type === 'date' || field.type === 'time' || field.type === 'datetime') && (
                          <div className="h-10 w-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-400">
                              {field.type === 'date' ? '选择日期' : field.type === 'time' ? '选择时间' : '选择日期时间'}
                            </span>
                          </div>
                        )}
                        
                        {/* 单选字段：选项少平铺，多则下拉 */}
                        {field.type === 'radio' && field.options && (
                          field.options.length <= 5 ? (
                            // 选项少：平铺展示
                            <div className="space-y-2">
                              {field.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                  <span className="text-sm text-gray-600">{opt}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // 选项多：下拉样式
                            <div className="h-10 w-full max-w-xs bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-between px-3">
                              <span className="text-sm text-gray-400">请选择</span>
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                          )
                        )}
                        
                        {/* 多选字段 */}
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
                        
                        {/* 评分字段 */}
                        {field.type === 'rating' && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
                              <Star key={i} className="h-6 w-6 text-gray-300" />
                            ))}
                          </div>
                        )}
                        
                        {/* 量表字段 */}
                        {field.type === 'scale' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{field.minLabel || '低'}</span>
                              <span>{field.maxLabel || '高'}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 w-1/2 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full" />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>1</span>
                              <span>2</span>
                              <span>3</span>
                              <span>4</span>
                              <span>5</span>
                            </div>
                          </div>
                        )}
                        
                        {/* 文件上传字段 */}
                        {field.type === 'file' && (
                          <div className="h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                            <Upload className="h-6 w-6 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              点击上传文件（最多 {field.maxFiles || 1} 个）
                            </span>
                          </div>
                        )}
                        
                        {/* 图片选择字段 */}
                        {field.type === 'image_select' && (
                          <div className="grid grid-cols-2 gap-2">
                            {field.options?.map((opt, i) => (
                              <div key={i} className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                                <Image className="h-6 w-6 text-gray-400" />
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
            <CardContent className="space-y-5">
              {FIELD_CATEGORIES.map(category => (
                <div key={category.key}>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-violet-400 rounded-full" />
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {FIELD_TYPES.filter(t => t.category === category.key).map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => handleAddField(type.value as FormField['type'])}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-200 group text-left"
                        >
                          <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-violet-100 transition-colors shrink-0">
                            <Icon className="h-4 w-4 text-gray-600 group-hover:text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 group-hover:text-violet-700 truncate">
                              {type.label}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{type.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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

                        {/* 选项类字段配置 */}
                        {['radio', 'checkbox', 'image_select'].includes(field.type) && (
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

                        {/* 评分题配置 */}
                        {field.type === 'rating' && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">最大星级</Label>
                              <Select
                                value={String(field.maxRating || 5)}
                                onValueChange={(v) => handleUpdateField(index, { maxRating: parseInt(v) })}
                              >
                                <SelectTrigger className="bg-white border-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3">3星</SelectItem>
                                  <SelectItem value="5">5星</SelectItem>
                                  <SelectItem value="7">7星</SelectItem>
                                  <SelectItem value="10">10星</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {/* 量表题配置 */}
                        {field.type === 'scale' && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">最小值标签</Label>
                              <Input
                                placeholder="如：非常不满意"
                                value={field.minLabel || ''}
                                onChange={e => handleUpdateField(index, { minLabel: e.target.value })}
                                className="bg-white border-gray-200"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">最大值标签</Label>
                              <Input
                                placeholder="如：非常满意"
                                value={field.maxLabel || ''}
                                onChange={e => handleUpdateField(index, { maxLabel: e.target.value })}
                                className="bg-white border-gray-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* 文件上传配置 */}
                        {field.type === 'file' && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">最大文件数</Label>
                              <Select
                                value={String(field.maxFiles || 1)}
                                onValueChange={(v) => handleUpdateField(index, { maxFiles: parseInt(v) })}
                              >
                                <SelectTrigger className="bg-white border-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1个</SelectItem>
                                  <SelectItem value="3">3个</SelectItem>
                                  <SelectItem value="5">5个</SelectItem>
                                  <SelectItem value="10">10个</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">文件类型</Label>
                              <Select
                                value={field.fileType || 'all'}
                                onValueChange={(v) => handleUpdateField(index, { fileType: v })}
                              >
                                <SelectTrigger className="bg-white border-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">所有类型</SelectItem>
                                  <SelectItem value="image">仅图片</SelectItem>
                                  <SelectItem value="document">仅文档</SelectItem>
                                  <SelectItem value="pdf">仅PDF</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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
        <div className="flex items-center gap-3">
          {responses.length > 0 && (
            <Button
              onClick={handleExportData}
              variant="outline"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              导出数据
            </Button>
          )}
        </div>
      </div>

      {/* 表单信息 */}
      {responseCollection && (
        <Card className="border-0 shadow-lg bg-white mb-6">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{responseCollection.title}</h2>
                {responseCollection.description && (
                  <p className="text-gray-600">{responseCollection.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-700">{statistics.total}</div>
            <div className="text-sm text-gray-500 mt-1">应提交人数</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{statistics.submitted}</div>
            <div className="text-sm text-emerald-600/70 mt-1">已提交</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{statistics.notSubmitted}</div>
            <div className="text-sm text-amber-600/70 mt-1">未提交</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={responseTab === 'submitted' ? 'default' : 'outline'}
          onClick={() => setResponseTab('submitted')}
          className={cn(
            "gap-2",
            responseTab === 'submitted' 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
              : "text-gray-600"
          )}
        >
          <CheckCircle className="h-4 w-4" />
          已提交 ({statistics.submitted})
        </Button>
        <Button
          variant={responseTab === 'notSubmitted' ? 'default' : 'outline'}
          onClick={() => setResponseTab('notSubmitted')}
          className={cn(
            "gap-2",
            responseTab === 'notSubmitted' 
              ? "bg-amber-500 hover:bg-amber-600 text-white" 
              : "text-gray-600"
          )}
        >
          <AlertCircle className="h-4 w-4" />
          未提交 ({statistics.notSubmitted})
        </Button>
      </div>

      {/* 加载状态 */}
      {responsesLoading ? (
        <Card className="border-0 shadow-lg bg-white/80">
          <CardContent className="p-12 text-center text-gray-500">
            加载中...
          </CardContent>
        </Card>
      ) : responseTab === 'submitted' ? (
        // 已提交列表
        responses.length === 0 ? (
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
        )
      ) : (
        // 未提交列表
        notSubmitted.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-gray-500">全部已提交</p>
              <p className="text-sm text-gray-400 mt-1">所有家长都已完成填写</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notSubmitted.map((student, index) => (
              <Card key={student.studentId || index} className="border-0 shadow-sm bg-white overflow-hidden">
                <div className="h-1 bg-amber-400" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.studentName}</p>
                      <p className="text-xs text-gray-500 truncate">家长：{student.parentName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
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
