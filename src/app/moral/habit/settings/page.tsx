'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  Star,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  GripVertical,
  Award,
  Target,
  Bell,
  Users,
  Clock,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

// 习惯类别图标
const habitIcons: Record<HabitCategory, React.ElementType> = {
  civilization: Heart,
  writing: Pen,
  reading: BookOpen,
  sports: Trophy,
  safety: Shield,
  hygiene: Sparkles,
  aesthetic: Palette,
  labor: Hammer,
};

// 习惯目标模板
const habitGoalTemplates: Record<HabitCategory, { id: string; title: string; description: string; enabled: boolean }[]> = {
  civilization: [
    { id: 'c1', title: '主动问好', description: '见到老师、同学、保安叔叔主动问好', enabled: true },
    { id: 'c2', title: '乐于助人', description: '主动帮助有需要的人', enabled: true },
    { id: 'c3', title: '诚实守信', description: '不说谎，答应的事要做到', enabled: true },
    { id: 'c4', title: '尊重劳动', description: '珍惜他人劳动成果，不浪费', enabled: true },
    { id: 'c5', title: '网络文明', description: '文明上网，不传播不良信息', enabled: false },
  ],
  writing: [
    { id: 'w1', title: '书写工整', description: '作业书写工整，字迹清晰', enabled: true },
    { id: 'w2', title: '姿势正确', description: '保持正确的读写姿势', enabled: true },
    { id: 'w3', title: '自觉练字', description: '每天坚持练字15分钟', enabled: false },
  ],
  reading: [
    { id: 'r1', title: '每日阅读', description: '坚持每天阅读课外书籍30分钟', enabled: true },
    { id: 'r2', title: '阅读推荐', description: '向同学推荐一本好书并说明理由', enabled: true },
    { id: 'r3', title: '读后感', description: '每月撰写一篇读后感', enabled: true },
    { id: 'r4', title: '背诵积累', description: '每周背诵一首古诗或一篇美文', enabled: true },
  ],
  sports: [
    { id: 's1', title: '每日运动', description: '保证每天运动时间不少于1小时', enabled: true },
    { id: 's2', title: '跳绳练习', description: '每天跳绳200个以上', enabled: true },
    { id: 's3', title: '专项爱好', description: '坚持一项体育运动爱好', enabled: false },
  ],
  safety: [
    { id: 'sa1', title: '安全意识', description: '遵守交通规则，不追逐打闹', enabled: true },
    { id: 'sa2', title: '网络安全', description: '控制上网时间，不轻信网络信息', enabled: true },
    { id: 'sa3', title: '自我保护', description: '学会基本的自我保护方法', enabled: true },
  ],
  hygiene: [
    { id: 'h1', title: '整理物品', description: '每天整理书包和书桌', enabled: true },
    { id: 'h2', title: '个人卫生', description: '勤洗手、勤剪指甲', enabled: true },
    { id: 'h3', title: '作息规律', description: '按时作息，保证充足睡眠', enabled: true },
  ],
  aesthetic: [
    { id: 'a1', title: '艺术欣赏', description: '每周欣赏一首名曲或一幅名画', enabled: true },
    { id: 'a2', title: '创意设计', description: '参与班级板报或海报设计', enabled: false },
    { id: 'a3', title: '艺术表达', description: '学习一种艺术表达方式', enabled: false },
  ],
  labor: [
    { id: 'l1', title: '做家务', description: '每周帮助父母做2次以上家务', enabled: true },
    { id: 'l2', title: '班级值日', description: '认真完成班级值日工作', enabled: true },
    { id: 'l3', title: '生活技能', description: '学习一项生活技能', enabled: false },
  ],
};

// 习惯之星评选规则
const starRules = {
  habitThreshold: 80, // 各习惯达成率阈值
  goalThreshold: 80, // 小目标达成率阈值
  minCategories: 6, // 最少达标习惯数
  requireParentSign: true, // 需要家长签字
  requireTeacherReview: true, // 需要班主任审核
  maxStarsPerMonth: 5, // 每班每月上限
};

// 预警规则
const alertRules = {
  attentionThreshold: 70, // 需关注阈值
  declineThreshold: 5, // 下降幅度预警
  consecutiveDays: 3, // 连续未达标天数
};

// 评价权限配置
const evaluationRoles = [
  { role: 'teacher', name: '任课教师', canPraise: true, canImprove: true, maxScore: 5 },
  { role: 'head_teacher', name: '班主任', canPraise: true, canImprove: true, maxScore: 10 },
  { role: 'grade_leader', name: '年段长', canPraise: true, canImprove: true, maxScore: 10 },
  { role: 'moral_director', name: '德育主任', canPraise: true, canImprove: true, maxScore: 15 },
  { role: 'parent', name: '家长', canPraise: true, canImprove: false, maxScore: 3 },
];

export default function HabitSettingsPage() {
  const [activeTab, setActiveTab] = useState('goals');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>('civilization');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ category: HabitCategory; goal: typeof habitGoalTemplates[HabitCategory][0] } | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Settings className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">习惯养成设置</h1>
              <Badge className="bg-blue-100 text-blue-700">系统配置</Badge>
            </div>
            <p className="text-gray-500 mt-0.5">配置习惯目标模板、评选规则、预警阈值</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            恢复默认
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className="h-4 w-4" />
            保存设置
          </Button>
        </div>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="goals">目标模板</TabsTrigger>
          <TabsTrigger value="star">习惯之星规则</TabsTrigger>
          <TabsTrigger value="alert">预警规则</TabsTrigger>
          <TabsTrigger value="permission">评价权限</TabsTrigger>
        </TabsList>

        {/* 目标模板设置 */}
        <TabsContent value="goals" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* 左侧：习惯类别选择 */}
            <Card className="border-0 shadow-lg lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">习惯类别</CardTitle>
                <CardDescription>选择要配置的习惯类别</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(Object.keys(habitCategoryNames) as HabitCategory[]).map((category) => {
                    const Icon = habitIcons[category];
                    const count = habitGoalTemplates[category].filter(g => g.enabled).length;
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${habitCategoryColors[category]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{habitCategoryNames[category]}</p>
                          <p className="text-xs text-gray-400">{count}项目标启用</p>
                        </div>
                        {isSelected && <ChevronRight className="h-4 w-4 text-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 右侧：目标列表 */}
            <Card className="border-0 shadow-lg lg:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className={`p-1.5 rounded ${habitCategoryColors[selectedCategory]}`}>
                        {React.createElement(habitIcons[selectedCategory], { className: 'h-4 w-4' })}
                      </div>
                      {habitCategoryNames[selectedCategory]} - 目标模板
                    </CardTitle>
                    <CardDescription>配置该类别下可选的小目标，班主任制定月度目标时从中选择</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    添加目标
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {habitGoalTemplates[selectedCategory].map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all">
                      <GripVertical className="h-5 w-5 text-gray-300 cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{goal.title}</span>
                          {goal.enabled ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">已启用</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 text-xs">未启用</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{goal.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={goal.enabled} />
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">提示</p>
                    <p>启用的小目标将出现在班主任的"制定月度目标"选项中。班主任可根据班级实际情况选择3-8项目标。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 习惯之星评选规则 */}
        <TabsContent value="star" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  评选条件
                </CardTitle>
                <CardDescription>设置习惯之星的评选标准</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>单习惯达成率阈值</Label>
                      <p className="text-xs text-gray-400">每个习惯需达到的最低达成率</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20 text-center" defaultValue={starRules.habitThreshold} />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>月度小目标达成率</Label>
                      <p className="text-xs text-gray-400">月度小目标的最低达成率</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20 text-center" defaultValue={starRules.goalThreshold} />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>最少达标习惯数</Label>
                      <p className="text-xs text-gray-400">至少有多少项习惯达标</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20 text-center" defaultValue={starRules.minCategories} />
                      <span className="text-sm text-gray-500">/ 8项</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>每班每月上限</Label>
                      <p className="text-xs text-gray-400">每个班级每月最多评选人数</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20 text-center" defaultValue={starRules.maxStarsPerMonth} />
                      <span className="text-sm text-gray-500">人</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  审核流程
                </CardTitle>
                <CardDescription>设置习惯之星的审核要求</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">家长签字确认</p>
                      <p className="text-xs text-gray-400">需要家长在月度目标表上签字</p>
                    </div>
                  </div>
                  <Switch checked={starRules.requireParentSign} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">班主任审核</p>
                      <p className="text-xs text-gray-400">班主任需审核并确认评选结果</p>
                    </div>
                  </div>
                  <Switch checked={starRules.requireTeacherReview} />
                </div>

                <div className="p-4 bg-amber-50 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">评选流程</p>
                    <p>学生达成目标 → 家长签字确认 → 班主任审核 → 德育处备案 → 公示表彰</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 预警规则设置 */}
        <TabsContent value="alert" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                预警触发规则
              </CardTitle>
              <CardDescription>设置学生习惯预警的触发条件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">达成率预警</p>
                      <p className="text-xs text-gray-400">低于阈值触发预警</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="flex-1 text-center" defaultValue={alertRules.attentionThreshold} />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">当学生总体达成率低于此值时，自动标记为"需关注"</p>
                </div>

                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">下降幅度预警</p>
                      <p className="text-xs text-gray-400">环比下降触发预警</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="flex-1 text-center" defaultValue={alertRules.declineThreshold} />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">当学生达成率环比下降超过此值时，触发预警</p>
                </div>

                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">连续未达标</p>
                      <p className="text-xs text-gray-400">连续天数触发预警</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="flex-1 text-center" defaultValue={alertRules.consecutiveDays} />
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">连续多天小目标未达标时，提醒班主任关注</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium mb-1">预警推送规则</p>
                    <ul className="space-y-1 text-orange-600">
                      <li>• 学生预警：自动推送给班主任和家长</li>
                      <li>• 班级预警：自动推送给班主任和年段长</li>
                      <li>• 年级预警：自动推送给德育主任和分管副校长</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 评价权限设置 */}
        <TabsContent value="permission" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-5 w-5 text-purple-500" />
                评价权限配置
              </CardTitle>
              <CardDescription>设置各角色的习惯评价权限和分值范围</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">角色</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">可表扬</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">可待改进</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">最高分值</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationRoles.map((role) => (
                      <tr key={role.role} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch checked={role.canPraise} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch checked={role.canImprove} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Input type="number" className="w-20 text-center mx-auto" defaultValue={role.maxScore} />
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-500">
                          {role.role === 'parent' ? '仅可表扬自己的孩子' : '可评价班级学生'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium mb-1">分值说明</p>
                    <p>表扬为正分（+1~+max），待改进为负分（-1~-max）。最终达成率为累计得分与理论满分的比值。</p>
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
