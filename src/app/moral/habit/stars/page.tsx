'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Award,
  Crown,
  Medal,
  Search,
  Users,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Settings,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

// 习惯类别图标映射
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

// 模拟习惯之星数据
const starsData = [
  { id: 's001', name: '李小明', class: '四(1)班', grade: '四年级', totalStars: 3, achievements: ['全习惯达标', '阅读之星', '文明之星'], avatar: '', applyDate: '2024-03-15', status: 'approved' },
  { id: 's002', name: '张小红', class: '三(2)班', grade: '三年级', totalStars: 2, achievements: ['7项习惯优秀', '阅读之星'], avatar: '', applyDate: '2024-03-10', status: 'approved' },
  { id: 's003', name: '王小刚', class: '五(3)班', grade: '五年级', totalStars: 1, achievements: ['劳动习惯突出'], avatar: '', applyDate: '2024-03-08', status: 'approved' },
  { id: 's004', name: '赵小芳', class: '四(4)班', grade: '四年级', totalStars: 2, achievements: ['文明习惯优秀', '安全之星'], avatar: '', applyDate: '2024-03-12', status: 'approved' },
  { id: 's005', name: '陈小华', class: '二(1)班', grade: '二年级', totalStars: 0, achievements: ['申请中'], avatar: '', applyDate: '2024-03-18', status: 'pending' },
  { id: 's006', name: '刘小伟', class: '六(2)班', grade: '六年级', totalStars: 3, achievements: ['全习惯达标', '运动之星', '劳动之星'], avatar: '', applyDate: '2024-03-05', status: 'approved' },
];

// 年度之星排行榜
const yearlyRanking = [
  { rank: 1, name: '李小明', class: '四(1)班', stars: 3, honors: 5 },
  { rank: 2, name: '刘小伟', class: '六(2)班', stars: 3, honors: 4 },
  { rank: 3, name: '张小红', class: '三(2)班', stars: 2, honors: 3 },
  { rank: 4, name: '赵小芳', class: '四(4)班', stars: 2, honors: 3 },
  { rank: 5, name: '周小龙', class: '五(1)班', stars: 1, honors: 2 },
];

// 评选规则
const selectionRules = [
  { id: 1, name: '全习惯之星', requirement: '八大习惯全部达到优秀(90%以上)', quota: '每学期20人', period: '学期末评选' },
  { id: 2, name: '单项习惯之星', requirement: '某项习惯连续4周达标', quota: '每班级3人', period: '每月评选' },
  { id: 3, name: '进步之星', requirement: '习惯达成率提升20%以上', quota: '每班级2人', period: '每月评选' },
];

export default function StarsPage() {
  const [activeTab, setActiveTab] = useState('stars');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedStar, setSelectedStar] = useState<typeof starsData[0] | null>(null);

  // 过滤学生
  const filteredStars = starsData.filter(star => {
    if (searchQuery && !star.name.includes(searchQuery) && !star.class.includes(searchQuery)) {
      return false;
    }
    if (selectedGrade !== 'all' && star.grade !== selectedGrade) {
      return false;
    }
    return true;
  });

  // 统计数据
  const stats = {
    totalStars: starsData.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.totalStars, 0),
    totalStudents: starsData.filter(s => s.status === 'approved').length,
    pendingCount: starsData.filter(s => s.status === 'pending').length,
    yearlyTop: yearlyRanking[0],
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 min-h-screen">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
            <Award className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">习惯之星</h1>
            <p className="text-gray-500 mt-0.5">习惯之星评选与管理，展示优秀学生风采</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            导出名单
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Star className="h-8 w-8" />
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.totalStars}</div>
              <div className="text-amber-100">习惯之星总数</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
              <div className="text-gray-500">获奖学生</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingCount}</div>
              <div className="text-gray-500">待审批</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{stats.yearlyTop?.name}</div>
              <div className="text-gray-500 text-sm">年度之星 · {stats.yearlyTop?.class}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="stars" className="data-[state=active]:bg-white">习惯之星名单</TabsTrigger>
          <TabsTrigger value="ranking" className="data-[state=active]:bg-white">年度排行榜</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-white">评选规则</TabsTrigger>
        </TabsList>

        {/* 习惯之星名单 */}
        <TabsContent value="stars" className="space-y-4">
          {/* 筛选 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索学生姓名或班级..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    <SelectItem value="一年级">一年级</SelectItem>
                    <SelectItem value="二年级">二年级</SelectItem>
                    <SelectItem value="三年级">三年级</SelectItem>
                    <SelectItem value="四年级">四年级</SelectItem>
                    <SelectItem value="五年级">五年级</SelectItem>
                    <SelectItem value="六年级">六年级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 学生列表 */}
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredStars.map((star) => (
              <Card
                key={star.id}
                className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  star.status === 'pending' ? 'border-l-4 border-l-blue-400' : ''
                }`}
                onClick={() => { setSelectedStar(star); setShowDetailDialog(true); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* 头像 */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                        {star.name.charAt(0)}
                      </div>
                      {star.totalStars > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-white">
                          <Star className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{star.name}</h3>
                        {star.status === 'pending' && (
                          <Badge className="bg-blue-100 text-blue-700">待审批</Badge>
                        )}
                        {star.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-700">已通过</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{star.class} · {star.grade}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: star.totalStars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                        ))}
                        <span className="text-sm text-gray-400 ml-1">
                          {star.totalStars > 0 ? `${star.totalStars}颗星` : '申请中'}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* 成就标签 */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t">
                    {star.achievements.map((achievement, idx) => (
                      <Badge key={idx} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 年度排行榜 */}
        <TabsContent value="ranking" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                2024年度习惯之星排行榜
              </CardTitle>
              <CardDescription>根据习惯之星数量和荣誉数量综合排名</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {yearlyRanking.map((item) => (
                  <div
                    key={item.rank}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      item.rank === 1 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' :
                      item.rank === 2 ? 'bg-gray-50' :
                      item.rank === 3 ? 'bg-orange-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* 排名 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      item.rank === 1 ? 'bg-amber-400 text-white' :
                      item.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      item.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {item.rank}
                    </div>

                    {/* 学生信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500">{item.class}</span>
                      </div>
                    </div>

                    {/* 统计 */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold">{item.stars}</span>
                        <span className="text-gray-400">颗星</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Medal className="h-4 w-4 text-purple-500" />
                        <span className="font-bold">{item.honors}</span>
                        <span className="text-gray-400">次荣誉</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 评选规则 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {selectionRules.map((rule) => (
              <Card key={rule.id} className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-amber-100">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{rule.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="text-gray-400">评选标准：</span>{rule.requirement}</p>
                        <p><span className="text-gray-400">名额分配：</span>{rule.quota}</p>
                        <p><span className="text-gray-400">评选周期：</span>{rule.period}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      编辑
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md border-dashed border-2 border-gray-200">
            <CardContent className="p-6 flex items-center justify-center gap-4 cursor-pointer hover:bg-gray-50">
              <div className="p-2 rounded-lg bg-gray-100">
                <Award className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">添加新的评选规则</h3>
                <p className="text-sm text-gray-500">创建自定义的习惯之星评选规则</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 学生详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                {selectedStar?.name.charAt(0)}
              </div>
              <div>
                <div>{selectedStar?.name}</div>
                <p className="text-sm font-normal text-gray-500">{selectedStar?.class}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedStar && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1 py-4">
                {Array.from({ length: selectedStar.totalStars }).map((_, i) => (
                  <Star key={i} className="h-8 w-8 text-amber-500 fill-amber-500" />
                ))}
                {selectedStar.totalStars === 0 && (
                  <span className="text-gray-400">暂无习惯之星</span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">荣誉成就</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStar.achievements.map((achievement, idx) => (
                    <Badge key={idx} className="bg-amber-100 text-amber-700">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">申请信息</h4>
                <p className="text-sm text-gray-600">
                  申请日期：{selectedStar.applyDate}
                </p>
                <p className="text-sm text-gray-600">
                  审核状态：{selectedStar.status === 'approved' ? '已通过' : '待审批'}
                </p>
              </div>

              {selectedStar.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="flex-1">驳回申请</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">批准通过</Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
