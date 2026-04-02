'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MoreHorizontal,
  UserPlus,
  Download,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  GraduationCap,
  Home,
  School,
  MapPin,
  UserCheck,
  UserCog,
  MessageCircle,
  Star,
  Award,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Grid3X3,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClasses, type StudentBasicInfo } from '@/hooks/useClasses';
import type { Parent } from '@/types';
import { useFrontendPagination } from '@/hooks/useApi';
import { PAGINATION } from '@/lib/pagination-config';
import { usePermissions } from '@/hooks/usePermissions';
import { useClassDailyRoutine, useClassWeeklyRoutine } from '@/hooks/useClassRoutine';
import { ROUTINE_SCORE_CATEGORIES, ROUTINE_CATEGORY_LABELS, ROUTINE_CATEGORY_MAX_SCORES } from '@/types/class-routine';
import type { RoutineScoreCategory } from '@/types/class-routine';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { StudentDetailDialog } from '@/components/teacher/student-detail-dialog';

// 懒加载座位表组件
const SeatingPlanView = dynamic(
  () => import('@/components/seating/SeatingPlanView').then(mod => ({ default: mod.SeatingPlanView })),
  { 
    ssr: false,
    loading: () => (
      <div className="py-12 text-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 mt-2">加载座位表...</p>
      </div>
    ),
  }
);

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '在校': 'bg-green-100 text-green-700',
    '请假': 'bg-yellow-100 text-yellow-700',
    '休学': 'bg-red-100 text-red-700',
    '毕业': 'bg-blue-100 text-blue-700',
    '转学': 'bg-gray-100 text-gray-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

// 获取性别样式
const getGenderStyle = (gender: string) => {
  return gender === 'male'
    ? { icon: '👨', color: 'text-blue-600', bg: 'bg-blue-50', label: '男' }
    : { icon: '👩', color: 'text-pink-600', bg: 'bg-pink-50', label: '女' };
};

export default function ClassManagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canManageClass, isHeadTeacher, isSubTeacher } = usePermissions();

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  // 班级选择状态（科任教师可能有多个班级）
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // 获取班级信息（包含科任教师和学生）- 只用一个 Hook 避免重复请求
  const { 
    allClasses, 
    allStudents,
    loading: classesLoading,
    refetch: refetchClasses
  } = useClasses();

  // 学生操作相关状态
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 删除学生方法
  const deleteStudent = useCallback(async (studentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        refetchClasses();
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除学生失败:', err);
      return false;
    }
  }, [refetchClasses]);
  
  // 获取主要家长
  const getPrimaryParent = useCallback((parents: Parent[]) => {
    return parents.find(p => p.isPrimary);
  }, []);

  // 班主任：自己的班级；科任：选择的班级
  const classId = useMemo(() => {
    if (isHeadTeacher()) {
      return user?.classId || '';
    }
    // 科任教师使用选中的班级，默认选第一个
    return selectedClassId || (user?.subTeacherClasses?.[0]?.classId || '');
  }, [user, selectedClassId, isHeadTeacher]);

  const className = useMemo(() => {
    if (isHeadTeacher()) {
      return user?.className || '我的班级';
    }
    // 科任教师从 subTeacherClasses 获取班级名称
    const cls = user?.subTeacherClasses?.find(c => c.classId === classId);
    return cls?.className || '我的班级';
  }, [user, classId, isHeadTeacher]);

  // 获取当前班级详情
  const currentClass = useMemo(() => {
    return allClasses.find(c => c.id === classId);
  }, [allClasses, classId]);

  // 获取常规评分数据（今日）
  const today = new Date().toISOString().split('T')[0];
  const { 
    categoryScores, 
    totalScore, 
    maxTotalScore, 
    scoreRate,
    loading: routineLoading 
  } = useClassDailyRoutine({ classId, date: today });

  // 获取本周评比（假设当前是第几周，需要根据学期计算）
  const currentAcademicYear = new Date().getFullYear().toString();
  const { evaluation: weeklyEvaluation } = useClassWeeklyRoutine({ 
    classId, 
    academicYear: currentAcademicYear 
  });

  const loading = studentsLoading || classesLoading || routineLoading;

  // 筛选当前班级的学生
  const students = useMemo(() => {
    let filtered = allStudents.filter(s => s.classId === classId);
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.includes(searchTerm) || s.studentNo.includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    return filtered;
  }, [allStudents, classId, searchTerm, statusFilter]);

  // 前端分页（学生名单）
  const pagination = useFrontendPagination(students, { 
    defaultPageSize: PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE 
  });
  
  // 家长通讯录分页
  const parentPagination = useFrontendPagination(students, { 
    defaultPageSize: PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE 
  });
  
  const totalStudents = students.length;

  // 学生操作状态
  const [mutationLoading, setMutationLoading] = useState(false);

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentBasicInfo | null>(null);

  // 学生详情弹窗
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 权限检查
  useEffect(() => {
    if (user && !canManageClass()) {
      toast.error('您不是班主任或科任教师，无法访问此页面');
      router.push('/teacher');
    }
  }, [user, canManageClass, router]);

  // 查看详情（点击学生行）
  const handleViewDetail = (studentId: string) => {
    setSelectedStudentId(studentId);
    setDetailDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = (student: StudentBasicInfo) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  // 执行删除
  const handleDelete = async () => {
    if (!studentToDelete) return;

    setMutationLoading(true);
    const success = await deleteStudent(studentToDelete.id);
    setMutationLoading(false);
    
    if (success) {
      toast.success('学生已删除');
      refetchClasses();
    } else {
      toast.error('删除失败，请重试');
    }
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['学号', '姓名', '性别', '班级', '状态', '联系电话'].join(','),
      ...students.map(s => [
        s.studentNo,
        s.name,
        s.gender === 'male' ? '男' : '女',
        s.className,
        s.status,
        ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${className}学生名单.csv`;
    link.click();
    toast.success('导出成功');
  };

  // 统计数据
  const presentCount = students.filter(s => s.status === '在校').length;
  const leaveCount = students.filter(s => s.status === '请假').length;
  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;

  // 加载状态
  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">加载班级数据...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetchClasses()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      {/* 班级标题卡片 */}
      <Card className="border-0 shadow-lg overflow-hidden rounded-none">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
          <div className="flex items-start justify-between text-white">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">{className}</h1>
                {/* 科任教师班级选择器 */}
                {isSubTeacher() && user?.subTeacherClasses && user.subTeacherClasses.length > 1 && (
                  <Select value={classId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-[180px] bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="切换班级" />
                    </SelectTrigger>
                    <SelectContent>
                      {user.subTeacherClasses.map((cls) => (
                        <SelectItem key={cls.classId} value={cls.classId}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-purple-100">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {currentClass?.gradeName || '班级'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentClass?.classroomName || '待分配教室'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalStudents}</div>
                <div className="text-sm text-purple-100">学生</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{currentClass?.parentCount || 0}</div>
                <div className="text-sm text-purple-100">家长</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 教师信息栏 */}
        <div className="p-4 bg-white grid grid-cols-2 gap-4">
          {/* 班主任 */}
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <Avatar className="h-12 w-12 border-2 border-purple-200">
              <AvatarImage src={isHeadTeacher() ? user?.avatar : currentClass?.headTeacher?.avatar} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-lg">
                {(isHeadTeacher() ? user?.name : currentClass?.headTeacherName)?.charAt(0) || '班'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm text-purple-600 font-medium">班主任</div>
              <div className="font-bold text-lg text-gray-900">
                {isHeadTeacher() ? user?.name || '我' : currentClass?.headTeacherName || '未配置'}
              </div>
              {isHeadTeacher() && user?.department && (
                <div className="text-sm text-gray-500">{user.department}</div>
              )}
              {!isHeadTeacher() && currentClass?.headTeacher?.title && (
                <div className="text-sm text-gray-500">{currentClass.headTeacher.title}</div>
              )}
            </div>
            {isHeadTeacher() && (
              <div className="flex items-center gap-1 text-purple-600">
                <Star className="h-4 w-4" />
                <span className="text-sm">班级管理员</span>
              </div>
            )}
          </div>
          
          {/* 科任（副班主任） */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${
            currentClass?.subTeacherName 
              ? 'bg-blue-50 border-blue-100' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <Avatar className="h-12 w-12 border-2 border-blue-200">
              <AvatarImage src={isSubTeacher() ? user?.avatar : currentClass?.subTeacher?.avatar} />
              <AvatarFallback className={`text-lg ${
                (isSubTeacher() ? user?.name : currentClass?.subTeacherName)
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {(isSubTeacher() ? user?.name : currentClass?.subTeacherName)?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm text-blue-600 font-medium">科任（副班主任）</div>
              <div className="font-bold text-lg text-gray-900">
                {isSubTeacher() 
                  ? user?.name || '我' 
                  : currentClass?.subTeacherName || '未配置'
                }
              </div>
              {(isSubTeacher() ? user?.subjects?.[0] : currentClass?.subTeacher?.primarySubject) && (
                <div className="text-sm text-gray-500">
                  {(isSubTeacher() ? user?.subjects?.[0] : currentClass?.subTeacher?.primarySubject)}教师
                </div>
              )}
            </div>
            {isSubTeacher() && (
              <div className="flex items-center gap-1 text-blue-600">
                <UserCog className="h-4 w-4" />
                <span className="text-sm">协同管理</span>
              </div>
            )}
            {!isSubTeacher() && currentClass?.subTeacherName && (
              <div className="flex items-center gap-1 text-blue-600">
                <UserCog className="h-4 w-4" />
                <span className="text-sm">协同管理</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tab 内容区 */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white border shadow-sm p-1 h-auto">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
              >
                <School className="h-4 w-4 mr-2" />
                班级概览
              </TabsTrigger>
              <TabsTrigger 
                value="students"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                学生名单 ({totalStudents})
              </TabsTrigger>
              <TabsTrigger 
                value="seating"
                className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                座位表
              </TabsTrigger>
              <TabsTrigger 
                value="parents"
                className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
              >
                <User className="h-4 w-4 mr-2" />
                家长通讯录
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => { refetchClasses(); refetchClasses(); }}>
                <RefreshCw className="h-4 w-4" />
                刷新
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                导出名单
              </Button>
              <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
                <UserPlus className="h-4 w-4" />
                添加学生
              </Button>
            </div>
          </div>
          
          {/* 概览 Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">学生总数</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">在校人数</p>
                      <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-100">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">请假人数</p>
                      <p className="text-2xl font-bold text-yellow-600">{leaveCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-100">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">男女比例</p>
                      <p className="text-2xl font-bold text-purple-600">{maleCount}:{femaleCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 常规评比卡片 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      班级常规评比
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      今日评分 ({today})
                    </CardDescription>
                  </div>
                  {weeklyEvaluation && (
                    <div className="flex items-center gap-2">
                      <Award className={`h-5 w-5 ${
                        weeklyEvaluation.level === '优秀' ? 'text-green-600' :
                        weeklyEvaluation.level === '良好' ? 'text-blue-600' :
                        'text-orange-600'
                      }`} />
                      <span className="text-sm font-medium">本周评比：{weeklyEvaluation.level}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {routineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">加载常规评分数据...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 总评分 */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">今日总评分</p>
                          <p className="text-2xl font-bold text-primary">
                            {totalScore.toFixed(1)} / {maxTotalScore}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">得分率</p>
                        <div className="flex items-center gap-2">
                          {scoreRate >= 90 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : scoreRate >= 70 ? (
                            <Target className="h-5 w-5 text-blue-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                          )}
                          <span className={`text-2xl font-bold ${
                            scoreRate >= 90 ? 'text-green-600' :
                            scoreRate >= 70 ? 'text-blue-600' :
                            'text-orange-600'
                          }`}>
                            {scoreRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 各维度评分 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {categoryScores.map((item) => {
                        const rate = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
                        const colorClass = rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-blue-600' : 'text-orange-600';
                        const bgClass = rate >= 90 ? 'bg-green-50 border-green-200' : rate >= 70 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200';
                        
                        return (
                          <div key={item.category} className={`p-3 rounded-lg border ${bgClass}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {ROUTINE_CATEGORY_LABELS[item.category]}
                              </span>
                              <span className={`text-lg font-bold ${colorClass}`}>
                                {item.score}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-blue-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-gray-500">满分 {item.maxScore}</span>
                              <span className={`text-xs ${colorClass}`}>{rate.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 查看更多 */}
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/teacher/habit')}
                        className="gap-2"
                      >
                        查看历史评分记录
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">快捷操作</CardTitle>
                <CardDescription>常用班级管理功能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('students')}
                  >
                    <Users className="h-6 w-6 text-blue-500" />
                    <span>学生管理</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('parents')}
                  >
                    <User className="h-6 w-6 text-green-500" />
                    <span>家长通讯</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/teacher/habit')}
                  >
                    <Star className="h-6 w-6 text-amber-500" />
                    <span>习惯养成</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/teacher/communication')}
                  >
                    <MessageCircle className="h-6 w-6 text-purple-500" />
                    <span>家校沟通</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 学生 Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">学生列表</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索学生姓名或学号..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          pagination.goToPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); pagination.goToPage(1); }}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="状态筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="在校">在校</SelectItem>
                        <SelectItem value="请假">请假</SelectItem>
                        <SelectItem value="休学">休学</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-4 text-gray-500">
                      {searchTerm ? '没有找到匹配的学生' : '暂无学生数据'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>学号</TableHead>
                          <TableHead>姓名</TableHead>
                          <TableHead>性别</TableHead>
                          <TableHead>年级</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagination.paginatedData.map((student) => {
                          const genderStyle = getGenderStyle(student.gender);
                          return (
                            <TableRow 
                              key={student.id} 
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleViewDetail(student.id)}
                            >
                              <TableCell className="font-mono text-sm">{student.studentNo}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={genderStyle.bg}>
                                      {student.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{student.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={genderStyle.color}>{genderStyle.label}</span>
                              </TableCell>
                              <TableCell>{student.gradeName}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(student.status)}>
                                  {student.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => confirmDelete(student)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      删除
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500">
                            共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
                          </p>
                          <Select 
                            value={pagination.pageSize.toString()} 
                            onValueChange={(value) => pagination.setPageSize(parseInt(value))}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                                <SelectItem key={size} value={size.toString()}>{size} 条/页</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={pagination.prevPage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            上一页
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={pagination.nextPage}
                          >
                            下一页
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 座位表 Tab - 懒加载 */}
          <TabsContent value="seating" className="space-y-6">
            <SeatingPlanView 
              classId={classId} 
              className={className}
              readOnly={!canManageClass()}
            />
          </TabsContent>
          
          {/* 家长 Tab */}
          <TabsContent value="parents" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">家长通讯录</CardTitle>
                <CardDescription>班级学生家长联系方式</CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-4 text-gray-500">暂无家长数据</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {parentPagination.paginatedData.map((student) => {
                        const primaryParent = getPrimaryParent(student.parents);
                        return (
                          <Card key={student.id} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className={getGenderStyle(student.gender).bg}>
                                    {student.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-xs text-gray-500">{student.studentNo}</div>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <User className="h-4 w-4" />
                                  <span>{primaryParent?.name || '未填写'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{primaryParent?.phone || '未填写'}</span>
                                </div>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Phone className="h-3 w-3 mr-1" />
                                  拨打
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  发消息
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {parentPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500">
                            共 {parentPagination.total} 条记录，第 {parentPagination.page} / {parentPagination.totalPages} 页
                          </p>
                          <Select 
                            value={parentPagination.pageSize.toString()} 
                            onValueChange={(value) => parentPagination.setPageSize(parseInt(value))}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                                <SelectItem key={size} value={size.toString()}>{size} 条/页</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={parentPagination.page <= 1}
                            onClick={parentPagination.prevPage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            上一页
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={parentPagination.page >= parentPagination.totalPages}
                            onClick={parentPagination.nextPage}
                          >
                            下一页
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除学生「{studentToDelete?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={mutationLoading}
            >
              {mutationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 学生详情弹窗 */}
      <StudentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        studentId={selectedStudentId}
      />
    </div>
  );
}
