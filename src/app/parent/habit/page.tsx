'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Star,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
} from 'lucide-react';

// 习惯类别配置
const habitCategories = [
  { key: 'civilization', name: '文明习惯', icon: Heart, color: 'text-red-600 bg-red-50' },
  { key: 'writing', name: '书写习惯', icon: Pen, color: 'text-blue-600 bg-blue-50' },
  { key: 'reading', name: '阅读习惯', icon: BookOpen, color: 'text-green-600 bg-green-50' },
  { key: 'sports', name: '运动习惯', icon: Trophy, color: 'text-orange-600 bg-orange-50' },
  { key: 'safety', name: '安全习惯', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  { key: 'hygiene', name: '卫生习惯', icon: Sparkles, color: 'text-teal-600 bg-teal-50' },
  { key: 'aesthetic', name: '审美习惯', icon: Palette, color: 'text-pink-600 bg-pink-50' },
  { key: 'labor', name: '劳动习惯', icon: Hammer, color: 'text-amber-600 bg-amber-50' },
];

// 模拟习惯记录
const mockRecords = [
  { id: '1', date: '2024-03-15', category: 'reading', content: '今日阅读《西游记》30分钟', score: 5, recordedBy: '家长' },
  { id: '2', date: '2024-03-15', category: 'sports', content: '参加跳绳训练，跳了200个', score: 4, recordedBy: '家长' },
  { id: '3', date: '2024-03-14', category: 'writing', content: '作业书写工整，获得老师表扬', score: 5, recordedBy: '家长' },
  { id: '4', date: '2024-03-14', category: 'hygiene', content: '主动整理房间，打扫卫生', score: 4, recordedBy: '家长' },
  { id: '5', date: '2024-03-13', category: 'civilization', content: '主动问好，帮助同学', score: 5, recordedBy: '老师' },
];

export default function ParentHabitPage() {
  const [addDialog, setAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [habitContent, setHabitContent] = useState('');
  const [habitScore, setHabitScore] = useState(5);
  const [records, setRecords] = useState(mockRecords);

  // 添加习惯记录
  const handleAddHabit = () => {
    if (!selectedCategory || !habitContent) {
      toast.error('请填写完整信息');
      return;
    }

    const category = habitCategories.find(c => c.key === selectedCategory);
    const newRecord = {
      id: String(records.length + 1),
      date: new Date().toISOString().split('T')[0],
      category: selectedCategory,
      content: habitContent,
      score: habitScore,
      recordedBy: '家长',
    };

    setRecords([newRecord, ...records]);
    toast.success(`${category?.name}记录已添加`);
    setAddDialog(false);
    setSelectedCategory('');
    setHabitContent('');
    setHabitScore(5);
  };

  // 获取类别信息
  const getCategoryInfo = (key: string) => {
    return habitCategories.find(c => c.key === key) || habitCategories[0];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">习惯养成</h1>
          <p className="text-muted-foreground mt-1">记录和跟踪孩子的八大习惯养成情况</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加记录
        </Button>
      </div>

      {/* 八大习惯概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {habitCategories.map((category) => {
          const Icon = category.icon;
          const count = records.filter(r => r.category === category.key).length;
          return (
            <Card key={category.key} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 text-center">
                <div className={`w-10 h-10 rounded-lg ${category.color} mx-auto flex items-center justify-center mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{count}条记录</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 统计和记录 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 本月统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              本月统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">总记录数</span>
                <span className="text-2xl font-bold">{records.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">平均评分</span>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="text-xl font-bold">
                    {(records.reduce((sum, r) => sum + r.score, 0) / records.length).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">最佳习惯</span>
                <Badge className="bg-green-100 text-green-700">阅读习惯</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 习惯之星 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              习惯之星
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🏆</div>
              <p className="font-medium text-lg">本月暂未获评</p>
              <p className="text-sm text-muted-foreground mt-1">继续努力，争取成为习惯之星！</p>
            </div>
          </CardContent>
        </Card>

        {/* 添加记录入口 */}
        <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
          <CardHeader>
            <CardTitle className="text-lg">快速记录</CardTitle>
            <CardDescription>记录孩子今日的习惯表现</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => setAddDialog(true)}>
              <Plus className="h-5 w-5 mr-2" />
              添加习惯记录
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              家长记录将纳入孩子习惯档案
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 习惯记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">习惯记录</CardTitle>
          <CardDescription>最近的习惯养成记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              {habitCategories.slice(0, 4).map(c => (
                <TabsTrigger key={c.key} value={c.key}>{c.name}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-3">
                {records.map((record) => {
                  const category = getCategoryInfo(record.category);
                  const Icon = category.icon;
                  return (
                    <div key={record.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{category.name}</Badge>
                          <span className="text-xs text-muted-foreground">{record.recordedBy}记录</span>
                        </div>
                        <p className="text-sm">{record.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{record.date}</span>
                          <span className="text-amber-500 text-sm">{'⭐'.repeat(record.score)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {habitCategories.map(cat => (
              <TabsContent key={cat.key} value={cat.key} className="mt-4">
                <div className="space-y-3">
                  {records.filter(r => r.category === cat.key).map((record) => {
                    const category = getCategoryInfo(record.category);
                    const Icon = category.icon;
                    return (
                      <div key={record.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{record.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">{record.date}</span>
                            <span className="text-amber-500 text-sm">{'⭐'.repeat(record.score)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 添加记录对话框 */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加习惯记录</DialogTitle>
            <DialogDescription>
              记录孩子今日的习惯养成情况
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>习惯类别 *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择习惯类别" />
                </SelectTrigger>
                <SelectContent>
                  {habitCategories.map(c => (
                    <SelectItem key={c.key} value={c.key}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>具体表现 *</Label>
              <Textarea
                value={habitContent}
                onChange={(e) => setHabitContent(e.target.value)}
                placeholder="描述孩子的具体表现..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>评分</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => setHabitScore(score)}
                    className={`text-2xl ${score <= habitScore ? 'text-amber-500' : 'text-gray-300'}`}
                  >
                    ⭐
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{habitScore}星</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>取消</Button>
            <Button onClick={handleAddHabit}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
