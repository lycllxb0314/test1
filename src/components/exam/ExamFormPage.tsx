'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

interface ExamSubject {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ExamForm {
  name: string;
  type: string;
  semester: string;
  description: string;
  grades: number[];
  subjects: ExamSubject[];
  examRooms: string[];
  startDate: string;
  endDate: string;
}

interface ExamFormProps {
  examId?: string; // 编辑模式传入ID
  initialData?: ExamForm;
}

// 考试类型选项
const EXAM_TYPES = [
  '期中考试',
  '期末考试',
  '单元测试',
  '月考',
  '模拟考试',
  '竞赛',
  '技能测试',
];

// 学期选项
const SEMESTERS = [
  '2025-2026-2',
  '2025-2026-1',
  '2024-2025-2',
  '2024-2025-1',
];

// 年级选项
const GRADES = [1, 2, 3, 4, 5, 6];

// ==================== 主组件 ====================

export default function ExamFormPage({ examId, initialData }: ExamFormProps) {
  const router = useRouter();
  const isEditMode = !!examId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExamForm>(initialData || {
    name: '',
    type: '期中考试',
    semester: '2025-2026-2',
    description: '',
    grades: [],
    subjects: [{ name: '', date: '', startTime: '', endTime: '', duration: 0 }],
    examRooms: [''],
    startDate: '',
    endDate: '',
  });

  // 编辑模式下加载数据
  useEffect(() => {
    if (isEditMode && examId && !initialData) {
      fetchExamData();
    }
  }, [examId, isEditMode, initialData]);

  const fetchExamData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${examId}`);
      const result = await response.json();

      if (result.success) {
        const exam = result.data;
        setFormData({
          name: exam.name || '',
          type: exam.type || '期中考试',
          semester: exam.semester || '2025-2026-2',
          description: exam.description || '',
          grades: exam.grades || [],
          subjects: exam.subjects?.length > 0 
            ? exam.subjects 
            : [{ name: '', date: '', startTime: '', endTime: '', duration: 0 }],
          examRooms: exam.examRooms?.length > 0 ? exam.examRooms : [''],
          startDate: exam.startDate ? exam.startDate.split('T')[0] : '',
          endDate: exam.endDate ? exam.endDate.split('T')[0] : '',
        });
      } else {
        toast.error('获取考试信息失败');
        router.push('/academic/exams');
      }
    } catch (err) {
      toast.error('获取考试信息失败');
      router.push('/academic/exams');
    } finally {
      setLoading(false);
    }
  };

  // 更新字段
  const updateField = (field: keyof ExamForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 切换年级选择
  const toggleGrade = (grade: number) => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade].sort((a, b) => a - b),
    }));
  };

  // 添加科目
  const addSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: '', date: '', startTime: '', endTime: '', duration: 0 }],
    }));
  };

  // 删除科目
  const removeSubject = (index: number) => {
    if (formData.subjects.length <= 1) {
      toast.error('至少保留一个科目');
      return;
    }
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  // 更新科目
  const updateSubject = (index: number, field: keyof ExamSubject, value: any) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((s, i) => {
        if (i !== index) return s;
        const updated = { ...s, [field]: value };
        // 计算时长
        if (field === 'startTime' || field === 'endTime') {
          if (updated.startTime && updated.endTime) {
            const start = new Date(`2000-01-01 ${updated.startTime}`);
            const end = new Date(`2000-01-01 ${updated.endTime}`);
            updated.duration = Math.round((end.getTime() - start.getTime()) / 60000);
          }
        }
        return updated;
      }),
    }));
  };

  // 添加考场
  const addExamRoom = () => {
    setFormData(prev => ({
      ...prev,
      examRooms: [...prev.examRooms, ''],
    }));
  };

  // 删除考场
  const removeExamRoom = (index: number) => {
    if (formData.examRooms.length <= 1) {
      toast.error('至少保留一个考场');
      return;
    }
    setFormData(prev => ({
      ...prev,
      examRooms: prev.examRooms.filter((_, i) => i !== index),
    }));
  };

  // 更新考场
  const updateExamRoom = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      examRooms: prev.examRooms.map((r, i) => i === index ? value : r),
    }));
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('请输入考试名称');
      return false;
    }
    if (!formData.type) {
      toast.error('请选择考试类型');
      return false;
    }
    if (!formData.startDate) {
      toast.error('请选择开始日期');
      return false;
    }

    // 验证科目
    const validSubjects = formData.subjects.filter(s => s.name.trim());
    if (validSubjects.length === 0) {
      toast.error('请至少添加一个科目');
      return false;
    }

    for (const subject of validSubjects) {
      if (!subject.date) {
        toast.error(`科目「${subject.name}」未设置考试日期`);
        return false;
      }
      if (!subject.startTime || !subject.endTime) {
        toast.error(`科目「${subject.name}」未设置考试时间`);
        return false;
      }
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = isEditMode ? `/api/exams/${examId}` : '/api/exams';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subjects: formData.subjects.filter(s => s.name.trim()),
          examRooms: formData.examRooms.filter(r => r.trim()),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEditMode ? '更新成功' : '创建成功');
        router.push('/academic/exams');
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/academic/exams')}
          className="text-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回列表
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? '编辑考试' : '新增考试'}
        </h1>
      </div>

      {/* 基本信息 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">考试名称 *</Label>
              <Input
                id="name"
                placeholder="请输入考试名称"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">考试类型 *</Label>
              <Select value={formData.type} onValueChange={(v) => updateField('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择考试类型" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="semester">所属学期</Label>
              <Select value={formData.semester} onValueChange={(v) => updateField('semester', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学期" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>参考年级</Label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((grade) => (
                  <Badge
                    key={grade}
                    variant={formData.grades.includes(grade) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer px-3 py-1.5',
                      formData.grades.includes(grade) 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'hover:bg-gray-100'
                    )}
                    onClick={() => toggleGrade(grade)}
                  >
                    {grade}年级
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500">不选择则默认全校参加</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期 *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">考试说明</Label>
            <Textarea
              id="description"
              placeholder="请输入考试说明..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 科目安排 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">科目安排</CardTitle>
              <CardDescription>设置考试科目及时间安排</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addSubject}>
              <Plus className="h-4 w-4 mr-1" />
              添加科目
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.subjects.map((subject, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-700">科目 {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeSubject(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs">科目名称 *</Label>
                  <Input
                    placeholder="如：语文"
                    value={subject.name}
                    onChange={(e) => updateSubject(index, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">考试日期 *</Label>
                  <Input
                    type="date"
                    value={subject.date}
                    onChange={(e) => updateSubject(index, 'date', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">开始时间 *</Label>
                  <Input
                    type="time"
                    value={subject.startTime}
                    onChange={(e) => updateSubject(index, 'startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">结束时间 *</Label>
                  <Input
                    type="time"
                    value={subject.endTime}
                    onChange={(e) => updateSubject(index, 'endTime', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">时长(分钟)</Label>
                  <div className="flex items-center gap-1.5 h-9 px-3 bg-gray-50 rounded-md text-sm text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{subject.duration || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 考场设置 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">考场设置</CardTitle>
              <CardDescription>设置考试场地（可选）</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addExamRoom}>
              <Plus className="h-4 w-4 mr-1" />
              添加考场
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {formData.examRooms.map((room, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`考场 ${index + 1}`}
                  value={room}
                  onChange={(e) => updateExamRoom(index, e.target.value)}
                />
                {formData.examRooms.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeExamRoom(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/academic/exams')}>
          取消
        </Button>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditMode ? '保存修改' : '创建考试'}
        </Button>
      </div>
    </div>
  );
}
