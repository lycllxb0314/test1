'use client';

/**
 * 德育处活动管理页面
 * 
 * 功能：
 * - 发布德育活动
 * - 选择目标年级和角色
 * - 配置是否需要收集信息
 * - 查看和管理提交
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Users,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  Image,
  File,
  Video,
  MessageSquare,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 活动类型
interface Activity {
  id: string;
  title: string;
  content: string;
  targetGrades: number[];
  targetGradeNames: string[];
  targetRoles: string[];
  requireSubmission: boolean;
  submissionConfig: {
    requireText?: boolean;
    requireAttachment?: boolean;
    allowedTypes?: string[];
    maxFiles?: number;
  };
  deadline: string | null;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  statistics?: {
    submissions: number;
    pending: number;
    submitted: number;
  };
}

// 提交类型
interface Submission {
  id: string;
  activityId: string;
  classId: string;
  className: string;
  grade: number;
  submitterId: string;
  submitterName: string;
  submitterRole: string;
  textContent: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
  status: 'pending' | 'submitted' | 'reviewed' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  createdAt: string;
}

// 年级选项
const GRADE_OPTIONS = [
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
];

// 角色选项
const ROLE_OPTIONS = [
  { value: 'head_teacher', label: '班主任' },
  { value: 'grade_leader', label: '年段长' },
];

// 状态标签
const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700', icon: FileText },
  published: { label: '已发布', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  archived: { label: '已归档', color: 'bg-amber-100 text-amber-700', icon: Archive },
};

// 提交状态标签
const SUBMISSION_STATUS_CONFIG = {
  pending: { label: '待提交', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: '待审核', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
};

export default function ActivityManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('activities');
  
  // 活动列表
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 提交列表
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  
  // 对话框状态
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'rejected'>('reviewed');
  const [reviewComment, setReviewComment] = useState('');
  
  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTargetGrades, setFormTargetGrades] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [formTargetRoles, setFormTargetRoles] = useState<string[]>(['head_teacher', 'grade_leader']);
  const [formRequireSubmission, setFormRequireSubmission] = useState(false);
  const [formRequireText, setFormRequireText] = useState(true);
  const [formRequireAttachment, setFormRequireAttachment] = useState(true);
  const [formDeadline, setFormDeadline] = useState('');
  const [formPublishNow, setFormPublishNow] = useState(false);
  
  // 加载活动列表
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/moral/activities?${params}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };
  
  // 加载提交列表
  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedActivityId) {
        params.set('activityId', selectedActivityId);
      }
      const res = await fetch(`/api/moral/activities/submissions?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('获取提交列表失败:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchActivities();
  }, [statusFilter]);
  
  useEffect(() => {
    fetchSubmissions();
  }, [selectedActivityId]);
  
  // 打开创建/编辑对话框
  const handleOpenActivityDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormTitle(activity.title);
      setFormContent(activity.content);
      setFormTargetGrades(activity.targetGrades);
      setFormTargetRoles(activity.targetRoles);
      setFormRequireSubmission(activity.requireSubmission);
      setFormRequireText(activity.submissionConfig?.requireText ?? true);
      setFormRequireAttachment(activity.submissionConfig?.requireAttachment ?? true);
      setFormDeadline(activity.deadline ? activity.deadline.slice(0, 16) : '');
      setFormPublishNow(activity.status === 'published');
    } else {
      setEditingActivity(null);
      setFormTitle('');
      setFormContent('');
      setFormTargetGrades([1, 2, 3, 4, 5, 6]);
      setFormTargetRoles(['head_teacher', 'grade_leader']);
      setFormRequireSubmission(false);
      setFormRequireText(true);
      setFormRequireAttachment(true);
      setFormDeadline('');
      setFormPublishNow(false);
    }
    setActivityDialogOpen(true);
  };
  
  // 保存活动
  const handleSaveActivity = async () => {
    if (!formTitle || !formContent) {
      alert('请填写标题和内容');
      return;
    }
    
    try {
      const url = editingActivity
        ? `/api/moral/activities/${editingActivity.id}`
        : '/api/moral/activities';
      
      const body = {
        title: formTitle,
        content: formContent,
        targetGrades: formTargetGrades,
        targetRoles: formTargetRoles,
        requireSubmission: formRequireSubmission,
        submissionConfig: {
          requireText: formRequireText,
          requireAttachment: formRequireAttachment,
          allowedTypes: ['image', 'document', 'video'],
          maxFiles: 10,
        },
        deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
        status: formPublishNow ? 'published' : 'draft',
      };
      
      const res = await fetch(url, {
        method: editingActivity ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchActivities();
        setActivityDialogOpen(false);
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存活动失败:', error);
      alert('保存失败');
    }
  };
  
  // 发布活动
  const handlePublishActivity = async (id: string) => {
    if (!confirm('确定要发布此活动吗？发布后将通知相关人员。')) return;
    
    try {
      const res = await fetch(`/api/moral/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchActivities();
      } else {
        alert(data.error || '发布失败');
      }
    } catch (error) {
      console.error('发布活动失败:', error);
      alert('发布失败');
    }
  };
  
  // 删除活动
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('确定要删除此活动吗？')) return;
    
    try {
      const res = await fetch(`/api/moral/activities/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        fetchActivities();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除活动失败:', error);
      alert('删除失败');
    }
  };
  
  // 审核提交
  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      const res = await fetch(`/api/moral/activities/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          reviewComment,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchSubmissions();
        setReviewDialogOpen(false);
        setSelectedSubmission(null);
        setReviewComment('');
      } else {
        alert(data.error || '审核失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('审核失败');
    }
  };
  
  // 切换年级选择
  const toggleGrade = (grade: number) => {
    if (formTargetGrades.includes(grade)) {
      setFormTargetGrades(formTargetGrades.filter(g => g !== grade));
    } else {
      setFormTargetGrades([...formTargetGrades, grade]);
    }
  };
  
  // 切换角色选择
  const toggleRole = (role: string) => {
    if (formTargetRoles.includes(role)) {
      setFormTargetRoles(formTargetRoles.filter(r => r !== role));
    } else {
      setFormTargetRoles([...formTargetRoles, role]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50">
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <Calendar className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                德育活动管理
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              发布德育活动 · 收集材料 · 审核管理
            </p>
          </div>
        </div>
        
        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 p-1 rounded-xl">
            <TabsTrigger value="activities" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Calendar className="h-4 w-4" />
              活动管理
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4" />
              提交审核
            </TabsTrigger>
          </TabsList>
          
          {/* 活动管理 */}
          <TabsContent value="activities" className="space-y-4 mt-4">
            {/* 筛选和操作 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Label className="text-gray-600">状态</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-white/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => handleOpenActivityDialog()}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                发布活动
              </Button>
            </div>
            
            {/* 活动列表 */}
            {activitiesLoading ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center text-gray-500">
                  加载中...
                </CardContent>
              </Card>
            ) : activities.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无活动数据</p>
                  <p className="text-sm text-gray-400 mt-1">点击"发布活动"创建新活动</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activities.map(activity => {
                  const statusConfig = STATUS_CONFIG[activity.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Card key={activity.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{activity.title}</h3>
                              <Badge className={cn('font-medium', statusConfig.color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {activity.requireSubmission && (
                                <Badge variant="outline" className="text-blue-600 border-blue-200">
                                  <Upload className="h-3 w-3 mr-1" />
                                  需提交材料
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {activity.content}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>{activity.targetGradeNames.join('、')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                              </div>
                              {activity.deadline && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                  <span>截止：{new Date(activity.deadline).toLocaleDateString()}</span>
                                </div>
                              )}
                              {activity.statistics && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>提交：{activity.statistics.submitted}/{activity.statistics.submissions}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {activity.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handlePublishActivity(activity.id)}
                              >
                                <Send className="h-3.5 w-3.5 mr-1" />
                                发布
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenActivityDialog(activity)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {activity.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteActivity(activity.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* 提交审核 */}
          <TabsContent value="submissions" className="space-y-4 mt-4">
            {/* 筛选 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-600">活动</Label>
                    <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                      <SelectTrigger className="w-64 bg-white border-gray-200">
                        <SelectValue placeholder="全部活动" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">全部活动</SelectItem>
                        {activities.filter(a => a.status === 'published').map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchSubmissions()}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    刷新
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* 提交列表 */}
            {submissionsLoading ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center text-gray-500">
                  加载中...
                </CardContent>
              </Card>
            ) : submissions.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无提交数据</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map(submission => {
                  const statusConfig = SUBMISSION_STATUS_CONFIG[submission.status];
                  
                  return (
                    <Card key={submission.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{submission.className}</h4>
                              <Badge className={cn('font-medium', statusConfig.color)}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-500 mb-2">
                              提交人：{submission.submitterName} · {new Date(submission.submittedAt).toLocaleString()}
                            </div>
                            
                            {submission.textContent && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {submission.textContent}
                              </p>
                            )}
                            
                            {submission.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {submission.attachments.slice(0, 3).map((att, idx) => (
                                  <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                    {att.type === 'image' ? <Image className="h-3 w-3" /> :
                                     att.type === 'video' ? <Video className="h-3 w-3" /> :
                                     <File className="h-3 w-3" />}
                                    <span className="text-gray-600">{att.name}</span>
                                  </div>
                                ))}
                                {submission.attachments.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{submission.attachments.length - 3}个文件
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {submission.reviewComment && (
                              <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
                                审核意见：{submission.reviewComment}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setSubmissionDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              查看
                            </Button>
                            {submission.status === 'submitted' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setReviewStatus('reviewed');
                                    setReviewComment('');
                                    setReviewDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setReviewStatus('rejected');
                                    setReviewComment('');
                                    setReviewDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* 活动编辑对话框 */}
        <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingActivity ? '编辑活动' : '发布新活动'}
              </DialogTitle>
              <DialogDescription>
                填写活动信息，选择目标对象
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>活动标题 *</Label>
                <Input
                  placeholder="输入活动标题"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="bg-white/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label>活动内容 *</Label>
                <Textarea
                  placeholder="输入活动详细内容"
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="bg-white/80 min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>目标年级</Label>
                <div className="flex flex-wrap gap-2">
                  {GRADE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                        formTargetGrades.includes(opt.value)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Checkbox
                        checked={formTargetGrades.includes(opt.value)}
                        onCheckedChange={() => toggleGrade(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>目标角色</Label>
                <div className="flex gap-3">
                  {ROLE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                        formTargetRoles.includes(opt.value)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Checkbox
                        checked={formTargetRoles.includes(opt.value)}
                        onCheckedChange={() => toggleRole(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label>需要收集材料</Label>
                  <p className="text-xs text-gray-500">
                    开启后，班主任/年段长可以提交文字和附件
                  </p>
                </div>
                <Switch
                  checked={formRequireSubmission}
                  onCheckedChange={setFormRequireSubmission}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              
              {formRequireSubmission && (
                <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <Label className="text-blue-700">收集配置</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formRequireText}
                        onCheckedChange={(checked) => setFormRequireText(checked as boolean)}
                      />
                      <span className="text-sm">要求填写文字说明</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={formRequireAttachment}
                        onCheckedChange={(checked) => setFormRequireAttachment(checked as boolean)}
                      />
                      <span className="text-sm">要求上传附件</span>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>截止时间</Label>
                <Input
                  type="datetime-local"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                  className="bg-white/80"
                />
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm text-amber-700">
                    发布后将自动通知目标年级的班主任和年段长
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formPublishNow}
                    onCheckedChange={(checked) => setFormPublishNow(checked as boolean)}
                  />
                  <span className="text-sm font-medium">立即发布</span>
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSaveActivity}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                {formPublishNow ? '发布活动' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 查看提交详情对话框 */}
        <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">提交详情</DialogTitle>
            </DialogHeader>
            
            {selectedSubmission && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">班级</p>
                    <p className="font-medium">{selectedSubmission.className}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">提交人</p>
                    <p className="font-medium">{selectedSubmission.submitterName}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">提交时间</p>
                    <p className="font-medium">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">状态</p>
                    <Badge className={SUBMISSION_STATUS_CONFIG[selectedSubmission.status].color}>
                      {SUBMISSION_STATUS_CONFIG[selectedSubmission.status].label}
                    </Badge>
                  </div>
                </div>
                
                {selectedSubmission.textContent && (
                  <div className="space-y-2">
                    <Label>文字说明</Label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedSubmission.textContent}
                    </div>
                  </div>
                )}
                
                {selectedSubmission.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>附件 ({selectedSubmission.attachments.length})</Label>
                    <div className="grid gap-2">
                      {selectedSubmission.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {att.type === 'image' ? <Image className="h-4 w-4 text-blue-500" /> :
                             att.type === 'video' ? <Video className="h-4 w-4 text-purple-500" /> :
                             <File className="h-4 w-4 text-gray-500" />}
                            <span className="text-sm">{att.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={att.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedSubmission.reviewComment && (
                  <div className="space-y-2">
                    <Label>审核意见</Label>
                    <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                      {selectedSubmission.reviewComment}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 审核对话框 */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {reviewStatus === 'reviewed' ? '审核通过' : '驳回提交'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>审核意见（可选）</Label>
                <Textarea
                  placeholder="输入审核意见..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="bg-white/80"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleReviewSubmission}
                className={cn(
                  'text-white',
                  reviewStatus === 'reviewed'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                )}
              >
                确认{reviewStatus === 'reviewed' ? '通过' : '驳回'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
