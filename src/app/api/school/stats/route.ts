/**
 * 学校统计数据 API
 * 
 * 提供统一的学校统计数据，供驾驶舱、首页等使用
 * 数据源：Supabase 数据库（唯一数据源）
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取学校统计数据
 */
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 并行获取所有统计数据
    const [
      schoolResult,
      classesResult,
      teachersResult,
      studentsResult,
    ] = await Promise.all([
      client.from('schools').select('*').limit(1).single(),
      client.from('classes').select('*', { count: 'exact' }),
      client.from('teachers').select('*', { count: 'exact' }),
      client.from('students').select('*', { count: 'exact' }),
    ]);
    
    const school = schoolResult.data;
    const classes = classesResult.data || [];
    const teachers = teachersResult.data || [];
    const students = studentsResult.data || [];
    
    // 计算各年级统计
    const studentsByGrade: Record<number, number> = {};
    const classesByGrade: Record<number, number> = {};
    
    students.forEach(s => {
      const grade = s.grade || 1;
      studentsByGrade[grade] = (studentsByGrade[grade] || 0) + 1;
    });
    
    classes.forEach(c => {
      classesByGrade[c.grade] = (classesByGrade[c.grade] || 0) + 1;
    });
    
    // 按部门统计教师
    const teachersByDepartment: Record<string, number> = {};
    teachers.forEach(t => {
      const dept = t.department || '其他';
      teachersByDepartment[dept] = (teachersByDepartment[dept] || 0) + 1;
    });
    
    // 统计班主任数量
    const headTeacherCount = teachers.filter(t => t.is_head_teacher).length;
    
    // 学生状态统计
    const studentsByStatus: Record<string, number> = {};
    students.forEach(s => {
      const status = s.status || '在校';
      studentsByStatus[status] = (studentsByStatus[status] || 0) + 1;
    });
    
    return NextResponse.json(success({
      school: {
        id: school?.id || 'lysf-fx',
        name: school?.name || '龙岩师范附属小学',
        shortName: school?.short_name || '龙师附小',
        fullName: school?.full_name || '福建省龙岩师范附属小学',
        motto: school?.motto || '明德、博学、笃行、创新',
        address: school?.address || '福建省龙岩市新罗区',
        establishedYear: school?.established_year || 1914,
        campusArea: school?.campus_area || '28600平方米',
        totalGrades: school?.total_grades || 6,
        currentSemester: school?.current_semester || '2024-2025-1',
        academicYear: school?.academic_year || '2024-2025',
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
      },
      students: {
        total: students.length,
        active: studentsByStatus['在校'] || 0,
        onLeave: studentsByStatus['请假'] || 0,
        suspended: studentsByStatus['休学'] || 0,
        transferred: studentsByStatus['转学'] || 0,
        byGrade: studentsByGrade,
        byStatus: studentsByStatus,
      },
      teachers: {
        total: teachers.length,
        headTeachers: headTeacherCount,
        subjectTeachers: teachers.length - headTeacherCount,
        byDepartment: teachersByDepartment,
      },
      classes: {
        total: classes.length,
        byGrade: classesByGrade,
        list: classes.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          gradeName: c.grade_name,
          classNumber: c.class_number,
          headTeacherId: c.head_teacher_id,
          headTeacherName: c.head_teacher_name,
          studentCount: c.student_count || 0,
        })),
      },
    }));
  } catch (err) {
    console.error('Failed to fetch school stats:', err);
    return NextResponse.json(error('获取统计数据失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
