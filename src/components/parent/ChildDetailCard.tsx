'use client';

/**
 * 家长端子女详情卡片
 * 
 * 复用教务处/班主任端的学生详情逻辑，但权限受限：
 * - 家长可编辑：联系电话、家庭住址、紧急联系人等
 * - 家长不可编辑：姓名、性别、学号、班级、身份证等关键信息
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
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
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { withAuth } from '@/lib/auth-client';

// 学生完整档案类型
type StudentProfile = {
  id: string;
  name: string;
  studentNo: string;
  gender: string;
  birthDate: string;
  ethnicity: string;
  nativePlace: string;
  phone: string;
  address: string;
  homeAddress: string;
  emergencyContact: string;
  emergencyPhone: string;
  familyType: string;
  status: string;
  gradeId: string;
  gradeName: string;
  classId: string;
  className: string;
  headTeacherName: string;
  studentType: string;
  parents: Parent[];
  idCard?: string;
};

type Parent = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  wechat?: string;
};

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
  return gender === 'male' || gender === '男' 
    ? { label: '男', icon: '👨', color: 'text-blue-600', bg: 'bg-blue-50' }
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

type ChildDetailCardProps = {
  studentId: string;
};

export function ChildDetailCard({ studentId }: ChildDetailCardProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
  }>>([]);
  const [honorsLoading, setHonorsLoading] = useState(false);

  // 可编辑字段（家长可修改的）
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    homeAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    familyType: '',
  });

  // 加载学生档案
  useEffect(() => {
    const loadProfile = async () => {
      if (!studentId) return;
      
      setLoading(true);
      setError(null);
      setIsEditing(false);
      setActiveTab('overview');
      
      try {
        const res = await fetch(`/api/students/${studentId}/full-profile`, withAuth());
        const result = await res.json();
        
        if (result.success && result.data) {
          const data = result.data;
          setProfile(data);
          setFormData({
            phone: data.phone || '',
            address: data.address || '',
            homeAddress: data.homeAddress || '',
            emergencyContact: data.emergencyContact || '',
            emergencyPhone: data.emergencyPhone || '',
            familyType: data.familyType || '',
          });
        } else {
          setError(result.error || '获取子女档案失败');
        }
      } catch (err) {
        console.error('Failed to load child profile:', err);
        setError('加载失败，请重试');
      }
      setLoading(false);
    };
    loadProfile();
  }, [studentId]);

  // 获取学生荣誉数据
  useEffect(() => {
    const fetchHonors = async () => {
      if (!studentId) return;
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
  }, [studentId]);

  // 更新字段
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存
  const handleSave = async () => {
    if (!profile || !studentId) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        ...withAuth(),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (result.success) {
        toast.success('信息已保存');
        setIsEditing(false);
        // 更新本地数据
        setProfile(prev => prev ? { ...prev, ...formData } : null);
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('保存失败，请重试');
    }
    setIsSaving(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        homeAddress: profile.homeAddress || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        familyType: profile.familyType || '',
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-red-500">{error || '暂无子女信息'}</p>
        </CardContent>
      </Card>
    );
  }

  const genderDisplay = getGenderDisplay(profile.gender);

  return (
    <div className="space-y-4">
      {/* 学生基本信息卡片 */}
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full ${genderDisplay.bg} flex items-center justify-center text-2xl`}>
              {genderDisplay.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{profile.name}</h2>
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

              {/* 统计概览 */}
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
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50 border rounded-lg p-1">
                <TabsTrigger value="overview" className="text-sm">基本信息</TabsTrigger>
                <TabsTrigger value="family" className="text-sm">家庭信息</TabsTrigger>
                <TabsTrigger value="honors" className="text-sm">在校荣誉</TabsTrigger>
              </TabsList>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" />
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? '保存中...' : '保存'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  编辑可修改信息
                </Button>
              )}
            </div>

            {/* 基本信息 */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 个人信息 - 只读 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    个人信息
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">姓名</span>
                      <span className="font-medium">{profile.name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">性别</span>
                      <span className={genderDisplay.color}>{genderDisplay.label}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">出生日期</span>
                      <span>{profile.birthDate || '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">民族</span>
                      <span>{profile.ethnicity || '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">籍贯</span>
                      <span>{profile.nativePlace || '-'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * 个人信息修改请联系班主任
                  </p>
                </div>

                {/* 学籍信息 - 只读 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    学籍信息
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">学号</span>
                      <span className="font-medium">{profile.studentNo}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">年级</span>
                      <span>{profile.gradeName}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">班级</span>
                      <span>{profile.className}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">班主任</span>
                      <span>{profile.headTeacherName || '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">学生类型</span>
                      <span>{profile.studentType || '普通'}</span>
                    </div>
                  </div>
                </div>

                {/* 联系信息 - 可编辑 */}
                <div className="space-y-3 md:col-span-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    联系信息
                    {isEditing && <Badge variant="outline" className="text-xs">可编辑</Badge>}
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between md:flex-col md:gap-1">
                        <span className="text-muted-foreground">联系电话</span>
                        {isEditing ? (
                          <Input 
                            value={formData.phone} 
                            onChange={(e) => handleFieldChange('phone', e.target.value)} 
                            className="h-7 w-32 md:w-full" 
                            placeholder="学生联系电话"
                          />
                        ) : (
                          <span>{profile.phone || '未填写'}</span>
                        )}
                      </div>
                      <div className="flex justify-between md:flex-col md:gap-1">
                        <span className="text-muted-foreground">紧急联系人</span>
                        {isEditing ? (
                          <Input 
                            value={formData.emergencyContact} 
                            onChange={(e) => handleFieldChange('emergencyContact', e.target.value)} 
                            className="h-7 w-32 md:w-full" 
                            placeholder="紧急联系人姓名"
                          />
                        ) : (
                          <span>{profile.emergencyContact || '未填写'}</span>
                        )}
                      </div>
                      <div className="flex justify-between md:flex-col md:gap-1">
                        <span className="text-muted-foreground">紧急联系电话</span>
                        {isEditing ? (
                          <Input 
                            value={formData.emergencyPhone} 
                            onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)} 
                            className="h-7 w-32 md:w-full" 
                            placeholder="紧急联系电话"
                          />
                        ) : (
                          <span>{profile.emergencyPhone || '未填写'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 家庭信息 */}
            <TabsContent value="family" className="space-y-4 mt-0">
              {/* 家庭类型 - 可编辑 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Home className="h-4 w-4" />
                  家庭信息
                  {isEditing && <Badge variant="outline" className="text-xs">可编辑</Badge>}
                </h4>
                <div className="space-y-3 text-sm bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">家庭类型：</span>
                    {isEditing ? (
                      <select
                        value={formData.familyType}
                        onChange={(e) => handleFieldChange('familyType', e.target.value)}
                        className="h-8 px-2 rounded border bg-background"
                      >
                        <option value="">请选择</option>
                        {familyTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline">{profile.familyType || '未设置'}</Badge>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">现居住址</span>
                    {isEditing ? (
                      <Input 
                        value={formData.address} 
                        onChange={(e) => handleFieldChange('address', e.target.value)} 
                        className="h-7 w-64" 
                        placeholder="现居住地址"
                      />
                    ) : (
                      <span className="text-right max-w-[300px]">{profile.address || '未填写'}</span>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">户籍地址</span>
                    {isEditing ? (
                      <Input 
                        value={formData.homeAddress} 
                        onChange={(e) => handleFieldChange('homeAddress', e.target.value)} 
                        className="h-7 w-64" 
                        placeholder="户籍地址"
                      />
                    ) : (
                      <span className="text-right max-w-[300px]">{profile.homeAddress || '未填写'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 家长信息 - 只读展示 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  家长信息
                </h4>
                <div className="text-sm bg-muted/30 rounded-lg p-3">
                  {profile.parents && profile.parents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.parents.map((parent) => (
                        <div key={parent.id} className="p-3 bg-background rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{parent.name}</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{parent.relationship}</Badge>
                              {parent.isPrimary && (
                                <Badge className="bg-primary/10 text-primary text-xs">主要</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Phone className="h-3 w-3" />
                            {parent.phone}
                            {parent.wechat && (
                              <>
                                <span className="mx-1">·</span>
                                <span>微信: {parent.wechat}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">暂无家长信息</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  * 家长信息修改请联系班主任
                </p>
              </div>
            </TabsContent>

            {/* 在校荣誉 */}
            <TabsContent value="honors" className="mt-0">
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  在校荣誉
                </h4>
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
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">暂无荣誉记录</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChildDetailCard;
