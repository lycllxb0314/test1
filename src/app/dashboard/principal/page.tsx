'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Zap,
  Clock,
  BookOpen,
  Star,
  ArrowRight,
  Lightbulb,
  Rocket,
  PieChart,
  LineChart,
} from 'lucide-react';

// 学校运行健康度
const schoolHealthData = {
  overallScore: 87,
  dimensions: [
    { name: '教学运行', score: 92, trend: 'up' },
    { name: '后勤保障', score: 85, trend: 'stable' },
    { name: '德育工作', score: 88, trend: 'up' },
    { name: '安全管理', score: 96, trend: 'stable' },
    { name: '家校关系', score: 91, trend: 'up' },
  ],
  alerts: [
    { type: 'info', content: '本周期末考试，教学秩序良好' },
    { type: 'success', content: '家长满意度创季度新高' },
  ],
};

// 教学质量趋势
const teachingQualityData = {
  currentScore: 88.5,
  trend: '+1.2',
  subjectAnalysis: [
    { subject: '语文', score: 91, trend: 'up', highlight: '阅读教学成效显著' },
    { subject: '数学', score: 87, trend: 'stable', highlight: '思维训练需加强' },
    { subject: '英语', score: 85, trend: 'up', highlight: '口语表达进步明显' },
    { subject: '科学', score: 90, trend: 'up', highlight: '实验探究能力提升' },
  ],
  keyMetrics: {
    classExcellenceRate: 68,
    homeworkCompletionRate: 96,
    teacherTrainingHours: 128,
  },
};

// 教师队伍发展
const teacherDevelopmentData = {
  total: 119,
  ageDistribution: { young: 45, middle: 52, senior: 22 },
  titleDistribution: { senior: 18, middle: 56, junior: 45 },
  growthIndicators: [
    { name: '骨干教师培养', current: 28, target: 35, unit: '人' },
    { name: '名师工作室', current: 4, target: 6, unit: '个' },
    { name: '课题研究', current: 12, target: 15, unit: '项' },
  ],
  developmentNeeds: [
    { teacher: '张老师', need: '信息技术能力提升', level: 'yellow' },
    { teacher: '李老师', need: '班级管理经验积累', level: 'yellow' },
  ],
};

// 学生成长指标
const studentGrowthData = {
  total: 2156,
  growthMetrics: [
    { name: '学业进步率', value: 78, trend: '+3%' },
    { name: '综合素质优秀率', value: 42, trend: '+5%' },
    { name: '习惯养成达标率', value: 89, trend: '+2%' },
  ],
  highlights: [
    { content: '四年级(2)班学业进步显著，平均分提升12分', type: 'success' },
    { content: '六年级数学竞赛获市级一等奖3人', type: 'award' },
    { content: '需关注：三年级(4)班部分学生行为习惯', type: 'warning' },
  ],
};

// 资源配置效率
const resourceEfficiencyData = {
  classroom: { usage: 92, efficiency: '优秀' },
  facilities: { usage: 78, efficiency: '良好' },
  budget: { executed: 72, planned: 100, efficiency: '正常' },
  itAssets: { usage: 85, efficiency: '良好' },
  optimizationSuggestions: [
    { area: '功能教室', suggestion: '下午时段利用率可提升15%', impact: 'medium' },
    { area: '体育设施', suggestion: '雨天预案需完善', impact: 'low' },
  ],
};

// 发展机遇与突破
const developmentOpportunities = {
  opportunities: [
    {
      title: '省级智慧教育示范校申报',
      probability: '高',
      impact: '重大',
      action: '需加快二期建设进度',
    },
    {
      title: '百年校庆品牌打造',
      probability: '确定',
      impact: '重大',
      action: '筹备工作已启动',
    },
    {
      title: '集团化办学试点',
      probability: '中',
      impact: '战略',
      action: '正在调研论证',
    },
  ],
  breakthroughPoints: [
    { area: '教学质量', point: '分层走班教学改革', status: 'planning' },
    { area: '教师发展', point: '名师梯队培养计划', status: 'implementing' },
    { area: '特色课程', point: '校本课程体系完善', status: 'ongoing' },
  ],
};

export default function PrincipalDashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">校长工作台</h1>
              <p className="text-gray-500 text-sm">学校运行 · 发展突破 · 战略决策</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">本周运行状态</p>
            <p className="text-lg font-bold text-green-600">健康</p>
          </div>
          <Activity className="h-8 w-8 text-green-500" />
        </div>
      </div>

      {/* 核心运行指标 */}
      <div className="grid gap-4 md:grid-cols-5">
        {schoolHealthData.dimensions.map((dim, idx) => (
          <Card key={idx} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{dim.name}</span>
                {dim.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-200" />
                )}
              </div>
              <p className="text-2xl font-bold">{dim.score}</p>
              <Progress value={dim.score} className="h-1 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：教学质量与教师发展 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 教学质量核心趋势 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  教学质量趋势
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">{teachingQualityData.currentScore}</span>
                  <Badge className="bg-green-100 text-green-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {teachingQualityData.trend}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {teachingQualityData.subjectAnalysis.map((subject, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{subject.subject}</span>
                      {subject.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    </div>
                    <p className="text-xl font-bold text-blue-600">{subject.score}</p>
                    <p className="text-xs text-gray-500 mt-1">{subject.highlight}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold">{teachingQualityData.keyMetrics.classExcellenceRate}%</p>
                  <p className="text-xs text-gray-500">班级优秀率</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{teachingQualityData.keyMetrics.homeworkCompletionRate}%</p>
                  <p className="text-xs text-gray-500">作业完成率</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{teachingQualityData.keyMetrics.teacherTrainingHours}h</p>
                  <p className="text-xs text-gray-500">人均培训时长</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 教师队伍发展 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  教师队伍发展
                </CardTitle>
                <span className="text-sm text-gray-500">共 {teacherDevelopmentData.total} 名教师</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-4">
                {/* 年龄分布 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">年龄结构</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-green-50 rounded text-center">
                      <p className="font-bold text-green-700">{teacherDevelopmentData.ageDistribution.young}</p>
                      <p className="text-xs text-gray-500">青年</p>
                    </div>
                    <div className="flex-1 p-2 bg-blue-50 rounded text-center">
                      <p className="font-bold text-blue-700">{teacherDevelopmentData.ageDistribution.middle}</p>
                      <p className="text-xs text-gray-500">中年</p>
                    </div>
                    <div className="flex-1 p-2 bg-purple-50 rounded text-center">
                      <p className="font-bold text-purple-700">{teacherDevelopmentData.ageDistribution.senior}</p>
                      <p className="text-xs text-gray-500">资深</p>
                    </div>
                  </div>
                </div>
                {/* 职称分布 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">职称结构</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-amber-50 rounded text-center">
                      <p className="font-bold text-amber-700">{teacherDevelopmentData.titleDistribution.senior}</p>
                      <p className="text-xs text-gray-500">高级</p>
                    </div>
                    <div className="flex-1 p-2 bg-teal-50 rounded text-center">
                      <p className="font-bold text-teal-700">{teacherDevelopmentData.titleDistribution.middle}</p>
                      <p className="text-xs text-gray-500">中级</p>
                    </div>
                    <div className="flex-1 p-2 bg-gray-50 rounded text-center">
                      <p className="font-bold text-gray-700">{teacherDevelopmentData.titleDistribution.junior}</p>
                      <p className="text-xs text-gray-500">初级</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 发展指标 */}
              <div className="space-y-3">
                {teacherDevelopmentData.growthIndicators.map((indicator, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{indicator.name}</span>
                      <span className="text-sm text-gray-500">
                        {indicator.current}/{indicator.target} {indicator.unit}
                      </span>
                    </div>
                    <Progress value={(indicator.current / indicator.target) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 学生成长关键指标 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  学生成长指标
                </CardTitle>
                <span className="text-sm text-gray-500">共 {studentGrowthData.total} 名学生</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {studentGrowthData.growthMetrics.map((metric, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{metric.name}</span>
                      <Badge className="bg-green-100 text-green-700 text-xs">{metric.trend}</Badge>
                    </div>
                    <p className="text-2xl font-bold">{metric.value}%</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {studentGrowthData.highlights.map((highlight, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2 rounded text-sm ${
                    highlight.type === 'success' ? 'bg-green-50 text-green-800' :
                    highlight.type === 'award' ? 'bg-amber-50 text-amber-800' :
                    'bg-yellow-50 text-yellow-800'
                  }`}>
                    {highlight.type === 'success' && <CheckCircle className="h-4 w-4" />}
                    {highlight.type === 'award' && <Award className="h-4 w-4" />}
                    {highlight.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                    <span>{highlight.content}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：资源配置与发展机遇 */}
        <div className="space-y-6">
          {/* 资源配置效率 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-500" />
                资源配置效率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">教室利用率</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{resourceEfficiencyData.classroom.usage}%</span>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      {resourceEfficiencyData.classroom.efficiency}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">设施使用率</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{resourceEfficiencyData.facilities.usage}%</span>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      {resourceEfficiencyData.facilities.efficiency}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">预算执行率</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{resourceEfficiencyData.budget.executed}%</span>
                    <Badge className="bg-gray-100 text-gray-700 text-xs">
                      {resourceEfficiencyData.budget.efficiency}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">优化建议</p>
                {resourceEfficiencyData.optimizationSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded text-sm mb-2">
                    <span className="font-medium text-blue-800">{suggestion.area}：</span>
                    <span className="text-blue-700">{suggestion.suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 发展机遇 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-indigo-500" />
                发展机遇
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {developmentOpportunities.opportunities.map((opp, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        opp.probability === '确定' ? 'bg-green-100 text-green-700' :
                        opp.probability === '高' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {opp.probability}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700">{opp.impact}</Badge>
                    </div>
                    <p className="font-medium text-sm">{opp.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{opp.action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 突破点 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                关键突破点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {developmentOpportunities.breakthroughPoints.map((bp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{bp.point}</p>
                      <p className="text-xs text-gray-500">{bp.area}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
