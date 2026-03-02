'use client';

/**
 * 正式课表数据同步 Hook
 * 
 * 从正式课表读取数据，供教师详情和班级详情使用
 */

import { useState, useEffect, useCallback } from 'react';

// 类型定义
export interface OfficialScheduleSlot {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  period_name: string;
  subject: string;
  teacher_id: string;
  teacher_name: string;
}

export interface TeacherClassInfo {
  classId: string;
  className: string;
  grade: number;
  subjects: string[];
}

export interface ClassTeacherInfo {
  subject: string;
  teachers: { id: string; name: string }[];
}

/**
 * 从正式课表获取教师的任课班级信息
 */
export function useTeacherClasses(teacherId: string | null) {
  const [classes, setClasses] = useState<TeacherClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!teacherId) {
      setClasses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/academic/official-schedule?teacherId=${teacherId}`
      );
      const result = await response.json();

      if (result.success) {
        // 按班级分组，统计每个班级的任教学科
        const classMap = new Map<string, TeacherClassInfo>();
        
        for (const slot of result.data || []) {
          const classId = slot.class_id;
          
          if (!classMap.has(classId)) {
            classMap.set(classId, {
              classId,
              className: slot.class_name,
              grade: slot.grade,
              subjects: [],
            });
          }
          
          const classInfo = classMap.get(classId)!;
          if (!classInfo.subjects.includes(slot.subject)) {
            classInfo.subjects.push(slot.subject);
          }
        }
        
        setClasses(Array.from(classMap.values()));
      } else {
        setError(result.error || '获取任课班级失败');
      }
    } catch (err) {
      setError('获取任课班级失败');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    isLoading,
    error,
    refresh: fetchClasses,
  };
}

/**
 * 从正式课表获取班级的教师团队信息
 */
export function useClassTeachers(classId: string | null) {
  const [teachers, setTeachers] = useState<ClassTeacherInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!classId) {
      setTeachers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/academic/official-schedule?classId=${classId}`
      );
      const result = await response.json();

      if (result.success) {
        // 按学科分组，统计每个学科的教师
        const subjectMap = new Map<string, { id: string; name: string }[]>();
        
        for (const slot of result.data || []) {
          const subject = slot.subject;
          
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, []);
          }
          
          const teacherList = subjectMap.get(subject)!;
          if (!teacherList.find(t => t.id === slot.teacher_id)) {
            teacherList.push({
              id: slot.teacher_id,
              name: slot.teacher_name,
            });
          }
        }
        
        const teacherInfo: ClassTeacherInfo[] = [];
        for (const [subject, teacherList] of subjectMap) {
          teacherInfo.push({ subject, teachers: teacherList });
        }
        
        // 按学科排序
        const subjectOrder = ['语文', '数学', '英语', '道德与法治', '科学', '体育', '音乐', '美术'];
        teacherInfo.sort((a, b) => {
          const indexA = subjectOrder.indexOf(a.subject);
          const indexB = subjectOrder.indexOf(b.subject);
          if (indexA === -1 && indexB === -1) return a.subject.localeCompare(b.subject);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        
        setTeachers(teacherInfo);
      } else {
        setError(result.error || '获取教师团队失败');
      }
    } catch (err) {
      setError('获取教师团队失败');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    teachers,
    isLoading,
    error,
    refresh: fetchTeachers,
  };
}

/**
 * 获取正式课表完整数据
 */
export function useOfficialSchedule(options?: {
  classId?: string;
  teacherId?: string;
  grade?: number;
}) {
  const [schedule, setSchedule] = useState<OfficialScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.classId) params.set('classId', options.classId);
      if (options?.teacherId) params.set('teacherId', options.teacherId);
      if (options?.grade) params.set('grade', options.grade.toString());

      const response = await fetch(
        `/api/academic/official-schedule?${params}`
      );
      const result = await response.json();

      if (result.success) {
        setSchedule(result.data || []);
      } else {
        setError(result.error || '获取正式课表失败');
      }
    } catch (err) {
      setError('获取正式课表失败');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [options?.classId, options?.teacherId, options?.grade]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // 更新单个课表格子
  const updateSlot = useCallback(async (
    slotId: string,
    subject: string,
    teacherId: string,
    teacherName: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch('/api/academic/official-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, subject, teacherId, teacherName }),
      });
      const result = await response.json();

      if (result.success) {
        // 更新本地数据
        setSchedule(prev =>
          prev.map(slot =>
            slot.id === slotId
              ? { ...slot, subject, teacher_id: teacherId, teacher_name: teacherName }
              : slot
          )
        );
        return true;
      } else {
        setError(result.error || '更新失败');
        return false;
      }
    } catch (err) {
      setError('更新失败');
      console.error(err);
      return false;
    }
  }, []);

  return {
    schedule,
    isLoading,
    error,
    refresh: fetchSchedule,
    updateSlot,
  };
}
