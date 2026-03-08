'use client';

/**
 * 家长信息收集页面
 * 
 * 功能：
 * - 查看待填写的信息收集列表
 * - 点击卡片进入填写界面（非弹窗）
 * - 填写并提交信息收集表单
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Star,
  Phone,
  CreditCard,
  Upload,
  Hash,
  Clock3,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// 表单字段类型（与教师端一致）
interface FormField {
  id: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'date' | 'time' | 'datetime' | 'number' | 'rating' | 'scale' | 'phone' | 'idcard' | 'file' | 'image_select';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  maxRating?: number;
  minLabel?: string;
  maxLabel?: string;
  maxFiles?: number;
  fileType?: string;
}

// 信息收集类型
interface InformationCollection {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  deadline: string | null;
  publishedAt: string;
  fields: FormField[];
  submitted: boolean;
  submittedAt: string | null;
  isExpired: boolean;
}

// 视图模式
type ViewMode = 'list' | 'form';

export default function ParentCollectionPage() {
  const { user } = useAuth();
  
  // 视图状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // 列表状态
  const [collections, setCollections] = useState<InformationCollection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 表单状态
  const [currentCollection, setCurrentCollection] = useState<InformationCollection | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // 加载列表
  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/information-collections/parent');
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
  }, []);

  // 进入填写界面
  const handleEnterForm = (collection: InformationCollection) => {
    if (collection.submitted || collection.isExpired) return;
    
    setCurrentCollection(collection);
    // 初始化表单响应
    const initialResponses: Record<string, string | string[]> = {};
    collection.fields.forEach(field => {
      if (field.type === 'checkbox') {
        initialResponses[field.id] = [];
      } else {
        initialResponses[field.id] = '';
      }
    });
    setFormResponses(initialResponses);
    setViewMode('form');
  };

  // 返回列表
  const handleBackToList = () => {
    setViewMode('list');
    setCurrentCollection(null);
    setFormResponses({});
  };

  // 更新响应
  const handleUpdateResponse = (fieldId: string, value: string | string[]) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // 提交响应
  const handleSubmit = async () => {
    if (!currentCollection) return;

    // 验证必填字段
    const missingFields = currentCollection.fields
      .filter(f => f.required && !formResponses[f.id])
      .map(f => f.label);

    if (missingFields.length > 0) {
      alert(`请填写必填项：${missingFields.join('、')}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/information-collections/${currentCollection.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: formResponses }),
      });

      const data = await res.json();
      if (data.success) {
        fetchCollections();
        handleBackToList();
      } else {
        alert(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 计算填写进度
  const calculateProgress = () => {
    if (!currentCollection) return 0;
    const requiredFields = currentCollection.fields.filter(f => f.required);
    if (requiredFields.length === 0) return 100;
    
    const filledCount = requiredFields.filter(f => {
      const value = formResponses[f.id];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== '';
    }).length;
    
    return Math.round((filledCount / requiredFields.length) * 100);
  };

  // 渲染字段输入组件
  const renderFieldInput = (field: FormField, index: number) => {
    const value = formResponses[field.id];
    
    return (
      <div key={field.id} className="group">
        <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all">
          {/* 题号 */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
            {index + 1}
          </div>
          
          {/* 题目内容 */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium text-gray-800">
                {field.label}
              </Label>
              {field.required && (
                <span className="text-red-500 text-sm">*</span>
              )}
            </div>
            
            {field.placeholder && (
              <p className="text-sm text-gray-500">{field.placeholder}</p>
            )}
            
            {/* 根据类型渲染输入 */}
            {field.type === 'text' && (
              <Input
                placeholder="请输入"
                value={(value as string) || ''}
                onChange={e => handleUpdateResponse(field.id, e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400"
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                placeholder="请输入"
                value={(value as string) || ''}
                onChange={e => handleUpdateResponse(field.id, e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 min-h-[100px]"
              />
            )}

            {field.type === 'number' && (
              <Input
                type="number"
                placeholder="请输入数字"
                value={(value as string) || ''}
                onChange={e => handleUpdateResponse(field.id, e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 max-w-xs"
              />
            )}

            {field.type === 'phone' && (
              <div className="relative max-w-xs">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  value={(value as string) || ''}
                  onChange={e => handleUpdateResponse(field.id, e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 pl-10"
                  maxLength={11}
                />
              </div>
            )}

            {field.type === 'idcard' && (
              <div className="relative max-w-xs">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="请输入身份证号"
                  value={(value as string) || ''}
                  onChange={e => handleUpdateResponse(field.id, e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 pl-10"
                  maxLength={18}
                />
              </div>
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={(value as string) || ''}
                onChange={e => handleUpdateResponse(field.id, e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 w-48"
              />
            )}

            {field.type === 'time' && (
              <Input
                type="time"
                value={(value as string) || ''}
                onChange={e => handleUpdateResponse(field.id, e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 w-40"
              />
            )}

            {field.type === 'datetime' && (
              <Input
                type="datetime-local"
                value={(value as string) || ''}
                onChange={e => handleUpdateResponse(field.id, e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-400 w-56"
              />
            )}

            {field.type === 'radio' && field.options && (
              <RadioGroup
                value={(value as string) || ''}
                onValueChange={(v) => handleUpdateResponse(field.id, v)}
                className="space-y-2"
              >
                {field.options.map((opt, i) => (
                  <label 
                    key={i} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      (value as string) === opt 
                        ? "border-green-400 bg-green-50" 
                        : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                    )}
                  >
                    <RadioGroupItem value={opt} className="text-green-500" />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            )}

            {field.type === 'checkbox' && field.options && (
              <div className="space-y-2">
                {field.options.map((opt, i) => {
                  const selectedValues = (value as string[]) || [];
                  const isChecked = selectedValues.includes(opt);
                  return (
                    <label 
                      key={i} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        isChecked 
                          ? "border-green-400 bg-green-50" 
                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleUpdateResponse(field.id, [...selectedValues, opt]);
                          } else {
                            handleUpdateResponse(field.id, selectedValues.filter(v => v !== opt));
                          }
                        }}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {field.type === 'rating' && (
              <div className="flex items-center gap-1">
                {Array.from({ length: field.maxRating || 5 }).map((_, i) => {
                  const rating = i + 1;
                  const currentRating = parseInt((value as string) || '0');
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleUpdateResponse(field.id, String(rating))}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "h-8 w-8 transition-colors",
                          rating <= currentRating 
                            ? "fill-amber-400 text-amber-400" 
                            : "text-gray-300"
                        )} 
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {field.type === 'scale' && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{field.minLabel || '低'}</span>
                  <span>{field.maxLabel || '高'}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const currentScale = parseInt((value as string) || '0');
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleUpdateResponse(field.id, String(num))}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 font-semibold transition-all",
                          num === currentScale
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-200 hover:border-green-300 text-gray-600"
                        )}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {field.type === 'file' && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-400 hover:bg-green-50/50 transition-all cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">点击上传文件</p>
                <p className="text-xs text-gray-400">
                  最多 {field.maxFiles || 1} 个文件
                  {field.fileType && field.fileType !== 'all' && `，仅支持${field.fileType === 'image' ? '图片' : field.fileType === 'document' ? '文档' : 'PDF'}`}
                </p>
              </div>
            )}

            {field.type === 'image_select' && field.options && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {field.options.map((opt, i) => {
                  const selectedValues = (value as string[]) || [];
                  const isSelected = selectedValues.includes(opt);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleUpdateResponse(field.id, selectedValues.filter(v => v !== opt));
                        } else {
                          handleUpdateResponse(field.id, [...selectedValues, opt]);
                        }
                      }}
                      className={cn(
                        "aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all",
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-600">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染列表视图
  const renderListView = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg shadow-green-500/20">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">信息收集</h1>
              <p className="text-sm text-gray-500">填写班主任发布的信息收集表</p>
            </div>
          </div>
        </div>
        
        {/* 统计 */}
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <div className="text-lg font-bold text-amber-600">
              {collections.filter(c => !c.submitted && !c.isExpired).length}
            </div>
            <div className="text-xs text-amber-600/70">待填写</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-100">
            <div className="text-lg font-bold text-green-600">
              {collections.filter(c => c.submitted).length}
            </div>
            <div className="text-xs text-green-600/70">已提交</div>
          </div>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm bg-white animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">暂无信息收集</p>
            <p className="text-sm text-gray-400 mt-1">班主任发布后您将收到通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map(collection => (
            <Card
              key={collection.id}
              className={cn(
                "border-0 shadow-sm bg-white overflow-hidden transition-all",
                !collection.submitted && !collection.isExpired && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
              )}
              onClick={() => handleEnterForm(collection)}
            >
              {/* 状态条 */}
              <div className={cn(
                "h-1.5",
                collection.submitted 
                  ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                  : collection.isExpired 
                    ? "bg-gray-300" 
                    : "bg-gradient-to-r from-amber-400 to-orange-400"
              )} />
              
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{collection.title}</h3>
                      {collection.submitted ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已提交
                        </Badge>
                      ) : collection.isExpired ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-0 shrink-0">
                          已截止
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          待填写
                        </Badge>
                      )}
                    </div>

                    {/* 描述 */}
                    {collection.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                    )}

                    {/* 信息标签 */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{collection.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{collection.fields.length} 题</span>
                      </div>
                      {collection.deadline && (
                        <div className={cn(
                          "flex items-center gap-1.5",
                          collection.isExpired && "text-red-400"
                        )}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {collection.isExpired ? '已截止' : `截止 ${new Date(collection.deadline).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      {collection.submittedAt && (
                        <div className="flex items-center gap-1.5 text-green-500">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{new Date(collection.submittedAt).toLocaleDateString()} 提交</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 箭头 */}
                  {!collection.submitted && !collection.isExpired && (
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <ChevronRight className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染表单视图
  const renderFormView = () => {
    if (!currentCollection) return null;
    
    const progress = calculateProgress();
    
    return (
      <div className="space-y-6">
        {/* 顶部导航 */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-green-50/95 via-white/95 to-teal-50/95 backdrop-blur-sm pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
            
            {/* 进度 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">填写进度</span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm font-medium text-green-600">{progress}%</span>
            </div>
          </div>
        </div>

        {/* 表单标题区域 */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-teal-600 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-xl font-bold">{currentCollection.title}</h1>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{currentCollection.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>{currentCollection.fields.length} 道题目</span>
                  </div>
                  {currentCollection.deadline && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>截止 {new Date(currentCollection.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 表单说明 */}
        {currentCollection.description && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700">{currentCollection.description}</p>
          </div>
        )}

        {/* 表单字段 */}
        <div className="space-y-4">
          {currentCollection.fields.map((field, index) => renderFieldInput(field, index))}
        </div>

        {/* 提交区域 */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="text-green-600 font-medium">{currentCollection.fields.filter(f => f.required).length}</span> 道必答题
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleBackToList}
                    disabled={submitting}
                  >
                    稍后填写
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg shadow-green-500/30"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        提交
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-green-50/50 via-white to-teal-50/50">
      {viewMode === 'list' ? renderListView() : renderFormView()}
    </div>
  );
}
