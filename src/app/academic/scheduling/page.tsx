'use client';

/**
 * 智能排课系统 - 管理界面
 * 
 * 功能模块：
 * 1. 数据概览 - 统计卡片展示关键数据
 * 2. 教师配置 - 查看/筛选参与排课的教师
 * 3. 班级配置 - 查看需要排课的班级
 * 4. 执行排课 - 一键生成课表
 * 5. 结果查看 - 排课结果统计、教师工作量、班级课表
 * 6. 草稿管理 - 保存草稿、确认同步
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Send,
  Search,
  BookOpen,
  GraduationCap,
  Settings,
  FileSpreadsheet,
  Play,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

interface SchedulingTeacher {
  id: string;
  name: string;
  gender?: string;
  department?: string;
  primaryRole: string;
  additionalRoles: string[];
  hasAdministrativeRole: boolean;
  primarySubject: string;
  secondarySubjects: string[];
  teachableSubjects: string[];
  teachableGrades: number[];
  baseWeeklyHours: number;
  minWeeklyHours: number;
  maxWeeklyHours: number;
  currentWeeklyHours: number;
  isHeadTeacher: boolean;
  headTeacherClassId?: string;
  headTeacherClassName?: string;
  canTeachMainSubject: boolean;
  mainSubjectClassCount: number;
}

interface SchedulingClass {
  id: string;
  name: string;
  grade: number;
  segment: string;
  classNumber: number;
  headTeacherId?: string;
  headTeacherName?: string;
  subTeacherId?: string;
  subTeacherName?: string;
  weeklyPeriods: number;
  studentCount?: number;
}

interface PreviewData {
  totalSlots: number;
  totalTeacherHours: number;
  avgTeacherHours: number;
  subjectCoverage: Array<{ subject: string; teachers: number; hours: number }>;
}

interface ValidationData {
  valid: boolean;
  errors: string[];
}

interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  primarySubject: string;
  originalHours: number;
  actualHours: number;
  adjustments: Array<{ adjustment: number; reason: string }>;
  classes: Array<{ classId: string; className: string; subject: string; hours: number }>;
}

interface ClassSchedule {
  classId: string;
  className: string;
  grade: number;
  totalSlots: number;
  filledSlots: number;
  teachers: Array<{ teacherId: string; teacherName: string; subject: string }>;
}

interface SchedulingResult {
  success: boolean;
  statistics: {
    totalSlots: number;
    filledSlots: number;
    totalClasses: number;
    averageTeacherHours: number;
    adjustmentsCount: number;
    crossGradeAssignments: number;
  };
  warnings: Array<{ type: string; message: string }>;
  errors: Array<{ type: string; message: string }>;
  teacherWorkloads: TeacherWorkload[];
  classSchedules: ClassSchedule[];
}

// ==================== 主组件 ====================

export default function SchedulingPage() {
  // === 状态管理 ===
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  
  // 数据
  const [teachers, setTeachers] = useState<SchedulingTeacher[]>([]);
  const [classes, setClasses] = useState<SchedulingClass[]>([]);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [validation, setValidation] = useState<ValidationData>({ valid: true, errors: [] });
  const [result, setResult] = useState<SchedulingResult | null>(null);
  
  // UI状态
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);

  // === 数据加载 ===
  useEffect(() => {
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/academic/scheduling?action=preview');
      const data = await response.json();
      
      if (data.success) {
        setTeachers(data.data.teachers || []);
        setClasses(data.data.classes || []);
        setPreview(data.data.preview || null);
        setValidation(data.data.validation || { valid: true, errors: [] });
      } else {
        toast.error('加载预览数据失败');
      }
    } catch (error) {
      console.error('加载预览数据失败:', error);
      toast.error('加载预览数据失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const executeScheduling = async () => {
    setLoading(true);
    setExecuteDialogOpen(false);
    try {
      const response = await fetch('/api/academic/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data.result);
        setActiveTab('result');
        toast.success('排课完成');
      } else {
        toast.error(data.error || '排课失败');
      }
    } catch (error) {
      console.error('执行排课失败:', error);
      toast.error('排课失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const confirmScheduling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/academic/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('排课结果已确认并同步到正式课表');
        setConfirmDialogOpen(false);
      } else {
        toast.error(data.error || '确认失败');
      }
    } catch (error) {
      console.error('确认排课失败:', error);
      toast.error('确认失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // === 筛选逻辑 ===
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = !searchTerm || 
        t.name.includes(searchTerm) || 
        t.primarySubject.includes(searchTerm);
      const matchRole = roleFilter === 'all' || t.primaryRole === roleFilter;
      return matchSearch && matchRole;
    });
  }, [teachers, searchTerm, roleFilter]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchSearch = !searchTerm || 
        c.name.includes(searchTerm) ||
        (c.headTeacherName && c.headTeacherName.includes(searchTerm));
      const matchGrade = gradeFilter === 'all' || c.grade === parseInt(gradeFilter);
      return matchSearch && matchGrade;
    });
  }, [classes, searchTerm, gradeFilter]);

  // === 统计数据 ===
  const stats = useMemo(() => {
    const headTeachers = teachers.filter(t => t.isHeadTeacher).length;
    const mainSubjectTeachers = teachers.filter(t => t.canTeachMainSubject).length;
    const skillTeachers = teachers.filter(t => !t.canTeachMainSubject).length;
    const hasAdminRole = teachers.filter(t => t.hasAdministrativeRole).length;
    
    return {
      totalTeachers: teachers.length,
      headTeachers,
      mainSubjectTeachers,
      skillTeachers,
      hasAdminRole,
      totalClasses: classes.length,
      totalSlots: preview?.totalSlots || 0,
      avgHours: preview?.avgTeacherHours || 0,
    };
  }, [teachers, classes, preview]);

  // === 角色标签映射 ===
  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'head_teacher': '班主任',
      'subject_teacher': '科任',
      'skill_teacher': '技能科',
      'principal': '校长',
      'secretary': '书记',
      'vice_principal': '副校长',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeStyle = (role: string) => {
    const styleMap: Record<string, string> = {
      'head_teacher': 'bg-amber-100 text-amber-700',
      'subject_teacher': 'bg-blue-100 text-blue-700',
      'skill_teacher': 'bg-green-100 text-green-700',
      'principal': 'bg-red-100 text-red-700',
      'secretary': 'bg-red-100 text-red-700',
      'vice_principal': 'bg-rose-100 text-rose-700',
    };
    return styleMap[role] || 'bg-gray-100 text-gray-700';
  };

  // === 渲染 ===
  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">智能排课</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            基于教师角色、课时配置、任教学科自动生成课表
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPreviewData} disabled={previewLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${previewLoading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
          <Button 
            onClick={() => setExecuteDialogOpen(true)} 
            disabled={previewLoading || !validation.valid}
          >
            <Play className="h-4 w-4 mr-2" />
            执行排课
          </Button>
        </div>
      </div>

      {/* 验证错误提示 */}
      {!validation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>数据验证失败</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">参与教师</p>
                <p className="text-2xl font-bold text-primary">{stats.totalTeachers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  班主任 {stats.headTeachers} · 科任 {stats.mainSubjectTeachers - stats.headTeachers} · 技能科 {stats.skillTeachers}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">班级数量</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalClasses}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  共 {stats.totalSlots} 个课时槽
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均课时</p>
                <p className="text-2xl font-bold text-green-600">{stats.avgHours.toFixed(1)}节</p>
                <p className="text-xs text-muted-foreground mt-1">
                  教师周平均课时量
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">兼任职务</p>
                <p className="text-2xl font-bold text-purple-600">{stats.hasAdminRole}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  有行政兼任的教师
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4 mr-2" />
            科目配置
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <Users className="h-4 w-4 mr-2" />
            教师列表
          </TabsTrigger>
          <TabsTrigger value="classes">
            <GraduationCap className="h-4 w-4 mr-2" />
            班级列表
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!result}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            排课结果
          </TabsTrigger>
          <TabsTrigger value="workload" disabled={!result}>
            <Clock className="h-4 w-4 mr-2" />
            工作量
          </TabsTrigger>
        </TabsList>

        {/* 科目配置 */}
        <TabsContent value="overview" className="space-y-4">
          {previewLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">加载数据中...</p>
              </CardContent>
            </Card>
          ) : preview && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>科目覆盖情况</CardTitle>
                <CardDescription>各科目的教师配置和课时需求</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {preview.subjectCoverage.map((item) => (
                    <div 
                      key={item.subject} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.subject}</span>
                        <Badge variant="outline">{item.teachers}人</Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>可教教师</span>
                          <span className="font-medium text-foreground">{item.teachers}人</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>周课时需求</span>
                          <span className="font-medium text-foreground">{item.hours}节</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 教师列表 */}
        <TabsContent value="teachers" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>教师配置</CardTitle>
                  <CardDescription>共 {filteredTeachers.length} 名教师参与排课</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索教师姓名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="角色筛选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部角色</SelectItem>
                      <SelectItem value="head_teacher">班主任</SelectItem>
                      <SelectItem value="subject_teacher">科任</SelectItem>
                      <SelectItem value="skill_teacher">技能科</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>主教学科</TableHead>
                      <TableHead>可教科目</TableHead>
                      <TableHead>可教年级</TableHead>
                      <TableHead>基准课时</TableHead>
                      <TableHead>课时范围</TableHead>
                      <TableHead>班主任班级</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          没有找到匹配的教师
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeachers.map(teacher => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge className={getRoleBadgeStyle(teacher.primaryRole)}>
                                {getRoleLabel(teacher.primaryRole)}
                              </Badge>
                              {teacher.hasAdministrativeRole && (
                                <Badge variant="outline" className="text-xs">
                                  兼任
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{teacher.primarySubject}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {teacher.teachableSubjects.slice(0, 3).map((s, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                              {teacher.teachableSubjects.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{teacher.teachableSubjects.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {teacher.teachableGrades.length === 6 
                              ? '全部年级' 
                              : teacher.teachableGrades.map(g => `${g}年级`).join('、')}
                          </TableCell>
                          <TableCell className="text-center">{teacher.baseWeeklyHours}节</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {teacher.minWeeklyHours} - {teacher.maxWeeklyHours}节
                          </TableCell>
                          <TableCell>
                            {teacher.isHeadTeacher ? (
                              <span className="text-sm">{teacher.headTeacherClassName}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 班级列表 */}
        <TabsContent value="classes" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>班级配置</CardTitle>
                  <CardDescription>共 {filteredClasses.length} 个班级需要排课</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索班级..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="年级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部年级</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map(g => (
                        <SelectItem key={g} value={g.toString()}>{g}年级</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredClasses.map(cls => (
                  <div 
                    key={cls.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cls.name}</span>
                      <Badge variant="outline">{cls.weeklyPeriods}节/周</Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">班主任</span>
                        <span>{cls.headTeacherName || '未设置'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">科任</span>
                        <span>{cls.subTeacherName || '未设置'}</span>
                      </div>
                      {cls.studentCount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">学生数</span>
                          <span>{cls.studentCount}人</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 排课结果 */}
        <TabsContent value="result" className="space-y-4">
          {result && (
            <>
              {/* 结果统计 */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className={`shadow-sm ${result.success ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">排课状态</p>
                        <p className="text-xl font-bold">{result.success ? '成功' : '失败'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">已排课时</p>
                        <p className="text-xl font-bold">{result.statistics.filledSlots}</p>
                      </div>
                    </div>
                    <Progress 
                      value={(result.statistics.filledSlots / result.statistics.totalSlots) * 100} 
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      共 {result.statistics.totalSlots} 节
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">教师平均课时</p>
                        <p className="text-xl font-bold">{result.statistics.averageTeacherHours.toFixed(1)}节</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">课时调整</p>
                        <p className="text-xl font-bold">{result.statistics.adjustmentsCount}人</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      跨段教学 {result.statistics.crossGradeAssignments} 人
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 警告和错误 */}
              {result.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>排课警告 ({result.warnings.length}条)</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      {result.warnings.map((warning, index) => (
                        <div key={index} className="text-sm py-1">
                          • {warning.message}
                        </div>
                      ))}
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>排课错误 ({result.errors.length}条)</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm py-1">
                          • {error.message}
                        </div>
                      ))}
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setExecuteDialogOpen(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新排课
                </Button>
                <Button 
                  onClick={() => setConfirmDialogOpen(true)} 
                  disabled={!result.success}
                >
                  <Send className="h-4 w-4 mr-2" />
                  确认并同步
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* 教师工作量 */}
        <TabsContent value="workload" className="space-y-4">
          {result && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>教师工作量详情</CardTitle>
                <CardDescription>各教师的课时分配情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>教师</TableHead>
                        <TableHead>主教学科</TableHead>
                        <TableHead>基准课时</TableHead>
                        <TableHead>实际课时</TableHead>
                        <TableHead>调整</TableHead>
                        <TableHead>带班情况</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.teacherWorkloads.map(teacher => (
                        <TableRow key={teacher.teacherId}>
                          <TableCell className="font-medium">{teacher.teacherName}</TableCell>
                          <TableCell>{teacher.primarySubject}</TableCell>
                          <TableCell>{teacher.originalHours}节</TableCell>
                          <TableCell>
                            <span className={teacher.actualHours !== teacher.originalHours ? 'text-orange-500 font-bold' : ''}>
                              {teacher.actualHours}节
                            </span>
                          </TableCell>
                          <TableCell>
                            {teacher.adjustments.length > 0 ? (
                              <Badge variant={teacher.adjustments[0].adjustment > 0 ? 'default' : 'destructive'}>
                                {teacher.adjustments[0].adjustment > 0 ? '+' : ''}{teacher.adjustments[0].adjustment}节
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {teacher.classes.slice(0, 2).map((c, i) => (
                                <div key={i}>{c.className} ({c.subject} {c.hours}节)</div>
                              ))}
                              {teacher.classes.length > 2 && (
                                <div className="text-muted-foreground">还有 {teacher.classes.length - 2} 个班级...</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 执行排课确认对话框 */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认执行排课</DialogTitle>
            <DialogDescription>
              系统将根据教师角色、课时配置、任教学科、学段配置自动生成课表。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">参与教师</span>
                <span className="font-medium">{stats.totalTeachers}人</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">班级数量</span>
                <span className="font-medium">{stats.totalClasses}个</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">课时槽</span>
                <span className="font-medium">{stats.totalSlots}个</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">平均课时</span>
                <span className="font-medium">{stats.avgHours.toFixed(1)}节</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={executeScheduling} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认同步对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认排课结果</DialogTitle>
            <DialogDescription>
              确认后，排课结果将同步到正式课表，当前学期的课表将被覆盖。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">班级数量</span>
              <span className="font-medium">{result?.statistics.totalClasses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">已排课时</span>
              <span className="font-medium">{result?.statistics.filledSlots || 0}节</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">跨段教学</span>
              <span className="font-medium">{result?.statistics.crossGradeAssignments || 0}人</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmScheduling} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
