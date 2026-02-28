'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  Home,
  Award,
  BookOpen,
  TrendingUp,
  Clock,
  FileText,
  Edit,
  Save,
  X,
  Loader2,
  Star,
  Target,
  Heart,
  Trophy,
  Activity,
} from 'lucide-react';
import { useStudentFullProfile } from '@/hooks/useStudentData';
import { StudentFullProfile, Parent } from '@/types';
import { toast } from 'sonner';
import { HabitTabContent } from '@/components/student/habit-tab-content';
import { MoralTabContent } from '@/components/student/moral-tab-content';

// 获取性别显示
const getGenderDisplay = (gender: string) => {
  return gender === 'male' ? { label: '男', icon: '👨', color: 'text-blue-600', bg: 'bg-blue-50' }
    : { label: '女', icon: '👩', color: 'text-pink-600', bg: 'bg-pink-50' };
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '在校': 'bg-green-100 text-green-700',
    '请假': 'bg-yellow-100 text-yellow-700',
    '休学': 'bg-red-100 text-red-700',
    '毕业': 'bg-blue-100 text-blue-700',
    '转学': 'bg-gray-100 text-gray-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

// 获取荣誉级别颜色
const getHonorLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '国家级': 'text-red-600 bg-red-50',
    '省级': 'text-purple-600 bg-purple-50',
    '市级': 'text-blue-600 bg-blue-50',
    '区级': 'text-green-600 bg-green-50',
    '校级': 'text-orange-600 bg-orange-50',
    '班级': 'text-gray-600 bg-gray-50',
  };
  return colorMap[level] || 'text-gray-600 bg-gray-50';
};

// 获取成绩等级颜色
const getGradeColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '优秀': 'text-green-600',
    '良好': 'text-blue-600',
    '合格': 'text-yellow-600',
    '待提高': 'text-red-600',
  };
  return colorMap[level] || 'text-gray-600';
};

interface PageProps {
  params: Promise<{ id: string }>;
}

// 年级选项
const gradeOptions = [
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
];

// 学生类型选项
const studentTypeOptions = [
  { value: '普通', label: '普通' },
  { value: '随迁子女', label: '随迁子女' },
  { value: '留守儿童', label: '留守儿童' },
  { value: '残疾学生', label: '残疾学生' },
  { value: '低保家庭', label: '低保家庭' },
];

// 学生状态选项
const studentStatusOptions = [
  { value: '在校', label: '在校' },
  { value: '请假', label: '请假' },
  { value: '休学', label: '休学' },
  { value: '毕业', label: '毕业' },
  { value: '转学', label: '转学' },
];

// 家庭类型选项
const familyTypeOptions = [
  { value: '核心家庭', label: '核心家庭' },
  { value: '单亲家庭', label: '单亲家庭' },
  { value: '重组家庭', label: '重组家庭' },
  { value: '隔代家庭', label: '隔代家庭' },
  { value: '其他', label: '其他' },
];

// 政治面貌选项
const politicalStatusOptions = ['少先队员', '共青团员', '群众'];

export default function StudentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const { data: profile, loading, error, refetch, updateProfile } = useStudentFullProfile(id);
  
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 班级列表
  const [classes, setClasses] = useState<{ id: string; name: string; grade: number; headTeacherName: string }[]>([]);
  
  // 编辑表单数据 - 包含所有可编辑字段
  const [formData, setFormData] = useState({
    // 个人信息
    name: '',
    gender: 'male' as 'male' | 'female',
    birthDate: '',
    ethnicity: '',
    nativePlace: '',
    politicalStatus: '',
    // 学籍信息
    studentNo: '',
    classId: '',
    className: '',
    grade: 1,
    gradeName: '一年级',
    headTeacherName: '',
    enrollmentDate: '',
    studentType: '' as '' | '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭',
    status: '在校' as '在校' | '请假' | '休学' | '毕业' | '转学',
    // 联系信息
    phone: '',
    address: '',
    homeAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    // 家庭信息
    familyType: '' as '' | '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他',
    // 家长信息
    parents: [] as Parent[],
  });
  
  // 家长编辑对话框状态
  const [parentDialogOpen, setParentDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [parentFormData, setParentFormData] = useState({
    id: '',
    name: '',
    relationship: '父亲' as '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他',
    phone: '',
    isPrimary: false,
    wechat: '',
  });

  // 获取班级列表
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes?pageSize=100');
        const result = await response.json();
        if (result.success) {
          setClasses(result.data.map((c: { id: string; name: string; grade: number; headTeacherName: string }) => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
            headTeacherName: c.headTeacherName,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setFormData({
        // 个人信息
        name: profile.name || '',
        gender: profile.gender || 'male',
        birthDate: profile.birthDate || '',
        ethnicity: profile.ethnicity || '',
        nativePlace: profile.nativePlace || '',
        politicalStatus: profile.politicalStatus || '',
        // 学籍信息
        studentNo: profile.studentNo || '',
        classId: profile.classId || '',
        className: profile.className || '',
        grade: profile.grade || 1,
        gradeName: profile.gradeName || '一年级',
        headTeacherName: profile.headTeacherName || '',
        enrollmentDate: profile.enrollmentDate || '',
        studentType: profile.studentType || '',
        status: profile.status || '在校',
        // 联系信息
        phone: profile.phone || '',
        address: profile.address || '',
        homeAddress: profile.homeAddress || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        // 家庭信息
        familyType: profile.familyType || '',
        // 家长信息
        parents: profile.parents || [],
      });
    }
  }, [profile]);
  
  // 处理班级变更
  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find(c => c.id === classId);
    if (selectedClass) {
      const gradeName = gradeOptions.find(g => g.value === selectedClass.grade)?.label || '一年级';
      setFormData(prev => ({
        ...prev,
        classId: selectedClass.id,
        className: selectedClass.name,
        grade: selectedClass.grade,
        gradeName,
        headTeacherName: selectedClass.headTeacherName,
      }));
    }
  };

  // 保存基本信息
  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    
    // 过滤空字符串，转换为正确的类型
    const updateData: Partial<StudentFullProfile> = {
      name: formData.name || undefined,
      gender: formData.gender,
      birthDate: formData.birthDate || undefined,
      ethnicity: formData.ethnicity || undefined,
      nativePlace: formData.nativePlace || undefined,
      politicalStatus: formData.politicalStatus || undefined,
      studentNo: formData.studentNo || undefined,
      classId: formData.classId || undefined,
      className: formData.className || undefined,
      grade: formData.grade,
      gradeName: formData.gradeName || undefined,
      headTeacherName: formData.headTeacherName || undefined,
      enrollmentDate: formData.enrollmentDate || undefined,
      studentType: formData.studentType || undefined,
      status: formData.status,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      homeAddress: formData.homeAddress || undefined,
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined,
      familyType: formData.familyType || undefined,
      parents: formData.parents,
    };
    
    const success = await updateProfile(updateData);
    
    if (success) {
      toast.success('信息已保存');
      setIsEditing(false);
    } else {
      toast.error('保存失败，请重试');
    }
    setIsSaving(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        // 个人信息
        name: profile.name || '',
        gender: profile.gender || 'male',
        birthDate: profile.birthDate || '',
        ethnicity: profile.ethnicity || '',
        nativePlace: profile.nativePlace || '',
        politicalStatus: profile.politicalStatus || '',
        // 学籍信息
        studentNo: profile.studentNo || '',
        classId: profile.classId || '',
        className: profile.className || '',
        grade: profile.grade || 1,
        gradeName: profile.gradeName || '一年级',
        headTeacherName: profile.headTeacherName || '',
        enrollmentDate: profile.enrollmentDate || '',
        studentType: profile.studentType || '',
        status: profile.status || '在校',
        // 联系信息
        phone: profile.phone || '',
        address: profile.address || '',
        homeAddress: profile.homeAddress || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        // 家庭信息
        familyType: profile.familyType || '',
        // 家长信息
        parents: profile.parents || [],
      });
    }
    setIsEditing(false);
  };

  // 家长编辑相关函数
  const handleAddParent = () => {
    setEditingParent(null);
    setParentFormData({
      id: `parent-${Date.now()}`,
      name: '',
      relationship: '父亲',
      phone: '',
      isPrimary: formData.parents.length === 0,
      wechat: '',
    });
    setParentDialogOpen(true);
  };

  const handleEditParent = (parent: Parent) => {
    setEditingParent(parent);
    setParentFormData({
      id: parent.id,
      name: parent.name,
      relationship: parent.relationship,
      phone: parent.phone,
      isPrimary: parent.isPrimary,
      wechat: parent.wechat || '',
    });
    setParentDialogOpen(true);
  };

  const handleDeleteParent = (parentId: string) => {
    const newParents = formData.parents.filter(p => p.id !== parentId);
    // 如果删除的是主要联系人，自动设置第一个为主要联系人
    if (newParents.length > 0 && !newParents.some(p => p.isPrimary)) {
      newParents[0].isPrimary = true;
    }
    setFormData(prev => ({ ...prev, parents: newParents }));
    toast.success('家长已删除');
  };

  const handleSaveParent = () => {
    if (!parentFormData.name.trim()) {
      toast.error('请输入家长姓名');
      return;
    }
    if (!parentFormData.phone.trim()) {
      toast.error('请输入联系电话');
      return;
    }

    let newParents: Parent[];
    if (editingParent) {
      // 编辑模式
      newParents = formData.parents.map(p => 
        p.id === editingParent.id ? { ...parentFormData } as Parent : p
      );
    } else {
      // 添加模式
      newParents = [...formData.parents, { ...parentFormData } as Parent];
    }

    // 如果设置为主要联系人，取消其他人的主要联系人标记
    if (parentFormData.isPrimary) {
      newParents = newParents.map(p => ({
        ...p,
        isPrimary: p.id === parentFormData.id,
      }));
    }

    setFormData(prev => ({ ...prev, parents: newParents }));
    setParentDialogOpen(false);
    toast.success(editingParent ? '家长信息已更新' : '家长已添加');
  };

  // 加载状态
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
  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">加载失败，请刷新页面重试</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const genderDisplay = getGenderDisplay(profile.gender);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <User className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">学生档案</h1>
            </div>
            <p className="text-muted-foreground mt-1">查看和管理学生完整信息</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? '保存中...' : '保存修改'}
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

      {/* 个人信息卡片 */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0 text-center">
              <div className={`w-32 h-32 rounded-full ${genderDisplay.bg} flex items-center justify-center text-6xl shadow-lg mx-auto`}>
                {genderDisplay.icon}
              </div>
              <Badge className={`mt-3 ${getStatusColor(profile.status)}`}>
                {profile.status}
              </Badge>
            </div>
            
            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-muted-foreground mt-1">
                    {profile.gradeName} · {profile.className}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>学号：{profile.studentNo}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className={genderDisplay.color}>{genderDisplay.label}</span>
                  {profile.ethnicity && <span>· {profile.ethnicity}</span>}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{profile.birthDate}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {isEditing ? (
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-6 text-xs w-32"
                    />
                  ) : (
                    <span>{profile.phone || '未填写'}</span>
                  )}
                </div>
              </div>

              {/* 统计概览 */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profile.honors?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">荣誉奖项</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {profile.habitProfile?.habitStarCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">习惯之星</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {profile.attendanceStats?.attendanceRate?.toFixed(1) || 100}%
                  </div>
                  <div className="text-xs text-muted-foreground">出勤率</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {profile.academicRecords?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">成绩记录</div>
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
          <TabsTrigger value="family">家庭信息</TabsTrigger>
          <TabsTrigger value="academic">学业记录</TabsTrigger>
          <TabsTrigger value="honors">荣誉奖项</TabsTrigger>
          <TabsTrigger value="growth">成长档案</TabsTrigger>
          <TabsTrigger value="habit">习惯养成</TabsTrigger>
          <TabsTrigger value="moral">德育表现</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  个人信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">姓名</span>
                  {isEditing ? (
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span className="font-medium">{profile.name}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">性别</span>
                  {isEditing ? (
                    <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v as 'male' | 'female' }))}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男</SelectItem>
                        <SelectItem value="female">女</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={genderDisplay.color}>{genderDisplay.label}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">出生日期</span>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={formData.birthDate} 
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span>{profile.birthDate}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">民族</span>
                  {isEditing ? (
                    <Input 
                      value={formData.ethnicity} 
                      onChange={(e) => setFormData(prev => ({ ...prev, ethnicity: e.target.value }))}
                      className="h-8 w-40"
                      placeholder="如：汉族"
                    />
                  ) : (
                    <span>{profile.ethnicity || '-'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">籍贯</span>
                  {isEditing ? (
                    <Input 
                      value={formData.nativePlace} 
                      onChange={(e) => setFormData(prev => ({ ...prev, nativePlace: e.target.value }))}
                      className="h-8 w-40"
                      placeholder="如：福建龙岩"
                    />
                  ) : (
                    <span>{profile.nativePlace || '-'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">政治面貌</span>
                  {isEditing ? (
                    <Select value={formData.politicalStatus} onValueChange={(v) => setFormData(prev => ({ ...prev, politicalStatus: v }))}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue placeholder="选择" />
                      </SelectTrigger>
                      <SelectContent>
                        {politicalStatusOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{profile.politicalStatus || '-'}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  学籍信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">学号</span>
                  {isEditing ? (
                    <Input 
                      value={formData.studentNo} 
                      onChange={(e) => setFormData(prev => ({ ...prev, studentNo: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span className="font-medium">{profile.studentNo}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">年级</span>
                  {isEditing ? (
                    <span className="font-medium text-primary">{formData.gradeName}</span>
                  ) : (
                    <span>{formData.gradeName || profile.gradeName}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">班级</span>
                  {isEditing ? (
                    <Select value={formData.classId} onValueChange={handleClassChange}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="选择班级" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{formData.className || profile.className}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">班主任</span>
                  {isEditing ? (
                    <span className="font-medium text-primary">{formData.headTeacherName || '-'}</span>
                  ) : (
                    <span>{formData.headTeacherName || profile.headTeacherName || '-'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">入学日期</span>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={formData.enrollmentDate} 
                      onChange={(e) => setFormData(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span>{profile.enrollmentDate || '-'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">学生类型</span>
                  {isEditing ? (
                    <Select value={formData.studentType} onValueChange={(v) => setFormData(prev => ({ ...prev, studentType: v as any }))}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue placeholder="选择" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentTypeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{profile.studentType || '普通'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">状态</span>
                  {isEditing ? (
                    <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {studentStatusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(profile.status)}>{profile.status}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  联系信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">联系电话</span>
                  {isEditing ? (
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span>{profile.phone || '未填写'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">家庭地址</span>
                  {isEditing ? (
                    <Input 
                      value={formData.address} 
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span>{profile.address || '未填写'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">紧急联系人</span>
                  {isEditing ? (
                    <Input 
                      value={formData.emergencyContact} 
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span>{profile.emergencyContact || '未填写'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">紧急联系电话</span>
                  {isEditing ? (
                    <Input 
                      value={formData.emergencyPhone} 
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      className="h-8 w-40"
                    />
                  ) : (
                    <span>{profile.emergencyPhone || '未填写'}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {profile.attendanceStats && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    出勤统计
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">出勤率</span>
                    <span className="text-2xl font-bold text-primary">
                      {profile.attendanceStats.attendanceRate}%
                    </span>
                  </div>
                  <Progress value={profile.attendanceStats.attendanceRate} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">应到</span>
                      <span>{profile.attendanceStats.totalDays}天</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">实到</span>
                      <span className="text-green-600">{profile.attendanceStats.presentDays}天</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">缺勤</span>
                      <span className="text-red-600">{profile.attendanceStats.absentDays}天</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">迟到</span>
                      <span className="text-yellow-600">{profile.attendanceStats.lateDays}天</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 家庭信息 */}
        <TabsContent value="family" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                家庭信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-muted-foreground">家庭类型：</span>
                {isEditing ? (
                  <Select value={formData.familyType} onValueChange={(v) => setFormData(prev => ({ ...prev, familyType: v as any }))}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{profile.familyType || '未设置'}</Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">家长信息</h4>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={handleAddParent}>
                      <Users className="h-4 w-4 mr-1" />
                      添加家长
                    </Button>
                  )}
                </div>
                {(isEditing ? formData.parents : profile.parents)?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(isEditing ? formData.parents : profile.parents).map((parent) => (
                      <div key={parent.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{parent.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{parent.relationship}</Badge>
                            {parent.isPrimary && (
                              <Badge className="bg-primary/10 text-primary">主要联系人</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {parent.phone}
                        </div>
                        {parent.wechat && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            微信：{parent.wechat}
                          </div>
                        )}
                        {isEditing && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button size="sm" variant="ghost" onClick={() => handleEditParent(parent)}>
                              编辑
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteParent(parent.id)}>
                              删除
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无家长信息</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 学业记录 */}
        <TabsContent value="academic" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                学业记录
              </CardTitle>
              <CardDescription>考试成绩与学业表现</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.academicRecords?.length > 0 ? (
                <div className="space-y-4">
                  {/* 按学期分组 */}
                  {Object.entries(
                    profile.academicRecords.reduce((acc, record) => {
                      if (!acc[record.semester]) acc[record.semester] = [];
                      acc[record.semester].push(record);
                      return acc;
                    }, {} as Record<string, typeof profile.academicRecords>)
                  ).map(([semester, records]) => (
                    <div key={semester}>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {semester}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {records.map((record) => (
                          <div key={record.id} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{record.subject}</span>
                              <Badge variant="outline">{record.examType}</Badge>
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                {record.score !== undefined && (
                                  <span className="text-2xl font-bold">{record.score}</span>
                                )}
                                {record.level && (
                                  <span className={`ml-2 ${getGradeColor(record.level)}`}>
                                    {record.level}
                                  </span>
                                )}
                              </div>
                              {record.classRank && (
                                <span className="text-sm text-muted-foreground">
                                  班级第{record.classRank}名
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无学业记录</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 荣誉奖项 */}
        <TabsContent value="honors" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                荣誉奖项
              </CardTitle>
              <CardDescription>获得的荣誉与表彰</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.honors?.length > 0 ? (
                <div className="space-y-3">
                  {profile.honors.map((honor) => (
                    <div key={honor.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className={`p-2 rounded-lg ${getHonorLevelColor(honor.level)}`}>
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{honor.title}</span>
                          <Badge className={getHonorLevelColor(honor.level)}>{honor.level}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {honor.issuer && <span>{honor.issuer} · </span>}
                          {honor.date}
                          {honor.category && <span> · {honor.category}类</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无荣誉记录</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成长档案 */}
        <TabsContent value="growth" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                成长档案
              </CardTitle>
              <CardDescription>重要事件与成长轨迹</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.growthRecords?.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-4">
                    {profile.growthRecords.map((record, index) => (
                      <div key={record.id} className="relative pl-10">
                        <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-primary" />
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{record.title}</span>
                            <Badge variant="outline">{record.type}</Badge>
                          </div>
                          {record.description && (
                            <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{record.date}</span>
                            {record.operator && <span>操作人：{record.operator}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无成长记录</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 习惯养成 */}
        <TabsContent value="habit" className="space-y-4 mt-4">
          <HabitTabContent profile={profile} />
        </TabsContent>

        {/* 德育表现 */}
        <TabsContent value="moral" className="space-y-4 mt-4">
          <MoralTabContent 
            profile={profile} 
            canViewWarnings={true}
          />
        </TabsContent>
      </Tabs>

      {/* 家长编辑对话框 */}
      <Dialog open={parentDialogOpen} onOpenChange={setParentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingParent ? '编辑家长信息' : '添加家长'}</DialogTitle>
            <DialogDescription>
              {editingParent ? '修改家长的联系方式和其他信息' : '添加新的家长信息'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent-name" className="text-right">姓名 *</Label>
              <Input
                id="parent-name"
                value={parentFormData.name}
                onChange={(e) => setParentFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="请输入家长姓名"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent-relation" className="text-right">关系</Label>
              <Select
                value={parentFormData.relationship}
                onValueChange={(v) => setParentFormData(prev => ({ ...prev, relationship: v as any }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择关系" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="父亲">父亲</SelectItem>
                  <SelectItem value="母亲">母亲</SelectItem>
                  <SelectItem value="爷爷">爷爷</SelectItem>
                  <SelectItem value="奶奶">奶奶</SelectItem>
                  <SelectItem value="外公">外公</SelectItem>
                  <SelectItem value="外婆">外婆</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent-phone" className="text-right">电话 *</Label>
              <Input
                id="parent-phone"
                value={parentFormData.phone}
                onChange={(e) => setParentFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="col-span-3"
                placeholder="请输入联系电话"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent-wechat" className="text-right">微信</Label>
              <Input
                id="parent-wechat"
                value={parentFormData.wechat}
                onChange={(e) => setParentFormData(prev => ({ ...prev, wechat: e.target.value }))}
                className="col-span-3"
                placeholder="微信号（选填）"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">主要联系人</Label>
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parent-primary"
                  checked={parentFormData.isPrimary}
                  onChange={(e) => setParentFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="parent-primary" className="text-sm text-muted-foreground">
                  设为主要联系人（将自动取消其他家长的主要联系人标记）
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParentDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveParent}>{editingParent ? '保存修改' : '添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
