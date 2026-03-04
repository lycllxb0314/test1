'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Activity,
  Target,
  Award,
} from 'lucide-react';
import type { TeacherWorkload, TeacherMonthlyWorkloadSummary } from '@/types';

// 科目颜色配置
const subjectColors: Record<string, string> = {
  '语文': 'bg-red-100 text-red-700 border-red-200',
  '数学': 'bg-blue-100 text-blue-700 border-blue-200',
  '英语': 'bg-green-100 text-green-700 border-green-200',
  '体育': 'bg-orange-100 text-orange-700 border-orange-200',
  '音乐': 'bg-purple-100 text-purple-700 border-purple-200',
  '美术': 'bg-pink-100 text-pink-700 border-pink-200',
  '科学': 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

// 月份数据
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}));

const semesters = [
  { value: '2024-2025-1', label: '2024-2025学年第一学期' },
  { value: '2024-2025-2', label: '2024-2025学年第二学期' },
];

// 年级选项
const grades = [
  { value: 0, label: '全部年级' },
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
];

export default function WorkloadPage() {
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('2024-2025-1');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [grade, setGrade] = useState<number>(0); // 0表示全部年级
  
  // 数据
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherDetail, setTeacherDetail] = useState<TeacherWorkload | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<TeacherMonthlyWorkloadSummary | null>(null);
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    totalTeachers: 0,
    avgWorkload: 0,
    avgVariance: 0,
    aboveStandard: 0,
    belowStandard: 0,
  });

  // 加载数据
  useEffect(() => {
    fetchWorkloadData();
  }, [semester, month, grade]);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      
      // 构建查询URL
      let url = `/api/workload?action=batch&semester=${semester}&month=${month}`;
      if (grade > 0) {
        url += `&grade=${grade}`;
      }
      
      // 批量获取教师工作量
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setWorkloads(result.data);
        
        // 计算统计数据
        const data = result.data as TeacherWorkload[];
        const totalTeachers = data.length;
        const avgWorkload = data.reduce((sum, w) => sum + w.totalWorkload, 0) / totalTeachers || 0;
        const avgVariance = data.reduce((sum, w) => sum + w.variance, 0) / totalTeachers || 0;
        const aboveStandard = data.filter(w => w.variance > 0).length;
        const belowStandard = data.filter(w => w.variance < 0).length;
        
        setStatistics({ totalTeachers, avgWorkload, avgVariance, aboveStandard, belowStandard });
        
        // 默认选中第一个教师
        if (data.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(data[0].teacherId);
        }
      }
    } catch (error) {
      console.error('获取工作量数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载教师详情
  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherDetail();
    }
  }, [selectedTeacherId, semester, month]);

  const fetchTeacherDetail = async () => {
    try {
      const response = await fetch(
        `/api/workload?action=teacher&teacherId=${selectedTeacherId}&semester=${semester}&month=${month}`
      );
      const result = await response.json();
      
      if (result.success) {
        setTeacherDetail(result.data);
      }
    } catch (error) {
      console.error('获取教师详情失败:', error);
    }
  };

  // 导出报表
  const handleExport = () => {
    // TODO: 实现导出功能
    alert('导出功能开发中');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">教师工作量统计</h1>
          <p className="text-muted-foreground mt-1">
            统计教师授课、代课、课后服务等工作量
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchWorkloadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">学期:</span>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">月份:</span>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">年级:</span>
              <Select value={grade.toString()} onValueChange={(v) => setGrade(parseInt(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(g => (
                    <SelectItem key={g.value} value={g.value.toString()}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">教师:</span>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择教师" />
                </SelectTrigger>
                <SelectContent>
                  {workloads.map(w => (
                    <SelectItem key={w.teacherId} value={w.teacherId}>{w.teacherName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">统计教师</p>
                <p className="text-2xl font-bold">{statistics.totalTeachers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均工作量</p>
                <p className="text-2xl font-bold">{statistics.avgWorkload.toFixed(1)} 节</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均差异</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {statistics.avgVariance > 0 ? '+' : ''}{statistics.avgVariance.toFixed(1)}
                  </p>
                  {statistics.avgVariance > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : statistics.avgVariance < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">达标情况</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{statistics.aboveStandard}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{statistics.belowStandard}</span>
                  </div>
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：教师工作量列表 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">教师工作量列表</CardTitle>
            <CardDescription>点击查看详情</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : workloads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无数据</div>
              ) : (
                workloads.map((workload) => (
                  <div
                    key={workload.teacherId}
                    onClick={() => setSelectedTeacherId(workload.teacherId)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeacherId === workload.teacherId
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{workload.teacherName}</p>
                        <p className="text-sm text-muted-foreground">
                          基准: {workload.baseWeeklyHours}节/周
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{workload.totalWorkload} 节</p>
                        <p className={`text-sm ${
                          workload.variance > 0 ? 'text-green-600' : 
                          workload.variance < 0 ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {workload.variance > 0 ? '+' : ''}{workload.variance}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：教师详情 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {teacherDetail ? `${teacherDetail.teacherName} - 工作量详情` : '工作量详情'}
            </CardTitle>
            <CardDescription>
              {semester} · {month}月
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!teacherDetail ? (
              <div className="text-center py-12 text-muted-foreground">
                请选择教师查看详情
              </div>
            ) : (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">总览</TabsTrigger>
                  <TabsTrigger value="leave">请假详情</TabsTrigger>
                  <TabsTrigger value="substitute">代课详情</TabsTrigger>
                  <TabsTrigger value="afterSchool">课后服务</TabsTrigger>
                </TabsList>

                {/* 总览 */}
                <TabsContent value="overview" className="space-y-4">
                  {/* 工作量构成 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600">应上课时</p>
                      <p className="text-2xl font-bold text-blue-700">{teacherDetail.expectedHours}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">实际授课</p>
                      <p className="text-2xl font-bold text-green-700">{teacherDetail.selfTaughtHours}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-orange-600">代课课时</p>
                      <p className="text-2xl font-bold text-orange-700">{teacherDetail.substituteHours}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600">课后服务</p>
                      <p className="text-2xl font-bold text-purple-700">{teacherDetail.afterSchoolServiceHours}</p>
                    </div>
                  </div>

                  {/* 工作量对比 */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">工作量对比</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">基准课时</span>
                        <span className="font-medium">{teacherDetail.expectedHours} 节</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">自己授课</span>
                        <span className="font-medium">{teacherDetail.selfTaughtHours} 节</span>
                      </div>
                      <div className="flex items-center justify-between text-red-600">
                        <span>请假扣减</span>
                        <span className="font-medium">-{teacherDetail.leaveHours} 节</span>
                      </div>
                      <div className="flex items-center justify-between text-orange-600">
                        <span>代课增加</span>
                        <span className="font-medium">+{teacherDetail.substituteHours} 节</span>
                      </div>
                      <div className="flex items-center justify-between text-purple-600">
                        <span>课后服务</span>
                        <span className="font-medium">+{teacherDetail.afterSchoolServiceHours} 节</span>
                      </div>
                      <div className="border-t pt-3 flex items-center justify-between">
                        <span className="font-medium">实际工作量</span>
                        <span className="font-bold text-lg">{teacherDetail.totalWorkload} 节</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">与基准差异</span>
                        <span className={`font-bold ${
                          teacherDetail.variance > 0 ? 'text-green-600' : 
                          teacherDetail.variance < 0 ? 'text-red-600' : ''
                        }`}>
                          {teacherDetail.variance > 0 ? '+' : ''}{teacherDetail.variance} 节
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 请假详情 */}
                <TabsContent value="leave">
                  {teacherDetail.leaveDetails.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">本月无请假记录</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>请假类型</TableHead>
                          <TableHead className="text-right">课时</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherDetail.leaveDetails.map((leave, index) => (
                          <TableRow key={index}>
                            <TableCell>{leave.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{leave.leaveType}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              -{leave.hours}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* 代课详情 */}
                <TabsContent value="substitute">
                  {teacherDetail.substituteDetails.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">本月无代课记录</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>班级</TableHead>
                          <TableHead>科目</TableHead>
                          <TableHead>原教师</TableHead>
                          <TableHead className="text-right">课时</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherDetail.substituteDetails.map((sub, index) => (
                          <TableRow key={index}>
                            <TableCell>{sub.date}</TableCell>
                            <TableCell>{sub.className}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={subjectColors[sub.subject] || ''}>
                                {sub.subject}
                              </Badge>
                            </TableCell>
                            <TableCell>{sub.originalTeacherName}</TableCell>
                            <TableCell className="text-right text-orange-600">
                              +{sub.hours}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* 课后服务 */}
                <TabsContent value="afterSchool">
                  {teacherDetail.afterSchoolServiceDetails.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">本月无课后服务记录</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>服务类型</TableHead>
                          <TableHead>班级</TableHead>
                          <TableHead className="text-right">课时</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherDetail.afterSchoolServiceDetails.map((service, index) => (
                          <TableRow key={index}>
                            <TableCell>{service.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{service.serviceType}</Badge>
                            </TableCell>
                            <TableCell>{service.className}</TableCell>
                            <TableCell className="text-right text-purple-600">
                              +{service.hours}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
