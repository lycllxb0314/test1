/**
 * 教师课时配置对话框
 * 
 * 用于配置：
 * - 周课时量
 * - 可任教科目（跨教科目）
 * - 可任教年级
 * - 是否班主任
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  BookOpen,
  GraduationCap,
  UserCheck,
  Save,
  Loader2,
} from 'lucide-react';

// 科目配置
const SUBJECTS = [
  { name: '语文', color: 'bg-red-100 text-red-700 border-red-200' },
  { name: '数学', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: '英语', color: 'bg-green-100 text-green-700 border-green-200' },
  { name: '体育', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { name: '音乐', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: '美术', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { name: '科学', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { name: '道德与法治', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { name: '信息技术', color: 'bg-teal-100 text-teal-700 border-teal-200' },
];

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// 跨教科目建议
const CROSS_SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  '语文': ['道德与法治'],
  '数学': ['科学'],
  '英语': [],
  '体育': [],
  '音乐': [],
  '美术': [],
  '科学': ['数学'],
  '道德与法治': ['语文'],
};

export interface TeacherScheduleConfig {
  teacherId: string;
  teacherName: string;
  primarySubject: string;       // 主教学科
  weeklyHours: number;          // 周课时量
  currentHours: number;         // 已安排课时
  teachableSubjects: string[];  // 可任教科目
  teachableGrades: number[];    // 可任教年级
  isHeadTeacher: boolean;       // 是否班主任
  headTeacherClassId?: string;  // 班主任班级
}

interface TeacherScheduleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TeacherScheduleConfig | null;
  onSave: (config: TeacherScheduleConfig) => void;
  classes: Array<{ id: string; name: string; grade: number }>;
}

export function TeacherScheduleConfigDialog({
  open,
  onOpenChange,
  config,
  onSave,
  classes,
}: TeacherScheduleConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TeacherScheduleConfig>({
    teacherId: '',
    teacherName: '',
    primarySubject: '语文',
    weeklyHours: 14,
    currentHours: 0,
    teachableSubjects: ['语文'],
    teachableGrades: [1, 2, 3, 4, 5, 6],
    isHeadTeacher: false,
  });

  // 初始化表单
  useEffect(() => {
    if (config) {
      setForm({ ...config });
    }
  }, [config]);

  // 切换可任教科目
  const toggleSubject = (subject: string) => {
    setForm(prev => {
      const subjects = prev.teachableSubjects.includes(subject)
        ? prev.teachableSubjects.filter(s => s !== subject)
        : [...prev.teachableSubjects, subject];
      
      return {
        ...prev,
        teachableSubjects: subjects,
        // 如果主教学科被移除，重新设置
        primarySubject: subjects.includes(prev.primarySubject) 
          ? prev.primarySubject 
          : subjects[0] || '语文',
      };
    });
  };

  // 切换可任教年级
  const toggleGrade = (grade: number) => {
    setForm(prev => {
      const grades = prev.teachableGrades.includes(grade)
        ? prev.teachableGrades.filter(g => g !== grade)
        : [...prev.teachableGrades, grade].sort();
      return { ...prev, teachableGrades: grades };
    });
  };

  // 保存
  const handleSave = async () => {
    setLoading(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave(form);
    setLoading(false);
    onOpenChange(false);
  };

  // 获取推荐跨教科目
  const suggestedSubjects = form.primarySubject 
    ? CROSS_SUBJECT_SUGGESTIONS[form.primarySubject] || []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            教师课时配置
          </DialogTitle>
          <DialogDescription>
            配置 {form.teacherName} 的课时量、任教科目和年级，这是智能排课的关键依据
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 课时量配置 */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              课时量配置
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>周课时量要求</Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={form.weeklyHours}
                  onChange={(e) => setForm({ ...form, weeklyHours: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">标准：语数英14节，其他16节</p>
              </div>
              
              <div className="space-y-2">
                <Label>已安排课时</Label>
                <Input
                  type="number"
                  value={form.currentHours}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">由系统自动计算</p>
              </div>
              
              <div className="space-y-2">
                <Label>剩余课时</Label>
                <div className={`text-2xl font-bold ${
                  form.weeklyHours - form.currentHours > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {form.weeklyHours - form.currentHours} 节
                </div>
              </div>
            </div>
          </div>

          {/* 任教科目配置 */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-600" />
              任教科目
            </h4>
            
            <div className="space-y-2">
              <Label>主教学科</Label>
              <Select 
                value={form.primarySubject} 
                onValueChange={(v) => {
                  setForm(prev => ({
                    ...prev,
                    primarySubject: v,
                    // 自动添加主教学科到可任教科目
                    teachableSubjects: prev.teachableSubjects.includes(v) 
                      ? prev.teachableSubjects 
                      : [v, ...prev.teachableSubjects],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>可任教科目（可跨教）</Label>
                {suggestedSubjects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">推荐：</span>
                    {suggestedSubjects.map(s => (
                      <Badge 
                        key={s}
                        variant="outline" 
                        className="cursor-pointer hover:bg-amber-50"
                        onClick={() => !form.teachableSubjects.includes(s) && toggleSubject(s)}
                      >
                        + {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                {SUBJECTS.map(subject => {
                  const isSelected = form.teachableSubjects.includes(subject.name);
                  const isPrimary = form.primarySubject === subject.name;
                  
                  return (
                    <Badge
                      key={subject.name}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? `${subject.color} border-2` 
                          : 'bg-white hover:bg-gray-100'
                      } ${isPrimary ? 'ring-2 ring-amber-400' : ''}`}
                      onClick={() => toggleSubject(subject.name)}
                    >
                      {subject.name}
                      {isPrimary && ' (主)'}
                    </Badge>
                  );
                })}
              </div>
              
              <p className="text-xs text-gray-500">
                点击选择可任教科目。语文老师通常可兼教道法，数学老师可兼教科学
              </p>
            </div>
          </div>

          {/* 任教年级配置 */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-amber-600" />
              任教年级
            </h4>
            
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5, 6].map(grade => {
                const isSelected = form.teachableGrades.includes(grade);
                return (
                  <div
                    key={grade}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-amber-100 border-2 border-amber-300' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                    onClick={() => toggleGrade(grade)}
                  >
                    <Checkbox checked={isSelected} />
                    <span className={isSelected ? 'font-medium' : 'text-gray-600'}>
                      {GRADE_NAMES[grade]}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-gray-500">
              选择该教师可以任教的年级范围。一般教师会固定在某个年级段
            </p>
          </div>

          {/* 班主任配置 */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-600" />
              班主任配置
            </h4>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={form.isHeadTeacher}
                onCheckedChange={(checked) => setForm({ 
                  ...form, 
                  isHeadTeacher: !!checked,
                  headTeacherClassId: checked ? form.headTeacherClassId : undefined,
                })}
              />
              <Label className="cursor-pointer">担任班主任</Label>
              
              {form.isHeadTeacher && (
                <Select 
                  value={form.headTeacherClassId || ''} 
                  onValueChange={(v) => setForm({ ...form, headTeacherClassId: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              班主任在排课时会优先安排本班课程
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || form.teachableSubjects.length === 0}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
