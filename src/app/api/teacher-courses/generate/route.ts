/**
 * 为所有班级生成初始科任配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

// 科目配置
const SUBJECTS = [
  { name: '语文', weeklyHours: 8 },
  { name: '数学', weeklyHours: 6 },
  { name: '英语', weeklyHours: 4 },
  { name: '体育', weeklyHours: 3 },
  { name: '音乐', weeklyHours: 2 },
  { name: '美术', weeklyHours: 2 },
  { name: '科学', weeklyHours: 2 },
  { name: '道德与法治', weeklyHours: 2 },
];

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 获取所有班级
    const { data: classes, error: classError } = await client
      .from('classes')
      .select('id, name, head_teacher_id');
    
    if (classError || !classes) {
      return NextResponse.json(error('获取班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 获取所有教师及其任教学科
    const { data: teachers, error: teacherError } = await client
      .from('teachers')
      .select('id, name, subjects');
    
    if (teacherError || !teachers) {
      return NextResponse.json(error('获取教师失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 按学科分组教师
    const teachersBySubject: Record<string, typeof teachers> = {};
    teachers.forEach(t => {
      (t.subjects || []).forEach((subject: string) => {
        if (!teachersBySubject[subject]) {
          teachersBySubject[subject] = [];
        }
        teachersBySubject[subject].push(t);
      });
    });
    
    // 清空现有配置
    await client.from('teacher_courses').delete().neq('id', 'xxx');
    
    // 为每个班级分配科任
    const records: Array<{
      id: string;
      teacher_id: string;
      teacher_name: string;
      class_id: string;
      class_name: string;
      subject: string;
      course_name: string;
      weekly_hours: number;
      is_active: boolean;
    }> = [];
    
    classes.forEach((cls, classIndex) => {
      SUBJECTS.forEach((subject, subjectIndex) => {
        const subjectTeachers = teachersBySubject[subject.name] || [];
        
        if (subjectTeachers.length > 0) {
          // 轮流分配教师，确保每个教师教的班级数相对均衡
          const teacherIndex = (classIndex + subjectIndex) % subjectTeachers.length;
          const teacher = subjectTeachers[teacherIndex];
          
          records.push({
            id: `tc_${cls.id}_${subject.name}`,
            teacher_id: teacher.id,
            teacher_name: teacher.name,
            class_id: cls.id,
            class_name: cls.name,
            subject: subject.name,
            course_name: subject.name,
            weekly_hours: subject.weeklyHours,
            is_active: true,
          });
        }
      });
    });
    
    // 批量插入
    if (records.length > 0) {
      const { error: insertError } = await client
        .from('teacher_courses')
        .insert(records);
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(error('保存失败: ' + insertError.message, ErrorCode.DATABASE_ERROR), { status: 500 });
      }
    }
    
    return NextResponse.json(success({
      message: '科任配置生成成功',
      classCount: classes.length,
      recordCount: records.length,
    }));
  } catch (err) {
    console.error('Failed to generate teacher courses:', err);
    return NextResponse.json(error('生成失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
