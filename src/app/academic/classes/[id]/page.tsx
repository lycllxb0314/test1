'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  School, 
  Users, 
  UserCheck, 
  UserCircle, 
  Phone, 
  MapPin,
  BookOpen,
  Calendar,
  Trophy,
  Star,
  UserCog,
  Edit,
  Loader2,
  Mail,
  MessageCircle,
  GraduationCap,
  Award,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  useClasses, 
  type ClassContainer, 
  type StudentBasicInfo, 
  type ParentBasicInfo 
} from '@/hooks/useClasses';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  
  const { classes, loading, getClassById, updateHeadTeacher, assignSubTeacher } = useClasses();
  const [classData, setClassData] = useState<ClassContainer | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 获取班级数据
  useEffect(() => {
    if (!loading && classes.length > 0) {
      const cls = getClassById(classId);
      setClassData(cls || null);
    }
  }, [loading, classes, classId, getClassById]);
  
  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
          <p className="mt-2 text-gray-500">加载班级详情...</p>
        </div>
      </div>
    );
  }
  
  // 班级不存在
  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30">
        <div className="text-center">
          <School className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">班级不存在</h2>
          <p className="mt-2 text-gray-500">该班级可能已被删除或您没有访问权限</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/academic/classes')}
          >
            返回班级列表
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/academic/classes')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-500">班级管理</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-gray-900">{classData.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                编辑班级
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 班级标题卡片 */}
        <Card className="border-0 shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
            <div className="flex items-start justify-between text-white">
              <div>
                <h1 className="text-3xl font-bold">{classData.name}</h1>
                <div className="mt-2 flex items-center gap-4 text-amber-100">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {classData.gradeName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {classData.classroomName || '待分配教室'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{classData.studentCount}</div>
                  <div className="text-sm text-amber-100">学生</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{classData.parentCount}</div>
                  <div className="text-sm text-amber-100">家长</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 教师信息栏 */}
          <div className="p-4 bg-white grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <Avatar className="h-12 w-12 border-2 border-amber-200">
                <AvatarImage src={classData.headTeacher?.avatar} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-lg">
                  {classData.headTeacherName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm text-amber-600 font-medium">班主任</div>
                <div className="font-bold text-lg text-gray-900">{classData.headTeacherName}</div>
                {classData.headTeacher?.subject && (
                  <div className="text-sm text-gray-500">{classData.headTeacher.subject}教师</div>
                )}
              </div>
              <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
            
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${
              classData.subTeacherName 
                ? 'bg-blue-50 border-blue-100' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage src={classData.subTeacher?.avatar} />
                <AvatarFallback className={`text-lg ${
                  classData.subTeacherName 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {classData.subTeacherName?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm text-blue-600 font-medium">科任（副班主任）</div>
                <div className="font-bold text-lg text-gray-900">
                  {classData.subTeacherName || '待配置'}
                </div>
                {classData.subTeacher?.subject && (
                  <div className="text-sm text-gray-500">{classData.subTeacher.subject}教师</div>
                )}
              </div>
              <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <UserCog className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Tab 内容区 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1 h-auto">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              <School className="h-4 w-4 mr-2" />
              班级概览
            </TabsTrigger>
            <TabsTrigger 
              value="students"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Users className="h-4 w-4 mr-2" />
              学生名单 ({classData.studentCount})
            </TabsTrigger>
            <TabsTrigger 
              value="parents"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              <UserCircle className="h-4 w-4 mr-2" />
              家长通讯录 ({classData.parentCount})
            </TabsTrigger>
            <TabsTrigger 
              value="teachers"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              教师团队
            </TabsTrigger>
          </TabsList>
          
          {/* 概览 Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewSection classData={classData} />
          </TabsContent>
          
          {/* 学生 Tab */}
          <TabsContent value="students" className="space-y-6">
            <StudentsSection students={classData.students} />
          </TabsContent>
          
          {/* 家长 Tab */}
          <TabsContent value="parents" className="space-y-6">
            <ParentsSection parents={classData.parents} />
          </TabsContent>
          
          {/* 教师团队 Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <TeachersSection classData={classData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==================== 概览模块 ====================
function OverviewSection({ classData }: { classData: ClassContainer }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 基本信息 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-amber-600" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="班级名称" value={classData.name} />
            <InfoItem label="年级" value={classData.gradeName} />
            <InfoItem label="班号" value={classData.classNumber.toString()} />
            <InfoItem label="教室位置" value={classData.classroomName || '待分配'} />
          </div>
          {classData.motto && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm text-amber-600 font-medium">班训</div>
              <div className="text-gray-700 mt-1">{classData.motto}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 学生统计 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            学生统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{classData.studentCount}</div>
              <div className="text-sm text-gray-500 mt-1">总人数</div>
            </div>
            <div className="text-center p-4 bg-sky-50 rounded-lg">
              <div className="text-3xl font-bold text-sky-600">{classData.maleStudentCount}</div>
              <div className="text-sm text-gray-500 mt-1">男生</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-3xl font-bold text-pink-600">{classData.femaleStudentCount}</div>
              <div className="text-sm text-gray-500 mt-1">女生</div>
            </div>
          </div>
          
          {/* 性别比例条 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>性别比例</span>
              <span>男:女 = {classData.maleStudentCount}:{classData.femaleStudentCount}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-sky-400 h-full" 
                style={{ width: `${classData.studentCount > 0 ? (classData.maleStudentCount / classData.studentCount) * 100 : 0}%` }}
              />
              <div 
                className="bg-pink-400 h-full" 
                style={{ width: `${classData.studentCount > 0 ? (classData.femaleStudentCount / classData.studentCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 家长统计 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-green-600" />
            家长通讯录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{classData.parentCount}</div>
              <div className="text-sm text-gray-500 mt-1">家长总数</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">
                {classData.parents.filter(p => p.isPrimary).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">主要联系人</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">平均每位学生家长数</span>
              <span className="font-medium text-gray-900">
                {classData.studentCount > 0 
                  ? (classData.parentCount / classData.studentCount).toFixed(1) 
                  : 0}人
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 班级特色 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            班级特色
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classData.features && classData.features.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {classData.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {feature}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂未设置班级特色</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 学生列表模块 ====================
function StudentsSection({ students }: { students: StudentBasicInfo[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || 
    s.studentNo.includes(searchTerm)
  );
  
  // 按状态分组
  const activeStudents = filteredStudents.filter(s => s.status === '在校');
  const inactiveStudents = filteredStudents.filter(s => s.status !== '在校');
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>学生名单</CardTitle>
            <CardDescription>
              共 {students.length} 名学生，{activeStudents.length} 人在校
            </CardDescription>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索学号或姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>没有找到学生</p>
            </div>
          ) : (
            <div className="divide-y">
              {activeStudents.map((student) => (
                <StudentItem key={student.id} student={student} />
              ))}
              
              {inactiveStudents.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 font-medium">
                    非在校学生 ({inactiveStudents.length})
                  </div>
                  {inactiveStudents.map((student) => (
                    <StudentItem key={student.id} student={student} />
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StudentItem({ student }: { student: StudentBasicInfo }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={student.avatar} />
          <AvatarFallback className={student.gender === 'male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}>
            {student.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center gap-2">
            {student.name}
            <Badge variant="outline" className="text-xs">
              {student.studentNo}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>{student.gender === 'male' ? '男' : '女'}</span>
            {student.birthDate && (
              <>
                <span>·</span>
                <span>{new Date(student.birthDate).toLocaleDateString('zh-CN')}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={student.status === '在校' ? 'default' : 'secondary'}>
          {student.status}
        </Badge>
        {student.parents && student.parents.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400">
            <UserCircle className="h-4 w-4" />
            <span className="text-xs">{student.parents.length}位家长</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 家长列表模块 ====================
function ParentsSection({ parents }: { parents: ParentBasicInfo[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredParents = parents.filter(p => 
    p.name.includes(searchTerm) || 
    p.studentName.includes(searchTerm) ||
    p.phone?.includes(searchTerm)
  );
  
  // 主要联系人优先排序
  const sortedParents = [...filteredParents].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>家长通讯录</CardTitle>
            <CardDescription>
              共 {parents.length} 位家长，{parents.filter(p => p.isPrimary).length} 位主要联系人
            </CardDescription>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索姓名、学生或电话..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {sortedParents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>没有找到家长</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedParents.map((parent, index) => (
                <ParentItem key={`${parent.id}-${index}`} parent={parent} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ParentItem({ parent }: { parent: ParentBasicInfo }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-100 text-green-700">
            {parent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center gap-2">
            {parent.name}
            {parent.isPrimary && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                <Star className="h-3 w-3 mr-1" />
                主要联系人
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              {parent.relationName}
            </Badge>
            <span>·</span>
            <span>{parent.studentName}家长</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {parent.phone && (
          <>
            <a 
              href={`tel:${parent.phone}`}
              className="p-2 hover:bg-green-100 rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4 text-green-600" />
            </a>
            <a 
              href={`sms:${parent.phone}`}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </a>
          </>
        )}
        {parent.wechat && (
          <div className="text-xs text-gray-400 hidden md:block">
            微信: {parent.wechat}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 教师团队模块 ====================
function TeachersSection({ classData }: { classData: ClassContainer }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 班主任 */}
      <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <UserCheck className="h-5 w-5" />
            班主任
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-amber-200">
              <AvatarImage src={classData.headTeacher?.avatar} />
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xl">
                {classData.headTeacherName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{classData.headTeacherName}</h3>
              {classData.headTeacher && (
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  {classData.headTeacher.subject && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>任教科目: {classData.headTeacher.subject}</span>
                    </div>
                  )}
                  {classData.headTeacher.title && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>职称: {classData.headTeacher.title}</span>
                    </div>
                  )}
                  {classData.headTeacher.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{classData.headTeacher.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50">
              <Phone className="h-4 w-4 mr-2" />
              联系
            </Button>
            <Button variant="outline" size="sm" className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50">
              <Edit className="h-4 w-4 mr-2" />
              更换
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 科任/副班主任 */}
      <Card className={`border-0 shadow-md border-l-4 ${classData.subTeacherName ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${classData.subTeacherName ? 'text-blue-700' : 'text-gray-400'}`}>
            <UserCog className="h-5 w-5" />
            科任（副班主任）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classData.subTeacherName ? (
            <>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-blue-200">
                  <AvatarImage src={classData.subTeacher?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                    {classData.subTeacherName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{classData.subTeacherName}</h3>
                  {classData.subTeacher && (
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      {classData.subTeacher.subject && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>任教科目: {classData.subTeacher.subject}</span>
                        </div>
                      )}
                      {classData.subTeacher.title && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>职称: {classData.subTeacher.title}</span>
                        </div>
                      )}
                      {classData.subTeacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{classData.subTeacher.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Phone className="h-4 w-4 mr-2" />
                  联系
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <UserCog className="h-4 w-4 mr-2" />
                  更换
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">暂未配置科任（副班主任）</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserCog className="h-4 w-4 mr-2" />
                配置科任
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 辅助组件 ====================
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900 mt-1">{value}</div>
    </div>
  );
}
