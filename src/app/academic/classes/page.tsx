'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  School,
  Plus,
  Search,
  Users,
  UserCircle,
  UserCheck,
  Eye,
  Loader2,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  Edit,
  Award,
  GraduationCap,
  Trophy,
} from 'lucide-react';
import { 
  useGlobalClasses, 
  type ClassContainer, 
  type StudentBasicInfo, 
  type ParentBasicInfo, 
  type TeacherCandidate, 
  type ClassStatistics 
} from '@/hooks/useGlobalData';
import { useGlobalTeachers, type TeacherInfo } from '@/hooks/useGlobalData';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export default function ClassesPage() {
  // 使用全局数据 Hooks（避免重复请求）
  const { 
    classes, 
    allClasses,
    loading: classesLoading, 
    statistics,
    pagination,
    getRecommendedSubTeachers,
    assignSubTeacher,
    updateHeadTeacher,
    filters,
    setFilters,
  } = useGlobalClasses();
  
  const { 
    teachers, 
    allTeachers,
    loading: teachersLoading,
  } = useGlobalTeachers();
  
  const loading = classesLoading || teachersLoading;
  
  // 视图模式：null = 列表，ClassContainer = 详情
  const [viewingClass, setViewingClass] = useState<ClassContainer | null>(null);
  
  // 对话框
  const [showSubTeacherDialog, setShowSubTeacherDialog] = useState(false);
  const [showHeadTeacherDialog, setShowHeadTeacherDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassContainer | null>(null);
  
  // 科任（副班主任）配置
  const [subTeacherId, setSubTeacherId] = useState<string>('');
  const [savingSubTeacher, setSavingSubTeacher] = useState(false);
  
  // 班主任选择
  const [selectedHeadTeacherId, setSelectedHeadTeacherId] = useState<string>('');

  // 将教师数据转换为候选人格式
  const teacherCandidates: TeacherCandidate[] = useMemo(() => {
    return allTeachers.map((t: TeacherInfo) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      subjects: t.teachableSubjects || [t.subject],
      primaryRole: t.primaryRole,
      department: t.department,
      title: t.title,
      teachableGrades: t.teachableGrades || [],
      isRecommended: false,
      isHeadTeacher: t.isHeadTeacher,
      currentClassId: t.headTeacherClassId,
      currentClassName: t.headTeacherClassName,
    }));
  }, [allTeachers]);

  // 获取班主任候选人
  const headTeacherCandidates = useMemo(() => {
    return allTeachers.filter((t: TeacherInfo) => 
      t.primaryRole === 'head_teacher' || t.primaryRole === 'subject_teacher'
    );
  }, [allTeachers]);

  // 打开详情（切换到详情视图）
  const handleOpenDetail = (cls: ClassContainer) => {
    setViewingClass(cls);
  };

  // 返回列表
  const handleBackToList = () => {
    setViewingClass(null);
  };

  // 打开科任（副班主任）配置
  const handleOpenSubTeacher = (cls: ClassContainer) => {
    setSelectedClass(cls);
    setSubTeacherId(cls.subTeacherId || '');
    setShowSubTeacherDialog(true);
  };
  
  // 打开班主任选择
  const handleOpenHeadTeacher = (cls: ClassContainer) => {
    setSelectedClass(cls);
    setSelectedHeadTeacherId(cls.headTeacherId);
    setShowHeadTeacherDialog(true);
  };

  // 保存科任（副班主任）配置
  const handleSaveSubTeacher = async () => {
    if (!selectedClass) return;
    
    setSavingSubTeacher(true);
    try {
      // 将特殊值 "__none__" 转换为空字符串（API 会将其设为 null）
      const teacherIdToSend = subTeacherId === '__none__' ? '' : subTeacherId;
      const success = await assignSubTeacher(selectedClass.id, teacherIdToSend);
      if (success) {
        setShowSubTeacherDialog(false);
        // 更新详情视图中的数据
        if (viewingClass?.id === selectedClass.id) {
          const updatedClass = classes.find(c => c.id === selectedClass.id);
          if (updatedClass) setViewingClass(updatedClass);
        }
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('保存科任配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingSubTeacher(false);
    }
  };
  
  // 保存班主任
  const handleSaveHeadTeacher = async () => {
    if (!selectedClass || !selectedHeadTeacherId) return;
    
    setSavingSubTeacher(true);
    try {
      const success = await updateHeadTeacher(selectedClass.id, selectedHeadTeacherId);
      if (success) {
        setShowHeadTeacherDialog(false);
        // 更新详情视图中的数据
        if (viewingClass?.id === selectedClass.id) {
          const updatedClass = classes.find(c => c.id === selectedClass.id);
          if (updatedClass) setViewingClass(updatedClass);
        }
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('保存班主任失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingSubTeacher(false);
    }
  };

  // 获取智能推荐的科任教师
  const getSubTeacherRecommendations = () => {
    if (!selectedClass) return [];
    return getRecommendedSubTeachers(selectedClass.id, teacherCandidates);
  };

  // ==================== 详情视图 ====================
  if (viewingClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleBackToList}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  返回列表
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <School className="h-5 w-5 text-amber-600" />
                  <span className="text-sm text-gray-500">班级管理</span>
                  <span className="text-gray-300">/</span>
                  <span className="font-medium text-gray-900">{viewingClass.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  编辑班级
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 主内容区 */}
        <div className="px-6 py-8 space-y-6">
          {/* 班级标题卡片 */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <div className="flex items-start justify-between text-white">
                <div>
                  <h1 className="text-3xl font-bold">{viewingClass.name}</h1>
                  <div className="mt-2 flex items-center gap-4 text-amber-100">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {viewingClass.gradeName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {viewingClass.classroomName || '待分配教室'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{viewingClass.studentCount}</div>
                    <div className="text-sm text-amber-100">学生</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{viewingClass.parentCount}</div>
                    <div className="text-sm text-amber-100">家长</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 教师信息栏 */}
            <div className="p-4 bg-white grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <Avatar className="h-12 w-12 border-2 border-amber-200">
                  <AvatarImage src={viewingClass.headTeacher?.avatar} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-lg">
                    {viewingClass.headTeacherName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm text-amber-600 font-medium">班主任</div>
                  <div className="font-bold text-lg text-gray-900">{viewingClass.headTeacherName}</div>
                  {viewingClass.headTeacher?.subject && (
                    <div className="text-sm text-gray-500">{viewingClass.headTeacher.subject}教师</div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => handleOpenHeadTeacher(viewingClass)}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              </div>
              
              <div className={`flex items-center gap-4 p-4 rounded-lg border ${
                viewingClass.subTeacherName 
                  ? 'bg-blue-50 border-blue-100' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <Avatar className="h-12 w-12 border-2 border-blue-200">
                  <AvatarImage src={viewingClass.subTeacher?.avatar} />
                  <AvatarFallback className={`text-lg ${
                    viewingClass.subTeacherName 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {viewingClass.subTeacherName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm text-blue-600 font-medium">科任（副班主任）</div>
                  <div className="font-bold text-lg text-gray-900">
                    {viewingClass.subTeacherName || '待配置'}
                  </div>
                  {viewingClass.subTeacher?.subject && (
                    <div className="text-sm text-gray-500">{viewingClass.subTeacher.subject}教师</div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => handleOpenSubTeacher(viewingClass)}
                >
                  <UserCog className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Tab 内容区 */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white border shadow-sm p-1 h-auto">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
              >
                <School className="h-4 w-4 mr-2" />
                班级概览
              </TabsTrigger>
              <TabsTrigger 
                value="students"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                学生名单 ({viewingClass.studentCount})
              </TabsTrigger>
              <TabsTrigger 
                value="parents"
                className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                家长通讯录 ({viewingClass.parentCount})
              </TabsTrigger>
              <TabsTrigger 
                value="teachers"
                className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                教师团队
              </TabsTrigger>
            </TabsList>
            
            {/* 概览 Tab */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewSection classData={viewingClass} />
            </TabsContent>
            
            {/* 学生 Tab */}
            <TabsContent value="students" className="space-y-6">
              <StudentsSection students={viewingClass.students} />
            </TabsContent>
            
            {/* 家长 Tab */}
            <TabsContent value="parents" className="space-y-6">
              <ParentsSection parents={viewingClass.parents} />
            </TabsContent>
            
            {/* 教师团队 Tab */}
            <TabsContent value="teachers" className="space-y-6">
              <TeachersSection 
                classData={viewingClass} 
                onChangeHeadTeacher={() => handleOpenHeadTeacher(viewingClass)}
                onChangeSubTeacher={() => handleOpenSubTeacher(viewingClass)}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* 班主任选择对话框 */}
        <Dialog open={showHeadTeacherDialog} onOpenChange={setShowHeadTeacherDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-600" />
                选择班主任
              </DialogTitle>
              <DialogDescription>
                为 {selectedClass?.name} 选择班主任
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>班主任人选</Label>
                <Select
                  value={selectedHeadTeacherId}
                  onValueChange={setSelectedHeadTeacherId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择班主任" />
                  </SelectTrigger>
                  <SelectContent>
                    {headTeacherCandidates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                          <span className="text-gray-500">({t.subject})</span>
                          {t.headTeacherClassId && (
                            <span className="text-xs text-amber-600">
                              现任:{t.headTeacherClassName}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">说明</p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>班主任从教师管理中获取</li>
                      <li>教师主要角色为"班主任"或"科任教师"时可担任</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHeadTeacherDialog(false)}>取消</Button>
              <Button 
                onClick={handleSaveHeadTeacher}
                disabled={savingSubTeacher || !selectedHeadTeacherId}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {savingSubTeacher && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 科任配置对话框 */}
        <Dialog open={showSubTeacherDialog} onOpenChange={setShowSubTeacherDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-amber-600" />
                设置科任（副班主任）
              </DialogTitle>
              <DialogDescription>
                为 {selectedClass?.name} 设置科任（副班主任）
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700">当前班主任</span>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-700">{selectedClass?.headTeacherName}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  科任（副班主任）
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-normal">智能推荐</span>
                </Label>
                <Select
                  value={subTeacherId}
                  onValueChange={setSubTeacherId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择科任老师" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="__none__">
                      <span className="text-gray-500">-- 不指定科任 --</span>
                    </SelectItem>
                    
                    <SelectItem value="__recommended__" disabled>
                      <div className="flex items-center gap-2 text-amber-600">
                        <Lightbulb className="h-4 w-4" />
                        智能推荐
                      </div>
                    </SelectItem>
                    
                    {getSubTeacherRecommendations()
                      .filter(t => t.isRecommended)
                      .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{t.name}</span>
                          <span className="text-gray-500">({t.subject})</span>
                          {t.matchReason && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              {t.matchReason}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    
                    {getSubTeacherRecommendations()
                      .filter(t => !t.isRecommended)
                      .length > 0 && (
                      <>
                        <SelectItem value="__other__" disabled>
                          <span className="text-gray-400">其他教师</span>
                        </SelectItem>
                        {getSubTeacherRecommendations()
                          .filter(t => !t.isRecommended)
                          .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <span>{t.name}</span>
                              <span className="text-gray-500">({t.subject})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">智能推荐规则</p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>根据教师设置的可任教年级智能匹配</li>
                      <li>科任由语文或数学老师担任</li>
                      <li>不能是该班班主任</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubTeacherDialog(false)}>取消</Button>
              <Button 
                onClick={handleSaveSubTeacher}
                disabled={savingSubTeacher}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {savingSubTeacher && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ==================== 列表视图 ====================
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
          <p className="text-gray-500 mt-1">
            班级作为容器，包含班主任、科任（副班主任）、学生、家长
          </p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          新增班级
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级总数</p>
                <p className="text-2xl font-bold text-amber-600">{statistics.totalClasses}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <School className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学生总数</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalStudents}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">家长总数</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalParents}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <UserCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待配置科任</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.classesWithoutSubTeacher}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <UserCog className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索班级名称、班主任或科任..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select 
              value={filters.grade?.toString() || 'all'} 
              onValueChange={(value) => setFilters({ ...filters, grade: value === 'all' ? 'all' : parseInt(value) })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <SelectItem key={g} value={g.toString()}>{GRADE_NAMES[g]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 班级列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>班级列表</CardTitle>
          <CardDescription>
            点击班级行查看详情，包含学生和家长信息
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>班级名称</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>学生/家长</TableHead>
                <TableHead>班主任</TableHead>
                <TableHead>科任（副班主任）</TableHead>
                <TableHead>教室位置</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" />
                    <p className="mt-2 text-gray-500">加载中...</p>
                  </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    暂无班级数据
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                <TableRow 
                  key={cls.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenDetail(cls)}
                >
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.gradeName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Users className="h-3 w-3 mr-1" />
                        {cls.studentCount}人
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <UserCircle className="h-3 w-3 mr-1" />
                        {cls.parentCount}人
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-4 w-4 text-amber-600" />
                      <span>{cls.headTeacherName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cls.subTeacherName ? (
                      <div className="flex items-center gap-1">
                        <UserCircle className="h-4 w-4 text-blue-600" />
                        <span>{cls.subTeacherName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">未配置</span>
                    )}
                  </TableCell>
                  <TableCell>{cls.classroomName || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenDetail(cls)}
                        title="查看详情"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenHeadTeacher(cls)}
                        title="更换班主任"
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={() => handleOpenSubTeacher(cls)}
                        title="设置科任（副班主任）"
                      >
                        <BookOpenCheck className="h-3 w-3 mr-1" />
                        科任
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  显示 {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
                </div>
                <Select 
                  value={pagination.pageSize.toString()} 
                  onValueChange={(value) => pagination.setPageSize(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pagination.pageSizeOptions.map((size: number) => (
                      <SelectItem key={size} value={size.toString()}>{size} 条/页</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pagination.prevPage}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pagination.nextPage}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 班主任选择对话框 */}
      <Dialog open={showHeadTeacherDialog} onOpenChange={setShowHeadTeacherDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              选择班主任
            </DialogTitle>
            <DialogDescription>
              为 {selectedClass?.name} 选择班主任
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>班主任人选</Label>
              <Select
                value={selectedHeadTeacherId}
                onValueChange={setSelectedHeadTeacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择班主任" />
                </SelectTrigger>
                <SelectContent>
                  {headTeacherCandidates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-gray-500">({t.subject})</span>
                        {t.headTeacherClassId && (
                          <span className="text-xs text-amber-600">
                            现任:{t.headTeacherClassName}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">说明</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>班主任从教师管理中获取</li>
                    <li>教师主要角色为"班主任"或"科任教师"时可担任</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHeadTeacherDialog(false)}>取消</Button>
            <Button 
              onClick={handleSaveHeadTeacher}
              disabled={savingSubTeacher || !selectedHeadTeacherId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {savingSubTeacher && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 科任（副班主任）配置对话框 */}
      <Dialog open={showSubTeacherDialog} onOpenChange={setShowSubTeacherDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-amber-600" />
              设置科任（副班主任）
            </DialogTitle>
            <DialogDescription>
              为 {selectedClass?.name} 设置科任（副班主任），系统智能推荐可任教教师
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">当前班主任</span>
                <div className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700">{selectedClass?.headTeacherName}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                科任（副班主任）
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600 font-normal">智能推荐</span>
              </Label>
              <Select
                value={subTeacherId}
                onValueChange={setSubTeacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择科任老师（系统已智能推荐）" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="__none__">
                    <span className="text-gray-500">-- 不指定科任 --</span>
                  </SelectItem>
                  
                  <SelectItem value="__recommended__" disabled>
                    <div className="flex items-center gap-2 text-amber-600">
                      <Lightbulb className="h-4 w-4" />
                      智能推荐
                    </div>
                  </SelectItem>
                  
                  {getSubTeacherRecommendations()
                    .filter(t => t.isRecommended)
                    .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{t.name}</span>
                        <span className="text-gray-500">({t.subject})</span>
                        {t.matchReason && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            {t.matchReason}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  
                  {getSubTeacherRecommendations()
                    .filter(t => !t.isRecommended)
                    .length > 0 && (
                    <>
                      <SelectItem value="__other__" disabled>
                        <span className="text-gray-400">其他教师</span>
                      </SelectItem>
                      {getSubTeacherRecommendations()
                        .filter(t => !t.isRecommended)
                        .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <span>{t.name}</span>
                            <span className="text-gray-500">({t.subject})</span>
                            {t.matchReason && (
                              <span className="text-xs text-gray-400">{t.matchReason}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">智能推荐规则</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>根据教师设置的可任教年级智能匹配</li>
                    <li>科任由语文或数学老师担任</li>
                    <li>不能是该班班主任</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubTeacherDialog(false)}>取消</Button>
            <Button 
              onClick={handleSaveSubTeacher}
              disabled={savingSubTeacher}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {savingSubTeacher && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== 详情页子组件 ====================

// 概览模块
function OverviewSection({ classData }: { classData: ClassContainer }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-amber-600" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="班级名称" value={classData.name} />
            <InfoItem label="年级" value={classData.gradeName} />
            <InfoItem label="班号" value={classData.classNumber.toString()} />
            <InfoItem label="教室位置" value={classData.classroomName || '待分配'} />
          </div>
          {classData.motto && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm text-amber-600 font-medium">班训</div>
              <div className="text-gray-700 mt-1">{classData.motto}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            学生统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{classData.studentCount}</div>
              <div className="text-sm text-gray-500 mt-1">总人数</div>
            </div>
            <div className="text-center p-4 bg-sky-50 rounded-lg">
              <div className="text-3xl font-bold text-sky-600">{classData.maleStudentCount}</div>
              <div className="text-sm text-gray-500 mt-1">男生</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-3xl font-bold text-pink-600">{classData.femaleStudentCount}</div>
              <div className="text-sm text-gray-500 mt-1">女生</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>性别比例</span>
              <span>男:女 = {classData.maleStudentCount}:{classData.femaleStudentCount}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-sky-400 h-full" 
                style={{ width: `${classData.studentCount > 0 ? (classData.maleStudentCount / classData.studentCount) * 100 : 0}%` }}
              />
              <div 
                className="bg-pink-400 h-full" 
                style={{ width: `${classData.studentCount > 0 ? (classData.femaleStudentCount / classData.studentCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-green-600" />
            家长通讯录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{classData.parentCount}</div>
              <div className="text-sm text-gray-500 mt-1">家长总数</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">
                {classData.parents.filter(p => p.isPrimary).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">主要联系人</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">平均每位学生家长数</span>
              <span className="font-medium text-gray-900">
                {classData.studentCount > 0 
                  ? (classData.parentCount / classData.studentCount).toFixed(1) 
                  : 0}人
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            班级特色
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classData.features && classData.features.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {classData.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {feature}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂未设置班级特色</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 学生列表模块
function StudentsSection({ students }: { students: StudentBasicInfo[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || 
    s.studentNo.includes(searchTerm)
  );
  
  const activeStudents = filteredStudents.filter(s => s.status === '在校');
  const inactiveStudents = filteredStudents.filter(s => s.status !== '在校');
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>学生名单</CardTitle>
            <CardDescription>
              共 {students.length} 名学生，{activeStudents.length} 人在校
            </CardDescription>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索学号或姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>没有找到学生</p>
            </div>
          ) : (
            <div className="divide-y">
              {activeStudents.map((student) => (
                <StudentItem key={student.id} student={student} />
              ))}
              
              {inactiveStudents.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 font-medium">
                    非在校学生 ({inactiveStudents.length})
                  </div>
                  {inactiveStudents.map((student) => (
                    <StudentItem key={student.id} student={student} />
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StudentItem({ student }: { student: StudentBasicInfo }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={student.avatar} />
          <AvatarFallback className={student.gender === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}>
            {student.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center gap-2">
            {student.name}
            <Badge variant="outline" className="text-xs">
              {student.studentNo}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>{student.gender === 'male' ? '男' : '女'}</span>
            {student.birthDate && (
              <>
                <span>·</span>
                <span>{new Date(student.birthDate).toLocaleDateString('zh-CN')}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={student.status === '在校' ? 'default' : 'secondary'}>
          {student.status}
        </Badge>
        {student.parents && student.parents.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400">
            <UserCircle className="h-4 w-4" />
            <span className="text-xs">{student.parents.length}位家长</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 家长列表模块
function ParentsSection({ parents }: { parents: ParentBasicInfo[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredParents = parents.filter(p => 
    p.name.includes(searchTerm) || 
    p.studentName.includes(searchTerm) ||
    p.phone?.includes(searchTerm)
  );
  
  const sortedParents = [...filteredParents].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>家长通讯录</CardTitle>
            <CardDescription>
              共 {parents.length} 位家长，{parents.filter(p => p.isPrimary).length} 位主要联系人
            </CardDescription>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索姓名、学生或电话..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {sortedParents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>没有找到家长</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedParents.map((parent, index) => (
                <ParentItem key={`${parent.id}-${index}`} parent={parent} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ParentItem({ parent }: { parent: ParentBasicInfo }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-100 text-green-700">
            {parent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center gap-2">
            {parent.name}
            {parent.isPrimary && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                <Star className="h-3 w-3 mr-1" />
                主要联系人
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              {parent.relationName}
            </Badge>
            <span>·</span>
            <span>{parent.studentName}家长</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {parent.phone && (
          <>
            <a 
              href={`tel:${parent.phone}`}
              className="p-2 hover:bg-green-100 rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4 text-green-600" />
            </a>
            <a 
              href={`sms:${parent.phone}`}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </a>
          </>
        )}
        {parent.wechat && (
          <div className="text-xs text-gray-400 hidden md:block">
            微信: {parent.wechat}
          </div>
        )}
      </div>
    </div>
  );
}

// 教师团队模块
function TeachersSection({ 
  classData, 
  onChangeHeadTeacher, 
  onChangeSubTeacher 
}: { 
  classData: ClassContainer;
  onChangeHeadTeacher: () => void;
  onChangeSubTeacher: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <UserCheck className="h-5 w-5" />
            班主任
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-amber-200">
              <AvatarImage src={classData.headTeacher?.avatar} />
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xl">
                {classData.headTeacherName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{classData.headTeacherName}</h3>
              {classData.headTeacher && (
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  {classData.headTeacher.subject && (
                    <div className="flex items-center gap-2">
                      <BookOpenCheck className="h-4 w-4" />
                      <span>任教科目: {classData.headTeacher.subject}</span>
                    </div>
                  )}
                  {classData.headTeacher.title && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>职称: {classData.headTeacher.title}</span>
                    </div>
                  )}
                  {classData.headTeacher.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{classData.headTeacher.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50">
              <Phone className="h-4 w-4 mr-2" />
              联系
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={onChangeHeadTeacher}
            >
              <Edit className="h-4 w-4 mr-2" />
              更换
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className={`border-0 shadow-md border-l-4 ${classData.subTeacherName ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${classData.subTeacherName ? 'text-blue-700' : 'text-gray-400'}`}>
            <UserCog className="h-5 w-5" />
            科任（副班主任）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classData.subTeacherName ? (
            <>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-blue-200">
                  <AvatarImage src={classData.subTeacher?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                    {classData.subTeacherName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{classData.subTeacherName}</h3>
                  {classData.subTeacher && (
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      {classData.subTeacher.subject && (
                        <div className="flex items-center gap-2">
                          <BookOpenCheck className="h-4 w-4" />
                          <span>任教科目: {classData.subTeacher.subject}</span>
                        </div>
                      )}
                      {classData.subTeacher.title && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>职称: {classData.subTeacher.title}</span>
                        </div>
                      )}
                      {classData.subTeacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{classData.subTeacher.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Phone className="h-4 w-4 mr-2" />
                  联系
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={onChangeSubTeacher}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  更换
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">暂未配置科任（副班主任）</p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onChangeSubTeacher}
              >
                <UserCog className="h-4 w-4 mr-2" />
                配置科任
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 辅助组件
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900 mt-1">{value}</div>
    </div>
  );
}
