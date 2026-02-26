'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Users,
  Calendar,
  FileText,
  Zap,
  Target,
  BarChart3,
  MessageSquare,
  Settings,
  Layers,
  TrendingUp,
  Send,
} from 'lucide-react';

// 待决策事项
const pendingDecisions = [
  {
    id: 1,
    title: '期中考试时间调整申请',
    source: '教务处',
    urgency: 'high',
    deadline: '今天',
    description: '因区级教研活动冲突，建议将期中考试提前一天',
  },
  {
    id: 2,
    title: '家长会方案审批',
    source: '德育处',
    urgency: 'medium',
    deadline: '2天内',
    description: '本学期家长会采用线上线下结合形式，需确定具体方案',
  },
  {
    id: 3,
    title: '教师培训经费追加申请',
    source: '教务处',
    urgency: 'low',
    deadline: '本周',
    description: '省级骨干教师培训名额增加，需追加预算2万元',
  },
];

// 分管部门重点工作
const departmentWork = {
  teaching: {
    name: '教务处',
    director: '王主任',
    keyTasks: [
      { name: '期中考试命题工作', progress: 75, status: 'on-track' },
      { name: '教师教学技能大赛', progress: 40, status: 'on-track' },
      { name: '教学质量分析报告', progress: 90, status: 'ahead' },
    ],
    pendingItems: 5,
    thisWeekMeetings: 3,
  },
  moral: {
    name: '德育处',
    director: '李主任',
    keyTasks: [
      { name: '清明节主题教育活动', progress: 60, status: 'on-track' },
      { name: '学生行为习惯养成月', progress: 85, status: 'ahead' },
      { name: '家长学校课程开发', progress: 30, status: 'at-risk' },
    ],
    pendingItems: 3,
    thisWeekMeetings: 2,
  },
};

// 跨部门协同项目
const crossDepartmentProjects = [
  {
    name: '智慧校园二期建设',
    departments: ['教务处', '总务处', '信息中心'],
    progress: 45,
    status: 'ongoing',
    nextMilestone: '设备采购招标',
    milestoneDate: '3月25日',
    issues: ['部分设备型号待确认'],
  },
  {
    name: '百年校庆筹备',
    departments: ['校办', '德育处', '总务处'],
    progress: 25,
    status: 'planning',
    nextMilestone: '方案初稿完成',
    milestoneDate: '4月1日',
    issues: [],
  },
  {
    name: '家校协同平台升级',
    departments: ['德育处', '信息中心'],
    progress: 68,
    status: 'ongoing',
    nextMilestone: '功能测试',
    milestoneDate: '3月20日',
    issues: ['家长端反馈需整理'],
  },
];

// 风险预警
const riskAlerts = [
  {
    level: 'high',
    title: '期中考试命题进度滞后',
    department: '教务处',
    impact: '可能影响考试安排',
    suggestion: '建议召开命题组紧急会议',
  },
  {
    level: 'medium',
    title: '家校平台家长参与率偏低',
    department: '德育处',
    impact: '影响家校协同效果',
    suggestion: '建议加强宣传推广',
  },
  {
    level: 'low',
    title: '部分教师培训报名未完成',
    department: '教务处',
    impact: '影响培训覆盖率',
    suggestion: '已发提醒，持续跟踪',
  },
];

// 资源协调需求
const coordinationNeeds = [
  {
    from: '教务处',
    to: '总务处',
    content: '阶梯教室音响设备检修',
    reason: '期中考试家长会需要',
    urgency: 'medium',
  },
  {
    from: '德育处',
    to: '教务处',
    content: '班会课时间协调',
    reason: '清明节主题教育活动',
    urgency: 'low',
  },
];

// 本周工作安排
const weeklySchedule = [
  { day: '周一', events: ['教务例会', '分管部门汇报'] },
  { day: '周二', events: ['期中考试命题会', '教师培训评审'] },
  { day: '周三', events: ['行政会议', '家长会方案讨论'] },
  { day: '周四', events: ['德育活动视察', '智慧校园项目会'] },
  { day: '周五', events: ['周工作总结', '下周计划安排'] },
];

export default function VicePrincipalDashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-xl">
              <Briefcase className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">副校长工作台</h1>
              <p className="text-gray-500 text-sm">分管领域 · 跨部门协同 · 决策支持</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-red-100 text-red-700 px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {pendingDecisions.length} 项待决策
          </Badge>
          <span className="text-sm text-gray-400">第12周</span>
        </div>
      </div>

      {/* 待决策事项 */}
      <Card className="border-0 shadow-md border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            待决策事项
          </CardTitle>
          <CardDescription>需要您审批或决策的重要事项</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingDecisions.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <Badge className={
                  item.urgency === 'high' ? 'bg-red-100 text-red-700' :
                  item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }>
                  {item.urgency === 'high' ? '紧急' : item.urgency === 'medium' ? '重要' : '一般'}
                </Badge>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-gray-400">来自：{item.source}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <p className="text-xs text-red-500 mt-1">截止：{item.deadline}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                    驳回
                  </Button>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    审批
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：分管部门 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 分管部门工作 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 教务处 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    教务处
                  </CardTitle>
                  <span className="text-xs text-gray-500">{departmentWork.teaching.director}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {departmentWork.teaching.keyTasks.map((task, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{task.name}</span>
                        <Badge className={
                          task.status === 'ahead' ? 'bg-green-100 text-green-700 text-xs' :
                          task.status === 'at-risk' ? 'bg-red-100 text-red-700 text-xs' :
                          'bg-blue-100 text-blue-700 text-xs'
                        }>
                          {task.status === 'ahead' ? '超前' : task.status === 'at-risk' ? '滞后' : '正常'}
                        </Badge>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t text-sm text-gray-500">
                  <span>待处理：{departmentWork.teaching.pendingItems}项</span>
                  <span>本周会议：{departmentWork.teaching.thisWeekMeetings}场</span>
                </div>
              </CardContent>
            </Card>

            {/* 德育处 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    德育处
                  </CardTitle>
                  <span className="text-xs text-gray-500">{departmentWork.moral.director}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {departmentWork.moral.keyTasks.map((task, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{task.name}</span>
                        <Badge className={
                          task.status === 'ahead' ? 'bg-green-100 text-green-700 text-xs' :
                          task.status === 'at-risk' ? 'bg-red-100 text-red-700 text-xs' :
                          'bg-blue-100 text-blue-700 text-xs'
                        }>
                          {task.status === 'ahead' ? '超前' : task.status === 'at-risk' ? '滞后' : '正常'}
                        </Badge>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t text-sm text-gray-500">
                  <span>待处理：{departmentWork.moral.pendingItems}项</span>
                  <span>本周会议：{departmentWork.moral.thisWeekMeetings}场</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 跨部门协同项目 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-500" />
                跨部门协同项目
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crossDepartmentProjects.map((project, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{project.name}</span>
                      <Badge className={
                        project.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'planning' ? 'bg-gray-100 text-gray-600' :
                        'bg-green-100 text-green-700'
                      }>
                        {project.status === 'ongoing' ? '进行中' : project.status === 'planning' ? '规划中' : '已完成'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {project.departments.map((dept, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{dept}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={project.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">下一节点：{project.nextMilestone}</span>
                      <span className="text-gray-400">{project.milestoneDate}</span>
                    </div>
                    {project.issues.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {project.issues.join('；')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：预警与协调 */}
        <div className="space-y-6">
          {/* 风险预警 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                风险预警
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAlerts.map((alert, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${
                    alert.level === 'high' ? 'bg-red-50 border border-red-100' :
                    alert.level === 'medium' ? 'bg-yellow-50 border border-yellow-100' :
                    'bg-gray-50 border border-gray-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.level === 'high' ? 'text-red-500' :
                        alert.level === 'medium' ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {alert.department} · {alert.impact}
                    </p>
                    <p className="text-xs text-gray-600 bg-white p-1.5 rounded">
                      建议：{alert.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 资源协调需求 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                资源协调
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coordinationNeeds.map((need, idx) => (
                  <div key={idx} className="p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{need.content}</span>
                      <Badge className={
                        need.urgency === 'high' ? 'bg-red-100 text-red-700 text-xs' :
                        need.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700 text-xs' :
                        'bg-gray-100 text-gray-600 text-xs'
                      }>
                        {need.urgency === 'high' ? '紧急' : need.urgency === 'medium' ? '一般' : '低'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {need.from} → {need.to}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{need.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 本周安排 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-500" />
                本周安排
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weeklySchedule.map((day, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-sm font-medium w-8 text-teal-600">{day.day}</span>
                    <div className="flex-1">
                      {day.events.map((event, i) => (
                        <p key={i} className="text-sm text-gray-600">{event}</p>
                      ))}
                    </div>
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
