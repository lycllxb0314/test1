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
  Building2,
  UserCheck,
  Edit,
  Eye,
  Loader2,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  MessageCircle,
  UserCog,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useClasses, type ClassContainer, type TeacherCandidate } from '@/hooks/useClasses';
import { useTeachers, type TeacherInfo } from '@/hooks/useTeachers';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export default function ClassesPage() {
  // Hooks
  const { 
    classes, 
    loading: classesLoading, 
    statistics,
    getRecommendedSubTeachers,
    assignSubTeacher,
    removeSubTeacher,
    updateHeadTeacher,
  } = useClasses();
  
  const { 
    teachers, 
    loading: teachersLoading,
  } = useTeachers();
  
  const loading = classesLoading || teachersLoading;
  
  // 筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  // 分页
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // 对话框
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSubTeacherDialog, setShowSubTeacherDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassContainer | null>(null);
  
  // 科任（副班主任）配置
  const [subTeacherId, setSubTeacherId] = useState<string>('');
  const [savingSubTeacher, setSavingSubTeacher] = useState(false);
  
  // 班主任选择
  const [selectedHeadTeacherId, setSelectedHeadTeacherId] = useState<string>('');
  const [showHeadTeacherDialog, setShowHeadTeacherDialog] = useState(false);

  // 将教师数据转换为候选人格式
  const teacherCandidates: TeacherCandidate[] = useMemo(() => {
    return teachers.map((t: TeacherInfo) => ({
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
  }, [teachers]);

  // 获取班主任候选人（primaryRole = 'head_teacher' 的教师）
  const headTeacherCandidates = useMemo(() => {
    return teachers.filter((t: TeacherInfo) => 
      t.primaryRole === 'head_teacher' || t.primaryRole === 'subject_teacher'
    );
  }, [teachers]);

  // 筛选班级
  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.name.includes(searchTerm) || 
                         c.headTeacherName.includes(searchTerm) ||
                         (c.subTeacherName && c.subTeacherName.includes(searchTerm));
    const matchesGrade = gradeFilter === 'all' || c.grade === parseInt(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  // 分页
  const totalPages = Math.ceil(filteredClasses.length / pageSize);
  const paginatedClasses = filteredClasses.slice((page - 1) * pageSize, page * pageSize);

  // 筛选条件变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [searchTerm, gradeFilter]);

  // 打开详情
  const handleOpenDetail = (cls: ClassContainer) => {
    setSelectedClass(cls);
    setShowDetailDialog(true);
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
      const success = await assignSubTeacher(selectedClass.id, subTeacherId);
      if (success) {
        setShowSubTeacherDialog(false);
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
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
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    暂无班级数据
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClasses.map((cls) => (
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredClasses.length)} 条，共 {filteredClasses.length} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 班级详情对话框（包含学生和家长） */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-amber-600" />
              {selectedClass?.name} 详情
            </DialogTitle>
            <DialogDescription>
              班级容器：班主任、科任、学生、家长
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="students">学生 ({selectedClass.studentCount})</TabsTrigger>
                <TabsTrigger value="parents">家长 ({selectedClass.parentCount})</TabsTrigger>
                <TabsTrigger value="teachers">教师</TabsTrigger>
              </TabsList>
              
              {/* 概览 */}
              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">年级</div>
                    <div className="font-medium text-lg">{selectedClass.gradeName}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">学生人数</div>
                    <div className="font-medium text-lg">{selectedClass.studentCount}人</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-sm text-amber-700">班主任</div>
                    <div className="font-medium text-lg text-amber-800">{selectedClass.headTeacherName}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700">科任（副班主任）</div>
                    <div className="font-medium text-lg text-blue-800">
                      {selectedClass.subTeacherName || '未配置'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">家长总数</div>
                    <div className="font-medium text-lg">{selectedClass.parentCount}人</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">教室位置</div>
                    <div className="font-medium text-lg">{selectedClass.classroomName || '-'}</div>
                  </div>
                </div>
              </TabsContent>
              
              {/* 学生列表 */}
              <TabsContent value="students" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {selectedClass.students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">暂无学生数据</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedClass.students.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {student.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-500">
                                {student.studentNo} · {student.gender === 'male' ? '男' : '女'}
                              </div>
                            </div>
                          </div>
                          <Badge variant={student.status === '在校' ? 'default' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              {/* 家长列表 */}
              <TabsContent value="parents" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {selectedClass.parents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">暂无家长数据</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedClass.parents.map((parent, index) => (
                        <div 
                          key={`${parent.id}-${index}`} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-700">
                                {parent.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {parent.name}
                                {parent.isPrimary && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                                    主要联系人
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {parent.relationName} · {parent.studentName}家长
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${parent.phone}`}
                              className="p-2 hover:bg-gray-200 rounded-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-4 w-4 text-gray-600" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              {/* 教师信息 */}
              <TabsContent value="teachers" className="mt-4">
                <div className="space-y-4">
                  {/* 班主任 */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-amber-700 font-medium">班主任</div>
                        <div className="text-lg font-bold text-amber-800">{selectedClass.headTeacherName}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDetailDialog(false);
                          handleOpenHeadTeacher(selectedClass);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        更换
                      </Button>
                    </div>
                  </div>
                  
                  {/* 科任（副班主任） */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700 font-medium">科任（副班主任）</div>
                        <div className="text-lg font-bold text-blue-800">
                          {selectedClass.subTeacherName || '未配置'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDetailDialog(false);
                          handleOpenSubTeacher(selectedClass);
                        }}
                      >
                        <BookOpenCheck className="h-3 w-3 mr-1" />
                        {selectedClass.subTeacherName ? '更换' : '配置'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

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

      {/* 科任（副班主任）配置对话框 - 智能推荐 */}
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
            {/* 当前班主任信息 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">当前班主任</span>
                <div className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700">{selectedClass?.headTeacherName}</span>
                </div>
              </div>
            </div>
            
            {/* 科任选择 */}
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
                  {/* 清空选项 */}
                  <SelectItem value="">
                    <span className="text-gray-500">-- 不指定科任 --</span>
                  </SelectItem>
                  
                  {/* 智能推荐的教师 */}
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
                  
                  {/* 其他符合条件的教师 */}
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
