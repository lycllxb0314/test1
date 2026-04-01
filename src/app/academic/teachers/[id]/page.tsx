'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  Clock,
  FileText,
  Trophy,
  Target,
  Users,
  Edit,
  Plus,
  CheckCircle,
  Building,
  IdCard,
  Save,
  X,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { DatePicker, MonthPicker } from '@/components/ui/date-picker';
import { TeacherProfile } from '@/types';
import { useTeachers, type TeacherInfo, type TeacherRecord, type TeacherHonor, type TeacherTraining, type TeacherAchievement, TEACHER_ROLE_LABELS, TEACHER_ROLE_COLORS, ADMINISTRATIVE_ROLE_LABELS, ADMINISTRATIVE_ROLE_COLORS, type AdministrativeRole, type TeacherRole, type TeacherRoleConfig } from '@/hooks';
import { GROUP_CONFIGS, type GroupType, type UserGroupMembership } from '@/types';
import { toast } from 'sonner';
import { TeacherProfileDialogs, deleteTeacherProfileItem } from '@/components/teacher/TeacherProfileDialogs';

// 本地类型定义，用于对话框编辑项
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

// 获取状态徽章
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    active: { label: '在职', className: 'bg-green-100 text-green-700' },
    on_leave: { label: '请假', className: 'bg-yellow-100 text-yellow-700' },
    retired: { label: '退休', className: 'bg-gray-100 text-gray-600' },
    transferred: { label: '调离', className: 'bg-blue-100 text-blue-600' },
  };
  const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100' };
  return <Badge className={className}>{label}</Badge>;
};

// 获取荣誉级别颜色
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
  const typeMap: Record<string, { icon: LucideIcon; color: string; label: string }> = {
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

// 表单字段类型
interface FormData {
  name: string;
  gender: string;
  birthDate: string;
  ethnicity: string;
  politicalStatus: string;
  nativePlace: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  education: string;
  school: string;
  major: string;
  graduationDate: string;
  title: string;
  titleDate: string;
  department: string;
  subjects: string;
  status: 'active' | 'on_leave' | 'retired' | 'transferred';
  // 角色与课时配置
  primaryRole: TeacherRole;
  additionalRoles: AdministrativeRole[];
  weeklyHours: number;
  teachableGrades: number[];
}

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  
  // 使用统一数据接口
  const { 
    getTeacherById, 
    loading, 
    refetch,
    updateTeacher,
    updateTeacherRole,
    // 履历管理
    fetchRecords, addRecord, updateRecord, deleteRecord,
    // 荣誉管理
    fetchHonors, addHonor, updateHonor, deleteHonor,
    // 培训管理
    fetchTrainings, addTraining, updateTraining, deleteTraining,
    // 成就管理
    fetchAchievements, addAchievement, updateAchievement, deleteAchievement,
  } = useTeachers();
  const teacher = getTeacherById(teacherId);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 履历、荣誉、培训、成就数据
  const [records, setRecords] = useState<TeacherRecord[]>([]);
  const [honors, setHonors] = useState<TeacherHonor[]>([]);
  const [trainings, setTrainings] = useState<TeacherTraining[]>([]);
  const [achievements, setAchievements] = useState<TeacherAchievement[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // 群组数据
  const [userGroups, setUserGroups] = useState<UserGroupMembership[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // 对话框状态
  const [dialogType, setDialogType] = useState<'honor' | 'training' | 'achievement' | 'record' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EditItem | undefined>(undefined);
  
  // 加载教师详情数据（履历、荣誉、培训、成就）
  const loadTeacherDetails = useCallback(async () => {
    if (!teacherId) return;
    setLoadingDetails(true);
    try {
      const [recordsData, honorsData, trainingsData, achievementsData] = await Promise.all([
        fetchRecords(teacherId),
        fetchHonors(teacherId),
        fetchTrainings(teacherId),
        fetchAchievements(teacherId),
      ]);
      setRecords(recordsData);
      setHonors(honorsData);
      setTrainings(trainingsData);
      setAchievements(achievementsData);
    } catch (err) {
      console.error('加载教师详情数据失败:', err);
    } finally {
      setLoadingDetails(false);
    }
  }, [teacherId, fetchRecords, fetchHonors, fetchTrainings, fetchAchievements]);
  
  // 加载用户群组数据
  const loadUserGroups = useCallback(async () => {
    if (!teacherId) return;
    setLoadingGroups(true);
    try {
      const response = await fetch(`/api/users/${teacherId}/groups`);
      if (response.ok) {
        const data = await response.json();
        setUserGroups(data.groups || []);
      }
    } catch (err) {
      console.error('加载用户群组失败:', err);
    } finally {
      setLoadingGroups(false);
    }
  }, [teacherId]);
  
  // 更新用户群组
  const updateUserGroups = useCallback(async (groupTypes: GroupType[]) => {
    if (!teacherId) return false;
    try {
      const response = await fetch(`/api/users/${teacherId}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: groupTypes }),
      });
      if (response.ok) {
        await loadUserGroups();
        toast.success('部门设置已更新');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || '更新失败');
        return false;
      }
    } catch (err) {
      console.error('更新用户群组失败:', err);
      toast.error('更新失败');
      return false;
    }
  }, [teacherId, loadUserGroups]);
  
  // 初始化加载
  useEffect(() => {
    loadTeacherDetails();
    loadUserGroups();
  }, [loadTeacherDetails, loadUserGroups]);
  
  const updateProfile = async (data: Partial<TeacherInfo>) => {
    return await updateTeacher(teacherId, data);
  };
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: '',
    birthDate: '',
    ethnicity: '',
    politicalStatus: '',
    nativePlace: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    education: '',
    school: '',
    major: '',
    graduationDate: '',
    title: '',
    titleDate: '',
    department: '',
    subjects: '',
    status: 'active',
    primaryRole: 'subject_teacher',
    additionalRoles: [],
    weeklyHours: 13,
    teachableGrades: [1, 2, 3, 4, 5, 6],
  });

  // 当数据加载完成后初始化表单
  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name ?? '',
        gender: teacher.gender ?? '男',
        birthDate: teacher.birthDate ?? '',
        ethnicity: teacher.ethnicity ?? '',
        politicalStatus: teacher.politicalStatus ?? '',
        nativePlace: teacher.nativePlace ?? '',
        phone: teacher.phone ?? '',
        email: teacher.email ?? '',
        emergencyContact: teacher.emergencyContact ?? '',
        emergencyPhone: teacher.emergencyPhone ?? '',
        address: teacher.address ?? '',
        education: teacher.education ?? '',
        school: teacher.school ?? '',
        major: teacher.major ?? '',
        graduationDate: teacher.graduationDate ?? '',
        title: teacher.title ?? '',
        titleDate: teacher.titleDate ?? '',
        department: teacher.department ?? '',
        subjects: teacher.teachableSubjects?.join('、') ?? teacher.subject ?? '',
        status: (teacher.status === 'active' ? 'active' : 'active') as 'active' | 'on_leave' | 'retired' | 'transferred',
        primaryRole: teacher.primaryRole ?? 'subject_teacher',
        additionalRoles: teacher.additionalRoles ?? [],
        weeklyHours: teacher.weeklyHours ?? 13,
        teachableGrades: teacher.teachableGrades ?? [1, 2, 3, 4, 5, 6],
      });
    }
  }, [teacher]);

  // 处理表单字段变化
  const handleFieldChange = (field: keyof FormData, value: string | number | AdministrativeRole[] | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存编辑
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 并行保存基本信息和角色配置
      const [basicSuccess, roleSuccess] = await Promise.all([
        updateProfile({
          name: formData.name,
          gender: formData.gender as '男' | '女',
          birthDate: formData.birthDate,
          ethnicity: formData.ethnicity,
          politicalStatus: formData.politicalStatus,
          nativePlace: formData.nativePlace,
          phone: formData.phone,
          email: formData.email,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          address: formData.address,
          education: formData.education,
          school: formData.school,
          major: formData.major,
          graduationDate: formData.graduationDate,
          title: formData.title,
          titleDate: formData.titleDate,
          department: formData.department,
          subject: formData.subjects.split('、')[0] || '',
          teachableSubjects: formData.subjects.split('、').filter(s => s.trim()),
        }),
        updateTeacherRole({
          teacherId: teacherId,
          primaryRole: formData.primaryRole,
          additionalRoles: formData.additionalRoles,
          primarySubject: formData.subjects.split('、')[0] || '',
          secondarySubjects: formData.subjects.split('、').slice(1).filter(s => s.trim()),
          totalWeeklyHours: formData.weeklyHours,
          teachableGrades: formData.teachableGrades,
        } as TeacherRoleConfig),
      ]);
      
      if (basicSuccess && roleSuccess) {
        setIsEditing(false);
        toast.success('保存成功');
        refetch(); // 刷新数据
      } else {
        toast.error('保存失败，请重试');
      }
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    // 重置表单数据
    if (teacher) {
      setFormData({
        name: teacher.name ?? '',
        gender: teacher.gender ?? '男',
        birthDate: teacher.birthDate ?? '',
        ethnicity: teacher.ethnicity ?? '',
        politicalStatus: teacher.politicalStatus ?? '',
        nativePlace: teacher.nativePlace ?? '',
        phone: teacher.phone ?? '',
        email: teacher.email ?? '',
        emergencyContact: teacher.emergencyContact ?? '',
        emergencyPhone: teacher.emergencyPhone ?? '',
        address: teacher.address ?? '',
        education: teacher.education ?? '',
        school: teacher.school ?? '',
        major: teacher.major ?? '',
        graduationDate: teacher.graduationDate ?? '',
        title: teacher.title ?? '',
        titleDate: teacher.titleDate ?? '',
        department: teacher.department ?? '',
        subjects: teacher.teachableSubjects?.join('、') ?? teacher.subject ?? '',
        status: (teacher.status === 'active' || teacher.status === 'on_leave' || teacher.status === 'retired' || teacher.status === 'transferred') 
          ? teacher.status 
          : 'active',
        primaryRole: teacher.primaryRole ?? 'subject_teacher',
        additionalRoles: teacher.additionalRoles ?? [],
        weeklyHours: teacher.weeklyHours ?? 13,
        teachableGrades: teacher.teachableGrades ?? [1, 2, 3, 4, 5, 6],
      });
    }
    setIsEditing(false);
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
        if (success) setHonors(prev => prev.filter(h => h.id !== id));
        break;
      case 'training':
        success = await deleteTraining(id);
        if (success) setTrainings(prev => prev.filter(t => t.id !== id));
        break;
      case 'achievement':
        success = await deleteAchievement(id);
        if (success) setAchievements(prev => prev.filter(a => a.id !== id));
        break;
      case 'record':
        success = await deleteRecord(id);
        if (success) setRecords(prev => prev.filter(r => r.id !== id));
        break;
    }
    
    if (success) {
      toast.success('删除成功');
    } else {
      toast.error('删除失败');
    }
  };

  // 对话框保存成功
  const handleDialogSuccess = () => {
    toast.success('保存成功');
    loadTeacherDetails(); // 刷新详情数据
  };

  // 加载中状态
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

  // 错误状态
  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">教师不存在</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 返回按钮和操作区 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              编辑信息
            </Button>
          )}
        </div>
      </div>

      {/* 教师基本信息卡片 */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {teacher.name.charAt(0)}
              </div>
            </div>
            
            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="text-2xl font-bold w-48"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold">{teacher.name}</h1>
                  )}
                  <p className="text-muted-foreground mt-1">{teacher.title} · {teacher.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Select value={formData.status} onValueChange={(v) => handleFieldChange('status', v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">在职</SelectItem>
                        <SelectItem value="on_leave">请假</SelectItem>
                        <SelectItem value="retired">退休</SelectItem>
                        <SelectItem value="transferred">调离</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(teacher.status)
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span>工号：{teacher.employeeId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {isEditing ? (
                    <Select value={formData.gender} onValueChange={(v) => handleFieldChange('gender', v)}>
                      <SelectTrigger className="w-20 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{teacher.gender} · {teacher.ethnicity}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="h-6 text-xs w-32"
                    />
                  ) : (
                    <span>{teacher.phone}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="h-6 text-xs w-48"
                    />
                  ) : (
                    <span>{teacher.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{teacher.education} · {teacher.major}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>教龄 {teacher.teachYears} 年</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {isEditing ? (
                    <Input
                      value={formData.subjects}
                      onChange={(e) => handleFieldChange('subjects', e.target.value)}
                      placeholder="多个学科用顿号分隔"
                      className="h-6 text-xs w-32"
                    />
                  ) : (
                    <span>任教学科：{teacher.teachableSubjects?.join('、') || teacher.subject}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    当前任教年级：{teacher.currentTeachingGrades && teacher.currentTeachingGrades.length > 0 
                      ? teacher.currentTeachingGrades.map(g => `${g}年级`).join('、') 
                      : '未安排'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>入职：{teacher.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详情标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border rounded-lg p-1">
          <TabsTrigger value="overview">个人概览</TabsTrigger>
          <TabsTrigger value="honors">荣誉奖项</TabsTrigger>
          <TabsTrigger value="trainings">培训记录</TabsTrigger>
          <TabsTrigger value="achievements">教学成果</TabsTrigger>
          <TabsTrigger value="records">成长档案</TabsTrigger>
        </TabsList>

        {/* 个人概览 */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本信息详情 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">姓名</Label>
                    {isEditing ? (
                      <Input value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">性别</Label>
                    {isEditing ? (
                      <Select value={formData.gender} onValueChange={(v) => handleFieldChange('gender', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="男">男</SelectItem>
                          <SelectItem value="女">女</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{teacher.gender}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">出生日期</Label>
                    {isEditing ? (
                      <DatePicker
                        value={formData.birthDate}
                        onChange={(v) => handleFieldChange('birthDate', v)}
                        placeholder="选择出生日期"
                      />
                    ) : (
                      <p className="font-medium">{teacher.birthDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">民族</Label>
                    {isEditing ? (
                      <Input value={formData.ethnicity} onChange={(e) => handleFieldChange('ethnicity', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.ethnicity}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">政治面貌</Label>
                    {isEditing ? (
                      <Select value={formData.politicalStatus} onValueChange={(v) => handleFieldChange('politicalStatus', v)}>
                        <SelectTrigger>
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
                      <p className="font-medium">{teacher.politicalStatus}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">籍贯</Label>
                    {isEditing ? (
                      <Input value={formData.nativePlace} onChange={(e) => handleFieldChange('nativePlace', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.nativePlace}</p>
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
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">联系电话</Label>
                    {isEditing ? (
                      <Input value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">电子邮箱</Label>
                    {isEditing ? (
                      <Input value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">紧急联系人</Label>
                    {isEditing ? (
                      <Input value={formData.emergencyContact} onChange={(e) => handleFieldChange('emergencyContact', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.emergencyContact}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">紧急联系电话</Label>
                    {isEditing ? (
                      <Input value={formData.emergencyPhone} onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.emergencyPhone}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">家庭住址</Label>
                    {isEditing ? (
                      <Textarea value={formData.address} onChange={(e) => handleFieldChange('address', e.target.value)} rows={2} />
                    ) : (
                      <p className="font-medium">{teacher.address}</p>
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
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">学历</Label>
                    {isEditing ? (
                      <Select value={formData.education} onValueChange={(v) => handleFieldChange('education', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="专科">专科</SelectItem>
                          <SelectItem value="本科">本科</SelectItem>
                          <SelectItem value="硕士">硕士</SelectItem>
                          <SelectItem value="博士">博士</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{teacher.education}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">职称</Label>
                    {isEditing ? (
                      <Select value={formData.title} onValueChange={(v) => handleFieldChange('title', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="二级教师">二级教师</SelectItem>
                          <SelectItem value="一级教师">一级教师</SelectItem>
                          <SelectItem value="高级教师">高级教师</SelectItem>
                          <SelectItem value="正高级教师">正高级教师</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{teacher.title}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">毕业院校</Label>
                    {isEditing ? (
                      <Input value={formData.school} onChange={(e) => handleFieldChange('school', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.school}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">专业</Label>
                    {isEditing ? (
                      <Input value={formData.major} onChange={(e) => handleFieldChange('major', e.target.value)} />
                    ) : (
                      <p className="font-medium">{teacher.major}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">毕业时间</Label>
                    {isEditing ? (
                      <MonthPicker
                        value={formData.graduationDate}
                        onChange={(v) => handleFieldChange('graduationDate', v)}
                        placeholder="选择毕业时间"
                      />
                    ) : (
                      <p className="font-medium">{teacher.graduationDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">职称取得时间</Label>
                    {isEditing ? (
                      <DatePicker
                        value={formData.titleDate}
                        onChange={(v) => handleFieldChange('titleDate', v)}
                        placeholder="选择职称取得时间"
                      />
                    ) : (
                      <p className="font-medium">{teacher.titleDate}</p>
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
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">工号</Label>
                    <p className="font-medium">{teacher.employeeId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">教研组</Label>
                    {isEditing ? (
                      <Select value={formData.department} onValueChange={(v) => handleFieldChange('department', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="语文组">语文组</SelectItem>
                          <SelectItem value="数学组">数学组</SelectItem>
                          <SelectItem value="英语组">英语组</SelectItem>
                          <SelectItem value="科学组">科学组</SelectItem>
                          <SelectItem value="音乐组">音乐组</SelectItem>
                          <SelectItem value="体育组">体育组</SelectItem>
                          <SelectItem value="美术组">美术组</SelectItem>
                          <SelectItem value="信息组">信息组</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{teacher.department}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">任教学科</Label>
                    {isEditing ? (
                      <Input value={formData.subjects} onChange={(e) => handleFieldChange('subjects', e.target.value)} placeholder="多个学科用顿号分隔" />
                    ) : (
                      <p className="font-medium">{teacher.teachableSubjects?.join('、') || teacher.subject}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">当前任教年级</Label>
                    <p className="font-medium">
                      {teacher.currentTeachingGrades && teacher.currentTeachingGrades.length > 0 
                        ? teacher.currentTeachingGrades.map(g => `${g}年级`).join('、') 
                        : '未安排'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">教龄</Label>
                    <p className="font-medium">{teacher.teachYears} 年</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">入职时间</Label>
                    <p className="font-medium">{teacher.joinDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">是否班主任</Label>
                    <p className="font-medium">{teacher.isHeadTeacher ? `是（${teacher.headTeacherClassName || '未分配班级'}）` : '否'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 角色与课时配置 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  角色与课时配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 角色信息 */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">角色身份</Label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <Select 
                        value={formData.primaryRole} 
                        onValueChange={(v) => handleFieldChange('primaryRole', v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal">校长</SelectItem>
                          <SelectItem value="secretary">书记</SelectItem>
                          <SelectItem value="academic_vice_principal">教学副校长</SelectItem>
                          <SelectItem value="moral_vice_principal">德育副校长</SelectItem>
                          <SelectItem value="general_vice_principal">总务副校长</SelectItem>
                          <SelectItem value="head_teacher">班主任</SelectItem>
                          <SelectItem value="subject_teacher">科任教师</SelectItem>
                          <SelectItem value="skill_teacher">技能课教师</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">兼任职务</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ADMINISTRATIVE_ROLE_LABELS).map(([role, label]) => (
                            <label key={role} className="flex items-center gap-1.5 px-2 py-1 rounded border hover:bg-muted/50 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={formData.additionalRoles.includes(role as AdministrativeRole)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleFieldChange('additionalRoles', [...formData.additionalRoles, role as AdministrativeRole] as AdministrativeRole[]);
                                  } else {
                                    handleFieldChange('additionalRoles', formData.additionalRoles.filter(r => r !== role) as AdministrativeRole[]);
                                  }
                                }}
                                className="rounded"
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`text-sm px-3 py-1 ${TEACHER_ROLE_COLORS[teacher.primaryRole]?.bg || 'bg-gray-100'} ${TEACHER_ROLE_COLORS[teacher.primaryRole]?.text || 'text-gray-700'}`}>
                        {TEACHER_ROLE_LABELS[teacher.primaryRole] || teacher.primaryRole}
                      </Badge>
                      {teacher.additionalRoles && teacher.additionalRoles.length > 0 && (
                        teacher.additionalRoles.map((role, idx) => (
                          <Badge key={idx} variant="outline" className={`text-sm px-3 py-1 ${ADMINISTRATIVE_ROLE_COLORS[role as AdministrativeRole]?.bg || ''} ${ADMINISTRATIVE_ROLE_COLORS[role as AdministrativeRole]?.text || ''} border-0`}>
                            {ADMINISTRATIVE_ROLE_LABELS[role as AdministrativeRole] || role}（兼）
                          </Badge>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* 课时配置 */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label className="text-muted-foreground text-sm">周课时量</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={formData.weeklyHours}
                        onChange={(e) => handleFieldChange('weeklyHours', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold">{teacher.weeklyHours}</span>
                        <span className="text-muted-foreground">节/周</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">已安排课时</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xl font-bold ${
                        teacher.currentHours > teacher.weeklyHours ? 'text-red-600' :
                        teacher.currentHours === teacher.weeklyHours ? 'text-green-600' :
                        'text-gray-900'
                      }`}>{teacher.currentHours}</span>
                      <span className="text-muted-foreground">节</span>
                      {teacher.currentHours > teacher.weeklyHours && (
                        <Badge className="bg-red-100 text-red-700 text-xs">超课时</Badge>
                      )}
                      {teacher.currentHours === teacher.weeklyHours && (
                        <Badge className="bg-green-100 text-green-700 text-xs">已满</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">可任教科目</Label>
                    {isEditing ? (
                      <Input
                        value={formData.subjects}
                        onChange={(e) => handleFieldChange('subjects', e.target.value)}
                        placeholder="多个学科用顿号分隔"
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.teachableSubjects && teacher.teachableSubjects.length > 0 ? (
                          teacher.teachableSubjects.map((subject, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">未设置</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">可任教年级</Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {[1, 2, 3, 4, 5, 6].map((grade) => (
                          <label key={grade} className="flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted/50 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={formData.teachableGrades.includes(grade)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFieldChange('teachableGrades', [...formData.teachableGrades, grade].sort() as number[]);
                                } else {
                                  handleFieldChange('teachableGrades', formData.teachableGrades.filter(g => g !== grade) as number[]);
                                }
                              }}
                              className="rounded"
                            />
                            {grade}年级
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.teachableGrades && teacher.teachableGrades.length > 0 ? (
                          teacher.teachableGrades.map((grade, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {grade}年级
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">未设置</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 部门设置 */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  部门设置
                </CardTitle>
                <CardDescription>
                  归入部门后，将继承部门负责人权限（如归入教务处可获得教务管理权限）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingGroups ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(GROUP_CONFIGS).map(([type, config]) => {
                      const isInGroup = userGroups.some(g => g.groupType === type);
                      const groupInfo = userGroups.find(g => g.groupType === type);
                      const isAuto = groupInfo?.joinType === 'auto';
                      
                      return (
                        <div 
                          key={type}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isInGroup ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isInGroup ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                            <div>
                              <p className="font-medium text-sm">{config.name}</p>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAuto && (
                              <Badge variant="outline" className="text-xs">自动</Badge>
                            )}
                            {isInGroup ? (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                已归入
                              </Badge>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                  const currentTypes = userGroups.map(g => g.groupType);
                                  const newTypes = [...currentTypes, type as GroupType];
                                  await updateUserGroups(newTypes);
                                }}
                              >
                                归入
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {userGroups.length > 0 && (
                      <div className="pt-2 text-xs text-muted-foreground">
                        <p>💡 归入部门后，将自动获得该部门对应模块的管理权限</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 统计概览 */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">数据概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{honors.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">荣誉奖项</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{trainings.filter(t => t.status === '已完成').length}</div>
                  <div className="text-sm text-muted-foreground mt-1">培训完成</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{achievements.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">教学成果</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{trainings.reduce((sum, t) => sum + (t.hours || 0), 0)}</div>
                  <div className="text-sm text-muted-foreground mt-1">培训学时</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{honors.filter(h => h.level === '省级' || h.level === '国家级').length}</div>
                  <div className="text-sm text-muted-foreground mt-1">省级以上荣誉</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 荣誉奖项 */}
        <TabsContent value="honors" className="space-y-4 mt-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  荣誉奖项
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddDialog('honor')}>
                  <Plus className="h-4 w-4" />
                  添加荣誉
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {honors.map(honor => (
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
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('honor', honor as unknown as EditItem)}>编辑</Button>
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
                {trainings.map(training => (
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
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('training', training as unknown as EditItem)}>编辑</Button>
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
                {achievements.map(achievement => (
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
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('achievement', achievement as unknown as EditItem)}>编辑</Button>
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
                  <FileText className="h-5 w-5 text-primary" />
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
                  {records.sort((a, b) => b.date.localeCompare(a.date)).map(record => {
                    const typeInfo = getRecordTypeInfo(record.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={record.id} className="relative flex items-start gap-4 pl-10">
                        {/* 时间线节点 */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full bg-background border-2 border-border`}></div>
                        
                        <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                              <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                              <span className="font-medium">{record.title}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog('record', record as unknown as EditItem)}>编辑</Button>
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
      <TeacherProfileDialogs
        teacherId={teacherId}
        type={dialogType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        editItem={editItem}
      />
    </div>
  );
}
