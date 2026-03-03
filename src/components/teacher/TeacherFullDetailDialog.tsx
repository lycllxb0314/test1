/**
 * 教师详情对话框（完整版）
 * 
 * 整合了教师详情页的全部内容：
 * - 基本信息：个人信息、联系方式、工作信息
 * - 角色配置：主要角色 + 兼任职务
 * - 课时配置：周课时、可任教科目/年级
 * - 履历记录：学历、职称、职务变更
 * - 荣誉：荣誉称号
 * - 培训：培训记录
 * - 成就：公开课、比赛、论文等
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Info,
  Calculator,
  GraduationCap,
  Briefcase,
  FileText,
  Trophy,
  Target,
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  IdCard,
  CheckCircle,
} from 'lucide-react';
import {
  TeacherRole,
  AdministrativeRole,
  TEACHER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
} from '@/hooks/useTeachers';
import { MAIN_SUBJECTS, calculateSuggestedHours } from '@/lib/data/teaching-rules';

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

// 主要角色选项（包含领导层和教师群体）
const PRIMARY_ROLE_OPTIONS: TeacherRole[] = [
  'principal',        // 校长
  'secretary',        // 书记
  'vice_principal',   // 副校长
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
// 学历选项
const EDUCATION_OPTIONS = ['专科', '本科', '硕士', '博士'];
// 政治面貌选项
const POLITICAL_OPTIONS = ['群众', '共青团员', '中共党员', '民主党派'];
// 民族选项
const ETHNICITY_OPTIONS = ['汉族', '畲族', '回族', '满族', '其他'];
// 状态选项
const STATUS_OPTIONS = [
  { value: 'active', label: '在职' },
  { value: 'on_leave', label: '请假' },
  { value: 'retired', label: '退休' },
];

// 履历记录类型
interface TeacherRecord {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
}

// 荣誉记录类型
interface TeacherHonor {
  id: string;
  title: string;
  level: string;
  category?: string;
  issuer?: string;
  date: string;
  certificateNo?: string;
}

// 培训记录类型
interface TeacherTraining {
  id: string;
  name: string;
  type?: string;
  organizer?: string;
  startDate: string;
  endDate?: string;
  hours?: number;
  status?: string;
}

// 成就记录类型
interface TeacherAchievement {
  id: string;
  type: string;
  title: string;
  level?: string;
  result?: string;
  date: string;
  description?: string;
}

/** 教师完整信息 */
export interface TeacherFullDetail {
  id: string;
  // 基本信息
  name: string;
  gender: string;
  birthDate?: string;
  idCard?: string;
  ethnicity?: string;
  politicalStatus?: string;
  nativePlace?: string;
  // 联系方式
  phone: string;
  email: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  // 工作信息
  employeeId?: string;
  subject: string;
  title: string;
  titleDate?: string;
  education?: string;
  school?: string;
  major?: string;
  graduationDate?: string;
  teachYears: number;
  joinDate?: string;
  department: string;
  status: string;
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
  // 履历记录
  records: TeacherRecord[];
  // 荣誉
  honors: TeacherHonor[];
  // 培训
  trainings: TeacherTraining[];
  // 成就
  achievements: TeacherAchievement[];
}

/** 组件属性 */
interface TeacherFullDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherFullDetail | null;
  classes: Array<{ id: string; name: string; grade: number }>;
  onSave: (teacher: TeacherFullDetail) => Promise<void>;
}

// 获取记录类型信息
const getRecordTypeInfo = (type: string) => {
  const typeMap: Record<string, { icon: any; color: string; label: string }> = {
    education: { icon: GraduationCap, color: 'text-blue-500', label: '学历' },
    title: { icon: Award, color: 'text-purple-500', label: '职称' },
    position: { icon: Briefcase, color: 'text-orange-500', label: '职务' },
    award: { icon: Trophy, color: 'text-yellow-500', label: '荣誉' },
    training: { icon: BookOpen, color: 'text-green-500', label: '培训' },
    research: { icon: FileText, color: 'text-indigo-500', label: '科研' },
    other: { icon: FileText, color: 'text-gray-500', label: '其他' },
  };
  return typeMap[type] || typeMap.other;
};

// 获取荣誉级别颜色
const getHonorLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '国家级': 'bg-red-50 text-red-700 border-red-200',
    '省级': 'bg-purple-50 text-purple-700 border-purple-200',
    '市级': 'bg-blue-50 text-blue-700 border-blue-200',
    '区级': 'bg-green-50 text-green-700 border-green-200',
    '校级': 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return colorMap[level] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export function TeacherFullDetailDialog({
  open,
  onOpenChange,
  teacher,
  classes,
  onSave,
}: TeacherFullDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState<TeacherFullDetail>({
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
    records: [],
    honors: [],
    trainings: [],
    achievements: [],
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
        records: teacher.records || [],
        honors: teacher.honors || [],
        trainings: teacher.trainings || [],
        achievements: teacher.achievements || [],
      });
    }
  }, [teacher]);

  // 主科变化时，自动调整主要角色
  useEffect(() => {
    if (isSkillTeacher && form.primaryRole === 'subject_teacher') {
      setForm(prev => ({ ...prev, primaryRole: 'skill_teacher' }));
    } else if (!isSkillTeacher && form.primaryRole === 'skill_teacher') {
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
      const isHeadTeacher = form.primaryRole === 'head_teacher';
      await onSave({
        ...form,
        isHeadTeacher,
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
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5" />
                {form.name || '新教师'}
                {form.employeeId && (
                  <Badge variant="outline" className="font-normal">
                    工号：{form.employeeId}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                查看和编辑教师完整信息
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${roleColor?.bg || 'bg-gray-100'} ${roleColor?.text || 'text-gray-700'}`}>
                {TEACHER_ROLE_LABELS[form.primaryRole]}
              </Badge>
              <Badge variant="outline" className={form.status === 'active' ? 'text-green-600 border-green-200' : ''}>
                {STATUS_OPTIONS.find(s => s.value === form.status)?.label || form.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 pt-2 border-b bg-gray-50/50">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <User className="h-4 w-4 mr-1.5" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="role" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserCog className="h-4 w-4 mr-1.5" />
                角色配置
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Clock className="h-4 w-4 mr-1.5" />
                课时配置
              </TabsTrigger>
              <TabsTrigger value="records" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4 mr-1.5" />
                履历记录
              </TabsTrigger>
              <TabsTrigger value="honors" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Trophy className="h-4 w-4 mr-1.5" />
                荣誉
                {form.honors.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {form.honors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="trainings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BookOpen className="h-4 w-4 mr-1.5" />
                培训
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Target className="h-4 w-4 mr-1.5" />
                成就
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4" style={{ height: 'calc(95vh - 200px)' }}>
            {/* 基本信息 Tab */}
            <TabsContent value="basic" className="mt-0 space-y-6">
              {/* 个人信息 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  个人信息
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>姓名 *</Label>
                    <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>性别</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm(prev => ({ ...prev, gender: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>出生日期</Label>
                    <Input type="date" value={form.birthDate || ''} onChange={(e) => setForm(prev => ({ ...prev, birthDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>民族</Label>
                    <Select value={form.ethnicity || '汉族'} onValueChange={(v) => setForm(prev => ({ ...prev, ethnicity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ETHNICITY_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>政治面貌</Label>
                    <Select value={form.politicalStatus || '群众'} onValueChange={(v) => setForm(prev => ({ ...prev, politicalStatus: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {POLITICAL_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>籍贯</Label>
                    <Input value={form.nativePlace || ''} onChange={(e) => setForm(prev => ({ ...prev, nativePlace: e.target.value }))} placeholder="如：福建龙岩" />
                  </div>
                  <div className="space-y-2">
                    <Label>身份证号</Label>
                    <Input value={form.idCard || ''} onChange={(e) => setForm(prev => ({ ...prev, idCard: e.target.value }))} placeholder="3508**********0015" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 联系方式 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  联系方式
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>联系电话</Label>
                    <Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="手机号码" />
                  </div>
                  <div className="space-y-2">
                    <Label>邮箱</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="xxx@lysf.fx.edu.cn" />
                  </div>
                  <div className="space-y-2">
                    <Label>紧急联系人</Label>
                    <Input value={form.emergencyContact || ''} onChange={(e) => setForm(prev => ({ ...prev, emergencyContact: e.target.value }))} placeholder="姓名" />
                  </div>
                  <div className="space-y-2">
                    <Label>紧急联系电话</Label>
                    <Input value={form.emergencyPhone || ''} onChange={(e) => setForm(prev => ({ ...prev, emergencyPhone: e.target.value }))} placeholder="手机号码" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>家庭住址</Label>
                    <Input value={form.address || ''} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="详细地址" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 工作信息 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  工作信息
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>任教学科</Label>
                    <Select value={form.subject} onValueChange={(v) => setForm(prev => ({ ...prev, subject: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBJECTS_CONFIG.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>职称</Label>
                    <Select value={form.title} onValueChange={(v) => setForm(prev => ({ ...prev, title: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TITLE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>职称获得日期</Label>
                    <Input type="date" value={form.titleDate || ''} onChange={(e) => setForm(prev => ({ ...prev, titleDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>教研组</Label>
                    <Input value={form.department} onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))} placeholder="如：语文组" />
                  </div>
                  <div className="space-y-2">
                    <Label>学历</Label>
                    <Select value={form.education || '本科'} onValueChange={(v) => setForm(prev => ({ ...prev, education: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EDUCATION_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>毕业院校</Label>
                    <Input value={form.school || ''} onChange={(e) => setForm(prev => ({ ...prev, school: e.target.value }))} placeholder="如：福建师范大学" />
                  </div>
                  <div className="space-y-2">
                    <Label>专业</Label>
                    <Input value={form.major || ''} onChange={(e) => setForm(prev => ({ ...prev, major: e.target.value }))} placeholder="如：汉语言文学" />
                  </div>
                  <div className="space-y-2">
                    <Label>毕业日期</Label>
                    <Input type="month" value={form.graduationDate || ''} onChange={(e) => setForm(prev => ({ ...prev, graduationDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>教龄（年）</Label>
                    <Input type="number" min={0} value={form.teachYears} onChange={(e) => setForm(prev => ({ ...prev, teachYears: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>入职日期</Label>
                    <Input type="date" value={form.joinDate || ''} onChange={(e) => setForm(prev => ({ ...prev, joinDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 角色配置 Tab */}
            <TabsContent value="role" className="mt-0 space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  主要角色决定教师的登录身份和基础权限；兼任职务只增加权限，不作为登录身份。
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label className="text-base font-medium">主要角色</Label>
                <Select value={form.primaryRole} onValueChange={(v) => setForm(prev => ({ ...prev, primaryRole: v as TeacherRole }))}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIMARY_ROLE_OPTIONS.map(role => (
                      <SelectItem key={role} value={role} disabled={role === 'skill_teacher' && !isSkillTeacher}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${TEACHER_ROLE_COLORS[role].bg}`} />
                          {TEACHER_ROLE_LABELS[role]}
                          {role === 'skill_teacher' && !isSkillTeacher && <span className="text-xs text-gray-400">（仅限技能科）</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">当前角色：</span>
                  <Badge className={`${roleColor?.bg} ${roleColor?.text}`}>{TEACHER_ROLE_LABELS[form.primaryRole]}</Badge>
                  {isSkillTeacher && <Badge variant="outline" className="text-xs">技能科教师</Badge>}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  兼任职务
                  <span className="text-sm font-normal text-gray-500 ml-2">（可多选，只增加权限）</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {ADMINISTRATIVE_ROLE_OPTIONS.map(role => {
                    const isChecked = form.additionalRoles.includes(role);
                    return (
                      <div
                        key={role}
                        className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => toggleAdditionalRole(role)}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleAdditionalRole(role)} />
                        <Label className="cursor-pointer text-sm">{ADMINISTRATIVE_ROLE_LABELS[role]}</Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* 课时配置 Tab */}
            <TabsContent value="schedule" className="mt-0 space-y-6">
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  课时配置用于排课系统，教务主任可根据实际情况调整课时量。
                </AlertDescription>
              </Alert>

              {/* 课时量建议说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Info className="h-4 w-4" />
                  <span>课时量标准参考（国家标准）</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-blue-700">语数教师：</p>
                    <p className="text-gray-600">周课时 14-16 节</p>
                    <p className="text-xs text-gray-500">班主任：本班主科6-8节 + 兼任科目6-8节</p>
                    <p className="text-xs text-gray-500">科任：两个班主科10-12节 + 兼任2-4节</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-blue-700">英语教师：</p>
                    <p className="text-gray-600">周课时 14-16 节</p>
                    <p className="text-xs text-gray-500">虽属技能科，但课时标准同主科</p>
                    <p className="text-xs text-gray-500">跨班级教学</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-blue-700">技能科教师：</p>
                    <p className="text-gray-600">周课时 16-18 节</p>
                    <p className="text-xs text-gray-500">体育/音乐/美术/科学等</p>
                    <p className="text-xs text-gray-500">跨多个班级教学，可能跨年级</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 border-t border-blue-200 pt-2">
                  兼任职务（年段长、教研组长等）可适当减免课时，具体由学校决定
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>周课时量</Label>
                  <Input type="number" min={0} max={30} value={form.weeklyHours} onChange={(e) => setForm(prev => ({ ...prev, weeklyHours: parseInt(e.target.value) || 0 }))} />
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      建议范围：<span className="font-medium text-blue-600">{suggestedHours.minHours}-{suggestedHours.maxHours} 节/周</span>
                    </p>
                    <p className="text-xs text-gray-400">{suggestedHours.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>已安排课时</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-lg px-3 py-1 ${form.currentHours > form.weeklyHours ? 'bg-red-100 text-red-700' : form.currentHours === form.weeklyHours ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {form.currentHours} / {form.weeklyHours} 节
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {form.currentHours > form.weeklyHours ? '⚠️ 已超课时' : form.currentHours === form.weeklyHours ? '✓ 已排满' : `剩余 ${form.weeklyHours - form.currentHours} 节未安排`}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">可任教科目 <span className="text-sm font-normal text-gray-500 ml-2">（可多选）</span>
                  {form.primaryRole === 'head_teacher' && (
                    <span className="text-xs text-amber-600 ml-2">* 班主任自动负责班会课</span>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS_CONFIG.map(s => {
                    const isChecked = form.teachableSubjects.includes(s.name);
                    const isPrimary = form.subject === s.name;
                    // 班主任的班会课是固定的
                    const isFixedClassMeeting = form.primaryRole === 'head_teacher' && s.name === '班会';
                    return (
                      <Badge
                        key={s.name}
                        className={`transition-all ${
                          isFixedClassMeeting
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : isChecked
                              ? isPrimary
                                ? 'bg-primary text-white'
                                : 'bg-primary/20 text-primary'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                        } ${isFixedClassMeeting ? '' : 'cursor-pointer'}`}
                        onClick={() => !isFixedClassMeeting && toggleSubject(s.name)}
                      >
                        {s.name}{isPrimary && ' (主)'}{isFixedClassMeeting && ' (固定)'}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">可任教年级 <span className="text-sm font-normal text-gray-500 ml-2">（可多选）</span></Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map(grade => {
                    const isChecked = form.teachableGrades.includes(grade);
                    return (
                      <Badge key={grade} className={`cursor-pointer transition-all ${isChecked ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`} onClick={() => toggleGrade(grade)}>
                        {GRADE_NAMES[grade]}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {form.primaryRole === 'head_teacher' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>班主任班级</Label>
                    <Select value={form.headTeacherClassId || ''} onValueChange={(v) => {
                      const selectedClass = classes.find(c => c.id === v);
                      setForm(prev => ({ ...prev, headTeacherClassId: v, headTeacherClassName: selectedClass?.name }));
                    }}>
                      <SelectTrigger className="w-64"><SelectValue placeholder="选择班级" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.headTeacherClassName && <p className="text-sm text-gray-500">当前班级：{form.headTeacherClassName}</p>}
                  </div>
                </>
              )}
            </TabsContent>

            {/* 履历记录 Tab */}
            <TabsContent value="records" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">履历记录</h3>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />添加记录</Button>
              </div>
              {form.records.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>暂无履历记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.records.map(record => {
                    const typeInfo = getRecordTypeInfo(record.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={record.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                        <div className={`p-2 rounded-lg bg-gray-100 ${typeInfo.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{record.title}</span>
                            <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                          </div>
                          {record.description && <p className="text-sm text-gray-500 mt-1">{record.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">{record.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* 荣誉 Tab */}
            <TabsContent value="honors" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">荣誉称号</h3>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />添加荣誉</Button>
              </div>
              {form.honors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>暂无荣誉记录</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {form.honors.map(honor => (
                    <div key={honor.id} className="p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{honor.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getHonorLevelColor(honor.level)}`}>{honor.level}</Badge>
                            {honor.category && <span className="text-xs text-gray-500">{honor.category}</span>}
                          </div>
                          {honor.issuer && <p className="text-xs text-gray-500 mt-1">颁发单位：{honor.issuer}</p>}
                        </div>
                        <span className="text-xs text-gray-400">{honor.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 培训 Tab */}
            <TabsContent value="trainings" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">培训记录</h3>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />添加培训</Button>
              </div>
              {form.trainings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>暂无培训记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.trainings.map(training => (
                    <div key={training.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{training.name}</span>
                          {training.status && <Badge variant="outline" className="text-xs">{training.status}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {training.type && <span>{training.type}</span>}
                          {training.organizer && <span>主办：{training.organizer}</span>}
                          {training.hours && <span>{training.hours}学时</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{training.startDate}{training.endDate ? ` ~ ${training.endDate}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 成就 Tab */}
            <TabsContent value="achievements" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">教学成就</h3>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />添加成就</Button>
              </div>
              {form.achievements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>暂无成就记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.achievements.map(achievement => (
                    <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{achievement.title}</span>
                          <Badge variant="outline" className="text-xs">{achievement.type}</Badge>
                          {achievement.level && <Badge variant="secondary" className="text-xs">{achievement.level}</Badge>}
                          {achievement.result && <Badge className="text-xs bg-green-100 text-green-700">{achievement.result}</Badge>}
                        </div>
                        {achievement.description && <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中...</>) : (<><Save className="h-4 w-4 mr-2" />保存</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
