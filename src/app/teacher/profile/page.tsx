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
  Edit,
  Plus,
  CheckCircle,
  Save,
  Upload,
  Building,
  IdCard,
  Users,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherProfile, TeacherRecord, TeacherHonor, TeacherTraining, TeacherAchievement } from '@/types';

// 模拟教师数据（与教务教研共享）
const mockTeacherProfile: TeacherProfile = {
  id: 'teacher-001',
  userId: 't001',
  
  name: '张明华',
  gender: '男',
  birthDate: '1985-03-15',
  idCard: '3508**********0015',
  ethnicity: '汉族',
  politicalStatus: '中共党员',
  nativePlace: '福建龙岩',
  
  phone: '138****1001',
  email: 'zhangmh@lysf.fx.edu.cn',
  emergencyContact: '张父',
  emergencyPhone: '139****2001',
  address: '龙岩市新罗区xx路xx号',
  
  employeeId: 'T2005001',
  subjects: ['语文'],
  title: '高级教师',
  titleDate: '2018-09-01',
  education: '本科',
  school: '福建师范大学',
  major: '汉语言文学',
  graduationDate: '2007-06',
  teachYears: 17,
  joinDate: '2007-09-01',
  department: '语文组',
  
  isHeadTeacher: false,
  
  status: 'active',
  
  records: [
    { id: 'r1', teacherId: 'teacher-001', type: 'education', title: '本科学历', description: '福建师范大学 汉语言文学专业', date: '2007-06', createdAt: '2020-01-01' },
    { id: 'r2', teacherId: 'teacher-001', type: 'title', title: '二级教师', date: '2010-09', createdAt: '2020-01-01' },
    { id: 'r3', teacherId: 'teacher-001', type: 'title', title: '一级教师', date: '2014-09', createdAt: '2020-01-01' },
    { id: 'r4', teacherId: 'teacher-001', type: 'title', title: '高级教师', date: '2018-09', createdAt: '2020-01-01' },
    { id: 'r5', teacherId: 'teacher-001', type: 'position', title: '担任语文教研组长', date: '2019-09', createdAt: '2020-01-01' },
  ],
  
  honors: [
    { id: 'h1', teacherId: 'teacher-001', title: '龙岩市优秀教师', level: '市级', category: '综合', issuer: '龙岩市教育局', date: '2023-09', certificateNo: 'LY202309001' },
    { id: 'h2', teacherId: 'teacher-001', title: '区级教学能手', level: '区级', category: '教学', issuer: '新罗区教育局', date: '2022-06' },
    { id: 'h3', teacherId: 'teacher-001', title: '校级优秀班主任', level: '校级', category: '德育', issuer: '学校', date: '2020-09' },
    { id: 'h4', teacherId: 'teacher-001', title: '福建省骨干教师', level: '省级', category: '综合', issuer: '福建省教育厅', date: '2021-12' },
  ],
  
  trainings: [
    { id: 't1', teacherId: 'teacher-001', name: '新课标解读培训', type: '市级培训', organizer: '龙岩市教育局', startDate: '2024-01-15', endDate: '2024-01-17', hours: 24, status: '已完成', certificate: 'cert-001' },
    { id: 't2', teacherId: 'teacher-001', name: '信息技术应用能力提升', type: '省级培训', organizer: '福建省教育厅', startDate: '2023-11-01', endDate: '2023-11-30', hours: 48, status: '已完成' },
    { id: 't3', teacherId: 'teacher-001', name: '班主任工作培训', type: '校内培训', organizer: '学校教务处', startDate: '2023-09-01', endDate: '2023-09-03', hours: 16, status: '已完成' },
  ],
  
  achievements: [
    { id: 'a1', teacherId: 'teacher-001', type: '公开课', title: '《背影》区级公开课', level: '区级', result: '优秀', date: '2023-11-20', description: '面向全区语文教师的示范课' },
    { id: 'a2', teacherId: 'teacher-001', type: '教学比赛', title: '龙岩市语文教学技能大赛', level: '市级', result: '一等奖', date: '2023-05-10' },
    { id: 'a3', teacherId: 'teacher-001', type: '论文发表', title: '小学语文阅读教学策略研究', level: '省级', date: '2022-08', description: '发表于《福建教育》2022年第8期' },
    { id: 'a4', teacherId: 'teacher-001', type: '课题研究', title: '小学语文核心素养培养研究', level: '市级', result: '结题', date: '2023-06', description: '市级课题主持人' },
    { id: 'a5', teacherId: 'teacher-001', type: '指导学生获奖', title: '指导学生参加征文比赛', level: '省级', result: '一等奖2人', date: '2023-12' },
  ],
  
  createdAt: '2020-01-01',
  updatedAt: '2024-03-15',
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
  const typeMap: Record<string, { icon: any; color: string; label: string }> = {
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

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<'honor' | 'training' | 'achievement'>('honor');

  // 新增表单
  const [newHonor, setNewHonor] = useState<{
    title: string;
    level: '国家级' | '省级' | '市级' | '区级' | '校级';
    category: '综合' | '教学' | '德育' | '科研';
    issuer: string;
    date: string;
  }>({
    title: '',
    level: '校级',
    category: '综合',
    issuer: '',
    date: '',
  });

  useEffect(() => {
    // 模拟加载教师数据
    setProfile(mockTeacherProfile);
  }, [user]);

  // 保存基本信息
  const handleSaveBasicInfo = () => {
    // 这里会调用API保存数据
    setIsEditing(false);
  };

  // 添加荣誉
  const handleAddHonor = () => {
    if (!profile) return;
    const newHonorItem: TeacherHonor = {
      id: `h${Date.now()}`,
      teacherId: profile.id,
      ...newHonor,
    };
    setProfile({
      ...profile,
      honors: [newHonorItem, ...profile.honors],
    });
    setShowAddDialog(false);
    setNewHonor({ title: '', level: '校级', category: '综合', issuer: '', date: '' });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-7 w-7 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900">个人档案</h1>
          </div>
          <p className="text-gray-500 mt-1">管理您的个人信息和成长记录</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-1" onClick={handleSaveBasicInfo}>
                <Save className="h-4 w-4" />
                保存修改
              </Button>
            </>
          ) : (
            <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-1" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
              编辑信息
            </Button>
          )}
        </div>
      </div>

      {/* 个人信息卡片 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 头像 */}
            <div className="flex-shrink-0 text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto">
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
                  <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-500 mt-1">{profile.title} · {profile.department}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">在职</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <IdCard className="h-4 w-4 text-gray-400" />
                  <span>工号：{profile.employeeId}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{profile.gender} · {profile.ethnicity}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
              </div>

              {/* 成长数据概览 */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{profile.honors.length}</div>
                  <div className="text-xs text-gray-600">荣誉奖项</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{profile.trainings.filter(t => t.status === '已完成').length}</div>
                  <div className="text-xs text-gray-600">培训完成</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{profile.achievements.length}</div>
                  <div className="text-xs text-gray-600">教学成果</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{profile.trainings.reduce((sum, t) => sum + t.hours, 0)}</div>
                  <div className="text-xs text-gray-600">培训学时</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详情标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border rounded-lg p-1">
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
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">姓名</Label>
                    {isEditing ? (
                      <Input value={profile.name} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">性别</Label>
                    <p className="font-medium mt-1">{profile.gender}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">出生日期</Label>
                    {isEditing ? (
                      <Input type="date" value={profile.birthDate} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.birthDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">民族</Label>
                    {isEditing ? (
                      <Input value={profile.ethnicity} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.ethnicity}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">政治面貌</Label>
                    {isEditing ? (
                      <Select value={profile.politicalStatus}>
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
                    <Label className="text-gray-500 text-xs">籍贯</Label>
                    {isEditing ? (
                      <Input value={profile.nativePlace} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.nativePlace}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 联系信息 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  联系信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">联系电话</Label>
                    {isEditing ? (
                      <Input value={profile.phone} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">电子邮箱</Label>
                    {isEditing ? (
                      <Input value={profile.email} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">紧急联系人</Label>
                    {isEditing ? (
                      <Input value={profile.emergencyContact} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.emergencyContact}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">紧急联系电话</Label>
                    {isEditing ? (
                      <Input value={profile.emergencyPhone} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.emergencyPhone}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-xs">家庭住址</Label>
                    {isEditing ? (
                      <Input value={profile.address} className="mt-1 h-8" />
                    ) : (
                      <p className="font-medium mt-1">{profile.address}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 学历职称 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  学历职称
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">学历</Label>
                    <p className="font-medium mt-1">{profile.education}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">职称</Label>
                    <p className="font-medium mt-1">{profile.title}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">毕业院校</Label>
                    <p className="font-medium mt-1">{profile.school}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">专业</Label>
                    <p className="font-medium mt-1">{profile.major}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">* 学历职称信息需联系教务处修改</p>
              </CardContent>
            </Card>

            {/* 工作信息 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-orange-500" />
                  工作信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">工号</Label>
                    <p className="font-medium mt-1">{profile.employeeId}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">教研组</Label>
                    <p className="font-medium mt-1">{profile.department}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">任教学科</Label>
                    <p className="font-medium mt-1">{profile.subjects.join('、')}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">教龄</Label>
                    <p className="font-medium mt-1">{profile.teachYears} 年</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">入职时间</Label>
                    <p className="font-medium mt-1">{profile.joinDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">班主任</Label>
                    <p className="font-medium mt-1">{profile.isHeadTeacher ? `是（${profile.className}）` : '否'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 荣誉奖项 */}
        <TabsContent value="honors" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  我的荣誉
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    setAddType('honor');
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  申报荣誉
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.honors.map(honor => (
                  <div key={honor.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHonorLevelColor(honor.level)}`}>
                      {honor.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{honor.title}</span>
                        <Badge variant="outline">{honor.category}</Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {honor.issuer && <span>颁发单位：{honor.issuer} · </span>}
                        获得时间：{honor.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 培训记录 */}
        <TabsContent value="trainings" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  培训记录
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  上传证书
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.trainings.map(training => (
                  <div key={training.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{training.name}</span>
                        <Badge variant="outline">{training.type}</Badge>
                        <Badge className={training.status === '已完成' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                          {training.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        主办单位：{training.organizer} · 时间：{training.startDate} 至 {training.endDate}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        学时：{training.hours} 小时
                        {training.certificate && <span className="ml-4 text-green-600">已获得证书</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教学成果 */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  教学成果
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  添加成果
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.achievements.map(achievement => (
                  <div key={achievement.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
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
                      <div className="text-sm text-gray-500 mt-1">
                        {achievement.level && <span>级别：{achievement.level} · </span>}
                        时间：{achievement.date}
                      </div>
                      {achievement.description && (
                        <div className="text-sm text-gray-400 mt-1">{achievement.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成长档案 */}
        <TabsContent value="records" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  成长档案
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* 时间线 */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-4">
                  {profile.records.sort((a, b) => b.date.localeCompare(a.date)).map(record => {
                    const typeInfo = getRecordTypeInfo(record.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={record.id} className="relative flex items-start gap-4 pl-10">
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-white border-2 border-gray-300"></div>
                        
                        <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                            <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                            <span className="font-medium">{record.title}</span>
                          </div>
                          {record.description && (
                            <p className="text-sm text-gray-500 mt-1">{record.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{record.date}</p>
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

      {/* 添加荣誉对话框 */}
      <Dialog open={showAddDialog && addType === 'honor'} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>申报荣誉</DialogTitle>
            <DialogDescription>
              填写荣誉信息，提交后将由教务处审核
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>荣誉名称 *</Label>
              <Input
                value={newHonor.title}
                onChange={(e) => setNewHonor(prev => ({ ...prev, title: e.target.value }))}
                placeholder="如：优秀教师、教学能手等"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>级别</Label>
                <Select value={newHonor.level} onValueChange={(v) => setNewHonor(prev => ({ ...prev, level: v as '国家级' | '省级' | '市级' | '区级' | '校级' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="校级">校级</SelectItem>
                    <SelectItem value="区级">区级</SelectItem>
                    <SelectItem value="市级">市级</SelectItem>
                    <SelectItem value="省级">省级</SelectItem>
                    <SelectItem value="国家级">国家级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>类别</Label>
                <Select value={newHonor.category} onValueChange={(v) => setNewHonor(prev => ({ ...prev, category: v as '综合' | '教学' | '德育' | '科研' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="综合">综合</SelectItem>
                    <SelectItem value="教学">教学</SelectItem>
                    <SelectItem value="德育">德育</SelectItem>
                    <SelectItem value="科研">科研</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>颁发单位</Label>
              <Input
                value={newHonor.issuer}
                onChange={(e) => setNewHonor(prev => ({ ...prev, issuer: e.target.value }))}
                placeholder="颁发荣誉的单位"
              />
            </div>
            <div className="space-y-2">
              <Label>获得时间</Label>
              <Input
                type="date"
                value={newHonor.date}
                onChange={(e) => setNewHonor(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>证书材料</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">点击上传证书扫描件</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-white"
              onClick={handleAddHonor}
              disabled={!newHonor.title || !newHonor.date}
            >
              提交申报
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
