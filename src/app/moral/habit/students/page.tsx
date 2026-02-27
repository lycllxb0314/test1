'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Users,
  Award,
  AlertTriangle,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  UserCheck,
  Calendar,
  Target,
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

// 模拟学生数据
const studentsData = [
  { id: 's001', name: '李小明', class: '四(1)班', grade: '四年级', avgRate: 95.2, stars: 3, trend: 'up', habits: { civilization: 98, writing: 88, reading: 100, sports: 92, safety: 95, hygiene: 96, aesthetic: 90, labor: 98 }, status: 'star' },
  { id: 's002', name: '张小红', class: '三(2)班', grade: '三年级', avgRate: 92.1, stars: 2, trend: 'up', habits: { civilization: 95, writing: 85, reading: 98, sports: 88, safety: 92, hygiene: 94, aesthetic: 88, labor: 95 }, status: 'excellent' },
  { id: 's003', name: '王小刚', class: '五(3)班', grade: '五年级', avgRate: 88.5, stars: 1, trend: 'stable', habits: { civilization: 90, writing: 82, reading: 92, sports: 85, safety: 90, hygiene: 88, aesthetic: 85, labor: 92 }, status: 'good' },
  { id: 's004', name: '赵小芳', class: '四(4)班', grade: '四年级', avgRate: 85.3, stars: 0, trend: 'up', habits: { civilization: 92, writing: 78, reading: 88, sports: 82, safety: 88, hygiene: 86, aesthetic: 80, labor: 88 }, status: 'good' },
  { id: 's005', name: '陈小华', class: '二(1)班', grade: '二年级', avgRate: 72.8, stars: 0, trend: 'down', habits: { civilization: 85, writing: 65, reading: 78, sports: 70, safety: 82, hygiene: 75, aesthetic: 68, labor: 78 }, status: 'attention' },
  { id: 's006', name: '刘小伟', class: '六(2)班', grade: '六年级', avgRate: 68.5, stars: 0, trend: 'down', habits: { civilization: 78, writing: 62, reading: 72, sports: 65, safety: 75, hygiene: 68, aesthetic: 60, labor: 70 }, status: 'attention' },
  { id: 's007', name: '孙小丽', class: '一(3)班', grade: '一年级', avgRate: 78.2, stars: 0, trend: 'stable', habits: { civilization: 82, writing: 70, reading: 85, sports: 75, safety: 88, hygiene: 80, aesthetic: 72, labor: 78 }, status: 'normal' },
  { id: 's008', name: '周小龙', class: '五(1)班', grade: '五年级', avgRate: 82.6, stars: 1, trend: 'up', habits: { civilization: 88, writing: 75, reading: 90, sports: 80, safety: 85, hygiene: 82, aesthetic: 78, labor: 85 }, status: 'good' },
];

// 分页状态
const pageSize = 10;

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<typeof studentsData[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤学生
  const filteredStudents = studentsData.filter(student => {
    if (searchQuery && !student.name.includes(searchQuery) && !student.class.includes(searchQuery)) {
      return false;
    }
    if (selectedGrade !== 'all' && student.grade !== selectedGrade) {
      return false;
    }
    if (selectedStatus !== 'all' && student.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'star':
        return <Badge className="bg-amber-100 text-amber-700">习惯之星</Badge>;
      case 'excellent':
        return <Badge className="bg-green-100 text-green-700">优秀</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-700">良好</Badge>;
      case 'normal':
        return <Badge className="bg-gray-100 text-gray-700">一般</Badge>;
      case 'attention':
        return <Badge className="bg-orange-100 text-orange-700">需关注</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 min-h-screen">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">学生档案</h1>
            <p className="text-gray-500 mt-0.5">学生习惯养成成长档案，查看个人习惯发展轨迹</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 筛选区域 */}
      <Card className="border-0 shadow-md">
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="star">习惯之星</SelectItem>
                <SelectItem value="excellent">优秀</SelectItem>
                <SelectItem value="good">良好</SelectItem>
                <SelectItem value="normal">一般</SelectItem>
                <SelectItem value="attention">需关注</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto text-sm text-gray-500">
              <span>共 {filteredStudents.length} 名学生</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle>学生习惯档案列表</CardTitle>
          <CardDescription>点击查看学生详细的习惯养成情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100"
                onClick={() => setSelectedStudent(student)}
              >
                {/* 头像 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  student.status === 'star' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                  student.status === 'attention' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                  'bg-gradient-to-br from-blue-400 to-indigo-500'
                }`}>
                  {student.name.charAt(0)}
                </div>

                {/* 基本信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{student.name}</span>
                    {getStatusBadge(student.status)}
                    {student.stars > 0 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: student.stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>{student.class}</span>
                    <span>·</span>
                    <span>达成率 {student.avgRate}%</span>
                  </div>
                </div>

                {/* 达成率进度条 */}
                <div className="w-48">
                  <div className="flex items-center gap-2">
                    <Progress value={student.avgRate} className="flex-1 h-2" />
                    <span className={`text-sm font-bold w-12 text-right ${
                      student.avgRate >= 90 ? 'text-green-600' :
                      student.avgRate >= 80 ? 'text-blue-600' :
                      student.avgRate >= 70 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {student.avgRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    {student.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {student.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {student.trend === 'stable' && <Minus className="h-3 w-3 text-gray-400" />}
                    <span className="text-xs text-gray-400">
                      {student.trend === 'up' ? '进步中' : student.trend === 'down' ? '需关注' : '稳定'}
                    </span>
                  </div>
                </div>

                {/* 查看详情按钮 */}
                <Button variant="ghost" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  详情
                </Button>
              </div>
            ))}
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredStudents.length)} / 共 {filteredStudents.length} 条
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage * pageSize >= filteredStudents.length}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生详情弹窗 */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                selectedStudent?.status === 'star' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                'bg-gradient-to-br from-blue-400 to-indigo-500'
              }`}>
                {selectedStudent?.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {selectedStudent?.name}
                  {selectedStudent && getStatusBadge(selectedStudent.status)}
                </div>
                <p className="text-sm font-normal text-gray-500">{selectedStudent?.class} · {selectedStudent?.grade}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              学生习惯养成详情
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* 总体达成情况 */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{selectedStudent.avgRate}%</div>
                    <div className="text-green-100 text-sm">总体达成率</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-amber-500 flex items-center justify-center gap-1">
                      {selectedStudent.stars}
                      <Star className="h-6 w-6 fill-amber-500" />
                    </div>
                    <div className="text-gray-500 text-sm">习惯之星</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {selectedStudent.trend === 'up' && <TrendingUp className="h-8 w-8 text-green-500" />}
                      {selectedStudent.trend === 'down' && <TrendingDown className="h-8 w-8 text-red-500" />}
                      {selectedStudent.trend === 'stable' && <Minus className="h-8 w-8 text-gray-400" />}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {selectedStudent.trend === 'up' ? '进步中' : selectedStudent.trend === 'down' ? '需关注' : '稳定'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 八大习惯详情 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">八大习惯达成情况</h4>
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(selectedStudent.habits) as HabitCategory[]).map((category) => {
                    const Icon = habitIcons[category];
                    const rate = selectedStudent.habits[category];
                    return (
                      <div
                        key={category}
                        className={`p-3 rounded-xl border-2 text-center ${
                          rate >= 90 ? 'border-green-200 bg-green-50' :
                          rate >= 80 ? 'border-blue-200 bg-blue-50' :
                          rate >= 70 ? 'border-orange-200 bg-orange-50' :
                          'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${habitCategoryColors[category]} mb-2 w-fit mx-auto`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{habitCategoryNames[category]}</div>
                        <div className={`text-lg font-bold ${
                          rate >= 90 ? 'text-green-600' :
                          rate >= 80 ? 'text-blue-600' :
                          rate >= 70 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {rate}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 成长轨迹 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">近期成长轨迹</h4>
                <div className="space-y-2">
                  {[
                    { date: '3月15日', action: '获得"阅读之星"称号', type: 'award' },
                    { date: '3月10日', action: '文明习惯评价提升至98%', type: 'improve' },
                    { date: '3月5日', action: '完成小目标：每天阅读30分钟', type: 'goal' },
                    { date: '2月28日', action: '书写习惯评价：85%', type: 'record' },
                  ].map((record, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        record.type === 'award' ? 'bg-amber-100' :
                        record.type === 'improve' ? 'bg-green-100' :
                        record.type === 'goal' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {record.type === 'award' && <Award className="h-4 w-4 text-amber-600" />}
                        {record.type === 'improve' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {record.type === 'goal' && <Target className="h-4 w-4 text-blue-600" />}
                        {record.type === 'record' && <Calendar className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm">{record.action}</span>
                      </div>
                      <span className="text-xs text-gray-400">{record.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
