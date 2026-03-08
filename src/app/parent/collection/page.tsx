'use client';

/**
 * 家长信息收集页面
 * 
 * 功能：
 * - 查看待填写的信息收集列表
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Calendar,
  User,
  ChevronRight,
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
  teacherName: string;
  deadline: string | null;
  publishedAt: string;
  fields: FormField[];
  submitted: boolean;
  submittedAt: string | null;
  isExpired: boolean;
}

export default function ParentCollectionPage() {
  const { user } = useAuth();
  
  // 列表状态
  const [collections, setCollections] = useState<InformationCollection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 填写对话框
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
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

  // 打开填写对话框
  const handleOpenFillDialog = (collection: InformationCollection) => {
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
    setFillDialogOpen(true);
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
        setFillDialogOpen(false);
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

  // 渲染字段输入组件
  const renderFieldInput = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            value={formResponses[field.id] as string || ''}
            onChange={e => handleUpdateResponse(field.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={formResponses[field.id] as string || ''}
            onChange={e => handleUpdateResponse(field.id, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={formResponses[field.id] as string || ''}
            onChange={e => handleUpdateResponse(field.id, e.target.value)}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={formResponses[field.id] as string || ''}
            onChange={e => handleUpdateResponse(field.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={formResponses[field.id] as string || ''}
            onValueChange={(v) => handleUpdateResponse(field.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={formResponses[field.id] as string || ''}
            onValueChange={(v) => handleUpdateResponse(field.id, v)}
          >
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value={opt} />
                <span>{opt}</span>
              </label>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const selectedValues = (formResponses[field.id] as string[]) || [];
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleUpdateResponse(field.id, [...selectedValues, opt]);
                    } else {
                      handleUpdateResponse(field.id, selectedValues.filter(v => v !== opt));
                    }
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/50 via-white to-teal-50/50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg shadow-green-500/30">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-teal-600 bg-clip-text text-transparent">
              信息收集
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">
            填写班主任发布的信息收集表
          </p>
        </div>
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
            <p className="text-sm text-gray-400 mt-1">班主任发布后您将收到通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map(collection => (
            <Card
              key={collection.id}
              className={cn(
                "border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all hover:shadow-xl",
                collection.submitted && "opacity-75"
              )}
              onClick={() => !collection.submitted && !collection.isExpired && handleOpenFillDialog(collection)}
            >
              <div className={cn(
                "h-1",
                collection.submitted ? "bg-green-500" : collection.isExpired ? "bg-gray-400" : "bg-gradient-to-r from-green-500 to-teal-500"
              )} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{collection.title}</h3>
                      {collection.submitted ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已提交
                        </Badge>
                      ) : collection.isExpired ? (
                        <Badge className="bg-gray-100 text-gray-600">
                          已截止
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          待填写
                        </Badge>
                      )}
                    </div>

                    {collection.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{collection.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{collection.fields.length} 个字段</span>
                      </div>
                      {collection.deadline && (
                        <div className={cn(
                          "flex items-center gap-1",
                          collection.isExpired && "text-red-500"
                        )}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>截止：{new Date(collection.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                      {collection.submittedAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>提交于 {new Date(collection.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!collection.submitted && !collection.isExpired && (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 填写对话框 */}
      <Dialog open={fillDialogOpen} onOpenChange={setFillDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentCollection?.title}</DialogTitle>
            <DialogDescription>
              发布人：{currentCollection?.teacherName}
              {currentCollection?.deadline && (
                <span className="ml-4">
                  截止时间：{new Date(currentCollection.deadline).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {currentCollection?.description && (
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
              {currentCollection.description}
            </div>
          )}

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4">
              {currentCollection?.fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderFieldInput(field)}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFillDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
            >
              {submitting ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
