'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Star,
  Award,
  Crown,
  Search,
  RefreshCw,
  Loader2,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Filter,
  Download,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { HabitCategory, habitCategoryNames } from '@/types';

// 候选数据类型
interface CandidateData {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  month: string;
  totalScore: number;
  categoriesAchieved: string[];
  goalsCompletionRate: number;
  improvementRate: number;
  assessmentsCount: number;
  praiseCount: number;
  recommendType: 'full_star' | 'category_star' | 'progress_star';
  recommendReason: string;
  recommendScore: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewerName?: string;
  reviewNotes?: string;
  createdAt: string;
}

// 推荐类型配置
const recommendTypes = [
  { value: 'full_star', label: '全习惯之星', icon: Crown, color: 'text-amber-600 bg-amber-50' },
  { value: 'category_star', label: '单项之星', icon: Star, color: 'text-blue-600 bg-blue-50' },
  { value: 'progress_star', label: '进步之星', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
];

// 当前月份
const currentMonth = new Date().toISOString().slice(0, 7);

// 模拟审核人信息
const currentReviewer = {
  id: 'reviewer-001',
  name: '德育处主任',
};

export default function StarCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'full_star' | 'category_star' | 'progress_star'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 审核对话框
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // 获取候选列表
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('month', month);
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        params.append('recommendType', typeFilter);
      }

      const response = await fetch(`/api/habit/star-candidates?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCandidates(result.data);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error('获取候选列表失败:', error);
      toast.error('获取候选列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [month, statusFilter, typeFilter]);

  // 生成推荐
  const handleGenerate = async (force = false) => {
    try {
      setGenerating(true);
      const response = await fetch('/api/habit/star-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, forceRegenerate: force }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchCandidates();
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 筛选
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (!searchTerm) return true;
      return c.studentName.includes(searchTerm) || 
             c.studentNumber.includes(searchTerm) ||
             c.className.includes(searchTerm);
    });
  }, [candidates, searchTerm]);

  // 统计
  const stats = useMemo(() => ({
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    approved: candidates.filter(c => c.status === 'approved').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    fullStar: candidates.filter(c => c.recommendType === 'full_star' && c.status === 'pending').length,
    categoryStar: candidates.filter(c => c.recommendType === 'category_star' && c.status === 'pending').length,
    progressStar: candidates.filter(c => c.recommendType === 'progress_star' && c.status === 'pending').length,
  }), [candidates]);

  // 打开审核对话框
  const handleOpenReview = (candidate: CandidateData) => {
    setSelectedCandidate(candidate);
    setReviewNotes(candidate.reviewNotes || '');
    setShowReviewDialog(true);
  };

  // 审核操作
  const handleReview = async (approve: boolean) => {
    if (!selectedCandidate) return;

    try {
      setReviewing(true);
      const response = await fetch('/api/habit/star-candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCandidate.id,
          status: approve ? 'approved' : 'rejected',
          reviewedBy: currentReviewer.id,
          reviewerName: currentReviewer.name,
          reviewNotes,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(approve ? '已批准' : '已拒绝');
        setShowReviewDialog(false);
        fetchCandidates();
      } else {
        throw new Error(result.error || '审核失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '审核失败');
    } finally {
      setReviewing(false);
    }
  };

  // 批量批准
  const handleBatchApprove = async () => {
    const pendingCandidates = filteredCandidates.filter(c => c.status === 'pending');
    if (pendingCandidates.length === 0) {
      toast.info('没有待审核的候选');
      return;
    }

    try {
      setReviewing(true);
      let successCount = 0;
      
      for (const candidate of pendingCandidates) {
        const response = await fetch('/api/habit/star-candidates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: candidate.id,
            status: 'approved',
            reviewedBy: currentReviewer.id,
            reviewerName: currentReviewer.name,
          }),
        });
        if ((await response.json()).success) {
          successCount++;
        }
      }

      toast.success(`已批量批准 ${successCount} 名候选`);
      fetchCandidates();
    } catch (error) {
      toast.error('批量批准失败');
    } finally {
      setReviewing(false);
    }
  };

  // 获取推荐类型信息
  const getTypeInfo = (type: string) => {
    return recommendTypes.find(t => t.value === type) || recommendTypes[1];
  };

  // 格式化月份
  const formatMonth = (m: string) => {
    const [year, month] = m.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">习惯之星评选</h1>
              <p className="text-gray-500">自动推荐 · 人工审核</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleGenerate(false)} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            生成推荐
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchCandidates()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总候选</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 rounded-xl bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-2 rounded-xl bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="p-2 rounded-xl bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100">全习惯之星</p>
                <p className="text-2xl font-bold">{stats.fullStar}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/20">
                <Crown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名、学号或班级..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[160px]"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'approved' | 'rejected')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'full_star' | 'category_star' | 'progress_star')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="full_star">全习惯之星</SelectItem>
                <SelectItem value="category_star">单项之星</SelectItem>
                <SelectItem value="progress_star">进步之星</SelectItem>
              </SelectContent>
            </Select>
            {stats.pending > 0 && statusFilter === 'pending' && (
              <Button onClick={handleBatchApprove} disabled={reviewing} className="bg-green-600 hover:bg-green-700">
                批量批准 ({stats.pending})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 候选列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">候选名单</CardTitle>
          <CardDescription>{formatMonth(month)} · 习惯之星推荐候选</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无候选数据</p>
              <Button variant="link" className="mt-2" onClick={() => handleGenerate(false)}>
                点击生成推荐
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>推荐类型</TableHead>
                  <TableHead>推荐得分</TableHead>
                  <TableHead>推荐理由</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => {
                  const typeInfo = getTypeInfo(candidate.recommendType);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{candidate.studentName}</div>
                            <div className="text-xs text-muted-foreground">
                              {candidate.className}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${typeInfo.color}`}>
                          <Icon className="h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={candidate.recommendScore} className="w-16 h-2" />
                          <span className="text-sm font-medium">{candidate.recommendScore.toFixed(0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm" title={candidate.recommendReason}>
                          {candidate.recommendReason}
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.status === 'pending' ? (
                          <Badge className="bg-amber-600">待审核</Badge>
                        ) : candidate.status === 'approved' ? (
                          <Badge className="bg-green-600">已批准</Badge>
                        ) : (
                          <Badge className="bg-red-600">已拒绝</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleOpenReview(candidate)}>
                          {candidate.status === 'pending' ? '审核' : '查看'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 审核对话框 */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              {selectedCandidate?.status === 'pending' ? '审核候选' : '查看详情'}
            </DialogTitle>
            <DialogDescription>
              {selectedCandidate?.studentName} · {selectedCandidate?.className}
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4">
              {/* 推荐信息 */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getTypeInfo(selectedCandidate.recommendType).color}>
                      {getTypeInfo(selectedCandidate.recommendType).label}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedCandidate.recommendScore} className="w-20 h-2" />
                      <span className="font-bold">{selectedCandidate.recommendScore.toFixed(0)}分</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.recommendReason}</p>
                </CardContent>
              </Card>

              {/* 详细数据 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold">{selectedCandidate.totalScore}</p>
                  <p className="text-xs text-muted-foreground">总得分</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold">{selectedCandidate.praiseCount}</p>
                  <p className="text-xs text-muted-foreground">表扬次数</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold">{selectedCandidate.goalsCompletionRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">目标完成率</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold text-green-600">
                    +{selectedCandidate.improvementRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">进步比例</p>
                </div>
              </div>

              {/* 达成的类别 */}
              {selectedCandidate.categoriesAchieved && selectedCandidate.categoriesAchieved.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">达成的习惯类别</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.categoriesAchieved.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {habitCategoryNames[cat as HabitCategory] || cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 审核信息 */}
              {selectedCandidate.status !== 'pending' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">审核信息</p>
                  <p className="text-sm">
                    审核人：{selectedCandidate.reviewerName}
                  </p>
                  {selectedCandidate.reviewNotes && (
                    <p className="text-sm p-2 rounded bg-muted/50">{selectedCandidate.reviewNotes}</p>
                  )}
                </div>
              )}

              {/* 审核备注 */}
              {selectedCandidate.status === 'pending' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">审核备注（可选）</p>
                  <Textarea
                    placeholder="输入审核意见..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedCandidate?.status === 'pending' ? (
              <>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  取消
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleReview(false)} 
                  disabled={reviewing}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  拒绝
                </Button>
                <Button 
                  onClick={() => handleReview(true)} 
                  disabled={reviewing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {reviewing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  批准
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
