/**
 * 教师课时配置对话框
 * 
 * 用于配置：
 * - 教师角色（班主任/教研组长/中层行政/年段长/科任/技能科教师）
 * - 主教学科
 * - 主科带班数
 * - 主科课时量（根据规则自动计算建议值）
 * - 兼任科目
 * - 可任教年级
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  BookOpen,
  GraduationCap,
  UserCheck,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Calculator,
} from 'lucide-react';
import {
  TeacherRole,
  TEACHER_ROLE_LABELS,
  MAIN_SUBJECTS,
  PRIORITY_SECONDARY_SUBJECTS,
  ALL_SUBJECTS,
  TEACHING_HOURS_RULES,
  calculateSuggestedHours,
  validateTeachingHours,
} from '@/lib/data/teaching-rules';

// 科目配置
const SUBJECTS_CONFIG = [
  { name: '语文', color: 'bg-red-100 text-red-700 border-red-200', isMain: true },
  { name: '数学', color: 'bg-blue-100 text-blue-700 border-blue-200', isMain: true },
  { name: '英语', color: 'bg-green-100 text-green-700 border-green-200', isMain: true },
  { name: '体育', color: 'bg-orange-100 text-orange-700 border-orange-200', isMain: false },
  { name: '音乐', color: 'bg-purple-100 text-purple-700 border-purple-200', isMain: false },
  { name: '美术', color: 'bg-pink-100 text-pink-700 border-pink-200', isMain: false },
  { name: '科学', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', isMain: false },
  { name: '道德与法治', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', isMain: false },
  { name: '信息技术', color: 'bg-teal-100 text-teal-700 border-teal-200', isMain: false },
  { name: '劳动', color: 'bg-amber-100 text-amber-700 border-amber-200', isMain: false },
];

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export interface TeacherScheduleConfig {
  teacherId: string;
  teacherName: string;
  role: TeacherRole;
  primarySubject: string;
  secondarySubjects: string[];
  mainClassCount: number;      // 主科带班数
  mainSubjectHours: number;    // 主科课时
  totalWeeklyHours: number;    // 总课时
  currentHours: number;
  teachableGrades: number[];
  headTeacherClassId?: string;
  subjectHeadClassId?: string;
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
    role: 'subject_teacher',
    primarySubject: '',
    secondarySubjects: [],
    mainClassCount: 2,
    mainSubjectHours: 11,
    totalWeeklyHours: 13,
    currentHours: 0,
    teachableGrades: [],
    headTeacherClassId: undefined,
    subjectHeadClassId: undefined,
  });

  // 是否是技能科教师（非主科）
  const isSkillTeacher = useMemo(() => {
    return !MAIN_SUBJECTS.includes(form.primarySubject as any);
  }, [form.primarySubject]);

  // 根据角色和带班数计算建议课时
  const suggestedHours = useMemo(() => {
    return calculateSuggestedHours(form.role, form.mainClassCount, isSkillTeacher);
  }, [form.role, form.mainClassCount, isSkillTeacher]);

  // 验证课时配置
  const validation = useMemo(() => {
    if (isSkillTeacher) {
      return { valid: true, message: '', warnings: [] };
    }
    return validateTeachingHours(
      form.role,
      form.mainClassCount,
      form.mainSubjectHours,
      form.totalWeeklyHours
    );
  }, [form.role, form.mainClassCount, form.mainSubjectHours, form.totalWeeklyHours, isSkillTeacher]);

  // 获取兼任科目建议
  const secondarySuggestions = useMemo(() => {
    return PRIORITY_SECONDARY_SUBJECTS[form.primarySubject] || [];
  }, [form.primarySubject]);

  // 初始化表单
  useEffect(() => {
    if (config) {
      setForm({
        ...config,
        secondarySubjects: config.secondarySubjects || [],
        teachableGrades: config.teachableGrades || [],
      });
    }
  }, [config]);

  // 角色或带班数变化时，自动调整建议课时
  useEffect(() => {
    if (!isSkillTeacher) {
      setForm(prev => ({
        ...prev,
        mainSubjectHours: suggestedHours.mainSubjectHours,
        totalWeeklyHours: suggestedHours.totalHours,
      }));
    } else {
      // 技能科教师
      setForm(prev => ({
        ...prev,
        mainClassCount: 0,
        mainSubjectHours: 0,
        totalWeeklyHours: suggestedHours.totalHours,
      }));
    }
  }, [suggestedHours, isSkillTeacher]);

  // 主科变化时，自动选择建议的兼任科目
  useEffect(() => {
    if (form.primarySubject && secondarySuggestions.length > 0) {
      setForm(prev => ({
        ...prev,
        secondarySubjects: secondarySuggestions.filter(s => !prev.secondarySubjects.includes(s)),
      }));
    }
  }, [form.primarySubject, secondarySuggestions]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleGrade = (grade: number) => {
    setForm(prev => ({
      ...prev,
      teachableGrades: prev.teachableGrades.includes(grade)
        ? prev.teachableGrades.filter(g => g !== grade)
        : [...prev.teachableGrades, grade].sort(),
    }));
  };

  const toggleSecondarySubject = (subject: string) => {
    setForm(prev => ({
      ...prev,
      secondarySubjects: prev.secondarySubjects.includes(subject)
        ? prev.secondarySubjects.filter(s => s !== subject)
        : [...prev.secondarySubjects, subject],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            教师课时配置
          </DialogTitle>
          <DialogDescription>
            配置教师的角色、课时量和任教信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 教师信息 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">{form.teacherName}</div>
              <div className="text-sm text-gray-500">当前已安排 {form.currentHours} 节课</div>
            </div>
          </div>

          {/* 角色选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              教师角色
            </Label>
            <Select
              value={form.role}
              onValueChange={(value: TeacherRole) => setForm(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEACHER_ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              角色影响课时量标准：班主任/教研组长带1个班，普通主科教师可带2个班
            </p>
          </div>

          {/* 主教学科 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              主教学科
            </Label>
            <Select
              value={form.primarySubject}
              onValueChange={(value) => setForm(prev => ({ ...prev, primarySubject: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择主教学科" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS_CONFIG.map(subject => (
                  <SelectItem key={subject.name} value={subject.name}>
                    <div className="flex items-center gap-2">
                      <span>{subject.name}</span>
                      {subject.isMain && (
                        <Badge variant="outline" className="text-[10px]">主科</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 主科配置（仅主科教师显示） */}
          {!isSkillTeacher && (
            <>
              {/* 带班数 */}
              <div className="space-y-2">
                <Label>主科带班数</Label>
                <Select
                  value={form.mainClassCount.toString()}
                  onValueChange={(value) => setForm(prev => ({ ...prev, mainClassCount: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">带1个班</SelectItem>
                    <SelectItem value="2">带2个班</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {form.role === 'head_teacher' && '班主任只能带1个班'}
                  {form.role === 'grade_leader' && '年段长通常带1个班'}
                  {form.role === 'subject_teacher' && '科任教师通常带2个班'}
                  {form.role === 'skill_teacher' && '技能课教师跨多个班级'}
                </p>
              </div>

              {/* 课时配置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>主科课时（周）</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={form.mainSubjectHours}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        mainSubjectHours: parseInt(e.target.value) || 0 
                      }))}
                      min={0}
                      max={20}
                    />
                    <span className="text-sm text-gray-500">节</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    参考：{suggestedHours.mainSubjectHours} 节（可调整）
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>总课时（周）</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={form.totalWeeklyHours}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        totalWeeklyHours: parseInt(e.target.value) || 0 
                      }))}
                      min={0}
                      max={25}
                    />
                    <span className="text-sm text-gray-500">节</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    参考约：{suggestedHours.totalHours} 节（可调整）
                  </p>
                </div>
              </div>

              {/* 课时分配预览 */}
              {form.headTeacherClassId && form.mainClassCount === 1 && (
                <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="flex items-center gap-2 text-blue-700">
                    <Calculator className="h-4 w-4" />
                    课时分配预览
                  </Label>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">本班主科：</span>
                      <span className="font-medium">{form.mainSubjectHours}节</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">本班兼任：</span>
                      <span className="font-medium">
                        {form.secondarySubjects.length > 0 
                          ? `${form.secondarySubjects.length * 2}节` 
                          : '待配置'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">本班班会：</span>
                      <span className="font-medium">1节</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">其他班课时：</span>
                      <span className="font-medium text-amber-600">
                        {Math.max(0, form.totalWeeklyHours - form.mainSubjectHours - 
                          (form.secondarySubjects.length * 2) - 1)}节
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 本班课程有限，剩余课时需到其他班级教学
                  </p>
                </div>
              )}

              {/* 兼任科目 */}
              <div className="space-y-2">
                <Label>兼任科目</Label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS_CONFIG
                    .filter(s => s.name !== form.primarySubject)
                    .map(subject => (
                      <Badge
                        key={subject.name}
                        variant={form.secondarySubjects.includes(subject.name) ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          secondarySuggestions.includes(subject.name) 
                            ? 'ring-2 ring-amber-400' 
                            : ''
                        }`}
                        onClick={() => toggleSecondarySubject(subject.name)}
                      >
                        {subject.name}
                        {secondarySuggestions.includes(subject.name) && (
                          <span className="ml-1 text-[10px]">推荐</span>
                        )}
                      </Badge>
                    ))}
                </div>
                <p className="text-xs text-gray-500">
                  班主任/科任优先兼任本班的道法、劳动等科目
                </p>
              </div>
            </>
          )}

          {/* 技能科教师课时 */}
          {isSkillTeacher && (
            <div className="space-y-2">
              <Label>周课时量</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={form.totalWeeklyHours}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    totalWeeklyHours: parseInt(e.target.value) || 0 
                  }))}
                  min={10}
                  max={25}
                />
                <span className="text-sm text-gray-500">节</span>
              </div>
              <p className="text-xs text-gray-500">
                技能科教师周课时约13节（跨多个班级，可能跨段）
              </p>
            </div>
          )}

          {/* 可任教年级 */}
          <div className="space-y-2">
            <Label>可任教年级</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map(grade => (
                <Badge
                  key={grade}
                  variant={form.teachableGrades.includes(grade) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleGrade(grade)}
                >
                  {GRADE_NAMES[grade]}
                </Badge>
              ))}
            </div>
          </div>

          {/* 班级关联 */}
          {form.role === 'head_teacher' && (
            <div className="space-y-2">
              <Label>班主任班级</Label>
              <Select
                value={form.headTeacherClassId || ''}
                onValueChange={(value) => setForm(prev => ({ ...prev, headTeacherClassId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择班主任班级" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 验证提示 */}
          {!validation.valid && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {validation.message}
              </AlertDescription>
              {validation.warnings.map((w, i) => (
                <AlertDescription key={i} className="text-amber-700 text-sm mt-1">
                  • {w}
                </AlertDescription>
              ))}
            </Alert>
          )}

          {/* 课时规则说明 */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <div className="font-medium mb-2">课时分配参考（周课时约13节）</div>
              <div className="text-xs text-blue-600 mb-2">⚠️ 以下规则仅供参考，教务主任有最终决定权</div>
              <ul className="space-y-1 text-xs">
                <li>• 班主任/教研组长/中层行政/年段长：本班主科5-6节 + 本班兼任约4节 + 其他班约3节</li>
                <li>• 科任：两个班主科共10-12节 + 兼任1-2节</li>
                <li>• 技能科教师：跨多个班级，约13节（可能跨段）</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
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
