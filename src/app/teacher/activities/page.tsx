'use client';

/**
 * 班主任/年段长活动页面
 * 
 * 功能：
 * - 查看收到的德育活动
 * - 提交活动材料（文字、附件）
 * - 查看提交状态
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Image,
  File,
  Video,
  X,
  Plus,
  Eye,
  MessageSquare,
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
  reviewComment: string | null;
  createdAt: string;
}

// 状态配置
const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  published: { label: '进行中', color: 'bg-green-100 text-green-700' },
  archived: { label: '已结束', color: 'bg-amber-100 text-amber-700' },
};

const SUBMISSION_STATUS_CONFIG = {
  pending: { label: '待提交', color: 'bg-gray-100 text-gray-700', icon: Clock },
  submitted: { label: '待审核', color: 'bg-blue-100 text-blue-700', icon: Clock },
  reviewed: { label: '已通过', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function TeacherActivitiesPage() {
  const { user } = useAuth();
  
  // 活动列表
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  // 我的提交
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  
  // 提交表单
  const [textContent, setTextContent] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  
  // 用户班级信息
  const [userClassId, setUserClassId] = useState<string>('');
  const [userClassName, setUserClassName] = useState<string>('');
  
  // 获取用户班级信息
  useEffect(() => {
    const fetchUserClass = async () => {
      if (!user?.id) return;
      
      try {
        const res = await fetch(`/api/users/${user.id}`);
        const data = await res.json();
        if (data.success) {
          setUserClassId(data.data.classId || '');
          setUserClassName(data.data.className || '');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };
    
    fetchUserClass();
  }, [user?.id]);
  
  // 加载活动列表
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const res = await fetch('/api/moral/activities?status=published');
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
  
  // 加载我的提交
  const fetchMySubmissions = async () => {
    if (!userClassId) return;
    
    try {
      const res = await fetch(`/api/moral/activities/submissions?classId=${userClassId}`);
      const data = await res.json();
      if (data.success) {
        setMySubmissions(data.data);
      }
    } catch (error) {
      console.error('获取提交记录失败:', error);
    }
  };
  
  useEffect(() => {
    fetchActivities();
  }, []);
  
  useEffect(() => {
    if (userClassId) {
      fetchMySubmissions();
    }
  }, [userClassId]);
  
  // 活动与提交的关联
  const activityWithSubmission = useMemo(() => {
    return activities.map(activity => {
      const submission = mySubmissions.find(s => s.activityId === activity.id);
      return { activity, submission };
    });
  }, [activities, mySubmissions]);
  
  // 打开详情对话框
  const handleOpenDetail = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };
  
  // 打开提交对话框
  const handleOpenSubmit = (activity: Activity) => {
    setSelectedActivity(activity);
    // 检查是否已有提交
    const submission = mySubmissions.find(s => s.activityId === activity.id);
    if (submission) {
      setExistingSubmission(submission);
      setTextContent(submission.textContent || '');
      setAttachments(submission.attachments || []);
    } else {
      setExistingSubmission(null);
      setTextContent('');
      setAttachments([]);
    }
    setSubmitDialogOpen(true);
  };
  
  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        const newAttachments = data.files.map((f: { url: string; name: string; type: string }) => ({
          name: f.name,
          url: f.url,
          type: f.type?.startsWith('image') ? 'image' : f.type?.startsWith('video') ? 'video' : 'document',
        }));
        setAttachments([...attachments, ...newAttachments]);
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  
  // 移除附件
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  // 提交
  const handleSubmit = async () => {
    if (!selectedActivity || !userClassId) return;
    
    const config = selectedActivity.submissionConfig || {};
    
    if (config.requireText && !textContent.trim()) {
      alert('请填写文字说明');
      return;
    }
    
    if (config.requireAttachment && attachments.length === 0) {
      alert('请上传附件');
      return;
    }
    
    try {
      const res = await fetch('/api/moral/activities/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          classId: userClassId,
          textContent,
          attachments,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchMySubmissions();
        setSubmitDialogOpen(false);
        alert('提交成功');
      } else {
        alert(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    }
  };
  
  // 检查是否过期
  const isExpired = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50">
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                <Calendar className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                德育活动
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              接收德育活动通知 · 提交活动材料
            </p>
          </div>
          {userClassName && (
            <Badge variant="outline" className="px-3 py-1.5 border-emerald-200 text-emerald-700 bg-emerald-50/50">
              {userClassName}
            </Badge>
          )}
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
              <p className="text-gray-500">暂无活动</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activityWithSubmission.map(({ activity, submission }) => {
              const statusConfig = STATUS_CONFIG[activity.status];
              const submissionConfig = submission ? SUBMISSION_STATUS_CONFIG[submission.status] : null;
              const expired = isExpired(activity.deadline);
              
              return (
                <Card key={activity.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{activity.title}</h3>
                          <Badge className={cn('font-medium', statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                          {activity.requireSubmission && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                              <Upload className="h-3 w-3 mr-1" />
                              需提交
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {activity.content}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>发布于 {new Date(activity.createdAt).toLocaleDateString()}</span>
                          </div>
                          {activity.deadline && (
                            <div className={cn(
                              'flex items-center gap-1',
                              expired ? 'text-red-500' : 'text-amber-500'
                            )}>
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>{expired ? '已截止：' : '截止：'}{new Date(activity.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          {activity.requireSubmission && (
                            <div className="flex items-center gap-1">
                              {submission ? (
                                <>
                                  {submissionConfig && (
                                    <>
                                      <submissionConfig.icon className="h-3.5 w-3.5" />
                                      <span className={submissionConfig.color.split(' ')[1]}>
                                        {submissionConfig.label}
                                      </span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  <span>待提交</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(activity)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          详情
                        </Button>
                        {activity.requireSubmission && !expired && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenSubmit(activity)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                          >
                            {submission ? '修改提交' : '提交材料'}
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
        
        {/* 活动详情对话框 */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedActivity?.title}</DialogTitle>
              <DialogDescription>
                发布于 {selectedActivity && new Date(selectedActivity.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            {selectedActivity && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedActivity.content}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">目标年级</p>
                    <p className="font-medium">{selectedActivity.targetGradeNames.join('、')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">截止时间</p>
                    <p className="font-medium">
                      {selectedActivity.deadline 
                        ? new Date(selectedActivity.deadline).toLocaleString()
                        : '无截止时间'}
                    </p>
                  </div>
                </div>
                
                {selectedActivity.requireSubmission && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-700 mb-2">提交要求</h4>
                    <div className="space-y-1 text-sm text-emerald-600">
                      {selectedActivity.submissionConfig?.requireText && (
                        <p>• 需要填写文字说明</p>
                      )}
                      {selectedActivity.submissionConfig?.requireAttachment && (
                        <p>• 需要上传附件材料</p>
                      )}
                      {selectedActivity.submissionConfig?.maxFiles && (
                        <p>• 最多上传 {selectedActivity.submissionConfig.maxFiles} 个文件</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                关闭
              </Button>
              {selectedActivity?.requireSubmission && !isExpired(selectedActivity.deadline) && (
                <Button
                  onClick={() => {
                    setDetailDialogOpen(false);
                    if (selectedActivity) {
                      handleOpenSubmit(selectedActivity);
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  提交材料
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 提交材料对话框 */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">提交材料</DialogTitle>
              <DialogDescription>
                {selectedActivity?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* 文字说明 */}
              <div className="space-y-2">
                <Label>
                  文字说明
                  {selectedActivity?.submissionConfig?.requireText && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  placeholder="请输入活动相关说明..."
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  className="bg-white/80 min-h-[120px]"
                />
              </div>
              
              {/* 附件上传 */}
              <div className="space-y-2">
                <Label>
                  附件材料
                  {selectedActivity?.submissionConfig?.requireAttachment && <span className="text-red-500">*</span>}
                </Label>
                
                {/* 已上传文件列表 */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {att.type === 'image' ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : att.type === 'video' ? (
                            <Video className="h-4 w-4 text-purple-500" />
                          ) : (
                            <File className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm">{att.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeAttachment(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 上传按钮 */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>{uploading ? '上传中...' : '上传文件'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    支持图片、视频、文档（PDF/Word/Excel/PPT）
                  </span>
                </div>
              </div>
              
              {/* 提交状态提示 */}
              {existingSubmission && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    您已于 {new Date(existingSubmission.submittedAt).toLocaleString()} 提交过材料，
                    重新提交将覆盖原有内容。
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {uploading ? '上传中...' : '提交'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
