'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { HabitCategory, habitCategoryNames } from '@/types';

// 习惯类别配置
const habitCategories: { key: HabitCategory; name: string; icon: React.ElementType }[] = [
  { key: 'civilization', name: '文明习惯', icon: Heart },
  { key: 'writing', name: '书写习惯', icon: Pen },
  { key: 'reading', name: '阅读习惯', icon: BookOpen },
  { key: 'sports', name: '运动习惯', icon: Trophy },
  { key: 'safety', name: '安全习惯', icon: Shield },
  { key: 'hygiene', name: '卫生习惯', icon: Sparkles },
  { key: 'aesthetic', name: '审美习惯', icon: Palette },
  { key: 'labor', name: '劳动习惯', icon: Hammer },
];

// 评价类型配置
const assessmentTypes = [
  { value: 'praise', label: '表扬', score: 5, icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'improve', label: '待改进', score: -2, icon: ThumbsDown, color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

// 学生信息类型
interface StudentInfo {
  id: string;
  name: string;
  studentNumber: string;
  grade: number;
  className: string;
}

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students?: StudentInfo[];
  classId?: string;
  evaluatorId: string;
  evaluatorName: string;
  onSuccess?: () => void;
}

export function AssessmentDialog({
  open,
  onOpenChange,
  students = [],
  classId,
  evaluatorId,
  evaluatorName,
  onSuccess,
}: AssessmentDialogProps) {
  const [step, setStep] = useState(1); // 1: 选择学生, 2: 填写评价
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [assessmentType, setAssessmentType] = useState<'praise' | 'improve'>('praise');
  const [category, setCategory] = useState<HabitCategory>('civilization');
  const [context, setContext] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentList, setStudentList] = useState<StudentInfo[]>(students);

  // 如果没有传入学生列表，从API获取
  useEffect(() => {
    if (open && students.length === 0 && classId) {
      fetchStudents();
    }
  }, [open, classId, students.length]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch(`/api/classes/${classId}/students`);
      const result = await response.json();
      if (result.success && result.data) {
        setStudentList(result.data);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
      toast.error('获取学生列表失败');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast.error('请选择学生');
      return;
    }
    if (!context.trim()) {
      toast.error('请输入评价内容');
      return;
    }

    try {
      setSubmitting(true);
      
      const assessmentData = {
        studentId: selectedStudent.id,
        category,
        score: assessmentTypes.find(t => t.value === assessmentType)?.score || 5,
        evaluatorId,
        evaluatorName,
        evaluatorType: 'teacher' as const,
        context: context.trim(),
        notes: notes.trim() || undefined,
      };

      const response = await fetch('/api/habit/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${assessmentType === 'praise' ? '表扬' : '待改进'}记录已保存`);
        // 重置表单
        setStep(1);
        setSelectedStudent(null);
        setContext('');
        setNotes('');
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.error || '提交失败');
      }
    } catch (error) {
      console.error('提交评价记录失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const selectedType = assessmentTypes.find(t => t.value === assessmentType);
  const selectedCategory = habitCategories.find(c => c.key === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? '选择学生' : '填写评价'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? '选择要评价的学生，然后填写评价内容' 
              : `正在为 ${selectedStudent?.name} 添加评价记录`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // 步骤1：选择学生
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="搜索学生姓名或学号..."
                className="pl-3"
                onChange={(e) => {
                  const query = e.target.value.toLowerCase();
                  if (query && students.length > 0) {
                    setStudentList(students.filter(s => 
                      s.name.toLowerCase().includes(query) || 
                      s.studentNumber.toLowerCase().includes(query)
                    ));
                  } else if (students.length > 0) {
                    setStudentList(students);
                  }
                }}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : studentList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无学生数据
                </div>
              ) : (
                studentList.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.studentNumber} · {student.className}
                      </div>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <Badge variant="default" className="text-xs">已选</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // 步骤2：填写评价
          <div className="space-y-4">
            {/* 评价类型 */}
            <div className="space-y-2">
              <Label>评价类型</Label>
              <RadioGroup
                value={assessmentType}
                onValueChange={(v) => setAssessmentType(v as 'praise' | 'improve')}
                className="flex gap-4"
              >
                {assessmentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div key={type.value} className="flex-1">
                      <RadioGroupItem
                        value={type.value}
                        id={type.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={type.value}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          assessmentType === type.value ? type.color : 'border-muted'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{type.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* 习惯类别 */}
            <div className="space-y-2">
              <Label>习惯类别</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as HabitCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {habitCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.key} value={cat.key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 评价内容 */}
            <div className="space-y-2">
              <Label htmlFor="context">评价内容 *</Label>
              <Textarea
                id="context"
                placeholder={`请描述${selectedType?.label}的具体原因或事例...`}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="notes">备注（可选）</Label>
              <Textarea
                id="notes"
                placeholder="补充说明或建议..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* 分数预览 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">本次评分</span>
              <Badge 
                variant={assessmentType === 'praise' ? 'default' : 'secondary'}
                className={`text-lg px-3 py-1 ${
                  assessmentType === 'praise' ? 'bg-green-600' : 'bg-amber-600'
                }`}
              >
                {assessmentType === 'praise' ? '+' : ''}{selectedType?.score} 分
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={handleBack}>
              返回
            </Button>
          )}
          {step === 1 ? (
            <Button 
              onClick={() => {
                if (selectedStudent) {
                  setStep(2);
                } else {
                  toast.error('请先选择学生');
                }
              }}
              disabled={!selectedStudent}
            >
              下一步
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !context.trim()}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              提交评价
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
