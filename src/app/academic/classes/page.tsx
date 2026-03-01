'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  BookOpen,
  Settings,
  Edit,
  Eye,
  Loader2,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ==================== 类型定义 ====================

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  isHeadTeacher: boolean;
  classId?: string;
  className?: string;
  department?: string;
  title?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  headTeacherId: string;
  headTeacherName: string;
  subTeacherId?: string;       // 科任（副班主任）ID
  subTeacherName?: string;     // 科任（副班主任）姓名
  studentCount: number;
  classroomId: string;
  classroomName: string;
  building: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 语文和数学老师才能担任班主任或科任（副班主任）
const HEAD_TEACHER_SUBJECTS = ['语文', '数学'];

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export default function ClassesPage() {
  // 状态
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // 从 API 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 并行获取班级和教师数据
        const [classesRes, teachersRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/teachers'),
        ]);
        
        const classesData = await classesRes.json();
        const teachersData = await teachersRes.json();
        
        if (classesData.success) {
          setClasses(classesData.data);
        }
        if (teachersData.success) {
          setTeachers(teachersData.data);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  // 分页
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // 对话框
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubTeacherDialog, setShowSubTeacherDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  
  // 科任（副班主任）配置
  const [subTeacherId, setSubTeacherId] = useState<string>('');
  const [savingSubTeacher, setSavingSubTeacher] = useState(false);
  
  // 编辑表单
  const [editForm, setEditForm] = useState({
    headTeacherId: '',
    classroom: '',
  });

  // 筛选班级
  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.name.includes(searchTerm) || c.headTeacherName.includes(searchTerm);
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

  // 统计
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const gradeStats = classes.reduce((acc, c) => {
    acc[c.grade] = (acc[c.grade] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // 打开详情
  const handleOpenDetail = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setShowDetailDialog(true);
  };

  // 打开编辑
  const handleOpenEdit = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setEditForm({
      headTeacherId: cls.headTeacherId,
      classroom: cls.classroomName,
    });
    setShowEditDialog(true);
  };

  // 打开科任（副班主任）配置
  const handleOpenSubTeacher = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setSubTeacherId(cls.subTeacherId || '');
    setShowSubTeacherDialog(true);
  };

  // 保存科任（副班主任）配置
  const handleSaveSubTeacher = async () => {
    if (!selectedClass) return;
    
    setSavingSubTeacher(true);
    try {
      const res = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subTeacherId: subTeacherId || null,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        // 更新本地状态
        const teacher = teachers.find(t => t.id === subTeacherId);
        setClasses(prev => prev.map(c => {
          if (c.id === selectedClass.id) {
            return {
              ...c,
              subTeacherId: subTeacherId || undefined,
              subTeacherName: teacher?.name,
            };
          }
          return c;
        }));
        setShowSubTeacherDialog(false);
      } else {
        alert('保存失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('保存科任配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingSubTeacher(false);
    }
  };

  // 保存班级编辑
  const handleSaveEdit = () => {
    if (!selectedClass) return;
    
    const teacher = teachers.find(t => t.id === editForm.headTeacherId);
    
    setClasses(prev => prev.map(c => {
      if (c.id === selectedClass.id) {
        return {
          ...c,
          headTeacherId: editForm.headTeacherId,
          headTeacherName: teacher?.name || c.headTeacherName,
          classroomName: editForm.classroom,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));
    
    setShowEditDialog(false);
    setSelectedClass(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
          <p className="text-gray-500 mt-1">设置班主任和科任（副班主任），其他科目由排课算法自动分配</p>
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
                <p className="text-2xl font-bold text-amber-600">{classes.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
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
                <p className="text-sm text-gray-500">平均班额</p>
                <p className="text-2xl font-bold text-blue-600">
                  {classes.length > 0 ? Math.round(totalStudents / classes.length) : 0}
                </p>
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
                <p className="text-sm text-gray-500">年级数</p>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(gradeStats).length}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
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
                placeholder="搜索班级名称或班主任..."
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
            点击"科任分配"为班级分配各科目任课教师，这是智能排课的前置条件
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>班级名称</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>学生人数</TableHead>
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
                <TableRow key={cls.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{GRADE_NAMES[cls.grade]}</TableCell>
                  <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {cls.studentCount}人
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-amber-600" />
                        {cls.headTeacherName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cls.subTeacherName ? (
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-4 w-4 text-blue-600" />
                          {cls.subTeacherName}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">未配置</span>
                      )}
                    </TableCell>
                    <TableCell>{cls.classroomName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          onClick={() => handleOpenEdit(cls)}
                          title="编辑"
                        >
                          <Edit className="h-3 w-3" />
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

      {/* 班级详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedClass?.name} 详情</DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">年级</div>
                  <div className="font-medium">{GRADE_NAMES[selectedClass.grade]}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">学生人数</div>
                  <div className="font-medium">{selectedClass.studentCount}人</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">班主任</div>
                  <div className="font-medium">{selectedClass.headTeacherName}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">教室</div>
                  <div className="font-medium">{selectedClass.classroomName}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 班级编辑对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑班级信息</DialogTitle>
            <DialogDescription>
              设置班主任和教室位置
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>班主任</Label>
              <Select 
                value={editForm.headTeacherId} 
                onValueChange={(v) => setEditForm({ ...editForm, headTeacherId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择班主任" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.filter(t => t.isHeadTeacher).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.subjects.join('/')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>教室位置</Label>
              <Input 
                value={editForm.classroom}
                onChange={(e) => setEditForm({ ...editForm, classroom: e.target.value })}
                placeholder="如：教学楼A101"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 科任（副班主任）配置对话框 */}
      <Dialog open={showSubTeacherDialog} onOpenChange={setShowSubTeacherDialog}>
        <DialogContent className="sm:max-w-md">
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
              <Label>科任（副班主任）</Label>
              <Select
                value={subTeacherId}
                onValueChange={setSubTeacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择科任老师" />
                </SelectTrigger>
                <SelectContent>
                  {/* 只能选择语文或数学老师，且不能是该班班主任 */}
                  {teachers
                    .filter(t => 
                      // 是语文或数学老师
                      t.subjects?.some(s => HEAD_TEACHER_SUBJECTS.includes(s)) &&
                      // 不是当前班级的班主任
                      t.id !== selectedClass?.headTeacherId
                    )
                    .map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.subjects?.join('/')}) {t.department ? `- ${t.department}` : ''}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">规则说明</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>科任由语文或数学老师担任</li>
                    <li>一个老师只能担任一个班的班主任</li>
                    <li>一个老师可以担任多个班的科任</li>
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
