'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { StudentFullProfile, Parent } from '@/types';
import { toast } from 'sonner';

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

interface PageProps {
  params: Promise<{ id: string }>;
}

// 家庭类型选项
const familyTypeOptions = [
  { value: '核心家庭', label: '核心家庭' },
  { value: '单亲家庭', label: '单亲家庭' },
  { value: '重组家庭', label: '重组家庭' },
  { value: '隔代家庭', label: '隔代家庭' },
  { value: '其他', label: '其他' },
];

export default function StudentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const { user } = useAuth();
  const { isHeadTeacher } = usePermissions();

  // 使用 useStudents hook 获取学生档案
  const { 
    fetchStudentProfile, 
    updateStudent, 
    getStudentById 
  } = useStudents();
  
  const [profile, setProfile] = useState<StudentFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载学生档案
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      const result = await fetchStudentProfile(id);
      if (result) {
        setProfile(result);
      } else {
        setError('获取学生档案失败');
      }
      setLoading(false);
    };
    loadProfile();
  }, [id, fetchStudentProfile]);

  // 刷新数据
  const refetch = async () => {
    const result = await fetchStudentProfile(id);
    if (result) {
      setProfile(result);
    }
  };

  // 更新档案
  const updateProfile = async (data: Partial<StudentFullProfile>) => {
    return await updateStudent(id, data);
  };

  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // 编辑表单数据
  const [formData, setFormData] = useState({
    // 个人信息
    name: '',
    gender: 'male' as 'male' | 'female',
    birthDate: '',
    ethnicity: '',
    nativePlace: '',
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

  // 权限检查
  useEffect(() => {
    if (user && !isHeadTeacher()) {
      toast.error('您不是班主任，无法访问此页面');
      router.push('/teacher/class');
    }
  }, [user, isHeadTeacher, router]);

  // 检查是否是该学生的班主任
  useEffect(() => {
    if (profile && user) {
      if (profile.classId !== user.classId) {
        toast.error('您不是该学生的班主任');
        router.push('/teacher/class');
      }
    }
  }, [profile, user, router]);

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        gender: profile.gender || 'male',
        birthDate: profile.birthDate || '',
        ethnicity: profile.ethnicity || '',
        nativePlace: profile.nativePlace || '',
        phone: profile.phone || '',
        address: profile.address || '',
        homeAddress: profile.homeAddress || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        familyType: profile.familyType || '',
        parents: profile.parents || [],
      });
    }
  }, [profile]);

  // 更新字段
  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存
  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    const updateData: Partial<StudentFullProfile> = {
      name: formData.name || undefined,
      gender: formData.gender,
      birthDate: formData.birthDate || undefined,
      ethnicity: formData.ethnicity || undefined,
      nativePlace: formData.nativePlace || undefined,
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
        name: profile.name || '',
        gender: profile.gender || 'male',
        birthDate: profile.birthDate || '',
        ethnicity: profile.ethnicity || '',
        nativePlace: profile.nativePlace || '',
        phone: profile.phone || '',
        address: profile.address || '',
        homeAddress: profile.homeAddress || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        familyType: profile.familyType || '',
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
      relationship: parent.relationship || '其他',
      phone: parent.phone || '',
      isPrimary: parent.isPrimary,
      wechat: parent.wechat || '',
    });
    setParentDialogOpen(true);
  };

  const handleDeleteParent = (parentId: string) => {
    const newParents = formData.parents.filter(p => p.id !== parentId);
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
      newParents = formData.parents.map(p =>
        p.id === editingParent.id ? { ...parentFormData } as Parent : p
      );
    } else {
      newParents = [...formData.parents, { ...parentFormData } as Parent];
    }

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
            <p className="text-muted-foreground mt-1">查看和管理学生信息</p>
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

      {/* 学生基本信息卡片 */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-full ${genderDisplay.bg} flex items-center justify-center text-3xl`}>
              {genderDisplay.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-48 h-8 text-xl"
                    />
                  ) : (
                    profile.name
                  )}
                </h2>
                <Badge className={getStatusColor(profile.status)}>{profile.status}</Badge>
                <Badge className={genderDisplay.bg + ' ' + genderDisplay.color}>
                  {genderDisplay.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{profile.gradeName} · {profile.className}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>学号：{profile.studentNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{profile.birthDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>班主任：{profile.headTeacherName}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 个人信息 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              个人信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">出生日期</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                  />
                ) : (
                  <p className="font-medium">{profile.birthDate || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">民族</Label>
                {isEditing ? (
                  <Input
                    value={formData.ethnicity}
                    onChange={(e) => handleFieldChange('ethnicity', e.target.value)}
                  />
                ) : (
                  <p className="font-medium">{profile.ethnicity || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">籍贯</Label>
                {isEditing ? (
                  <Input
                    value={formData.nativePlace}
                    onChange={(e) => handleFieldChange('nativePlace', e.target.value)}
                  />
                ) : (
                  <p className="font-medium">{profile.nativePlace || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">学生类型</Label>
                <p className="font-medium">{profile.studentType || '普通'}</p>
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
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                ) : (
                  <p className="font-medium">{profile.phone || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">紧急联系人</Label>
                {isEditing ? (
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                  />
                ) : (
                  <p className="font-medium">{profile.emergencyContact || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">紧急联系电话</Label>
                {isEditing ? (
                  <Input
                    value={formData.emergencyPhone}
                    onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)}
                  />
                ) : (
                  <p className="font-medium">{profile.emergencyPhone || '-'}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">家庭住址</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.homeAddress}
                    onChange={(e) => handleFieldChange('homeAddress', e.target.value)}
                    rows={2}
                  />
                ) : (
                  <p className="font-medium">{profile.homeAddress || profile.address || '-'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 家庭信息 */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              家庭信息
            </CardTitle>
            <CardDescription>家长联系方式与家庭情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <span className="text-muted-foreground">家庭类型：</span>
              {isEditing ? (
                <Select
                  value={formData.familyType}
                  onValueChange={(v) => handleFieldChange('familyType', v as any)}
                >
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDeleteParent(parent.id)}
                          >
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
      </div>

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
                  设为主要联系人
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
