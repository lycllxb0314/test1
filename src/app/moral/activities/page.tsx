'use client';

/**
 * 德育处活动管理页面
 * 
 * 功能：
 * - 发布德育活动（支持上传附件/图片）
 * - 选择目标年级和角色
 * - 配置是否需要收集信息
 */

import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Send,
  Users,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Image,
  File,
  Video,
  X,
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
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
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

export default function ActivityManagementPage() {
  const { user } = useAuth();
  
  // 活动列表
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 对话框状态
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
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
  const [formAttachments, setFormAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [uploading, setUploading] = useState(false);
  
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
  
  useEffect(() => {
    fetchActivities();
  }, [statusFilter]);
  
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
      setFormAttachments(activity.attachments || []);
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
      setFormAttachments([]);
    }
    setActivityDialogOpen(true);
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
        setFormAttachments([...formAttachments, ...newAttachments]);
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
    setFormAttachments(formAttachments.filter((_, i) => i !== index));
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
      
      // 编辑时保持原状态，除非明确要发布
      let status: 'draft' | 'published' | 'archived' = 'draft';
      if (editingActivity) {
        // 编辑已有活动：保持原状态或发布
        status = formPublishNow ? 'published' : editingActivity.status;
      } else {
        // 新建活动：根据是否勾选发布
        status = formPublishNow ? 'published' : 'draft';
      }
      
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
        attachments: formAttachments,
        status,
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
  
  // 归档活动
  const handleArchiveActivity = async (id: string) => {
    if (!confirm('确定要归档此活动吗？归档后将不再显示给教师。')) return;
    
    try {
      const res = await fetch(`/api/moral/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchActivities();
      } else {
        alert(data.error || '归档失败');
      }
    } catch (error) {
      console.error('归档活动失败:', error);
      alert('归档失败');
    }
  };
  
  // 删除活动
  const handleDeleteActivity = async (id: string) => {
    const activity = activities.find(a => a.id === id);
    const isPublished = activity?.status === 'published';
    
    const confirmMsg = isPublished 
      ? '此活动已发布，删除后教师将无法查看。确定要删除吗？'
      : '确定要删除此活动吗？';
    
    if (!confirm(confirmMsg)) return;
    
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
              发布德育活动 · 收集材料
            </p>
          </div>
        </div>
        
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
                        
                        {/* 附件预览 */}
                        {activity.attachments && activity.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {activity.attachments.slice(0, 4).map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                              >
                                {att.type === 'image' ? (
                                  <Image className="h-3 w-3 text-blue-500" />
                                ) : att.type === 'video' ? (
                                  <Video className="h-3 w-3 text-purple-500" />
                                ) : (
                                  <File className="h-3 w-3 text-gray-500" />
                                )}
                                <span className="text-gray-600 truncate max-w-[100px]">{att.name}</span>
                              </a>
                            ))}
                            {activity.attachments.length > 4 && (
                              <span className="text-xs text-gray-400 flex items-center">
                                +{activity.attachments.length - 4}个文件
                              </span>
                            )}
                          </div>
                        )}
                        
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
                        {activity.status === 'published' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleArchiveActivity(activity.id)}
                          >
                            <Archive className="h-3.5 w-3.5 mr-1" />
                            归档
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenActivityDialog(activity)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteActivity(activity.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
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
              
              {/* 附件上传 */}
              <div className="space-y-2">
                <Label>附件材料（可选）</Label>
                
                {/* 已上传文件列表 */}
                {formAttachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {formAttachments.map((att, idx) => (
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
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>{uploading ? '上传中...' : '上传附件'}</span>
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
                    支持图片、视频、文档
                  </span>
                </div>
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
                disabled={uploading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                {formPublishNow ? '发布活动' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
