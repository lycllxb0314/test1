'use client';

/**
 * 班主任习惯养成管理页面
 * 
 * 功能：
 * - 为班级学生制定月度习惯目标
 * - 查看学生打卡记录和统计
 * - 审核补打卡申请
 * - 班级习惯之星推荐
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { HABIT_CATEGORIES, CATEGORY_COLORS, STATUS_LABELS, APPROVAL_STATUS_LABELS } from '@/config/habit';
import {
  Target,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Star,
  Plus,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 学生类型
interface Student {
  id: string;
  name: string;
  studentNumber: string;
  avatar?: string;
}

// 月度目标类型
interface MonthlyGoal {
  id: string;
  classId: string;
  studentId: string;
  month: string;
  academicYear: string;
  goalId: string;
  customTitle?: string;
  customDescription?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalComment?: string;
  goal?: {
    id: string;
    category: string;
    code: string;
    title: string;
    description: string;
    difficulty: string;
  };
}

// 打卡记录类型
interface HabitRecord {
  id: string;
  monthlyGoalId: string;
  studentId: string;
  checkDate: string;
  month: string;
  status: 'completed' | 'pending' | 'missed' | 'make_up';
  photoUrl?: string;
  description?: string;
  parentComment?: string;
  teacherComment?: string;
  makeUpDate?: string;
}

// 类别颜色映射
export default function TeacherHabitPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('goals');
  
  // 学生列表
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  
  // 目标库
  const [goals, setGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  
  // 月度目标
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [monthlyGoalsLoading, setMonthlyGoalsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // 打卡记录
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  
  // 对话框状态
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [viewRecordsDialogOpen, setViewRecordsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // 表单状态
  const [selectedCategory, setSelectedCategory] = useState('文明习惯');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  
  // 加载学生列表
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      // 获取当前用户的班级学生
      const res = await fetch(`/api/students?teacherId=${user?.id}&pageSize=100`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          studentNumber: s.studentNumber,
          avatar: s.avatar,
        })));
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    } finally {
      setStudentsLoading(false);
    }
  };
  
  // 加载目标库
  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const res = await fetch('/api/habit/goals?isActive=true');
      const data = await res.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('获取目标库失败:', error);
    } finally {
      setGoalsLoading(false);
    }
  };
  
  // 加载月度目标
  const fetchMonthlyGoals = async () => {
    setMonthlyGoalsLoading(true);
    try {
      const res = await fetch(`/api/habit/monthly-goals?month=${currentMonth}`);
      const data = await res.json();
      if (data.success) {
        setMonthlyGoals(data.data);
      }
    } catch (error) {
      console.error('获取月度目标失败:', error);
    } finally {
      setMonthlyGoalsLoading(false);
    }
  };
  
  // 加载打卡记录
  const fetchRecords = async (studentId?: string) => {
    setRecordsLoading(true);
    try {
      const params = new URLSearchParams({ month: currentMonth });
      if (studentId) {
        params.set('studentId', studentId);
      }
      const res = await fetch(`/api/habit/records?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('获取打卡记录失败:', error);
    } finally {
      setRecordsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchStudents();
      fetchGoals();
    }
  }, [user?.id]);
  
  useEffect(() => {
    fetchMonthlyGoals();
    fetchRecords();
  }, [currentMonth]);
  
  // 根据类别筛选目标
  const filteredGoals = useMemo(() => {
    return goals.filter(g => g.category === selectedCategory);
  }, [goals, selectedCategory]);
  
  // 创建月度目标
  const handleCreateMonthlyGoals = async () => {
    if (!selectedGoalId || selectedStudentIds.length === 0) {
      alert('请选择目标和学生');
      return;
    }
    
    try {
      const academicYear = currentMonth.slice(0, 4) + '-' + (parseInt(currentMonth.slice(0, 4)) + 1);
      
      const goalsData = selectedStudentIds.map(studentId => ({
        classId: '', // TODO: 从用户信息获取
        studentId,
        month: currentMonth,
        academicYear,
        goalId: selectedGoalId,
        customTitle: customTitle || undefined,
        customDescription: customDescription || undefined,
      }));
      
      const res = await fetch('/api/habit/monthly-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: goalsData }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchMonthlyGoals();
        setAddGoalDialogOpen(false);
        setSelectedStudentIds([]);
        setCustomTitle('');
        setCustomDescription('');
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建月度目标失败:', error);
      alert('创建失败');
    }
  };
  
  // 查看学生打卡记录
  const handleViewRecords = (student: Student) => {
    setSelectedStudent(student);
    fetchRecords(student.id);
    setViewRecordsDialogOpen(true);
  };
  
  // 添加班主任评语
  const handleAddComment = async (recordId: string, comment: string) => {
    try {
      const res = await fetch(`/api/habit/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherComment: comment }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRecords(selectedStudent?.id);
      }
    } catch (error) {
      console.error('添加评语失败:', error);
    }
  };
  
  // 统计数据
  const statistics = useMemo(() => {
    const total = monthlyGoals.length;
    const approved = monthlyGoals.filter(g => g.approvalStatus === 'approved').length;
    const completed = monthlyGoals.filter(g => g.status === 'completed').length;
    const active = monthlyGoals.filter(g => g.status === 'active').length;
    
    return { total, approved, completed, active };
  }, [monthlyGoals]);
  
  // 计算学生打卡进度
  const getStudentProgress = (studentId: string) => {
    const studentRecords = records.filter(r => r.studentId === studentId);
    const completed = studentRecords.filter(r => r.status === 'completed').length;
    const total = studentRecords.length || 1;
    return Math.round((completed / total) * 100);
  };
  
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">习惯养成管理</h1>
          <p className="text-gray-500 mt-1">
            制定班级月度习惯目标 · 查看打卡进度 · 审核补打卡
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月目标</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已通过</p>
                <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.active}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            目标制定
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            打卡进度
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Calendar className="h-4 w-4" />
            打卡记录
          </TabsTrigger>
        </TabsList>
        
        {/* 目标制定 */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              为班级学生制定月度习惯目标
            </p>
            <Button onClick={() => setAddGoalDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加月度目标
            </Button>
          </div>
          
          <Card className="border-0 shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>习惯类别</TableHead>
                  <TableHead>目标标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>审核状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyGoalsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : monthlyGoals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      本月暂无目标，请添加
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyGoals.map(goal => {
                    const colors = goal.goal ? CATEGORY_COLORS[goal.goal.category] : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                    return (
                      <TableRow key={goal.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{goal.studentId?.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{goal.studentId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {goal.goal && (
                            <Badge className={cn(colors.bg, colors.text, colors.border, 'border')}>
                              {goal.goal.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{goal.customTitle || goal.goal?.title || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{STATUS_LABELS[goal.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={goal.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                            {APPROVAL_STATUS_LABELS[goal.approvalStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        {/* 打卡进度 */}
        <TabsContent value="progress" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">班级学生打卡进度</CardTitle>
              <CardDescription>
                查看每位学生的习惯养成打卡完成情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studentsLoading ? (
                  <p className="text-gray-500">加载中...</p>
                ) : students.length === 0 ? (
                  <p className="text-gray-500">暂无学生数据</p>
                ) : (
                  students.map(student => {
                    const progress = getStudentProgress(student.id);
                    return (
                      <div 
                        key={student.id} 
                        className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewRecords(student)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.studentNumber}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">打卡进度</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 打卡记录 */}
        <TabsContent value="records" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">打卡记录列表</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>家长留言</TableHead>
                    <TableHead>班主任评语</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        暂无打卡记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.slice(0, 20).map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{record.studentId}</TableCell>
                        <TableCell>{record.checkDate}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                            {record.status === 'completed' ? '已完成' : 
                             record.status === 'missed' ? '缺卡' :
                             record.status === 'make_up' ? '补卡' : '待打卡'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.parentComment || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.teacherComment || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 添加月度目标对话框 */}
      <Dialog open={addGoalDialogOpen} onOpenChange={setAddGoalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加月度习惯目标</DialogTitle>
            <DialogDescription>
              为学生制定本月习惯养成目标
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 选择类别 */}
            <div className="space-y-2">
              <Label>习惯类别</Label>
              <Select value={selectedCategory} onValueChange={v => {
                setSelectedCategory(v);
                setSelectedGoalId('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 选择目标 */}
            <div className="space-y-2">
              <Label>选择目标</Label>
              {goalsLoading ? (
                <p className="text-gray-500">加载中...</p>
              ) : filteredGoals.length === 0 ? (
                <p className="text-gray-500">该类别暂无目标</p>
              ) : (
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {filteredGoals.map(goal => (
                    <div
                      key={goal.id}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedGoalId === goal.id ? 'border-primary bg-primary/5' : 'hover:border-gray-300'
                      )}
                      onClick={() => setSelectedGoalId(goal.id)}
                    >
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-gray-500">{goal.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 自定义标题和描述 */}
            <div className="space-y-2">
              <Label>自定义标题（可选）</Label>
              <Input
                placeholder="覆盖默认标题"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>自定义描述（可选）</Label>
              <Input
                placeholder="覆盖默认描述"
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
              />
            </div>
            
            {/* 选择学生 */}
            <div className="space-y-2">
              <Label>选择学生</Label>
              <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {studentsLoading ? (
                  <p className="text-gray-500">加载中...</p>
                ) : (
                  students.map(student => (
                    <div key={student.id} className="flex items-center gap-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            setSelectedStudentIds([...selectedStudentIds, student.id]);
                          } else {
                            setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                          }
                        }}
                      />
                      <label htmlFor={student.id} className="text-sm cursor-pointer">
                        {student.name} ({student.studentNumber})
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500">已选择 {selectedStudentIds.length} 名学生</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateMonthlyGoals}>确定添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 查看学生打卡记录对话框 */}
      <Dialog open={viewRecordsDialogOpen} onOpenChange={setViewRecordsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name} 的打卡记录</DialogTitle>
            <DialogDescription>
              查看学生的习惯养成打卡详情
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {recordsLoading ? (
              <p className="text-gray-500">加载中...</p>
            ) : (
              <div className="space-y-3">
                {records.filter(r => r.studentId === selectedStudent?.id).map(record => (
                  <div key={record.id} className="p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{record.checkDate}</span>
                      <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                        {record.status === 'completed' ? '已完成' : '缺卡'}
                      </Badge>
                    </div>
                    {record.description && (
                      <p className="text-sm text-gray-600 mb-1">{record.description}</p>
                    )}
                    {record.parentComment && (
                      <p className="text-sm text-blue-600">家长留言：{record.parentComment}</p>
                    )}
                    {record.teacherComment && (
                      <p className="text-sm text-green-600">班主任评语：{record.teacherComment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecordsDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
