'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Flag,
  Users,
  Heart,
  Shield,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  MessageSquare,
  Calendar,
  Star,
  Activity,
  Building,
  Globe,
  Award,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

// 党建工作数据
const partyBuildingData = {
  partyMembers: 42,
  partyMemberRatio: 35.2,
  thisYearNewMembers: 3,
  activitiesThisMonth: 4,
  studyHoursThisQuarter: 128,
  organizationMeetings: 12,
  thematicActivities: [
    { name: '党的二十大精神学习', status: 'completed', progress: 100, date: '2024-03-10' },
    { name: '师德师风建设月', status: 'ongoing', progress: 65, date: '2024-03-15' },
    { name: '党员先锋岗创建', status: 'ongoing', progress: 40, date: '2024-03-20' },
    { name: '清明祭扫活动筹备', status: 'pending', progress: 0, date: '2024-04-01' },
  ],
};

// 师德师风数据
const teacherMoralityData = {
  overallScore: 92.5,
  trend: '+2.3',
  complaints: 0,
  praises: 15,
  trainingHours: 48,
  keyIssues: [
    { type: 'warning', content: '3名教师连续两周未参加教研活动', level: 'yellow' },
    { type: 'success', content: '本月收到家长表扬信12封，创历史新高', level: 'green' },
  ],
};

// 安全稳定数据
const safetyData = {
  overallScore: 96,
  incidents: 0,
  nearMisses: 2,
  resolvedRate: 100,
  inspections: 28,
  pendingIssues: 1,
  alerts: [
    { content: '清明节假期安全教育待落实', deadline: '3天后', level: 'yellow' },
    { content: '校园周边交通隐患已协调解决', deadline: '已完成', level: 'green' },
  ],
};

// 家校社协同数据
const collaborationData = {
  parentSatisfaction: 94.2,
  communityActivities: 8,
  volunteerHours: 256,
  keyProjects: [
    { name: '家长学校课程', participants: 1850, status: 'ongoing' },
    { name: '社区阅读推广', participants: 320, status: 'ongoing' },
    { name: '校警联动机制', status: 'active' },
  ],
};

// 发展规划数据
const developmentData = {
  yearGoals: [
    { name: '教学质量提升工程', progress: 68, status: 'on-track' },
    { name: '智慧校园二期建设', progress: 45, status: 'on-track' },
    { name: '教师队伍培养计划', progress: 72, status: 'ahead' },
    { name: '校园文化品牌打造', progress: 35, status: 'at-risk' },
  ],
  strategicPriorities: [
    { title: '百年校庆筹备', urgency: 'high', status: 'planning' },
    { title: '省级示范校申报', urgency: 'medium', status: 'preparing' },
    { title: '集团化办学探索', urgency: 'low', status: 'researching' },
  ],
};

export default function SecretaryDashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-red-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">书记工作台</h1>
              <p className="text-gray-500 text-sm">党建引领 · 发展方向 · 安全稳定</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-100 text-red-700 px-3 py-1">
            <Activity className="h-3 w-3 mr-1" />
            实时更新
          </Badge>
          <span className="text-sm text-gray-400">2024年3月18日</span>
        </div>
      </div>

      {/* 核心指标概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">党员占比</p>
                <p className="text-3xl font-bold">{partyBuildingData.partyMemberRatio}%</p>
                <p className="text-red-200 text-xs mt-1">共{partyBuildingData.partyMembers}名党员</p>
              </div>
              <Users className="h-10 w-10 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">师德评分</p>
                <p className="text-3xl font-bold">{teacherMoralityData.overallScore}</p>
                <p className="text-green-200 text-xs mt-1">较上月{teacherMoralityData.trend}</p>
              </div>
              <Heart className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">安全指数</p>
                <p className="text-3xl font-bold">{safetyData.overallScore}</p>
                <p className="text-blue-200 text-xs mt-1">零安全事故</p>
              </div>
              <Shield className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">家长满意度</p>
                <p className="text-3xl font-bold">{collaborationData.parentSatisfaction}%</p>
                <p className="text-purple-200 text-xs mt-1">家校协同良好</p>
              </div>
              <MessageSquare className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：党建与师德 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 党建工作推进 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-red-500" />
                  党建工作推进
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  全部活动 <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {partyBuildingData.thematicActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activity.name}</span>
                        {activity.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-700 text-xs">已完成</Badge>
                        )}
                        {activity.status === 'ongoing' && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">进行中</Badge>
                        )}
                        {activity.status === 'pending' && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">待开始</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={activity.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-gray-500">{activity.progress}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 师德师风建设 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                师德师风建设
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{teacherMoralityData.praises}</p>
                  <p className="text-xs text-gray-500">本月表扬</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{teacherMoralityData.complaints}</p>
                  <p className="text-xs text-gray-500">投诉反馈</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{teacherMoralityData.trainingHours}h</p>
                  <p className="text-xs text-gray-500">培训时长</p>
                </div>
              </div>
              <div className="space-y-2">
                {teacherMoralityData.keyIssues.map((issue, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2 rounded ${
                    issue.level === 'yellow' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'
                  }`}>
                    {issue.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm">{issue.content}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 家校社协同 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                家校社协同育人
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">社区活动</span>
                  </div>
                  <p className="text-xl font-bold">{collaborationData.communityActivities} 场</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">志愿服务</span>
                  </div>
                  <p className="text-xl font-bold">{collaborationData.volunteerHours} 小时</p>
                </div>
              </div>
              <div className="space-y-2">
                {collaborationData.keyProjects.map((project, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm">{project.name}</span>
                    <span className="text-xs text-gray-500">
                      {project.participants ? `${project.participants}人参与` : project.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：安全与发展 */}
        <div className="space-y-6">
          {/* 安全稳定预警 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                安全稳定预警
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg mb-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-1" />
                  <p className="text-sm text-green-700">校园安全稳定</p>
                  <p className="text-xs text-green-600">本月零安全事故</p>
                </div>
              </div>
              <div className="space-y-2">
                {safetyData.alerts.map((alert, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-2 rounded text-sm ${
                    alert.level === 'yellow' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <span className={alert.level === 'yellow' ? 'text-yellow-800' : 'text-green-800'}>
                      {alert.content}
                    </span>
                    <span className="text-xs text-gray-500">{alert.deadline}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{safetyData.inspections}</p>
                  <p className="text-xs text-gray-500">安全检查</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{safetyData.resolvedRate}%</p>
                  <p className="text-xs text-gray-500">整改完成率</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 发展规划落地 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                年度目标推进
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {developmentData.yearGoals.map((goal, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className={`text-xs ${
                        goal.status === 'ahead' ? 'text-green-600' :
                        goal.status === 'at-risk' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {goal.status === 'ahead' ? '超前' : goal.status === 'at-risk' ? '需关注' : '正常'}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 战略重点 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                战略重点事项
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {developmentData.strategicPriorities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded shadow-sm">
                    <Badge className={
                      item.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }>
                      {item.urgency === 'high' ? '紧急' : item.urgency === 'medium' ? '重要' : '一般'}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.status}</p>
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
