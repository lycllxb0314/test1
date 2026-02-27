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
} from 'lucide-react';

// ==================== 类型定义 ====================

interface Teacher {
  id: string;
  name: string;
  subjects: string[];        // 可任教科目
  grades: number[];          // 可任教年级
  weeklyHours: number;       // 周课时量
  currentHours: number;      // 已安排课时
  isHeadTeacher: boolean;    // 是否班主任
  headTeacherClassId?: string;
}

interface SubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  classNum: number;
  students: number;
  headTeacherId: string;        // 班主任
  headTeacherName: string;
  subjectHeadId?: string;       // 科任（副班主任）
  subjectHeadName?: string;
  classroom: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 科目配置
const SUBJECTS = [
  { name: '语文', weeklyHours: 8, color: 'bg-red-100 text-red-700' },
  { name: '数学', weeklyHours: 6, color: 'bg-blue-100 text-blue-700' },
  { name: '英语', weeklyHours: 4, color: 'bg-green-100 text-green-700' },
  { name: '体育', weeklyHours: 3, color: 'bg-orange-100 text-orange-700' },
  { name: '音乐', weeklyHours: 2, color: 'bg-purple-100 text-purple-700' },
  { name: '美术', weeklyHours: 2, color: 'bg-pink-100 text-pink-700' },
  { name: '科学', weeklyHours: 2, color: 'bg-cyan-100 text-cyan-700' },
  { name: '道德与法治', weeklyHours: 2, color: 'bg-yellow-100 text-yellow-700' },
];

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// ==================== Mock数据 ====================

const mockTeachers: Teacher[] = [
  { id: 't001', name: '张明华', subjects: ['语文', '道德与法治'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0, isHeadTeacher: true },
  { id: 't002', name: '李秀芳', subjects: ['数学', '科学'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0, isHeadTeacher: true },
  { id: 't003', name: '王建国', subjects: ['语文', '道德与法治'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0, isHeadTeacher: false },
  { id: 't004', name: '赵丽萍', subjects: ['数学', '科学'], grades: [2, 3, 4], weeklyHours: 14, currentHours: 0, isHeadTeacher: true },
  { id: 't005', name: '刘伟强', subjects: ['语文'], grades: [3, 4], weeklyHours: 12, currentHours: 0, isHeadTeacher: false },
  { id: 't006', name: '陈美玲', subjects: ['数学'], grades: [3, 4], weeklyHours: 12, currentHours: 0, isHeadTeacher: true },
  { id: 't007', name: '周志明', subjects: ['英语'], grades: [3, 4, 5, 6], weeklyHours: 16, currentHours: 0, isHeadTeacher: false },
  { id: 't008', name: '吴晓燕', subjects: ['体育'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 18, currentHours: 0, isHeadTeacher: false },
  { id: 't009', name: '郑文博', subjects: ['音乐'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 16, currentHours: 0, isHeadTeacher: false },
  { id: 't010', name: '孙艺华', subjects: ['美术'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 16, currentHours: 0, isHeadTeacher: false },
  { id: 't011', name: '黄志强', subjects: ['科学'], grades: [3, 4, 5, 6], weeklyHours: 14, currentHours: 0, isHeadTeacher: false },
  { id: 't012', name: '林小红', subjects: ['道德与法治'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 12, currentHours: 0, isHeadTeacher: false },
];

// 存储状态
let classesStore: ClassInfo[] = [
  {
    id: 'c001',
    name: '一年级1班',
    grade: 1,
    classNum: 1,
    students: 50,
    headTeacherId: 't001',
    headTeacherName: '张明华',
    subjectHeadId: 't002',
    subjectHeadName: '李秀芳',
    classroom: '教学楼A101',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  {
    id: 'c002',
    name: '一年级2班',
    grade: 1,
    classNum: 2,
    students: 49,
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    subjectHeadId: 't003',
    subjectHeadName: '王建国',
    classroom: '教学楼A102',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  {
    id: 'c003',
    name: '二年级1班',
    grade: 2,
    classNum: 1,
    students: 48,
    headTeacherId: 't003',
    headTeacherName: '王建国',
    subjectHeadId: 't004',
    subjectHeadName: '赵丽萍',
    classroom: '教学楼A201',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  {
    id: 'c004',
    name: '三年级1班',
    grade: 3,
    classNum: 1,
    students: 52,
    headTeacherId: 't006',
    headTeacherName: '陈美玲',
    subjectHeadId: 't005',
    subjectHeadName: '刘伟强',
    classroom: '教学楼A301',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
];

export default function ClassesPage() {
  // 状态
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>(classesStore);
  const [teachers] = useState<Teacher[]>(mockTeachers);
  
  // 筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  // 对话框
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  
  // 编辑表单
  const [editForm, setEditForm] = useState({
    headTeacherId: '',
    subjectHeadId: '',
    classroom: '',
  });

  // 筛选班级
  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.name.includes(searchTerm) || c.headTeacherName.includes(searchTerm);
    const matchesGrade = gradeFilter === 'all' || c.grade === parseInt(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  // 统计
  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);
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
      subjectHeadId: cls.subjectHeadId || '',
      classroom: cls.classroom,
    });
    setShowEditDialog(true);
  };

  // 自动推荐科任（副班主任）
  const getRecommendedSubjectHead = (headTeacherId: string, grade: number): Teacher | undefined => {
    const headTeacher = teachers.find(t => t.id === headTeacherId);
    if (!headTeacher) return undefined;
    
    // 语文班主任 → 推荐数学老师当科任
    // 数学班主任 → 推荐语文老师当科任
    const targetSubject = headTeacher.subjects.includes('语文') ? '数学' : 
                         headTeacher.subjects.includes('数学') ? '语文' : null;
    
    if (!targetSubject) return undefined;
    
    // 找同年级、教目标科目的老师
    return teachers.find(t => 
      t.subjects.includes(targetSubject) && 
      t.grades.includes(grade) &&
      t.id !== headTeacherId
    );
  };

  // 保存班级编辑
  const handleSaveEdit = () => {
    if (!selectedClass) return;
    
    const teacher = teachers.find(t => t.id === editForm.headTeacherId);
    const subjectHead = teachers.find(t => t.id === editForm.subjectHeadId);
    
    setClasses(prev => prev.map(c => {
      if (c.id === selectedClass.id) {
        return {
          ...c,
          headTeacherId: editForm.headTeacherId,
          headTeacherName: teacher?.name || c.headTeacherName,
          subjectHeadId: editForm.subjectHeadId,
          subjectHeadName: subjectHead?.name,
          classroom: editForm.classroom,
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
                <TableHead>科任</TableHead>
                <TableHead>教室位置</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => (
                <TableRow key={cls.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{GRADE_NAMES[cls.grade]}</TableCell>
                  <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {cls.students}人
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-amber-600" />
                        {cls.headTeacherName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cls.subjectHeadName ? (
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-4 w-4 text-blue-600" />
                          {cls.subjectHeadName}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">未设置</span>
                      )}
                    </TableCell>
                    <TableCell>{cls.classroom}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDetail(cls)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEdit(cls)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
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
                  <div className="font-medium">{selectedClass.students}人</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">班主任</div>
                  <div className="font-medium">{selectedClass.headTeacherName}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">教室</div>
                  <div className="font-medium">{selectedClass.classroom}</div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">科任（副班主任）</div>
                <div className="font-medium">{selectedClass.subjectHeadName || '未设置'}</div>
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
              设置班主任和科任（副班主任）。科任自动推荐规则：语文班主任→数学科任，数学班主任→语文科任
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>班主任</Label>
              <Select 
                value={editForm.headTeacherId} 
                onValueChange={(v) => {
                  // 自动推荐科任
                  const recommended = selectedClass ? getRecommendedSubjectHead(v, selectedClass.grade) : undefined;
                  setEditForm({ 
                    ...editForm, 
                    headTeacherId: v,
                    subjectHeadId: recommended?.id || editForm.subjectHeadId,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择班主任" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.filter(t => t.isHeadTeacher || t.weeklyHours >= 12).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.subjects.join('/')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>科任（副班主任）</Label>
              <Select 
                value={editForm.subjectHeadId} 
                onValueChange={(v) => setEditForm({ ...editForm, subjectHeadId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择科任" />
                </SelectTrigger>
                <SelectContent>
                  {selectedClass && (() => {
                    const headTeacher = teachers.find(t => t.id === editForm.headTeacherId);
                    // 只显示与班主任学科互补的老师（语文或数学）
                    const targetSubject = headTeacher?.subjects.includes('语文') ? '数学' : 
                                         headTeacher?.subjects.includes('数学') ? '语文' : null;
                    
                    return teachers
                      .filter(t => 
                        t.grades.includes(selectedClass.grade) &&
                        t.id !== editForm.headTeacherId &&
                        (!targetSubject || t.subjects.includes(targetSubject))
                      )
                      .map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.subjects.join('/')})
                        </SelectItem>
                      ));
                  })()}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                科任由班主任学科自动推荐，也可手动选择
              </p>
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
    </div>
  );
}
