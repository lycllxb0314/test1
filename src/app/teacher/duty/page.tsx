'use client';

/**
 * 值日老师评分页面
 * 
 * 功能：
 * - 对负责年级的班级进行评分
 * - 支持多个评分维度
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  Calendar,
  Star,
  Loader2,
  ChevronLeft,
  Check,
  Save,
  Clock,
  Users,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ==================== 类型定义 ====================

type ScoreCategory = '文明礼仪' | '遵守纪律' | '班容班貌' | '环境卫生' | '文体活动' | '学习习惯';

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
}

interface ScoreItem {
  category: ScoreCategory;
  score: number;
  maxScore: number;
  remark: string;
}

interface ScoreRecord {
  id: string;
  classId: string;
  className: string;
  grade: number;
  date: string;
  category: ScoreCategory;
  score: number;
  maxScore: number;
  teacherId: string;
  teacherName: string;
  remark?: string;
}

// ==================== 配置 ====================

const SCORE_CATEGORIES: ScoreCategory[] = ['文明礼仪', '遵守纪律', '班容班貌', '环境卫生', '文体活动', '学习习惯'];
const MAX_SCORE = 10;

const CATEGORY_CONFIG: Record<ScoreCategory, { icon: string; color: string; description: string }> = {
  '文明礼仪': { icon: '🙏', color: 'text-rose-500', description: '礼貌用语、仪容仪表、尊师重道' },
  '遵守纪律': { icon: '📋', color: 'text-orange-500', description: '课堂纪律、课间秩序、集会纪律' },
  '班容班貌': { icon: '🎨', color: 'text-amber-500', description: '教室布置、黑板报、班级文化' },
  '环境卫生': { icon: '🧹', color: 'text-green-500', description: '教室卫生、包干区、垃圾分类' },
  '文体活动': { icon: '⚽', color: 'text-blue-500', description: '课间操、眼保健操、体育活动' },
  '学习习惯': { icon: '📚', color: 'text-purple-500', description: '早读、课堂表现、作业完成' },
};

// ==================== 主组件 ====================

export default function DutyWorkPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // === 数据状态 ===
  const [dutyInfo, setDutyInfo] = useState<{ grade: number } | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [myRecords, setMyRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('score');
  
  // === 评分状态 ===
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split('T')[0]);
  const [scores, setScores] = useState<ScoreItem[]>(SCORE_CATEGORIES.map(cat => ({
    category: cat,
    score: MAX_SCORE,
    maxScore: MAX_SCORE,
    remark: '',
  })));
  
  // === 对话框状态 ===
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);

  // ==================== 数据加载 ====================

  // 检查是否为值日老师并获取负责年级
  const checkDutyStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/duty-teachers?teacherId=${user.id}&active=true`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success && result.data?.length > 0) {
        // 获取第一个有效的值日安排
        const duty = result.data[0];
        setDutyInfo({ grade: duty.grade });
        
        // 加载该年级的班级
        await loadClasses(duty.grade);
      } else {
        setDutyInfo(null);
      }
    } catch (err) {
      console.error('检查值日状态失败:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 加载班级
  const loadClasses = async (grade: number) => {
    try {
      const res = await fetch(`/api/classes?grade=${grade}&pageSize=50`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (err) {
      console.error('加载班级失败:', err);
    }
  };

  // 加载我的评分记录
  const loadMyRecords = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/routine-scores?startDate=${today}&endDate=${today}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        // 筛选我的记录
        const myRecords = (result.data || []).filter((r: ScoreRecord) => r.teacherId === user.id);
        setMyRecords(myRecords);
      }
    } catch (err) {
      console.error('加载评分记录失败:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    checkDutyStatus();
  }, [checkDutyStatus]);

  useEffect(() => {
    if (dutyInfo) {
      loadMyRecords();
    }
  }, [dutyInfo, loadMyRecords]);

  // ==================== 操作处理 ====================

  // 打开评分对话框
  const handleOpenScore = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setScoreDate(new Date().toISOString().split('T')[0]);
    setScores(SCORE_CATEGORIES.map(cat => ({
      category: cat,
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      remark: '',
    })));
    setScoreDialogOpen(true);
  };

  // 更新评分
  const handleScoreChange = (category: ScoreCategory, score: number) => {
    setScores(prev => prev.map(s => 
      s.category === category ? { ...s, score } : s
    ));
  };

  // 更新备注
  const handleRemarkChange = (category: ScoreCategory, remark: string) => {
    setScores(prev => prev.map(s => 
      s.category === category ? { ...s, remark } : s
    ));
  };

  // 提交评分
  const handleSubmitScores = async () => {
    if (!selectedClass) return;
    
    setSubmitting(true);
    try {
      // 批量提交所有维度的评分
      const promises = scores.map(s => 
        fetch('/api/routine-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            classId: selectedClass.id,
            className: selectedClass.name,
            grade: selectedClass.grade,
            date: scoreDate,
            category: s.category,
            score: s.score,
            maxScore: s.maxScore,
            remark: s.remark,
          }),
        })
      );
      
      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length === 0) {
        toast.success('评分提交成功');
        setScoreDialogOpen(false);
        loadMyRecords();
      } else {
        toast.error(`${failed.length}项评分提交失败`);
      }
    } catch (err) {
      console.error('提交评分失败:', err);
      toast.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取班级今日评分状态
  const getClassScoreStatus = (classId: string) => {
    const todayRecords = myRecords.filter(r => r.classId === classId);
    const scoredCategories = new Set(todayRecords.map(r => r.category));
    return {
      scored: scoredCategories.size,
      total: SCORE_CATEGORIES.length,
      isComplete: scoredCategories.size === SCORE_CATEGORIES.length,
    };
  };

  // ==================== 渲染 ====================

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 非值日老师
  if (!dutyInfo) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teacher')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">值日工作</h1>
            <p className="text-gray-500">班级常规评分</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">您暂未被安排为值日老师</p>
            <p className="text-sm text-muted-foreground mt-2">请联系德育处进行安排</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teacher')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">值日工作</h1>
            <p className="text-gray-500 mt-1">
              负责年级：{dutyInfo.grade === 0 ? '全校' : `${dutyInfo.grade}年级`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}</span>
        </div>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="score" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            班级评分
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="h-4 w-4" />
            评分记录
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 班级评分 */}
        <TabsContent value="score" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">选择班级进行评分</CardTitle>
              <CardDescription>
                点击班级卡片开始评分，今日已完成的班级会显示勾选标记
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => {
                  const status = getClassScoreStatus(cls.id);
                  return (
                    <Card 
                      key={cls.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        status.isComplete ? 'border-green-300 bg-green-50/50' : 'border-border'
                      }`}
                      onClick={() => handleOpenScore(cls)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              status.isComplete ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                            }`}>
                              {status.isComplete ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Users className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{cls.name}</p>
                              <p className="text-xs text-gray-500">
                                {status.isComplete ? '已完成' : `${status.scored}/${status.total}项`}
                              </p>
                            </div>
                          </div>
                          {!status.isComplete && status.scored > 0 && (
                            <Badge variant="secondary">{status.scored}/{status.total}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 评分记录 */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">今日评分记录</CardTitle>
              <CardDescription>查看今天已提交的评分</CardDescription>
            </CardHeader>
            <CardContent>
              {myRecords.length > 0 ? (
                <div className="space-y-3">
                  {myRecords.map((record) => (
                    <div 
                      key={record.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{record.className}</span>
                          <Badge variant="outline">{record.category}</Badge>
                        </div>
                        {record.remark && (
                          <p className="text-sm text-gray-500 mt-1">{record.remark}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{record.score}/{record.maxScore}</p>
                        <p className="text-xs text-gray-500">{record.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无评分记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 评分对话框 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              {selectedClass?.name} - 班级评分
            </DialogTitle>
            <DialogDescription>
              请对各维度进行评分（满分{MAX_SCORE}分）
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 日期选择 */}
            <div className="flex items-center gap-4">
              <Label className="w-16">日期</Label>
              <Input
                type="date"
                value={scoreDate}
                onChange={(e) => setScoreDate(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {/* 各维度评分 */}
            {scores.map((s) => (
              <div key={s.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_CONFIG[s.category].icon}</span>
                    <Label className={CATEGORY_CONFIG[s.category].color}>{s.category}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={MAX_SCORE}
                      value={s.score}
                      onChange={(e) => handleScoreChange(s.category, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-gray-500">/ {MAX_SCORE}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{CATEGORY_CONFIG[s.category].description}</p>
                <Input
                  placeholder="备注（选填）"
                  value={s.remark}
                  onChange={(e) => handleRemarkChange(s.category, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
            
            {/* 总分预览 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-medium">总分</span>
              <span className="text-xl font-bold text-primary">
                {scores.reduce((sum, s) => sum + s.score, 0)} / {MAX_SCORE * scores.length}
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmitScores} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              提交评分
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
