'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GraduationCap, MapPin, Star, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useClasses } from '@/hooks/useClasses';
import { useClassDailyRoutine, useClassWeeklyRoutine } from '@/hooks/useClassRoutine';
import { useFrontendPagination } from '@/hooks/useApi';
import { PAGINATION } from '@/lib/pagination-config';
import type { StudentBasicInfo } from '@/hooks/useClasses';
import type { Parent } from '@/types';

import { ClassOverviewTab } from './components/ClassOverviewTab';
import { StudentsTab } from './components/StudentsTab';
import { ParentsTab } from './components/ParentsTab';

export default function ClassManagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canManageClass, isHeadTeacher, isSubTeacher } = usePermissions();

  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // 数据获取
  const { allClasses, allStudents, loading: classesLoading, refetch: refetchClasses } = useClasses();

  // 班级ID（班主任用自己的，科任用选择的）
  const classId = useMemo(() => {
    if (isHeadTeacher()) return user?.classId || '';
    return selectedClassId || (user?.subTeacherClasses?.[0]?.classId || '');
  }, [user, selectedClassId, isHeadTeacher]);

  const className = useMemo(() => {
    if (isHeadTeacher()) return user?.className || '我的班级';
    const cls = user?.subTeacherClasses?.find(c => c.classId === classId);
    return cls?.className || '我的班级';
  }, [user, classId, isHeadTeacher]);

  const currentClass = useMemo(() => allClasses.find(c => c.id === classId), [allClasses, classId]);

  // 常规评比
  const today = new Date().toISOString().split('T')[0];
  const { categoryScores, totalScore, maxTotalScore, scoreRate, loading: routineLoading } = useClassDailyRoutine({ classId, date: today });
  const currentAcademicYear = new Date().getFullYear().toString();
  const { evaluation: weeklyEvaluation } = useClassWeeklyRoutine({ classId, academicYear: currentAcademicYear });

  // 学生操作
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteStudent = useCallback(async (studentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}`, { method: 'DELETE', credentials: 'include' });
      const result = await response.json();
      if (result.success) { refetchClasses(); return true; }
      return false;
    } catch (err) { console.error('删除学生失败:', err); return false; }
  }, [refetchClasses]);

  // 筛选当前班级学生
  const students = useMemo(() => {
    let filtered = allStudents.filter(s => s.classId === classId);
    if (searchTerm) filtered = filtered.filter(s => s.name.includes(searchTerm) || s.studentNo.includes(searchTerm));
    if (statusFilter !== 'all') filtered = filtered.filter(s => s.status === statusFilter);
    return filtered;
  }, [allStudents, classId, searchTerm, statusFilter]);

  // 分页
  const pagination = useFrontendPagination(students, { defaultPageSize: PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE });

  // 统计
  const totalStudents = students.length;
  const presentCount = students.filter(s => s.status === '在校').length;
  const leaveCount = students.filter(s => s.status === '请假').length;
  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;

  // 学生操作状态
  const [mutationLoading, setMutationLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentBasicInfo | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 权限检查
  useEffect(() => {
    if (user && !canManageClass()) {
      toast.error('您不是班主任或科任教师，无法访问此页面');
      router.push('/teacher');
    }
  }, [user, canManageClass, router]);

  const handleViewDetail = (studentId: string) => { setSelectedStudentId(studentId); setDetailDialogOpen(true); };
  const confirmDelete = (student: StudentBasicInfo) => { setStudentToDelete(student); setDeleteDialogOpen(true); };
  const handleDelete = async () => {
    if (!studentToDelete) return;
    setMutationLoading(true);
    const success = await deleteStudent(studentToDelete.id);
    setMutationLoading(false);
    if (success) { toast.success('学生已删除'); refetchClasses(); } else { toast.error('删除失败，请重试'); }
    setDeleteDialogOpen(false); setStudentToDelete(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['学号', '姓名', '性别', '班级', '状态', '联系电话'].join(','),
      ...students.map(s => [s.studentNo, s.name, s.gender === 'male' ? '男' : '女', s.className, s.status, ''].join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${className}学生名单.csv`;
    link.click();
    toast.success('导出成功');
  };

  const loading = studentsLoading || classesLoading || routineLoading;

  // 加载状态
  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">加载班级数据...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetchClasses()}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      {/* 班级标题卡片 */}
      <Card className="border-0 shadow-lg overflow-hidden rounded-none">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
          <div className="flex items-start justify-between text-white">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">{className}</h1>
                {isSubTeacher() && user?.subTeacherClasses && user.subTeacherClasses.length > 1 && (
                  <Select value={classId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-[180px] bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="切换班级" />
                    </SelectTrigger>
                    <SelectContent>
                      {user.subTeacherClasses.map((cls) => (
                        <SelectItem key={cls.classId} value={cls.classId}>{cls.className}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-purple-100">
                <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{currentClass?.gradeName || '班级'}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{currentClass?.classroomName || '待分配教室'}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalStudents}</div>
                <div className="text-sm text-purple-100">学生</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{currentClass?.parentCount || 0}</div>
                <div className="text-sm text-purple-100">家长</div>
              </div>
            </div>
          </div>
        </div>

        {/* 教师信息栏 */}
        <div className="p-4 bg-white grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <Avatar className="h-12 w-12 border-2 border-purple-200">
              <AvatarImage src={isHeadTeacher() ? user?.avatar : currentClass?.headTeacher?.avatar} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-lg">
                {(isHeadTeacher() ? user?.name : currentClass?.headTeacherName)?.charAt(0) || '班'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm text-purple-600 font-medium">班主任</div>
              <div className="font-bold text-lg text-gray-900">
                {isHeadTeacher() ? user?.name || '我' : currentClass?.headTeacherName || '未配置'}
              </div>
              {isHeadTeacher() && user?.department && <div className="text-sm text-gray-500">{user.department}</div>}
              {!isHeadTeacher() && currentClass?.headTeacher?.title && <div className="text-sm text-gray-500">{currentClass.headTeacher.title}</div>}
            </div>
            {isHeadTeacher() && (
              <div className="flex items-center gap-1 text-purple-600">
                <Star className="h-4 w-4" /><span className="text-sm">班级管理员</span>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${currentClass?.subTeacherName ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
            <Avatar className="h-12 w-12 border-2 border-blue-200">
              <AvatarImage src={isSubTeacher() ? user?.avatar : currentClass?.subTeacher?.avatar} />
              <AvatarFallback className={`text-lg ${(isSubTeacher() ? user?.name : currentClass?.subTeacherName) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                {(isSubTeacher() ? user?.name : currentClass?.subTeacherName)?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm text-blue-600 font-medium">科任教师</div>
              <div className="font-bold text-lg text-gray-900">
                {(isSubTeacher() ? user?.name : currentClass?.subTeacherName) || '未配置'}
              </div>
              {((isSubTeacher() ? (user as unknown as Record<string, unknown>)?.primarySubject : currentClass?.subTeacher?.primarySubject) as string | undefined) && (
                <div className="text-sm text-gray-500">{isSubTeacher() ? (user as unknown as Record<string, unknown>)?.primarySubject as string : currentClass?.subTeacher?.primarySubject}</div>
              )}
            </div>
            {isSubTeacher() && (
              <div className="flex items-center gap-1 text-blue-600">
                <Star className="h-4 w-4" /><span className="text-sm">科任管理</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tab 切换 */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border">
          {[
            { key: 'overview', label: '班级概览' },
            { key: 'students', label: '学生管理' },
            { key: 'parents', label: '家长通讯' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <ClassOverviewTab
            stats={{ totalStudents, presentCount, leaveCount, maleCount, femaleCount }}
            routine={{ today, loading: routineLoading, totalScore, maxTotalScore, scoreRate, categoryScores, weeklyEvaluation }}
            onSwitchTab={setActiveTab}
          />
        )}
        {activeTab === 'students' && (
          <StudentsTab
            students={students}
            className={className}
            onDelete={async (student) => { const ok = await deleteStudent(student.id); if (ok) refetchClasses(); return ok; }}
            onViewDetail={(id: string) => setSelectedStudentId(id)}
            onRefetch={refetchClasses}
          />
        )}
        {activeTab === 'parents' && (
          <ParentsTab
            students={students}
            loading={loading}
            onRefresh={refetchClasses}
          />
        )}
      </div>
    </div>
  );
}
