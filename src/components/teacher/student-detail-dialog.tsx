'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Phone,
  Calendar,
  GraduationCap,
  Users,
  Home,
  Award,
  BookOpen,
  Edit,
  Save,
  X,
  Loader2,
  Trophy,
  Camera,
} from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { withAuth } from '@/lib/auth-client';
import { StudentFullProfile, Parent } from '@/types';
import { toast } from 'sonner';

type ParentRelationship = '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他';

// 家庭类型选项
const familyTypeOptions = [
  { value: '核心家庭', label: '核心家庭' },
  { value: '单亲家庭', label: '单亲家庭' },
  { value: '重组家庭', label: '重组家庭' },
  { value: '隔代家庭', label: '隔代家庭' },
  { value: '其他', label: '其他' },
];

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

type StudentDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
};

export function StudentDetailDialog({ open, onOpenChange, studentId }: StudentDetailDialogProps) {
  const { fetchStudentProfile, updateStudent } = useStudents();
  
  const [profile, setProfile] = useState<StudentFullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 学生荣誉数据状态
  const [studentHonors, setStudentHonors] = useState<Array<{
    id: string;
    title: string;
    level: string;
    category: string;
    issuer: string;
    date: string;
    description?: string;
  }>>([]);
  const [honorsLoading, setHonorsLoading] = useState(false);

  // 编辑表单数据
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    photoUrl: '',
    birthDate: '',
    ethnicity: '',
    nativePlace: '',
    phone: '',
    address: '',
    homeAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    familyType: '' as '' | '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他',
    parents: [] as Parent[],
  });

  // 家长编辑对话框状态
  const [parentDialogOpen, setParentDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [parentFormData, setParentFormData] = useState({
    id: '',
    name: '',
    relationship: '父亲' as ParentRelationship,
    phone: '',
    isPrimary: false,
    wechat: '',
  });

  // 加载学生档案
  useEffect(() => {
    const loadProfile = async () => {
      if (!studentId || !open) return;
      
      setLoading(true);
      setError(null);
      setIsEditing(false);
      setActiveTab('overview');
      
      const result = await fetchStudentProfile(studentId);
      if (result) {
        setProfile(result);
        setFormData({
          name: result.name || '',
          gender: result.gender || 'male',
          photoUrl: result.photoUrl ?? '',
          birthDate: result.birthDate || '',
          ethnicity: result.ethnicity || '',
          nativePlace: result.nativePlace || '',
          phone: result.phone || '',
          address: result.address || '',
          homeAddress: result.homeAddress || '',
          emergencyContact: result.emergencyContact || '',
          emergencyPhone: result.emergencyPhone || '',
          familyType: result.familyType || '',
          parents: result.parents || [],
        });
      } else {
        setError('获取学生档案失败');
      }
      setLoading(false);
    };
    loadProfile();
  }, [studentId, open, fetchStudentProfile]);

  // 获取学生荣誉数据
  useEffect(() => {
    const fetchHonors = async () => {
      if (!studentId || !open) return;
      setHonorsLoading(true);
      try {
        const res = await fetch(`/api/student-honors?studentId=${studentId}&pageSize=100`, withAuth());
        const result = await res.json();
        if (result.success && result.data) {
          const honorsArray = Array.isArray(result.data) ? result.data : (result.data.data || []);
          setStudentHonors(honorsArray);
        }
      } catch (err) {
        console.error('Failed to fetch student honors:', err);
      } finally {
        setHonorsLoading(false);
      }
    };
    fetchHonors();
  }, [studentId, open]);

  // 更新字段
  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存
  const handleSave = async () => {
    if (!profile || !studentId) return;
    setIsSaving(true);

    const updateData: Partial<StudentFullProfile> = {
      name: formData.name || undefined,
      gender: formData.gender,
      photoUrl: formData.photoUrl || undefined,
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

    const success = await updateStudent(studentId, updateData);

    if (success) {
      toast.success('信息已保存');
      setIsEditing(false);
      // 刷新数据
      const result = await fetchStudentProfile(studentId);
      if (result) {
        setProfile(result);
      }
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
        photoUrl: profile.photoUrl ?? '',
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

  if (!studentId) return null;

  const genderDisplay = profile ? getGenderDisplay(profile.gender) : getGenderDisplay('male');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              学生档案
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" />
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? '保存中...' : '保存'}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !profile ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error || '加载失败'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 学生基本信息卡片 */}
            <Card className="shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="relative group">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="student-photo-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const uploadForm = new FormData();
                              uploadForm.append('file', file);
                              uploadForm.append('folder', 'student-photos');
                              const res = await fetch('/api/upload', { method: 'POST', body: uploadForm });
                              const data = await res.json();
                              if (data.success && data.data?.url) {
                                handleFieldChange('photoUrl', data.data.url);
                              }
                            } catch { /* ignore */ }
                          }}
                        />
                        {formData.photoUrl ? (
                          <div className="relative">
                            <img src={formData.photoUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => document.getElementById('student-photo-upload')?.click()}>
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className={`w-16 h-16 rounded-full ${genderDisplay.bg} flex items-center justify-center text-2xl relative group-hover:opacity-80 transition-opacity cursor-pointer`} onClick={() => document.getElementById('student-photo-upload')?.click()}>
                            {genderDisplay.icon}
                            <Camera className="w-3 h-3 absolute bottom-0 right-0 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ) : (
                      formData.photoUrl ? (
                        <img src={formData.photoUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className={`w-16 h-16 rounded-full ${genderDisplay.bg} flex items-center justify-center text-2xl`}>
                          {genderDisplay.icon}
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">
                        {isEditing ? (
                          <Input
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-40 h-8 text-lg"
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
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {profile.gradeName} · {profile.className}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        学号：{profile.studentNo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {profile.birthDate || '未填写出生日期'}
                      </span>
                    </div>

                    {/* 统计概览 - 仅显示荣誉数量 */}
                    <div className="mt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">荣誉奖项</span>
                        <span className="text-lg font-bold text-primary">{studentHonors.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 详情标签页 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 border rounded-lg p-1 w-full justify-start">
                <TabsTrigger value="overview" className="text-sm">基本信息</TabsTrigger>
                <TabsTrigger value="family" className="text-sm">家庭信息</TabsTrigger>
                <TabsTrigger value="honors" className="text-sm">在校荣誉</TabsTrigger>
              </TabsList>

              {/* 基本信息 */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        个人信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">姓名</span>
                        {isEditing ? (
                          <Input value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} className="h-7 w-32" />
                        ) : (
                          <span className="font-medium">{profile.name}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">性别</span>
                        {isEditing ? (
                          <Select value={formData.gender} onValueChange={(v) => handleFieldChange('gender', v)}>
                            <SelectTrigger className="w-[80px] h-7"><SelectValue /></SelectTrigger>
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
                          <Input type="date" value={formData.birthDate} onChange={(e) => handleFieldChange('birthDate', e.target.value)} className="h-7 w-32" />
                        ) : (
                          <span>{profile.birthDate || '-'}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">民族</span>
                        {isEditing ? (
                          <Input value={formData.ethnicity} onChange={(e) => handleFieldChange('ethnicity', e.target.value)} className="h-7 w-32" placeholder="汉族" />
                        ) : (
                          <span>{profile.ethnicity || '-'}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">籍贯</span>
                        {isEditing ? (
                          <Input value={formData.nativePlace} onChange={(e) => handleFieldChange('nativePlace', e.target.value)} className="h-7 w-32" />
                        ) : (
                          <span>{profile.nativePlace || '-'}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        学籍信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">学号</span>
                        <span className="font-medium">{profile.studentNo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">年级</span>
                        <span>{profile.gradeName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">班级</span>
                        <span>{profile.className}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">班主任</span>
                        <span>{profile.headTeacherName || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">学生类型</span>
                        <span>{profile.studentType || '普通'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        联系信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">联系电话</span>
                        {isEditing ? (
                          <Input value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} className="h-7 w-32" />
                        ) : (
                          <span>{profile.phone || '未填写'}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">紧急联系人</span>
                        {isEditing ? (
                          <Input value={formData.emergencyContact} onChange={(e) => handleFieldChange('emergencyContact', e.target.value)} className="h-7 w-32" />
                        ) : (
                          <span>{profile.emergencyContact || '未填写'}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">紧急联系电话</span>
                        {isEditing ? (
                          <Input value={formData.emergencyPhone} onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)} className="h-7 w-32" />
                        ) : (
                          <span>{profile.emergencyPhone || '未填写'}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 家庭信息 */}
              <TabsContent value="family" className="space-y-4 mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      家庭信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">家庭类型：</span>
                      {isEditing ? (
                        <Select value={formData.familyType} onValueChange={(v) => handleFieldChange('familyType', v)}>
                          <SelectTrigger className="w-[120px] h-7"><SelectValue placeholder="选择" /></SelectTrigger>
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

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">家长信息</h4>
                        {isEditing && (
                          <Button size="sm" variant="outline" onClick={handleAddParent}>
                            <Users className="h-3 w-3 mr-1" />
                            添加
                          </Button>
                        )}
                      </div>
                      {(isEditing ? formData.parents : profile.parents)?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(isEditing ? formData.parents : profile.parents).map((parent) => (
                            <div key={parent.id} className="p-3 bg-muted/30 rounded-lg text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{parent.name}</span>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">{parent.relationship}</Badge>
                                  {parent.isPrimary && (
                                    <Badge className="bg-primary/10 text-primary text-xs">主要</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {parent.phone}
                              </div>
                              {isEditing && (
                                <div className="flex gap-2 mt-2 pt-2 border-t">
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleEditParent(parent)}>编辑</Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500" onClick={() => handleDeleteParent(parent.id)}>删除</Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">暂无家长信息</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 在校荣誉 */}
              <TabsContent value="honors" className="mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      在校荣誉
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {honorsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : studentHonors.length > 0 ? (
                      <div className="space-y-2">
                        {studentHonors.map((honor) => (
                          <div key={honor.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              honor.level === '国家级' ? 'bg-red-100 text-red-600' :
                              honor.level === '省级' ? 'bg-purple-100 text-purple-600' :
                              honor.level === '市级' ? 'bg-blue-100 text-blue-600' :
                              honor.level === '区级' ? 'bg-green-100 text-green-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              <Award className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{honor.title}</span>
                                <Badge variant="secondary" className="text-xs">{honor.level}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{honor.date}</span>
                                {honor.issuer && <span>{honor.issuer}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground text-sm">暂无荣誉记录</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* 家长编辑对话框 */}
            <Dialog open={parentDialogOpen} onOpenChange={setParentDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>{editingParent ? '编辑家长' : '添加家长'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4 text-sm">
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">姓名 *</Label>
                    <Input value={parentFormData.name} onChange={(e) => setParentFormData(prev => ({ ...prev, name: e.target.value }))} className="col-span-3 h-8" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">关系</Label>
                    <Select value={parentFormData.relationship} onValueChange={(v) => setParentFormData(prev => ({ ...prev, relationship: v as ParentRelationship }))}>
                      <SelectTrigger className="col-span-3 h-8"><SelectValue /></SelectTrigger>
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
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">电话 *</Label>
                    <Input value={parentFormData.phone} onChange={(e) => setParentFormData(prev => ({ ...prev, phone: e.target.value }))} className="col-span-3 h-8" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">微信</Label>
                    <Input value={parentFormData.wechat} onChange={(e) => setParentFormData(prev => ({ ...prev, wechat: e.target.value }))} className="col-span-3 h-8" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right"></Label>
                    <div className="col-span-3 flex items-center gap-2">
                      <input type="checkbox" id="parent-primary" checked={parentFormData.isPrimary} onChange={(e) => setParentFormData(prev => ({ ...prev, isPrimary: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="parent-primary" className="text-muted-foreground">主要联系人</Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setParentDialogOpen(false)}>取消</Button>
                  <Button size="sm" onClick={handleSaveParent}>{editingParent ? '保存' : '添加'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
