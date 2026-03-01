/**
 * 教师详情编辑对话框（统一整合版）
 * 
 * 整合了：
 * - 基本信息（可编辑）
 * - 角色配置（主要角色 + 兼任职务）
 * - 课时配置（不含角色设置）
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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  UserCog,
  Clock,
  BookOpen,
  Phone,
  Mail,
  Award,
  Building,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Calculator,
  GraduationCap,
} from 'lucide-react';
import {
  TeacherRole,
  AdministrativeRole,
  TEACHER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
} from '@/hooks/useTeachers';
import { MAIN_SUBJECTS, calculateSuggestedHours, validateTeachingHours } from '@/lib/data/teaching-rules';

// 科目配置
const SUBJECTS_CONFIG = [
  { name: '语文', isMain: true },
  { name: '数学', isMain: true },
  { name: '英语', isMain: false },
  { name: '体育', isMain: false },
  { name: '音乐', isMain: false },
  { name: '美术', isMain: false },
  { name: '科学', isMain: false },
  { name: '道德与法治', isMain: false },
  { name: '信息技术', isMain: false },
  { name: '劳动', isMain: false },
];

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// 主要角色选项（教师本职角色）
const PRIMARY_ROLE_OPTIONS: TeacherRole[] = [
  'head_teacher',
  'subject_teacher',
  'skill_teacher',
];

// 可兼任的行政职务选项
const ADMINISTRATIVE_ROLE_OPTIONS: AdministrativeRole[] = [
  'grade_leader',
  'research_group_leader',
  'research_group_deputy_leader',
  'young_pioneer_counselor',
];

// 性别选项
const GENDER_OPTIONS = ['男', '女'];
// 职称选项
const TITLE_OPTIONS = ['二级教师', '一级教师', '高级教师', '正高级教师'];
// 状态选项
const STATUS_OPTIONS = [
  { value: 'active', label: '在职' },
  { value: 'on_leave', label: '请假' },
  { value: 'retired', label: '退休' },
];

/** 教师完整信息 */
export interface TeacherDetail {
  id: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  subject: string;
  title: string;
  department: string;
  status: string;
  teachYears: number;
  // 角色信息
  primaryRole: TeacherRole;
  additionalRoles: AdministrativeRole[];
  // 课时配置
  weeklyHours: number;
  currentHours: number;
  teachableSubjects: string[];
  teachableGrades: number[];
  isHeadTeacher: boolean;
  headTeacherClassId?: string;
  headTeacherClassName?: string;
}

/** 组件属性 */
interface TeacherDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherDetail | null;
  classes: Array<{ id: string; name: string; grade: number }>;
  onSave: (teacher: TeacherDetail) => Promise<void>;
}

export function TeacherDetailDialog({
  open,
  onOpenChange,
  teacher,
  classes,
  onSave,
}: TeacherDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState<TeacherDetail>({
    id: '',
    name: '',
    gender: '男',
    phone: '',
    email: '',
    subject: '语文',
    title: '二级教师',
    department: '',
    status: 'active',
    teachYears: 0,
    primaryRole: 'subject_teacher',
    additionalRoles: [],
    weeklyHours: 13,
    currentHours: 0,
    teachableSubjects: ['语文'],
    teachableGrades: [1, 2, 3, 4, 5, 6],
    isHeadTeacher: false,
  });

  // 是否是技能科教师
  const isSkillTeacher = useMemo(() => {
    return !MAIN_SUBJECTS.includes(form.subject as any);
  }, [form.subject]);

  // 根据主科和带班数计算建议课时
  const suggestedHours = useMemo(() => {
    return calculateSuggestedHours(form.primaryRole, form.weeklyHours > 12 ? 2 : 1, isSkillTeacher, form.subject);
  }, [form.primaryRole, form.weeklyHours, isSkillTeacher, form.subject]);

  // 初始化表单
  useEffect(() => {
    if (teacher) {
      setForm({
        ...teacher,
        teachableSubjects: teacher.teachableSubjects || [teacher.subject],
        teachableGrades: teacher.teachableGrades || [1, 2, 3, 4, 5, 6],
        additionalRoles: teacher.additionalRoles || [],
      });
    }
  }, [teacher]);

  // 主科变化时，自动调整主要角色
  useEffect(() => {
    if (isSkillTeacher && form.primaryRole === 'subject_teacher') {
      // 技能科教师如果选了科任，自动改为技能课教师
      setForm(prev => ({ ...prev, primaryRole: 'skill_teacher' }));
    } else if (!isSkillTeacher && form.primaryRole === 'skill_teacher') {
      // 主科教师如果选了技能课教师，自动改为科任
      setForm(prev => ({ ...prev, primaryRole: 'subject_teacher' }));
    }
  }, [isSkillTeacher, form.primaryRole]);

  // 切换兼任职务
  const toggleAdditionalRole = (role: AdministrativeRole) => {
    setForm(prev => ({
      ...prev,
      additionalRoles: prev.additionalRoles.includes(role)
        ? prev.additionalRoles.filter(r => r !== role)
        : [...prev.additionalRoles, role],
    }));
  };

  // 切换可任教年级
  const toggleGrade = (grade: number) => {
    setForm(prev => ({
      ...prev,
      teachableGrades: prev.teachableGrades.includes(grade)
        ? prev.teachableGrades.filter(g => g !== grade)
        : [...prev.teachableGrades, grade].sort(),
    }));
  };

  // 切换可任教科目
  const toggleSubject = (subject: string) => {
    setForm(prev => {
      const subjects = prev.teachableSubjects.includes(subject)
        ? prev.teachableSubjects.filter(s => s !== subject)
        : [...prev.teachableSubjects, subject];
      return { ...prev, teachableSubjects: subjects };
    });
  };

  // 保存
  const handleSave = async () => {
    setLoading(true);
    try {
      // 自动设置是否班主任
      const isHeadTeacher = form.primaryRole === 'head_teacher';
      await onSave({
        ...form,
        isHeadTeacher,
        // 技能科教师自动设置角色
        primaryRole: isSkillTeacher ? 'skill_teacher' : form.primaryRole,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const roleColor = TEACHER_ROLE_COLORS[form.primaryRole];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            教师详情 - {form.name || '新教师'}
          </DialogTitle>
          <DialogDescription>
            查看、编辑教师基本信息、角色和课时配置
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              基本信息
            </TabsTrigger>
            <TabsTrigger value="role" className="flex items-center gap-1">
              <UserCog className="h-4 w-4" />
              角色配置
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              课时配置
            </TabsTrigger>
          </TabsList>

          {/* 基本信息 Tab */}
          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 姓名 */}
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入姓名"
                />
              </div>

              {/* 性别 */}
              <div className="space-y-2">
                <Label>性别</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value) => setForm(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 联系电话 */}
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入电话"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="请输入邮箱"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 任教学科 */}
              <div className="space-y-2">
                <Label>任教学科</Label>
                <Select
                  value={form.subject}
                  onValueChange={(value) => setForm(prev => ({ 
                    ...prev, 
                    subject: value,
                    teachableSubjects: [value, ...prev.teachableSubjects.filter(s => s !== value)],
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS_CONFIG.map(s => (
                      <SelectItem key={s.name} value={s.name}>
                        <div className="flex items-center gap-2">
                          {s.name}
                          {s.isMain && <Badge variant="outline" className="text-xs">主科</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 职称 */}
              <div className="space-y-2">
                <Label>职称</Label>
                <Select
                  value={form.title}
                  onValueChange={(value) => setForm(prev => ({ ...prev, title: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TITLE_OPTIONS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 教研组 */}
              <div className="space-y-2">
                <Label htmlFor="department">教研组</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="department"
                    value={form.department}
                    onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="如：语文组"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 教龄 */}
              <div className="space-y-2">
                <Label htmlFor="teachYears">教龄（年）</Label>
                <Input
                  id="teachYears"
                  type="number"
                  min={0}
                  value={form.teachYears}
                  onChange={(e) => setForm(prev => ({ ...prev, teachYears: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* 状态 */}
              <div className="space-y-2 col-span-2">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* 角色配置 Tab */}
          <TabsContent value="role" className="space-y-6 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                主要角色决定教师的登录身份和基础权限；兼任职务只增加权限，不作为登录身份。
              </AlertDescription>
            </Alert>

            {/* 主要角色 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">主要角色</Label>
              <Select
                value={form.primaryRole}
                onValueChange={(value) => setForm(prev => ({ 
                  ...prev, 
                  primaryRole: value as TeacherRole 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_ROLE_OPTIONS.map(role => (
                    <SelectItem 
                      key={role} 
                      value={role}
                      disabled={role === 'skill_teacher' && !isSkillTeacher}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${TEACHER_ROLE_COLORS[role].bg}`} />
                        {TEACHER_ROLE_LABELS[role]}
                        {role === 'skill_teacher' && !isSkillTeacher && (
                          <span className="text-xs text-gray-400">（仅限技能科教师）</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">当前角色：</span>
                <Badge className={`${roleColor.bg} ${roleColor.text}`}>
                  {TEACHER_ROLE_LABELS[form.primaryRole]}
                </Badge>
                {isSkillTeacher && (
                  <Badge variant="outline" className="text-xs">
                    技能科教师
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* 兼任职务 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                兼任职务
                <span className="text-sm font-normal text-gray-500 ml-2">
                  （可多选，只增加权限）
                </span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {ADMINISTRATIVE_ROLE_OPTIONS.map(role => {
                  const isChecked = form.additionalRoles.includes(role);
                  return (
                    <div
                      key={role}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleAdditionalRole(role)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleAdditionalRole(role)}
                      />
                      <Label className="cursor-pointer text-sm">
                        {ADMINISTRATIVE_ROLE_LABELS[role]}
                      </Label>
                    </div>
                  );
                })}
              </div>
              {form.additionalRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-gray-500">已选兼任：</span>
                  {form.additionalRoles.map(role => (
                    <Badge key={role} variant="secondary">
                      {ADMINISTRATIVE_ROLE_LABELS[role]}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 课时配置 Tab */}
          <TabsContent value="schedule" className="space-y-6 py-4">
            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                课时配置用于排课系统，系统会根据主教学科和角色自动计算建议课时。
              </AlertDescription>
            </Alert>

            {/* 周课时量 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">周课时量</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  min={0}
                  max={30}
                  value={form.weeklyHours}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    weeklyHours: parseInt(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-gray-500">
                  建议课时：{suggestedHours.totalHours} 节/周
                </p>
              </div>

              <div className="space-y-2">
                <Label>已安排课时</Label>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`text-lg px-3 py-1 ${
                      form.currentHours > form.weeklyHours 
                        ? 'bg-red-100 text-red-700' 
                        : form.currentHours === form.weeklyHours 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {form.currentHours} / {form.weeklyHours} 节
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {form.currentHours > form.weeklyHours 
                    ? '⚠️ 已超课时' 
                    : form.currentHours === form.weeklyHours 
                      ? '✓ 已排满' 
                      : `剩余 ${form.weeklyHours - form.currentHours} 节未安排`}
                </p>
              </div>
            </div>

            <Separator />

            {/* 可任教科目 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                可任教科目
                <span className="text-sm font-normal text-gray-500 ml-2">
                  （可多选）
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS_CONFIG.map(s => {
                  const isChecked = form.teachableSubjects.includes(s.name);
                  const isPrimary = form.subject === s.name;
                  return (
                    <Badge
                      key={s.name}
                      className={`cursor-pointer transition-all ${
                        isChecked
                          ? isPrimary
                            ? 'bg-primary text-white'
                            : 'bg-primary/20 text-primary'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleSubject(s.name)}
                    >
                      {s.name}
                      {isPrimary && ' (主)'}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* 可任教年级 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                可任教年级
                <span className="text-sm font-normal text-gray-500 ml-2">
                  （可多选）
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map(grade => {
                  const isChecked = form.teachableGrades.includes(grade);
                  return (
                    <Badge
                      key={grade}
                      className={`cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleGrade(grade)}
                    >
                      {GRADE_NAMES[grade]}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* 班主任班级（仅班主任显示） */}
            {form.primaryRole === 'head_teacher' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>班主任班级</Label>
                  <Select
                    value={form.headTeacherClassId || ''}
                    onValueChange={(value) => {
                      const selectedClass = classes.find(c => c.id === value);
                      setForm(prev => ({ 
                        ...prev, 
                        headTeacherClassId: value,
                        headTeacherClassName: selectedClass?.name,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择班级" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.headTeacherClassName && (
                    <p className="text-sm text-gray-500">
                      当前班级：{form.headTeacherClassName}
                    </p>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
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
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
