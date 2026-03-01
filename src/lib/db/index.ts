/**
 * 数据库服务层 - 统一数据访问接口
 * 
 * 这是所有数据访问的唯一入口点，确保数据来源统一。
 * 使用 Supabase 作为数据库。
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ============================================================
// 类型定义
// ============================================================

export interface School {
  id: string;
  name: string;
  short_name: string | null;
  full_name: string | null;
  motto: string | null;
  address: string | null;
  established_year: number | null;
  campus_area: string | null;
  total_grades: number;
  current_semester: string | null;
  academic_year: string | null;
  facilities: string[] | null;
  awards: string[] | null;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  grade_name: string;
  class_number: number;
  head_teacher_id: string;
  head_teacher_name: string;
  classroom_id: string | null;
  classroom_name: string | null;
  building: string | null;
  student_count: number;
  status: string;
}

export interface Teacher {
  id: string;
  name: string;
  gender: string | null;
  subjects: string[];
  is_head_teacher: boolean;
  head_teacher_class_ids: string[];
  department: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  status: string;
}

export interface Student {
  id: string;
  student_no: string;
  name: string;
  gender: string | null;
  birth_date: string | null;
  class_id: string;
  class_name: string | null;
  grade: number | null;
  parent_name: string | null;
  parent_phone: string | null;
  address: string | null;
  status: string;
}

// ============================================================
// 学校服务
// ============================================================

export async function getSchool(): Promise<School | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('schools')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching school:', error);
    return null;
  }
  
  return data as School;
}

export async function getSchoolStats() {
  const client = getSupabaseClient();
  
  const { count: totalStudents } = await client
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalTeachers } = await client
    .from('teachers')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalClasses } = await client
    .from('classes')
    .select('*', { count: 'exact', head: true });
  
  const school = await getSchool();
  
  return {
    name: school?.name || '龙岩师范附属小学',
    fullName: school?.full_name || '福建省龙岩师范附属小学',
    establishedYear: school?.established_year || 1914,
    motto: school?.motto || '明德、博学、笃行、创新',
    address: school?.address || '福建省龙岩市新罗区',
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    totalClasses: totalClasses || 0,
    campusArea: school?.campus_area || '28600平方米',
    facilities: school?.facilities || [
      '标准教室48间',
      '多媒体教室12间',
      '科学实验室4间',
      '图书馆1个',
      '体育馆1个',
      '田径场1个',
    ],
    awards: school?.awards || [
      '福建省示范小学',
      '全国文明校园',
      '全国青少年校园足球特色学校',
      '福建省德育工作先进学校',
    ],
  };
}

// ============================================================
// 班级服务
// ============================================================

export async function getClasses(): Promise<Class[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('classes')
    .select('*')
    .order('grade', { ascending: true })
    .order('class_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  
  return (data || []) as Class[];
}

export async function getClassById(id: string): Promise<Class | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('classes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching class:', error);
    return null;
  }
  
  return data as Class;
}

export async function getClassesByGrade(grade: number): Promise<Class[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('classes')
    .select('*')
    .eq('grade', grade)
    .order('class_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching classes by grade:', error);
    return [];
  }
  
  return (data || []) as Class[];
}

// ============================================================
// 教师服务
// ============================================================

export async function getTeachers(): Promise<Teacher[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('teachers')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
  
  return (data || []) as Teacher[];
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('teachers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching teacher:', error);
    return null;
  }
  
  return data as Teacher;
}

export async function getHeadTeachers(): Promise<Teacher[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('teachers')
    .select('*')
    .eq('is_head_teacher', true)
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching head teachers:', error);
    return [];
  }
  
  return (data || []) as Teacher[];
}

export async function getTeachersBySubject(subject: string): Promise<Teacher[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('teachers')
    .select('*')
    .contains('subjects', [subject]);
  
  if (error) {
    console.error('Error fetching teachers by subject:', error);
    return [];
  }
  
  return (data || []) as Teacher[];
}

// ============================================================
// 学生服务
// ============================================================

export async function getStudents(): Promise<Student[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('students')
    .select('*')
    .order('class_id', { ascending: true })
    .order('student_no', { ascending: true });
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  
  return (data || []) as Student[];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }
  
  return data as Student;
}

export async function getStudentsByClassId(classId: string): Promise<Student[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('student_no', { ascending: true });
  
  if (error) {
    console.error('Error fetching students by class:', error);
    return [];
  }
  
  return (data || []) as Student[];
}

export async function getStudentsByGrade(grade: number): Promise<Student[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('students')
    .select('*')
    .eq('grade', grade)
    .order('student_no', { ascending: true });
  
  if (error) {
    console.error('Error fetching students by grade:', error);
    return [];
  }
  
  return (data || []) as Student[];
}

// ============================================================
// 统计服务
// ============================================================

export async function getDashboardStats() {
  const [schoolStats, classes, teachers, students] = await Promise.all([
    getSchoolStats(),
    getClasses(),
    getTeachers(),
    getStudents(),
  ]);

  // 按年级统计学生数
  const studentsByGrade: Record<number, number> = {};
  students.forEach(s => {
    const grade = s.grade || 1;
    studentsByGrade[grade] = (studentsByGrade[grade] || 0) + 1;
  });

  // 按年级统计班级数
  const classesByGrade: Record<number, number> = {};
  classes.forEach(c => {
    classesByGrade[c.grade] = (classesByGrade[c.grade] || 0) + 1;
  });

  // 班主任数量
  const headTeacherCount = teachers.filter(t => t.is_head_teacher).length;

  // 按部门统计教师数
  const teachersByDepartment: Record<string, number> = {};
  teachers.forEach(t => {
    const dept = t.department || '其他';
    teachersByDepartment[dept] = (teachersByDepartment[dept] || 0) + 1;
  });

  return {
    school: schoolStats,
    students: {
      total: students.length,
      byGrade: studentsByGrade,
      active: students.filter(s => s.status === '在校').length,
      onLeave: students.filter(s => s.status === '请假').length,
    },
    teachers: {
      total: teachers.length,
      headTeachers: headTeacherCount,
      byDepartment: teachersByDepartment,
    },
    classes: {
      total: classes.length,
      byGrade: classesByGrade,
    },
  };
}
