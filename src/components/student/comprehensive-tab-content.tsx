'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Award,
  Target,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { StudentFullProfile, AcademicYear, YearlyComprehensiveData } from '@/types';

interface ComprehensiveTabContentProps {
  profile: StudentFullProfile;
  /** 是否可查看预警信息（权限控制） */
  canViewWarnings?: boolean;
}

// 获取等级颜色
const getLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '优秀': 'bg-green-100 text-green-700 border-green-200',
    '良好': 'bg-blue-100 text-blue-700 border-blue-200',
    '合格': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '待提高': 'bg-red-100 text-red-700 border-red-200',
  };
  return colorMap[level] || 'bg-gray-100 text-gray-700 border-gray-200';
};

// 获取荣誉级别颜色
const getHonorLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '国家级': 'text-red-600 bg-red-50 border-red-200',
    '省级': 'text-purple-600 bg-purple-50 border-purple-200',
    '市级': 'text-blue-600 bg-blue-50 border-blue-200',
    '区级': 'text-green-600 bg-green-50 border-green-200',
    '校级': 'text-orange-600 bg-orange-50 border-orange-200',
    '班级': 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colorMap[level] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// 获取趋势图标
const getTrendIcon = (trend: 'up' | 'down' | 'stable' | number) => {
  if (typeof trend === 'number') {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  }
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
};

// 模拟学年数据生成函数
function generateMockYearData(profile: StudentFullProfile, enrollmentYear: number): Map<AcademicYear, YearlyComprehensiveData> {
  const yearData = new Map<AcademicYear, YearlyComprehensiveData>();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // 计算当前学年
  const currentAcademicYear = currentMonth >= 9 
    ? `${currentYear}-${currentYear + 1}` 
    : `${currentYear - 1}-${currentYear}`;
  
  // 生成入学至今的学年数据
  for (let year = enrollmentYear; year <= currentYear; year++) {
    const academicYear = `${year}-${year + 1}`;
    const grade = year - enrollmentYear + 1;
    
    if (grade > 6) break; // 小学最多6年
    
    // 模拟数据
    const avgScore = 75 + Math.floor(Math.random() * 20);
    const rank = Math.floor(Math.random() * 20) + 1;
    const honorCount = Math.floor(Math.random() * 4);
    const behaviorScore = 85 + Math.floor(Math.random() * 15);
    const starCount = Math.floor(Math.random() * 3);
    const activityCount = Math.floor(Math.random() * 8) + 2;
    
    yearData.set(academicYear, {
      academicYear,
      academic: {
        avgScore,
        rank,
        improvement: Math.floor(Math.random() * 10) - 5,
        subjectAverages: [
          { subject: '语文', avgScore: avgScore + Math.floor(Math.random() * 10), trend: Math.random() > 0.5 ? 'up' : 'stable' },
          { subject: '数学', avgScore: avgScore + Math.floor(Math.random() * 10), trend: Math.random() > 0.5 ? 'up' : 'down' },
          { subject: '英语', avgScore: avgScore + Math.floor(Math.random() * 10), trend: 'stable' },
        ],
      },
      honors: {
        academicYear,
        honors: honorCount > 0 ? Array.from({ length: honorCount }, (_, i) => {
          const levels: Array<'校级' | '区级' | '市级'> = ['校级', '区级', '市级'];
          const categories: Array<'综合' | '学习' | '德育'> = ['综合', '学习', '德育'];
          return {
            id: `honor-${academicYear}-${i}`,
            title: ['三好学生', '优秀少先队员', '学习标兵', '文明之星'][Math.floor(Math.random() * 4)],
            level: levels[Math.floor(Math.random() * 3)],
            category: categories[Math.floor(Math.random() * 3)],
            date: `${academicYear.split('-')[0]}-0${Math.floor(Math.random() * 6) + 1}-15`,
          };
        }) : [],
        summary: {
          total: honorCount,
          byLevel: { '校级': Math.floor(honorCount / 2), '区级': Math.ceil(honorCount / 3), '市级': honorCount > 2 ? 1 : 0 },
          byCategory: { '综合': Math.ceil(honorCount / 2), '学习': Math.floor(honorCount / 2) },
        },
      },
      moral: {
        avgBehaviorScore: behaviorScore,
        totalStarCount: starCount,
        totalActivityCount: activityCount,
        totalVolunteerHours: Math.floor(Math.random() * 10) + 2,
        overallLevel: behaviorScore >= 90 ? '优秀' : behaviorScore >= 80 ? '良好' : '合格',
      },
      timeline: {
        academicYear,
        events: [
          { id: '1', date: `${year}-09-01`, type: 'milestone', title: '开学典礼', description: '新学期开始', academicYear },
          { id: '2', date: `${year}-11-15`, type: 'academic', title: '期中考试', description: `班级排名第${rank}名`, academicYear },
          ...(honorCount > 0 ? [{ id: '3', date: `${year}-12-20`, type: 'honor' as const, title: '获得荣誉', description: '三好学生', academicYear }] : []),
        ],
        highlights: [],
      },
      evaluation: {
        totalScore: Math.floor((avgScore + behaviorScore) / 2),
        level: behaviorScore >= 90 ? '优秀' : behaviorScore >= 80 ? '良好' : '合格',
      },
    });
  }
  
  return yearData;
}

export function ComprehensiveTabContent({ profile, canViewWarnings = false }: ComprehensiveTabContentProps) {
  // 从入学年份生成学年选项
  const enrollmentYear = profile.enrollmentDate ? new Date(profile.enrollmentDate).getFullYear() : new Date().getFullYear() - 1;
  const yearData = useMemo(() => generateMockYearData(profile, enrollmentYear), [profile, enrollmentYear]);
  
  // 当前学年
  const currentAcademicYear = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }, []);
  
  // 选中的学年（null表示全学段）
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'all'>('all');
  
  // 学年选项
  const yearOptions = useMemo(() => {
    const options: { value: AcademicYear | 'all'; label: string; isCurrent: boolean }[] = [
      { value: 'all', label: '全学段', isCurrent: false },
    ];
    yearData.forEach((_, year) => {
      options.push({
        value: year,
        label: `${year}学年`,
        isCurrent: year === currentAcademicYear,
      });
    });
    return options;
  }, [yearData, currentAcademicYear]);
  
  // 计算全学段汇总数据
  const overallStats = useMemo(() => {
    let totalHonors = 0;
    let totalBehaviorScore = 0;
    let totalStars = 0;
    let totalActivities = 0;
    let yearCount = 0;
    const academicTrend: { academicYear: AcademicYear; avgScore: number; rank: number }[] = [];
    
    yearData.forEach((data, year) => {
      totalHonors += data.honors.summary.total;
      totalBehaviorScore += data.moral.avgBehaviorScore;
      totalStars += data.moral.totalStarCount;
      totalActivities += data.moral.totalActivityCount;
      yearCount++;
      academicTrend.push({
        academicYear: year,
        avgScore: data.academic.avgScore,
        rank: data.academic.rank,
      });
    });
    
    return {
      totalHonors,
      avgBehaviorScore: yearCount > 0 ? Math.round(totalBehaviorScore / yearCount) : 0,
      totalStars,
      totalActivities,
      academicTrend,
      overallLevel: (totalBehaviorScore / yearCount) >= 90 ? '优秀' : (totalBehaviorScore / yearCount) >= 80 ? '良好' : '合格',
    };
  }, [yearData]);
  
  // 获取当前显示的数据
  const displayData = useMemo(() => {
    if (selectedYear === 'all') {
      return null; // 全学段视图
    }
    return yearData.get(selectedYear) || null;
  }, [selectedYear, yearData]);
  
  // 从profile获取荣誉数据
  const honors = profile.honors || [];
  const habitProfile = profile.habitProfile;
  const moralPerformance = profile.moralPerformance;
  
  // 筛选荣誉
  const filteredHonors = useMemo(() => {
    if (selectedYear === 'all' || !selectedYear) return honors;
    const yearPrefix = selectedYear.split('-')[0];
    return honors.filter(h => h.date.startsWith(yearPrefix));
  }, [honors, selectedYear]);

  return (
    <div className="space-y-6">
      {/* 学年选择器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v as AcademicYear | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择学年" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {option.isCurrent && <Badge className="ml-2 text-xs">当前</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* 综合等级 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">综合等级：</span>
          <Badge className={getLevelColor(overallStats.overallLevel)}>
            {overallStats.overallLevel}
          </Badge>
        </div>
      </div>
      
      {/* 素质概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedYear === 'all' ? overallStats.totalHonors : displayData?.honors.summary.total || 0}</div>
                <div className="text-xs text-muted-foreground">荣誉奖项</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedYear === 'all' ? overallStats.avgBehaviorScore : displayData?.moral.avgBehaviorScore || 0}</div>
                <div className="text-xs text-muted-foreground">行为评分</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedYear === 'all' ? overallStats.totalStars : displayData?.moral.totalStarCount || 0}</div>
                <div className="text-xs text-muted-foreground">习惯之星</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedYear === 'all' ? overallStats.totalActivities : displayData?.moral.totalActivityCount || 0}</div>
                <div className="text-xs text-muted-foreground">活动参与</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 详细内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学业表现 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              学业表现
            </CardTitle>
            <CardDescription>
              {selectedYear === 'all' ? '全学段学业趋势' : `${selectedYear}学年成绩概况`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedYear === 'all' ? (
              // 全学段趋势图
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">学年趋势</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">平均分</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium">年级排名</span>
                  </div>
                </div>
                {overallStats.academicTrend.map((item) => (
                  <div key={item.academicYear} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{item.academicYear}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-primary font-bold">{item.avgScore}分</span>
                      <span className="text-muted-foreground">第{item.rank}名</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayData ? (
              // 单学年详情
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-primary">{displayData.academic.avgScore}</div>
                    <div className="text-sm text-muted-foreground">年平均分</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">第{displayData.academic.rank}名</span>
                      {getTrendIcon(displayData.academic.improvement)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {displayData.academic.improvement > 0 ? `进步${displayData.academic.improvement}名` : 
                       displayData.academic.improvement < 0 ? `退步${Math.abs(displayData.academic.improvement)}名` : '排名持平'}
                    </div>
                  </div>
                </div>
                
                {/* 各科成绩 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">各科平均分</div>
                  {displayData.academic.subjectAverages.map((subject) => (
                    <div key={subject.subject} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{subject.subject}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subject.avgScore}分</span>
                        {getTrendIcon(subject.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无学业数据</p>
            )}
          </CardContent>
        </Card>
        
        {/* 荣誉奖项 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              荣誉奖项
            </CardTitle>
            <CardDescription>
              {selectedYear === 'all' ? '全学段荣誉汇总' : `${selectedYear}学年荣誉`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredHonors.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {filteredHonors.map((honor) => (
                  <div key={honor.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`p-2 rounded-lg ${getHonorLevelColor(honor.level)}`}>
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{honor.title}</span>
                        <Badge className={getHonorLevelColor(honor.level)} variant="outline">
                          {honor.level}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {honor.category && <span>{honor.category}类 · </span>}
                        {honor.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无荣誉记录</p>
            )}
          </CardContent>
        </Card>
        
        {/* 德育表现 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              德育表现
            </CardTitle>
            <CardDescription>
              {selectedYear === 'all' ? '全学段德育概况' : `${selectedYear}学年德育表现`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedYear === 'all' ? (
              // 全学段汇总
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{overallStats.avgBehaviorScore}</div>
                    <div className="text-xs text-muted-foreground">平均行为评分</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{overallStats.totalStars}</div>
                    <div className="text-xs text-muted-foreground">习惯之星总数</div>
                  </div>
                </div>
                
                {habitProfile && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">八大习惯达成率</div>
                    {habitProfile.categoryScores?.slice(0, 4).map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{item.categoryName}</span>
                        <div className="flex items-center gap-2 w-24">
                          <Progress value={item.rate} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{item.rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : displayData ? (
              // 单学年详情
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-primary">{displayData.moral.avgBehaviorScore}</div>
                    <div className="text-sm text-muted-foreground">行为评分</div>
                  </div>
                  <Badge className={getLevelColor(displayData.moral.overallLevel)}>
                    {displayData.moral.overallLevel}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">习惯之星 × {displayData.moral.totalStarCount}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">活动参与 {displayData.moral.totalActivityCount}次</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无德育数据</p>
            )}
          </CardContent>
        </Card>
        
        {/* 成长轨迹 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              成长轨迹
            </CardTitle>
            <CardDescription>
              {selectedYear === 'all' ? '全学段成长历程' : `${selectedYear}学年重要事件`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedYear === 'all' ? (
              // 全学段 - 合并所有学年事件
              <div className="relative max-h-[280px] overflow-y-auto">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted" />
                <div className="space-y-3 pl-8">
                  {Array.from(yearData.values()).flatMap((data) => data.timeline.events).slice(0, 8).map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary" />
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.type === 'academic' ? '学业' : 
                             event.type === 'honor' ? '荣誉' : 
                             event.type === 'activity' ? '活动' : '里程碑'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{event.date}</span>
                        </div>
                        <div className="font-medium text-sm mt-1">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground">{event.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : displayData && displayData.timeline.events.length > 0 ? (
              // 单学年时间轴
              <div className="relative max-h-[280px] overflow-y-auto">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted" />
                <div className="space-y-3 pl-8">
                  {displayData.timeline.events.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary" />
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.type === 'academic' ? '学业' : 
                             event.type === 'honor' ? '荣誉' : 
                             event.type === 'activity' ? '活动' : '里程碑'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{event.date}</span>
                        </div>
                        <div className="font-medium text-sm mt-1">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground">{event.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无成长记录</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 学年对比（仅全学段视图显示） */}
      {selectedYear === 'all' && yearData.size > 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              学年对比
            </CardTitle>
            <CardDescription>各学年综合表现对比分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">学年</th>
                    <th className="text-center py-2 px-3 font-medium">平均分</th>
                    <th className="text-center py-2 px-3 font-medium">排名</th>
                    <th className="text-center py-2 px-3 font-medium">荣誉</th>
                    <th className="text-center py-2 px-3 font-medium">行为分</th>
                    <th className="text-center py-2 px-3 font-medium">习惯之星</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(yearData.values()).map((data) => (
                    <tr key={data.academicYear} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{data.academicYear}</td>
                      <td className="text-center py-2 px-3">{data.academic.avgScore}</td>
                      <td className="text-center py-2 px-3">第{data.academic.rank}名</td>
                      <td className="text-center py-2 px-3">
                        <Badge variant="outline">{data.honors.summary.total}项</Badge>
                      </td>
                      <td className="text-center py-2 px-3">{data.moral.avgBehaviorScore}</td>
                      <td className="text-center py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {data.moral.totalStarCount}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
