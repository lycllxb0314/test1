'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker, MonthPicker } from '@/components/ui/date-picker';
import {
  User,
  Phone,
  Mail,
  BookOpen,
  GraduationCap,
  Briefcase,
  FileText,
  Trophy,
  Target,
  Edit,
  Plus,
  Save,
  Upload,
  IdCard,
  TrendingUp,
  X,
  Loader2,
  Lock,
  Clock,
  Users,
  Award,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeachers, type TeacherInfo, type TeacherRecord, type TeacherHonor, type TeacherTraining, type TeacherAchievement, TEACHER_ROLE_LABELS, ADMINISTRATIVE_ROLE_LABELS } from '@/hooks/useTeachers';
import { toast } from 'sonner';
import { TeacherProfileDialogs } from '@/components/teacher/TeacherProfileDialogs';

// 本地类型定义，用于对话框编辑项（兼容 TeacherProfileDialogs）
type EditItem = { 
  id: string; 
  teacherId?: string;
  title: string; 
  date: string; 
  type?: string;
  level?: string;
  category?: string;
  issuer?: string;
  certificateNo?: string;
  name?: string;
  organizer?: string;
  startDate?: string;
  endDate?: string;
  hours?: number;
  status?: string;
  result?: string;
  description?: string;
  [key: string]: unknown 
};

// 获取记录类型图标和颜色
const getHonorLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '国家级': 'text-red-600 bg-red-50',
    '省级': 'text-purple-600 bg-purple-50',
    '市级': 'text-blue-600 bg-blue-50',
    '区级': 'text-green-600 bg-green-50',
    '校级': 'text-gray-600 bg-gray-50',
  };
  return colorMap[level] || 'text-gray-600 bg-gray-50';
};

// 获取记录类型图标和颜色
const getRecordTypeInfo = (type: string) => {
  const typeMap: Record<string, { icon: typeof GraduationCap; color: string; label: string }> = {
    education: { icon: GraduationCap, color: 'text-blue-500', label: '学历' },
    title: { icon: Award, color: 'text-purple-500', label: '职称' },
    position: { icon: Briefcase, color: 'text-orange-500', label: '职务' },
    award: { icon: Trophy, color: 'text-yellow-500', label: '荣誉' },
    training: { icon: BookOpen, color: 'text-green-500', label: '培训' },
    research: { icon: FileText, color: 'text-indigo-500', label: '科研' },
    other: { icon: FileText, color: 'text-gray-500', label: '其他' },
  };
  return typeMap[type] || typeMap.other;
};

// 获取角色显示名称（使用统一映射）
const getRoleDisplayName = (role: string): string => {
  // 先检查教师角色映射
  if (role in TEACHER_ROLE_LABELS) {
    return TEACHER_ROLE_LABELS[role as keyof typeof TEACHER_ROLE_LABELS];
  }
  // 再检查行政职务映射
  if (role in ADMINISTRATIVE_ROLE_LABELS) {
    return ADMINISTRATIVE_ROLE_LABELS[role as keyof typeof ADMINISTRATIVE_ROLE_LABELS];
  }
  // 兼容旧数据格式
  const legacyMap: Record<string, string> = {
    'homeroom_teacher': '班主任',
    'grade_leader': '年段长',
    'research_leader': '教研组长',
    'admin': '行政人员',
    'dean': '教务主任',
  };
  return legacyMap[role] || role;
};

// 可编辑的表单数据
interface EditableFormData {
  // 联系信息
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  // 个人信息
  birthDate: string;
  gender: string;
  ethnicity: string;
  politicalStatus: string;
  nativePlace: string;
  // 学历职称
  education: string;
  school: string;
  major: string;
  graduationDate: string;
  title: string;
  titleDate: string;
  teachYears: number;
  // 任教信息
  department: string;
}

export default function TeacherProfilePage() {
  const { user } = useAuth();
  
  // 使用统一数据接口获取教师完整档案
  const { 
    getTeacherById, 
    updateTeacher, 
    addRecord,
    updateRecord,
    deleteRecord,
    addHonor,
    updateHonor,
    deleteHonor,
    addTraining,
    updateTraining,
    deleteTraining,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    loading: hookLoading,
    refetch,
    allTeachers
  } = useTeachers();
  
  // 动态获取 teacherId：通过工号或手机号匹配教师
  const teacherId = React.useMemo(() => {
    if (!allTeachers || allTeachers.length === 0) return null;
    
    // 1. 尝试通过工号匹配
    if (user?.employeeId) {
      const matchedByEmployeeId = allTeachers.find(t => t.employeeId === user.employeeId);
      if (matchedByEmployeeId) {
        return matchedByEmployeeId.id;
      }
    }
    
    // 2. 尝试通过手机号匹配（去掉掩码*号）
    if (user?.phone) {
      const userPhoneClean = user.phone.replace(/\*/g, '');
      const matchedByPhone = allTeachers.find(t => {
        const teacherPhoneClean = t.phone?.replace(/\*/g, '') || '';
        // 支持部分匹配（去掉掩码后的比较）
        return teacherPhoneClean.includes(userPhoneClean) || userPhoneClean.includes(teacherPhoneClean);
      });
      if (matchedByPhone) {
        return matchedByPhone.id;
      }
    }
    
    // 3. 未匹配到，使用第一个教师作为演示
    return allTeachers[0].id;
  }, [user?.employeeId, user?.phone, allTeachers]);
  
  // 直接从 allTeachers 获取教师档案
  const profile = React.useMemo(() => {
    if (!teacherId || !allTeachers) return null;
    return allTeachers.find(t => t.id === teacherId) || null;
  }, [teacherId, allTeachers]);
  
  // 计算加载状态
  const isLoading = hookLoading || (!teacherId && !profile);
  
  // 计算错误状态
  const error = !isLoading && !profile ? '未找到教师档案' : null;
  
  // 更新档案
  const updateProfile = async (data: Partial<TeacherInfo>) => {
    if (!teacherId) return false;
    return await updateTeacher(teacherId, data);
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 对话框状态
  const [dialogType, setDialogType] = useState<'honor' | 'training' | 'achievement' | 'record' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EditItem | undefined>(undefined);
  
  // 密码修改状态
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 可编辑字段状态
  const [formData, setFormData] = useState<EditableFormData>({
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    birthDate: '',
    gender: '',
    ethnicity: '',
    politicalStatus: '',
    nativePlace: '',
    education: '',
    school: '',
    major: '',
    graduationDate: '',
    title: '',
    titleDate: '',
    teachYears: 0,
    department: '',
  });

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        emergencyContact: profile.emergencyContact ?? '',
        emergencyPhone: profile.emergencyPhone ?? '',
        address: profile.address ?? '',
        birthDate: profile.birthDate ?? '',
        gender: profile.gender ?? '',
        ethnicity: profile.ethnicity ?? '',
        politicalStatus: profile.politicalStatus ?? '',
        nativePlace: profile.nativePlace ?? '',
        education: profile.education ?? '',
        school: profile.school ?? '',
        major: profile.major ?? '',
        graduationDate: profile.graduationDate ?? '',
        title: profile.title ?? '',
        titleDate: profile.titleDate ?? '',
        teachYears: profile.teachYears ?? 0,
        department: profile.department ?? '',
      });
    }
  }, [profile]);

  // 处理字段变化
  const handleFieldChange = (field: keyof EditableFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存基本信息
  const handleSaveBasicInfo = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      // 调用updateProfile更新教师信息
      // 注意：性别字段直接使用中文 '男'/'女'，无需转换
      const success = await updateProfile({
        phone: formData.phone,
        email: formData.email,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        address: formData.address,
        birthDate: formData.birthDate,
        gender: formData.gender, // 直接使用中文，不转换
        ethnicity: formData.ethnicity,
        politicalStatus: formData.politicalStatus,
        nativePlace: formData.nativePlace,
        education: formData.education,
        school: formData.school,
        major: formData.major,
        graduationDate: formData.graduationDate,
        title: formData.title,
        titleDate: formData.titleDate,
        teachYears: formData.teachYears,
        department: formData.department,
      });
      
      if (!success) throw new Error('保存失败');
      
      setIsEditing(false);
      toast.success('个人信息已保存');
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    // 重置表单数据
    if (profile) {
      setFormData({
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        emergencyContact: profile.emergencyContact ?? '',
        emergencyPhone: profile.emergencyPhone ?? '',
        address: profile.address ?? '',
        birthDate: profile.birthDate ?? '',
        gender: profile.gender ?? '',
        ethnicity: profile.ethnicity ?? '',
        politicalStatus: profile.politicalStatus ?? '',
        nativePlace: profile.nativePlace ?? '',
        education: profile.education ?? '',
        school: profile.school ?? '',
        major: profile.major ?? '',
        graduationDate: profile.graduationDate ?? '',
        title: profile.title ?? '',
        titleDate: profile.titleDate ?? '',
        teachYears: profile.teachYears ?? 0,
        department: profile.department ?? '',
      });
    }
    setIsEditing(false);
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error('请输入旧密码');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('smart_campus_token');
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || '密码修改成功');
        setShowPasswordDialog(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.error || '密码修改失败');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 打开添加对话框
  const openAddDialog = (type: 'honor' | 'training' | 'achievement' | 'record') => {
    setDialogType(type);
    setEditItem(undefined);
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (type: 'honor' | 'training' | 'achievement' | 'record', item: EditItem) => {
    setDialogType(type);
    setEditItem(item);
    setDialogOpen(true);
  };

  // 处理删除
  const handleDelete = async (type: 'honor' | 'training' | 'achievement' | 'record', id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    let success = false;
    switch (type) {
      case 'honor':
        success = await deleteHonor(id);
        break;
      case 'training':
        success = await deleteTraining(id);
        break;
      case 'achievement':
        success = await deleteAchievement(id);
        break;
      case 'record':
        success = await deleteRecord(id);
        break;
    }
    
    if (success) {
      toast.success('删除成功');
      refetch();
    } else {
      toast.error('删除失败');
    }
  };

  // 对话框保存成功
  const handleDialogSuccess = () => {
    toast.success('保存成功');
    refetch();
  };

  // 加载状态 - 等待 hook 数据加载完成
  if (isLoading || hookLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">{error || '未找到教师档案'}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => refetch()}
          >
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">个人档案</h1>
          </div>
          <p className="text-muted-foreground mt-1">管理您的个人信息和成长记录</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button onClick={handleSaveBasicInfo} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? '保存中...' : '保存修改'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                <Lock className="h-4 w-4 mr-1" />
                修改密码
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                编辑信息
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 个人信息卡片 */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0 text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto">
                {profile.name.charAt(0)}
              </div>
              <Button variant="outline" size="sm" className="mt-3 gap-1">
                <Upload className="h-4 w-4" />
                更换头像
              </Button>
            </div>
            
            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-muted-foreground mt-1">{profile.title} · {profile.department}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">在职</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span>工号：{profile.employeeId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{profile.gender} · {profile.ethnicity}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {isEditing ? (
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="h-6 text-xs w-28"
                    />
                  ) : (
                    <span>{profile.phone}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {isEditing ? (
                    <Input 
                      value={formData.email} 
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="h-6 text-xs w-40"
                    />
                  ) : (
                    <span>{profile.email}</span>
                  )}
                </div>
              </div>

              {/* 成长数据概览 */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{(profile.honors || []).length}</div>
                  <div className="text-xs text-muted-foreground">荣誉奖项</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{(profile.trainings || []).filter(t => t.status === '已完成').length}</div>
                  <div className="text-xs text-muted-foreground">培训完成</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{(profile.achievements || []).length}</div>
                  <div className="text-xs text-muted-foreground">教学成果</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{(profile.trainings || []).reduce((sum, t) => sum + (t.hours || 0), 0)}</div>
                  <div className="text-xs text-muted-foreground">培训学时</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详情标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border rounded-lg p-1">
          <TabsTrigger value="overview">基本信息</TabsTrigger>
          <TabsTrigger value="honors">荣誉奖项</TabsTrigger>
          <TabsTrigger value="trainings">培训记录</TabsTrigger>
          <TabsTrigger value="achievements">教学成果</TabsTrigger>
          <TabsTrigger value="records">成长档案</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">姓名</Label>
                    <p className="font-medium mt-1">{profile.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">性别</Label>
                    {isEditing ? (
                      <Select 
                        value={formData.gender} 
                        onValueChange={(v) => handleFieldChange('gender', v)}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue placeholder="请选择性别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="男">男</SelectItem>
                          <SelectItem value="女">女</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium mt-1">{profile.gender}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">出生日期</Label>
                    {isEditing ? (
                      <DatePicker
                        value={formData.birthDate}
                        onChange={(v) => handleFieldChange('birthDate', v)}
                        placeholder="选择出生日期"
                        className="mt-1 h-8"
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.birthDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">民族</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.ethnicity} 
                        onChange={(e) => handleFieldChange('ethnicity', e.target.value)}
                        className="mt-1 h-8" 
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.ethnicity}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">政治面貌</Label>
                    {isEditing ? (
                      <Select 
                        value={formData.politicalStatus} 
                        onValueChange={(v) => handleFieldChange('politicalStatus', v)}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="中共党员">中共党员</SelectItem>
                          <SelectItem value="共青团员">共青团员</SelectItem>
                          <SelectItem value="群众">群众</SelectItem>
                          <SelectItem value="民主党派">民主党派</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium mt-1">{profile.politicalStatus}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">籍贯</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.nativePlace} 
                        onChange={(e) => handleFieldChange('nativePlace', e.target.value)}
                        className="mt-1 h-8" 
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.nativePlace}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 联系信息 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  联系信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">联系电话</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="mt-1 h-8" 
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">电子邮箱</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.email} 
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="mt-1 h-8" 
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">紧急联系人</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.emergencyContact} 
                        onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                        className="mt-1 h-8" 
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.emergencyContact}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">紧急联系电话</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.emergencyPhone} 
                        onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)}
                        className="mt-1 h-8" 
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.emergencyPhone}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground text-xs">家庭住址</Label>
                    {isEditing ? (
                      <Textarea 
                        value={formData.address} 
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        className="mt-1" 
                        rows={2}
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.address}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 学历职称 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  学历职称
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">学历</Label>
                    {isEditing ? (
                      <Select 
                        value={formData.education} 
                        onValueChange={(v) => handleFieldChange('education', v)}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue placeholder="请选择学历" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="专科">专科</SelectItem>
                          <SelectItem value="本科">本科</SelectItem>
                          <SelectItem value="硕士">硕士</SelectItem>
                          <SelectItem value="博士">博士</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium mt-1">{profile.education}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">职称</Label>
                    {isEditing ? (
                      <Select 
                        value={formData.title} 
                        onValueChange={(v) => handleFieldChange('title', v)}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue placeholder="请选择职称" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="二级教师">二级教师</SelectItem>
                          <SelectItem value="一级教师">一级教师</SelectItem>
                          <SelectItem value="高级教师">高级教师</SelectItem>
                          <SelectItem value="正高级教师">正高级教师</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium mt-1">{profile.title}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">毕业院校</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.school} 
                        onChange={(e) => handleFieldChange('school', e.target.value)}
                        className="mt-1 h-8" 
                        placeholder="请输入毕业院校"
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.school}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">专业</Label>
                    {isEditing ? (
                      <Input 
                        value={formData.major} 
                        onChange={(e) => handleFieldChange('major', e.target.value)}
                        className="mt-1 h-8" 
                        placeholder="请输入专业"
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.major}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">毕业时间</Label>
                    {isEditing ? (
                      <MonthPicker
                        value={formData.graduationDate}
                        onChange={(v) => handleFieldChange('graduationDate', v)}
                        placeholder="选择毕业时间"
                        className="mt-1 h-8"
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.graduationDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">职称获得日期</Label>
                    {isEditing ? (
                      <DatePicker
                        value={formData.titleDate}
                        onChange={(v) => handleFieldChange('titleDate', v)}
                        placeholder="选择职称获得日期"
                        className="mt-1 h-8"
                      />
                    ) : (
                      <p className="font-medium mt-1">{profile.titleDate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 工作信息 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  工作信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">工号</Label>
                    <p className="font-medium mt-1">{profile.employeeId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">教研组</Label>
                    <p className="font-medium mt-1">{profile.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">任教学科</Label>
                    <p className="font-medium mt-1">{profile.subject}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">教龄</Label>
                    <p className="font-medium mt-1">{profile.teachYears} 年</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">入职时间</Label>
                    <p className="font-medium mt-1">{profile.joinDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">班主任</Label>
                    <p className="font-medium mt-1">{profile.isHeadTeacher ? `是（${profile.headTeacherClassName || '未分配班级'}）` : '否'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 角色配置 - 只读 */}
            <Card className="shadow-md border-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  角色配置
                  <Badge variant="outline" className="ml-2 text-xs bg-muted/50">
                    <Lock className="h-3 w-3 mr-1" />
                    只读
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">角色配置由教务处统一管理，如有疑问请联系教务处</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">主要角色</Label>
                    <p className="font-medium mt-1">{getRoleDisplayName(profile.primaryRole)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">兼任职务</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.additionalRoles && profile.additionalRoles.length > 0 ? (
                        profile.additionalRoles.map((role, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {getRoleDisplayName(role)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">无</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 课时配置 - 只读 */}
            <Card className="shadow-md border-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  课时配置
                  <Badge variant="outline" className="ml-2 text-xs bg-muted/50">
                    <Lock className="h-3 w-3 mr-1" />
                    只读
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">课时配置由教务处统一管理，如有疑问请联系教务处</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">周课时量</Label>
                    <p className="font-medium mt-1">{profile.weeklyHours} 节</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">已安排课时</Label>
                    <p className="font-medium mt-1">{profile.currentHours} 节</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">可任教科目</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.teachableSubjects && profile.teachableSubjects.length > 0 ? (
                        profile.teachableSubjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">{profile.subject}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">可任教年级</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.teachableGrades && profile.teachableGrades.length > 0 ? (
                        profile.teachableGrades.map((grade, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {grade}年级
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">全部年级</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 荣誉奖项 */}
        <TabsContent value="honors" className="space-y-4 mt-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  我的荣誉
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => openAddDialog('honor')}
                >
                  <Plus className="h-4 w-4" />
                  申报荣誉
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(profile.honors || []).map(honor => (
                  <div key={honor.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHonorLevelColor(honor.level)}`}>
                      {honor.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{honor.title}</span>
                        <Badge variant="outline">{honor.category}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {honor.issuer && <span>颁发单位：{honor.issuer} · </span>}
                        获得时间：{honor.date}
                      </div>
                      {honor.certificateNo && (
                        <div className="text-xs text-muted-foreground mt-1">证书编号：{honor.certificateNo}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('honor', honor)}>编辑</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('honor', honor.id)}>删除</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 培训记录 */}
        <TabsContent value="trainings" className="space-y-4 mt-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  培训记录
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddDialog('training')}>
                  <Plus className="h-4 w-4" />
                  添加培训
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(profile.trainings || []).map(training => (
                  <div key={training.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{training.name}</span>
                        <Badge variant="outline">{training.type}</Badge>
                        <Badge className={training.status === '已完成' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                          {training.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        主办单位：{training.organizer} · 时间：{training.startDate} 至 {training.endDate}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        学时：{training.hours || 0} 小时
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('training', training as EditItem)}>编辑</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('training', training.id)}>删除</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教学成果 */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  教学成果
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddDialog('achievement')}>
                  <Plus className="h-4 w-4" />
                  添加成果
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(profile.achievements || []).map(achievement => (
                  <div key={achievement.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          achievement.type === '公开课' ? 'bg-blue-100 text-blue-700' :
                          achievement.type === '教学比赛' ? 'bg-purple-100 text-purple-700' :
                          achievement.type === '论文发表' ? 'bg-green-100 text-green-700' :
                          achievement.type === '课题研究' ? 'bg-orange-100 text-orange-700' :
                          'bg-teal-100 text-teal-700'
                        }>
                          {achievement.type}
                        </Badge>
                        <span className="font-medium">{achievement.title}</span>
                        {achievement.result && (
                          <Badge className="bg-yellow-100 text-yellow-700">{achievement.result}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {achievement.level && <span>级别：{achievement.level} · </span>}
                        时间：{achievement.date}
                      </div>
                      {achievement.description && (
                        <div className="text-sm text-muted-foreground mt-1">{achievement.description}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('achievement', achievement as EditItem)}>编辑</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('achievement', achievement.id)}>删除</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成长档案 */}
        <TabsContent value="records" className="space-y-4 mt-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  成长档案
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddDialog('record')}>
                  <Plus className="h-4 w-4" />
                  添加记录
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* 时间线 */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                
                <div className="space-y-4">
                  {(profile.records || []).sort((a, b) => b.date.localeCompare(a.date)).map(record => {
                    const typeInfo = getRecordTypeInfo(record.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={record.id} className="relative flex items-start gap-4 pl-10">
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-background border-2 border-border"></div>
                        
                        <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                              <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                              <span className="font-medium">{record.title}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog('record', record)}>编辑</Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('record', record.id)}>删除</Button>
                            </div>
                          </div>
                          {record.description && (
                            <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{record.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 对话框组件 */}
      {teacherId && (
        <TeacherProfileDialogs
          teacherId={teacherId}
          type={dialogType}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleDialogSuccess}
          editItem={editItem}
        />
      )}

      {/* 密码修改对话框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              修改密码
            </DialogTitle>
            <DialogDescription>
              请输入旧密码和新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">旧密码</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              取消
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  修改中...
                </>
              ) : (
                '确认修改'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
