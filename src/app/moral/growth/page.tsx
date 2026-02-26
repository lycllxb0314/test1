'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Search,
  Download,
  Award,
  Calendar,
  FileText,
  TrendingUp,
} from 'lucide-react';

// 模拟成长档案数据
const mockGrowth = [
  { id: 1, studentId: '2024001', name: '张小明', class: '三年级1班', semester: '2024春季', awards: 3, activities: 8, moralScore: 91.5, academicScore: 88, growthPoint: '+5.2' },
  { id: 2, studentId: '2024002', name: '李小红', class: '三年级1班', semester: '2024春季', awards: 2, activities: 10, moralScore: 91.3, academicScore: 90, growthPoint: '+3.8' },
  { id: 3, studentId: '2024003', name: '王小刚', class: '三年级1班', semester: '2024春季', awards: 1, activities: 5, moralScore: 83.8, academicScore: 82, growthPoint: '+2.1' },
  { id: 4, studentId: '2024004', name: '赵小芳', class: '三年级1班', semester: '2024春季', awards: 2, activities: 6, moralScore: 86.3, academicScore: 85, growthPoint: '+4.5' },
  { id: 5, studentId: '2024005', name: '刘小华', class: '三年级1班', semester: '2024春季', awards: 0, activities: 4, moralScore: 79.5, academicScore: 78, growthPoint: '+1.2' },
];

export default function GrowthPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  const filteredGrowth = mockGrowth.filter(g => {
    const matchesSearch = g.name.includes(searchTerm) || g.studentId.includes(searchTerm);
    const matchesGrade = gradeFilter === 'all' || g.class.includes(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成长档案</h1>
          <p className="text-gray-500 mt-1">学生成长轨迹记录与展示</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出档案
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">档案总数</p>
                <p className="text-2xl font-bold text-green-600">2,800</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本学期获奖</p>
                <p className="text-2xl font-bold text-orange-600">156</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活动记录</p>
                <p className="text-2xl font-bold text-blue-600">1,850</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">平均成长</p>
                <p className="text-2xl font-bold text-purple-600">+3.8%</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="年级筛选" />
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

      {/* 成长档案卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGrowth.map((item) => (
          <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.class}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">{item.growthPoint}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">获奖次数</p>
                  <p className="font-bold text-orange-600">{item.awards}次</p>
                </div>
                <div>
                  <p className="text-gray-500">活动参与</p>
                  <p className="font-bold text-blue-600">{item.activities}次</p>
                </div>
                <div>
                  <p className="text-gray-500">德育评分</p>
                  <p className="font-bold text-green-600">{item.moralScore}</p>
                </div>
                <div>
                  <p className="text-gray-500">学业成绩</p>
                  <p className="font-bold text-purple-600">{item.academicScore}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <FileText className="h-3 w-3 mr-1" />
                查看详情
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
