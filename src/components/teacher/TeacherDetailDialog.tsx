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
  KeyRound,
  IdCard,
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
  { name: '书法', isMain: false },
  { name: '综合实践', isMain: false },
  { name: '校本课', isMain: false },
  { name: '班会', isMain: false },
];

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// 学段名称映射
const GRADE_LEVEL_NAMES: Record<string, string> = {
  'low': '低年级（1-2年级）',
  'middle': '中年级（3-4年级）',
  'high': '高年级（5-6年级）',
};

// 根据年级列表计算学段
function calculateGradeLevels(grades: number[]): string[] {
  const levels: string[] = [];
  if (grades.some(g => g === 1 || g === 2)) levels.push('low');
  if (grades.some(g => g === 3 || g === 4)) levels.push('middle');
  if (grades.some(g => g === 5 || g === 6)) levels.push('high');
  return levels;
}

// 主要角色选项（包含领导层和教师群体）
const PRIMARY_ROLE_OPTIONS: TeacherRole[] = [
  'principal',        // 校长
  'secretary',        // 书记
  'academic_vice_principal',   // 教学副校长
  'moral_vice_principal',      // 德育副校长
  'general_vice_principal',    // 总务副校长
  'head_teacher',     // 班主任
  'subject_teacher',  // 科任教师
  'skill_teacher',    // 技能课教师
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
  photoUrl?: string;
  phone: string;
  email: string;
  employeeId: string;  // 工号
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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form, setForm] = useState<TeacherDetail>({
    id: '',
    name: '',
    gender: '男',
    phone: '',
    email: '',
    employeeId: '',
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

  // 班主任自动添加班会到可任教科目
  useEffect(() => {
    const isHeadTeacher = form.primaryRole === 'head_teacher';
    const hasClassMeeting = form.teachableSubjects.includes('班会');
    
    if (isHeadTeacher && !hasClassMeeting) {
      // 成为班主任时自动添加班会
      setForm(prev => ({
        ...prev,
        teachableSubjects: [...prev.teachableSubjects, '班会']
      }));
    }
  }, [form.primaryRole, form.teachableSubjects]);

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
    // 班主任的班会课是固定的，不能取消
    const isHeadTeacher = form.primaryRole === 'head_teacher';
    if (isHeadTeacher && subject === '班会') {
      return; // 班主任必须教班会
    }
    
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

  // 修改密码
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const response = await fetch(`/api/teachers/${form.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('密码修改成功');
        setShowPasswordDialog(false);
        setNewPassword('');
      } else {
        alert(result.error || '密码修改失败');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('密码修改失败');
    } finally {
      setPasswordLoading(false);
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
            {/* 头像上传区域 */}
            <div className="flex items-center gap-4 pb-3 border-b">
              <div className="relative group">
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt={form.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-xs">更换</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success && data.data?.url) {
                          setForm(prev => ({ ...prev, photoUrl: data.data.url }));
                        }
                      } catch (err) {
                        console.error('上传照片失败:', err);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{form.name || '教师姓名'}</p>
                <p className="text-xs text-muted-foreground">{form.employeeId && `工号: ${form.employeeId}`}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.photoUrl ? '点击头像更换照片，将同步到门禁系统' : '点击头像上传照片，用于门禁人脸识别'}
                </p>
              </div>
            </div>

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

              {/* 工号 */}
              <div className="space-y-2">
                <Label htmlFor="employeeId">工号</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="employeeId"
                    value={form.employeeId}
                    onChange={(e) => {
                      // 自动格式化工号：用户输入数字时自动补全为 ly+4位数字
                      let value = e.target.value.toLowerCase();
                      // 如果只输入数字，自动补全
                      if (/^\d+$/.test(value)) {
                        value = 'ly' + value.padStart(4, '0');
                      }
                      // 如果输入 ly 开头加数字，格式化为 ly+4位数字
                      if (/^ly\d+$/.test(value)) {
                        const num = value.replace('ly', '');
                        value = 'ly' + num.padStart(4, '0');
                      }
                      setForm(prev => ({ ...prev, employeeId: value }));
                    }}
                    placeholder="ly0001（输入数字自动格式化）"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">格式：ly + 4位数字，如 ly0001</p>
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
                课时配置信息来源于教师所任教班级的实际情况，由系统自动计算生成。
              </AlertDescription>
            </Alert>

            {/* 周课时量 - 只读展示 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>周课时量</Label>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 text-lg px-3 py-1">
                    {form.weeklyHours} 节/周
                  </Badge>
                </div>
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

            {/* 任教学科 - 只读展示 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                任教学科
                <span className="text-sm font-normal text-gray-500 ml-2">
                  （从教师配置读取）
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {/* 语数教师只显示主教学科 */}
                {(MAIN_SUBJECTS.includes(form.subject as typeof MAIN_SUBJECTS[number]) 
                  ? [form.subject] // 语数教师只显示主教学科
                  : form.teachableSubjects // 技能科教师显示所有可任教学科
                ).map((subject, index) => {
                  const isPrimary = subject === form.subject;
                  return (
                    <Badge
                      key={subject}
                      className={`transition-all ${
                        isPrimary
                          ? 'bg-primary text-white'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {subject}
                      {isPrimary && ' (主)'}
                    </Badge>
                  );
                })}
                {form.primaryRole === 'head_teacher' && (
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
                    班会 (班主任固定)
                  </Badge>
                )}
              </div>
              {MAIN_SUBJECTS.includes(form.subject as typeof MAIN_SUBJECTS[number]) && form.teachableSubjects.length > 1 && (
                <p className="text-xs text-amber-600">
                  * 语数教师任教学科仅显示主教学科
                </p>
              )}
            </div>

            <Separator />

            {/* 任教学段 - 只读展示 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                任教学段
                <span className="text-sm font-normal text-gray-500 ml-2">
                  （从任教班级计算）
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {calculateGradeLevels(form.teachableGrades).map(level => (
                  <Badge
                    key={level}
                    className="bg-primary text-white"
                  >
                    {GRADE_LEVEL_NAMES[level]}
                  </Badge>
                ))}
                {form.teachableGrades.length === 0 && (
                  <span className="text-sm text-gray-400">暂无任教班级</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                可任教年级：{form.teachableGrades.map(g => GRADE_NAMES[g]).join('、') || '暂无'}
              </p>
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
          {form.id && (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordDialog(true)}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              修改密码
            </Button>
          )}
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

      {/* 密码修改对话框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              修改密码
            </DialogTitle>
            <DialogDescription>
              为 {form.name} 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              取消
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  修改中...
                </>
              ) : (
                '确认修改'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
