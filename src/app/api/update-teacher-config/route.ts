/**
 * 更新教师可任教科目配置API
 * 
 * 核心逻辑：teachable_subjects = primary_subject + secondary_subjects
 * 
 * 更新规则：
 * - 语文班主任：primary=语文, secondary=[道德与法治, 班会, 书法]
 * - 数学班主任：primary=数学, secondary=[劳动, 班会]
 * - 语文科任：primary=语文, secondary=[道德与法治, 书法]
 * - 数学科任：primary=数学, secondary=[科学, 劳动]
 * - 英语教师：primary=英语, secondary=[]（仅3-6年级）
 * - 其他技能科：primary=对应科目, secondary=[]
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface UpdateResult {
  role: string;
  subject: string;
  count: number;
  message: string;
}

export async function GET() {
  const client = getSupabaseClient();
  
  try {
    const { data: teachers, error } = await client
      .from('teachers')
      .select('id, name, subjects, role, primary_subject, secondary_subjects, total_weekly_hours, teachable_grades, main_class_count');
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 计算每个教师的 teachable_subjects
    const teachersWithTeachable = (teachers || []).map(t => ({
      ...t,
      teachable_subjects: [
        t.primary_subject,
        ...(t.secondary_subjects || [])
      ].filter(Boolean),
    }));
    
    const stats = {
      total: teachers?.length || 0,
      byRole: {
        head_teacher: teachers?.filter(t => t.role === 'head_teacher').length || 0,
        subject_teacher: teachers?.filter(t => t.role === 'subject_teacher').length || 0,
        skill_teacher: teachers?.filter(t => t.role === 'skill_teacher').length || 0,
      },
      needUpdate: teachersWithTeachable.filter(t => !t.primary_subject).length,
    };
    
    return NextResponse.json({
      success: true,
      stats,
      sampleTeachers: teachersWithTeachable.slice(0, 5),
    });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * 根据学科筛选教师
 * 由于 subjects 是 jsonb/text 字段，使用文本匹配方式
 */
async function getTeachersBySubject(client: any, subject: string, role?: string): Promise<any[]> {
  // 使用 text 类型的 ilike 查询
  let query = client
    .from('teachers')
    .select('id, name, role, primary_subject, secondary_subjects')
    .ilike('subjects::text', `%"${subject}"%`);
  
  if (role) {
    query = query.eq('role', role);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`查询 ${subject} 教师失败:`, error);
    return [];
  }
  
  return data || [];
}

export async function POST() {
  const client = getSupabaseClient();
  const results: UpdateResult[] = [];
  
  try {
    // 先获取所有教师，按角色和学科分组
    const { data: allTeachers, error: fetchError } = await client
      .from('teachers')
      .select('id, name, role, subjects, primary_subject');
    
    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }
    
    // 按条件筛选并更新
    // 1. 语文班主任
    const chineseHeadsIds = (allTeachers || [])
      .filter(t => t.role === 'head_teacher' && t.subjects?.includes('语文'))
      .map(t => t.id);
    
    if (chineseHeadsIds.length > 0) {
      const { error: err1 } = await client
        .from('teachers')
        .update({
          primary_subject: '语文',
          secondary_subjects: ['道德与法治', '班会', '书法', '综合实践', '校本'],
          total_weekly_hours: 16,
          main_class_count: 1,
          main_subject_hours: 6,
        })
        .in('id', chineseHeadsIds);
      
      if (err1) {
        results.push({ role: 'head_teacher', subject: '语文', count: 0, message: err1.message });
      } else {
        results.push({ role: 'head_teacher', subject: '语文', count: chineseHeadsIds.length, message: '更新成功' });
      }
    } else {
      results.push({ role: 'head_teacher', subject: '语文', count: 0, message: '无匹配教师' });
    }

    // 2. 数学班主任
    const mathHeadsIds = (allTeachers || [])
      .filter(t => t.role === 'head_teacher' && t.subjects?.includes('数学'))
      .map(t => t.id);
    
    if (mathHeadsIds.length > 0) {
      const { error: err2 } = await client
        .from('teachers')
        .update({
          primary_subject: '数学',
          secondary_subjects: ['劳动', '班会', '科学', '综合实践', '校本'],
          total_weekly_hours: 16,
          main_class_count: 1,
          main_subject_hours: 5,
        })
        .in('id', mathHeadsIds);
      
      if (err2) {
        results.push({ role: 'head_teacher', subject: '数学', count: 0, message: err2.message });
      } else {
        results.push({ role: 'head_teacher', subject: '数学', count: mathHeadsIds.length, message: '更新成功' });
      }
    } else {
      results.push({ role: 'head_teacher', subject: '数学', count: 0, message: '无匹配教师' });
    }

    // 3. 语文科任教师
    const chineseSubsIds = (allTeachers || [])
      .filter(t => t.role === 'subject_teacher' && t.subjects?.includes('语文'))
      .map(t => t.id);
    
    if (chineseSubsIds.length > 0) {
      const { error: err3 } = await client
        .from('teachers')
        .update({
          primary_subject: '语文',
          secondary_subjects: ['道德与法治', '书法', '综合实践', '校本'],
          total_weekly_hours: 16,
          main_class_count: 2,
          main_subject_hours: 12,
        })
        .in('id', chineseSubsIds);
      
      if (err3) {
        results.push({ role: 'subject_teacher', subject: '语文', count: 0, message: err3.message });
      } else {
        results.push({ role: 'subject_teacher', subject: '语文', count: chineseSubsIds.length, message: '更新成功' });
      }
    } else {
      results.push({ role: 'subject_teacher', subject: '语文', count: 0, message: '无匹配教师' });
    }

    // 4. 数学科任教师
    const mathSubsIds = (allTeachers || [])
      .filter(t => t.role === 'subject_teacher' && t.subjects?.includes('数学'))
      .map(t => t.id);
    
    if (mathSubsIds.length > 0) {
      const { error: err4 } = await client
        .from('teachers')
        .update({
          primary_subject: '数学',
          secondary_subjects: ['科学', '劳动', '综合实践', '校本'],
          total_weekly_hours: 16,
          main_class_count: 2,
          main_subject_hours: 10,
        })
        .in('id', mathSubsIds);
      
      if (err4) {
        results.push({ role: 'subject_teacher', subject: '数学', count: 0, message: err4.message });
      } else {
        results.push({ role: 'subject_teacher', subject: '数学', count: mathSubsIds.length, message: '更新成功' });
      }
    } else {
      results.push({ role: 'subject_teacher', subject: '数学', count: 0, message: '无匹配教师' });
    }

    // 5. 技能科教师
    const skillSubjects = [
      { name: '英语', hours: 15, grades: [3, 4, 5, 6] },
      { name: '体育', hours: 18, grades: [1, 2, 3, 4, 5, 6] },
      { name: '音乐', hours: 18, grades: [1, 2, 3, 4, 5, 6] },
      { name: '美术', hours: 18, grades: [1, 2, 3, 4, 5, 6] },
      { name: '科学', hours: 18, grades: [1, 2, 3, 4, 5, 6] },
      { name: '道德与法治', hours: 18, grades: [1, 2, 3, 4, 5, 6] },
      { name: '信息技术', hours: 18, grades: [3, 4, 5, 6] },
      { name: '心育', hours: 18, grades: [3, 4, 5, 6] },
    ];

    for (const subj of skillSubjects) {
      const skillTeacherIds = (allTeachers || [])
        .filter(t => t.role === 'skill_teacher' && t.subjects?.includes(subj.name))
        .map(t => t.id);
      
      if (skillTeacherIds.length > 0) {
        const { error } = await client
          .from('teachers')
          .update({
            primary_subject: subj.name,
            secondary_subjects: [],
            total_weekly_hours: subj.hours,
            teachable_grades: subj.grades,
            main_class_count: 0,
            main_subject_hours: 0,
          })
          .in('id', skillTeacherIds);
        
        if (error) {
          results.push({ role: 'skill_teacher', subject: subj.name, count: 0, message: error.message });
        } else {
          results.push({ role: 'skill_teacher', subject: subj.name, count: skillTeacherIds.length, message: '更新成功' });
        }
      } else {
        results.push({ role: 'skill_teacher', subject: subj.name, count: 0, message: '无匹配教师' });
      }
    }

    // 汇总结果
    const totalUpdated = results.reduce((sum, r) => sum + (r.message === '更新成功' ? r.count : 0), 0);
    const errors = results.filter(r => r.message !== '更新成功' && r.message !== '无匹配教师');

    return NextResponse.json({
      success: true,
      message: `成功更新 ${totalUpdated} 位教师配置`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalUpdated,
        totalErrors: errors.length,
        teachableLogic: 'teachable_subjects = primary_subject + secondary_subjects',
        details: {
          headTeachers: results.filter(r => r.role === 'head_teacher' && r.message === '更新成功').reduce((s, r) => s + r.count, 0),
          subjectTeachers: results.filter(r => r.role === 'subject_teacher' && r.message === '更新成功').reduce((s, r) => s + r.count, 0),
          skillTeachers: results.filter(r => r.role === 'skill_teacher' && r.message === '更新成功').reduce((s, r) => s + r.count, 0),
        },
      },
    });

  } catch (error: any) {
    console.error('更新教师配置失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新失败' },
      { status: 500 }
    );
  }
}
