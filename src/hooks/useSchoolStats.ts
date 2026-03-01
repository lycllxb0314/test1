'use client';

import { useState, useEffect } from 'react';

export interface SchoolStats {
  school: {
    id: string;
    name: string;
    shortName: string;
    fullName: string;
    motto: string;
    address: string;
    establishedYear: number;
    campusArea: string;
    totalGrades: number;
    currentSemester: string;
    academicYear: string;
    facilities: string[];
    awards: string[];
  };
  students: {
    total: number;
    active: number;
    onLeave: number;
    suspended: number;
    transferred: number;
    byGrade: Record<number, number>;
    byStatus: Record<string, number>;
  };
  teachers: {
    total: number;
    headTeachers: number;
    subjectTeachers: number;
    byDepartment: Record<string, number>;
  };
  classes: {
    total: number;
    byGrade: Record<number, number>;
    list: Array<{
      id: string;
      name: string;
      grade: number;
      gradeName: string;
      classNumber: number;
      headTeacherId: string;
      headTeacherName: string;
      studentCount: number;
    }>;
  };
}

export function useSchoolStats() {
  const [data, setData] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/school/stats');
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || '获取数据失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error, refetch: () => setLoading(true) };
}
