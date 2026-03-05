'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  Loader2,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

interface ExamSubject {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  totalStudents: number;
  submittedCount: number;
}

interface SubjectGrade {
  subjectName: string;
  averageScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  excellentRate: number;
}

interface Exam {
  id: string;
  name: string;
  type: string;
  semester: string;
  description?: string;
  grades: number[];
  subjects: ExamSubject[];
  examRooms: string[];
  startDate: string;
  endDate: string;
  status: 'planning' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  totalStudents: number;
  submittedCount: number;
  createdByName?: string;
  createdAt: string;
  publishedAt?: string;
  classes?: ClassInfo[];
  gradeStats?: SubjectGrade[];
}

// 考试状态配置
const EXAM_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: '计划中', color: 'text-gray-700', bg: 'bg-gray-100' },
  published: { label: '已发布', color: 'text-blue-700', bg: 'bg-blue-100' },
  in_progress: { label: '进行中', color: 'text-orange-700', bg: 'bg-orange-100' },
  completed: { label: '已完成', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: '已取消', color: 'text-red-700', bg: 'bg-red-100' },
};

// ==================== 主组件 ====================

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchExamDetail();
  }, [resolvedParams.id]);

  const fetchExamDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${resolvedParams.id}`);
      const result = await response.json();

      if (result.success) {
        setExam(result.data);
      } else {
        toast.error(result.error || '获取考试详情失败');
        router.push('/academic/exams');
      }
    } catch (err) {
      console.error('获取考试详情失败:', err);
      toast.error('获取考试详情失败');
      router.push('/academic/exams');
    } finally {
      setLoading(false);
    }
  };

  // 发布考试
  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/exams/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('发布成功');
        fetchExamDetail();
      } else {
        toast.error(result.error || '发布失败');
      }
    } catch (err) {
      toast.error('发布失败');
    }
  };

  // 开始考试
  const handleStart = async () => {
    try {
      const response = await fetch(`/api/exams/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('考试已开始');
        fetchExamDetail();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    }
  };

  // 完成考试
  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/exams/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('考试已结束');
        fetchExamDetail();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!exam) {
    return null;
  }

  const statusConfig = EXAM_STATUS[exam.status] || EXAM_STATUS.planning;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 返回按钮和标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/academic/exams')}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回列表
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{exam.name}</h1>
              <Badge className={cn('font-normal', statusConfig.bg, statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">{exam.type} · {exam.semester}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {exam.status === 'planning' && (
            <>
              <Button 
                variant="outline"
                onClick={() => router.push(`/academic/exams/${exam.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handlePublish}
              >
                <Play className="h-4 w-4 mr-2" />
                发布考试
              </Button>
            </>
          )}
          {exam.status === 'published' && (
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleStart}
            >
              <Play className="h-4 w-4 mr-2" />
              开始考试
            </Button>
          )}
          {exam.status === 'in_progress' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleComplete}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              结束考试
            </Button>
          )}
          {exam.status === 'completed' && (
            <>
              <Button 
                variant="outline"
                onClick={() => router.push(`/academic/exams/${exam.id}/grades`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                成绩管理
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                成绩分析
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出成绩
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 快捷信息卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">考试日期</p>
                <p className="font-semibold text-gray-900">{formatDate(exam.startDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">参考人数</p>
                <p className="font-semibold text-gray-900">{exam.totalStudents || '-'} 人</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">考试科目</p>
                <p className="font-semibold text-gray-900">{exam.subjects?.length || 0} 门</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">参考年级</p>
                <p className="font-semibold text-gray-900">
                  {exam.grades?.length > 0 
                    ? `${exam.grades.length} 个年级`
                    : '全校'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详情选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/80 backdrop-blur">
          <TabsTrigger value="overview">考试概览</TabsTrigger>
          <TabsTrigger value="subjects">科目安排</TabsTrigger>
          <TabsTrigger value="classes">班级信息</TabsTrigger>
          {exam.status === 'completed' && (
            <TabsTrigger value="grades">成绩统计</TabsTrigger>
          )}
        </TabsList>

        {/* 考试概览 */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">考试名称</span>
                  <span className="font-medium">{exam.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">考试类型</span>
                  <span className="font-medium">{exam.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">所属学期</span>
                  <span className="font-medium">{exam.semester || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">开始日期</span>
                  <span className="font-medium">{formatDate(exam.startDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">结束日期</span>
                  <span className="font-medium">{formatDate(exam.endDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">创建人</span>
                  <span className="font-medium">{exam.createdByName || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">创建时间</span>
                  <span className="font-medium">{formatDateTime(exam.createdAt)}</span>
                </div>
                {exam.publishedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">发布时间</span>
                    <span className="font-medium">{formatDateTime(exam.publishedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">考试说明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {exam.description || '暂无说明'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 参考年级 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">参考年级</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {exam.grades?.length > 0 ? (
                  exam.grades.map(grade => (
                    <Badge key={grade} variant="secondary" className="px-3 py-1">
                      {grade}年级
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="px-3 py-1">
                    全校
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 考场信息 */}
          {exam.examRooms && exam.examRooms.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">考场安排</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {exam.examRooms.map((room, index) => (
                    <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-sm font-medium">{room}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 科目安排 */}
        <TabsContent value="subjects" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {exam.subjects && exam.subjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-medium">科目</TableHead>
                      <TableHead className="font-medium">考试日期</TableHead>
                      <TableHead className="font-medium">开始时间</TableHead>
                      <TableHead className="font-medium">结束时间</TableHead>
                      <TableHead className="font-medium">时长(分钟)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.subjects.map((subject, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>{formatDate(subject.date)}</TableCell>
                        <TableCell>{subject.startTime}</TableCell>
                        <TableCell>{subject.endTime}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {subject.duration} 分钟
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mb-4 text-gray-300" />
                  <p>暂无科目安排</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 班级信息 */}
        <TabsContent value="classes" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {exam.classes && exam.classes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-medium">班级</TableHead>
                      <TableHead className="font-medium">年级</TableHead>
                      <TableHead className="font-medium">学生人数</TableHead>
                      <TableHead className="font-medium">已交卷</TableHead>
                      <TableHead className="font-medium">完成率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.grade}年级</TableCell>
                        <TableCell>{cls.totalStudents}</TableCell>
                        <TableCell>{cls.submittedCount}</TableCell>
                        <TableCell>
                          {cls.totalStudents > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${(cls.submittedCount / cls.totalStudents) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12">
                                {Math.round((cls.submittedCount / cls.totalStudents) * 100)}%
                              </span>
                            </div>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mb-4 text-gray-300" />
                  <p>暂无班级信息</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成绩统计 */}
        {exam.status === 'completed' && (
          <TabsContent value="grades" className="mt-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {exam.gradeStats && exam.gradeStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-medium">科目</TableHead>
                        <TableHead className="font-medium text-center">平均分</TableHead>
                        <TableHead className="font-medium text-center">最高分</TableHead>
                        <TableHead className="font-medium text-center">最低分</TableHead>
                        <TableHead className="font-medium text-center">及格率</TableHead>
                        <TableHead className="font-medium text-center">优秀率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exam.gradeStats.map((stat, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{stat.subjectName}</TableCell>
                          <TableCell className="text-center">{stat.averageScore.toFixed(1)}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">
                            {stat.maxScore}
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-medium">
                            {stat.minScore}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'font-normal',
                                stat.passRate >= 90 ? 'text-green-600 border-green-200' :
                                stat.passRate >= 70 ? 'text-blue-600 border-blue-200' :
                                'text-orange-600 border-orange-200'
                              )}
                            >
                              {stat.passRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className="font-normal text-purple-600 border-purple-200"
                            >
                              {stat.excellentRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <BarChart3 className="h-12 w-12 mb-4 text-gray-300" />
                    <p>暂无成绩数据</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => router.push(`/academic/exams/${exam.id}/grades`)}
                    >
                      录入成绩
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
