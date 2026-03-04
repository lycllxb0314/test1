'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

interface WorkloadStats {
  teacherName: string;
  employeeId: string;
  totalHours: number;
  teachingHours: number;
  substituteHours: number;
  adjustedHours: number;
  weeklyTrend: WeeklyTrend[];
  subjectDistribution: SubjectDistribution[];
  classDistribution: ClassDistribution[];
  semesterStats?: {
    totalAdjustedOut: number;
    totalSubstitutedIn: number;
  };
}

interface WeeklyTrend {
  week: string;
  weekLabel: string;
  totalHours: number;
  teachingHours: number;
  substituteHours: number;
}

interface SubjectDistribution {
  subject: string;
  hours: number;
  percentage: number;
}

interface ClassDistribution {
  className: string;
  hours: number;
}

// 颜色配置
const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

// ==================== 主组件 ====================

export default function WorkloadPage() {
  const { user, isLoading: authLoading } = useAuth();
  
  // === 状态 ===
  const [stats, setStats] = useState<WorkloadStats | null>(null);
  const [selectedSemester, setSelectedSemester] = useState('2025-2026-2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'overview' | 'trend' | 'detail'>('overview');
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // === 加载统计数据 ===
  const loadStats = async () => {
    // 检查用户登录状态
    if (!user) {
      setError('请先登录');
      setDebugInfo('用户未登录');
      return;
    }
    
    if (!user.employeeId) {
      setError('用户信息不完整，缺少工号');
      setDebugInfo(`用户信息: ${JSON.stringify({ id: user.id, name: user.name, role: user.role })}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo(`正在加载: employeeId=${user.employeeId}`);
    
    try {
      const url = `/api/teachers/workload?employeeId=${user.employeeId}&semester=${selectedSemester}`;
      setDebugInfo(`请求URL: ${url}`);
      
      const res = await fetch(url);
      const result = await res.json();
      
      setDebugInfo(`API响应: ${JSON.stringify(result)}`);
      
      if (result.success) {
        setStats(result.data);
        setDebugInfo(`数据加载成功: ${result.data.totalHours}课时`);
      } else {
        setError(result.error || '加载数据失败');
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
      setError('网络错误，请重试');
      setDebugInfo(`错误: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // === 初始化 ===
  useEffect(() => {
    if (!authLoading && user?.employeeId) {
      loadStats();
    }
  }, [authLoading, user?.employeeId, selectedSemester]);
  
  // === 默认空数据 ===
  const emptyStats: WorkloadStats = {
    teacherName: user?.name || '',
    employeeId: user?.employeeId || '',
    totalHours: 0,
    teachingHours: 0,
    substituteHours: 0,
    adjustedHours: 0,
    weeklyTrend: [],
    subjectDistribution: [],
    classDistribution: [],
  };
  
  const displayStats = stats || emptyStats;
  
  // === 计算趋势 ===
  const currentWeek = displayStats.weeklyTrend[displayStats.weeklyTrend.length - 1];
  const prevWeek = displayStats.weeklyTrend[displayStats.weeklyTrend.length - 2];
  const hoursChange = (currentWeek && prevWeek) ? currentWeek.totalHours - prevWeek.totalHours : 0;
  
  // === 渲染 ===
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            工作量统计
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.name && <span className="font-medium text-foreground">{user.name}</span>}
            {user?.employeeId && <span className="text-muted-foreground ml-2">({user.employeeId})</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026-2">2025-2026学年第二学期</SelectItem>
              <SelectItem value="2025-2026-1">2025-2026学年第一学期</SelectItem>
              <SelectItem value="2024-2025-2">2024-2025学年第二学期</SelectItem>
              <SelectItem value="2024-2025-1">2024-2025学年第一学期</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </div>
      
      {/* 调试信息 */}
      {debugInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="text-xs text-blue-600 font-mono">{debugInfo}</div>
          </CardContent>
        </Card>
      )}
      
      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 加载状态 */}
      {loading && !stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 概览卡片 */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">本周总课时</div>
                  <div className="text-3xl font-bold mt-1">{displayStats.totalHours}</div>
                  {displayStats.weeklyTrend.length > 1 && (
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      {hoursChange > 0 ? (
                        <><ArrowUpRight className="h-3 w-3 text-green-500" /><span className="text-green-500">+{hoursChange}</span></>
                      ) : hoursChange < 0 ? (
                        <><ArrowDownRight className="h-3 w-3 text-red-500" /><span className="text-red-500">{hoursChange}</span></>
                      ) : (
                        <><Minus className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">持平</span></>
                      )}
                      <span className="text-muted-foreground ml-1">较上周</span>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">正常教学课时</div>
                  <div className="text-3xl font-bold mt-1">{displayStats.teachingHours}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    占比 {displayStats.totalHours > 0 ? ((displayStats.teachingHours / displayStats.totalHours) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">代课课时</div>
                  <div className="text-3xl font-bold mt-1">{displayStats.substituteHours}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    本学期累计 {displayStats.semesterStats?.totalSubstitutedIn || 0} 节
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">调课课时</div>
                  <div className="text-3xl font-bold mt-1">{displayStats.adjustedHours}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    本学期累计 {displayStats.semesterStats?.totalAdjustedOut || 0} 节
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 图表区域 */}
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as any)}>
        <TabsList>
          <TabsTrigger value="overview"><PieChartIcon className="h-4 w-4 mr-1" />概览</TabsTrigger>
          <TabsTrigger value="trend"><TrendingUpIcon className="h-4 w-4 mr-1" />趋势</TabsTrigger>
          <TabsTrigger value="detail"><BarChart3 className="h-4 w-4 mr-1" />详情</TabsTrigger>
        </TabsList>
        
        {/* 概览视图 */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 学科分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">学科课时分布</CardTitle>
                <CardDescription>各学科教学课时占比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {displayStats.subjectDistribution.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>暂无课表数据</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayStats.subjectDistribution}
                          dataKey="hours"
                          nameKey="subject"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          label={({ subject, percentage }) => `${subject} ${percentage}%`}
                        >
                          {displayStats.subjectDistribution.map((entry, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* 班级分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">班级课时分布</CardTitle>
                <CardDescription>各班级教学课时</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {displayStats.classDistribution.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>暂无班级数据</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayStats.classDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="className" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 趋势视图 */}
        <TabsContent value="trend" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">周课时趋势</CardTitle>
              <CardDescription>近5周课时变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {displayStats.weeklyTrend.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mr-2 opacity-20" />
                    <span>暂无趋势数据</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayStats.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="weekLabel" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalHours" name="总课时" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      <Line type="monotone" dataKey="teachingHours" name="教学课时" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      <Line type="monotone" dataKey="substituteHours" name="代课课时" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* 周明细表格 */}
          {displayStats.weeklyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">周课时明细</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium">周次</th>
                        <th className="text-left py-2 px-4 font-medium">日期</th>
                        <th className="text-right py-2 px-4 font-medium">总课时</th>
                        <th className="text-right py-2 px-4 font-medium">教学课时</th>
                        <th className="text-right py-2 px-4 font-medium">代课课时</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayStats.weeklyTrend.map((week, index) => (
                        <tr key={week.week} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-4">{week.weekLabel}</td>
                          <td className="py-2 px-4 text-muted-foreground text-sm">{week.week}</td>
                          <td className="py-2 px-4 text-right font-bold">{week.totalHours}</td>
                          <td className="py-2 px-4 text-right">{week.teachingHours}</td>
                          <td className="py-2 px-4 text-right">{week.substituteHours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 详情视图 */}
        <TabsContent value="detail" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">课时详情</CardTitle>
              <CardDescription>本学期详细课时统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 学科详情 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">学科课时</h3>
                  {displayStats.subjectDistribution.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无数据</p>
                  ) : (
                    displayStats.subjectDistribution.map((item, index) => (
                      <div key={item.subject} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="text-sm">{item.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.hours}</span>
                          <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* 班级详情 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">班级课时</h3>
                  {displayStats.classDistribution.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无数据</p>
                  ) : (
                    displayStats.classDistribution.map((item) => (
                      <div key={item.className} className="flex items-center justify-between">
                        <span className="text-sm">{item.className}</span>
                        <span className="font-medium">{item.hours} 节</span>
                      </div>
                    ))
                  )}
                </div>
                
                {/* 统计摘要 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">统计摘要</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">学期总课时</span>
                      <span className="font-medium">{displayStats.weeklyTrend.reduce((sum, w) => sum + w.totalHours, 0)} 节</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">平均周课时</span>
                      <span className="font-medium">
                        {displayStats.weeklyTrend.length > 0 
                          ? (displayStats.weeklyTrend.reduce((sum, w) => sum + w.totalHours, 0) / displayStats.weeklyTrend.length).toFixed(1) 
                          : 0} 节
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">代课总课时</span>
                      <span className="font-medium">{displayStats.weeklyTrend.reduce((sum, w) => sum + w.substituteHours, 0)} 节</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">任教班级</span>
                      <span className="font-medium">{displayStats.classDistribution.length} 个</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">任教学科</span>
                      <span className="font-medium">{displayStats.subjectDistribution.length} 门</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
