import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  GradeData,
  SubjectGroup,
  SummaryData,
  ViewMode,
  ClassInfo,
  TeacherInfo,
  DetailDialog,
} from '@/app/academic/school-schedule/types';

const GRADES = [1, 2, 3, 4, 5, 6];

export function useSchoolSchedule() {
  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('classes');

  // 数据
  const [classData, setClassData] = useState<GradeData[]>([]);
  const [teacherData, setTeacherData] = useState<SubjectGroup[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // 加载状态
  const [loading, setLoading] = useState(true);

  // 筛选
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 展开的年级/学科
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // 详情弹窗
  const [detailDialog, setDetailDialog] = useState<DetailDialog | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const summaryRes = await fetch('/api/academic/school-schedule?mode=summary');
      const summaryData = await summaryRes.json();
      if (summaryData.success && summaryData.data) {
        setSummary(summaryData.data);
      }

      if (viewMode === 'classes') {
        const gradeParam = gradeFilter !== 'all' ? `&grade=${gradeFilter}` : '';
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/academic/school-schedule?mode=all-classes${gradeParam}${searchParam}`);
        const data = await res.json();
        if (data.success && data.data?.data) {
          setClassData(data.data.data);
        } else {
          setClassData([]);
        }
      } else if (viewMode === 'teachers') {
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/academic/school-schedule?mode=all-teachers${searchParam}`);
        const data = await res.json();
        if (data.success && data.data?.data) {
          setTeacherData(data.data.data);
        } else {
          setTeacherData([]);
        }
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [viewMode, gradeFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换年级展开
  const toggleGrade = useCallback((grade: number) => {
    setExpandedGrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grade)) {
        newSet.delete(grade);
      } else {
        newSet.add(grade);
      }
      return newSet;
    });
  }, []);

  // 切换学科展开
  const toggleSubject = useCallback((subject: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  }, []);

  // 查看班级详情
  const viewClassDetail = useCallback(async (classInfo: ClassInfo) => {
    try {
      const res = await fetch(`/api/academic/school-schedule?mode=class&classId=${classInfo.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDetailDialog({
          type: 'class',
          data: data.data.class,
          scheduleMatrix: data.data.scheduleMatrix,
        });
      }
    } catch (err) {
      console.error('获取班级课表失败:', err);
      toast.error('获取班级课表失败');
    }
  }, []);

  // 查看教师详情
  const viewTeacherDetail = useCallback(async (teacher: TeacherInfo) => {
    try {
      const res = await fetch(`/api/academic/school-schedule?mode=teacher&teacherId=${teacher.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDetailDialog({
          type: 'teacher',
          data: data.data.teacher,
          scheduleMatrix: data.data.scheduleMatrix,
        });
      }
    } catch (err) {
      console.error('获取教师课表失败:', err);
      toast.error('获取教师课表失败');
    }
  }, []);

  // 筛选后的教师数据
  const filteredTeacherData = useMemo(() => {
    if (!Array.isArray(teacherData)) return [];
    if (subjectFilter === 'all') return teacherData;
    return teacherData.filter(g => g.subject === subjectFilter);
  }, [teacherData, subjectFilter]);

  // 获取学科列表
  const subjects = useMemo(() => {
    if (!Array.isArray(teacherData)) return [];
    return Array.from(new Set(teacherData.map(g => g.subject)));
  }, [teacherData]);

  return {
    // 视图
    viewMode,
    setViewMode,
    // 数据
    classData,
    teacherData,
    filteredTeacherData,
    summary,
    subjects,
    // 状态
    loading,
    // 筛选
    gradeFilter,
    setGradeFilter,
    subjectFilter,
    setSubjectFilter,
    searchQuery,
    setSearchQuery,
    // 展开
    expandedGrades,
    expandedSubjects,
    toggleGrade,
    toggleSubject,
    // 详情弹窗
    detailDialog,
    setDetailDialog,
    viewClassDetail,
    viewTeacherDetail,
    // 操作
    loadData,
    // 常量
    grades: GRADES,
  };
}
