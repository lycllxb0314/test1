import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教师档案（含教研数据）
 * 整合教师基本信息、教研活动、听课评课、培训研修等数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    // 1. 获取教师基本信息
    const { data: teacher, error: teacherError } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 404 });
    }

    // 2. 获取教研活动参与记录
    const { data: activities } = await client
      .from('research_activities')
      .select('*')
      .contains('participant_ids', [id])
      .order('created_at', { ascending: false });

    // 统计各类活动数量
    const activityByType = (activities || []).reduce((acc, activity) => {
      const type = activity.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 3. 获取听课评课记录
    // 作为听课人
    const { data: observationsAsObserver } = await client
      .from('lesson_observations')
      .select('*')
      .contains('observer_ids', [id]);

    // 作为被听课人
    const { data: observationsAsTeacher } = await client
      .from('lesson_observations')
      .select('*')
      .eq('teacher_id', id);

    // 计算平均得分
    const scoresList = (observationsAsTeacher || [])
      .filter(o => o.overall_score)
      .map(o => o.overall_score);
    const averageScore = scoresList.length > 0
      ? scoresList.reduce((a, b) => a + b, 0) / scoresList.length
      : null;

    // 4. 获取集体备课记录
    // 作为主备人
    const { data: preparationsAsHost } = await client
      .from('collective_preparations')
      .select('*')
      .eq('host_id', id);

    // 作为参与人
    const { data: preparationsAsParticipant } = await client
      .from('collective_preparations')
      .select('*')
      .contains('participant_ids', [id]);

    // 5. 获取课题研究
    const { data: projects } = await client
      .from('research_projects')
      .select('*')
      .or(`host_id.eq.${id},core_member_ids.cs.{${id}},participant_ids.cs.{${id}}`);

    const projectData = (projects || []).map(p => {
      let role: 'host' | 'core_member' | 'participant' = 'participant';
      if (p.host_id === id) {
        role = 'host';
      } else if (p.core_member_ids?.includes(id)) {
        role = 'core_member';
      }
      return {
        id: p.id,
        name: p.name,
        role,
        status: p.status,
      };
    });

    // 6. 获取培训研修记录
    const { data: trainings } = await client
      .from('teacher_trainings')
      .select('*')
      .eq('teacher_id', id);

    const totalTrainingHours = (trainings || []).reduce((sum, t) => sum + (t.hours || 0), 0);

    // 7. 获取教学成果/荣誉
    const { data: achievements } = await client
      .from('teacher_achievements')
      .select('*')
      .eq('teacher_id', id)
      .order('date', { ascending: false });

    // 8. 获取成长记录
    const { data: growthRecords } = await client
      .from('teacher_growth_records')
      .select('*')
      .eq('teacher_id', id)
      .order('date', { ascending: false })
      .limit(20);

    // 组装完整的教师档案
    const profile = {
      teacherId: id,
      teacherName: teacher.name,
      
      // 基本信息
      basicInfo: {
        employeeId: teacher.employee_id,
        gender: teacher.gender,
        phone: teacher.phone,
        email: teacher.email,
        department: teacher.department,
        subject: teacher.subject,
        title: teacher.title,
        education: teacher.education,
        joinDate: teacher.join_date,
        status: teacher.status,
      },

      // 教研活动统计
      totalActivities: (activities || []).length,
      activityByType: Object.entries(activityByType).map(([type, count]) => ({
        type,
        count,
      })),

      // 听课统计
      lessonsObserved: (observationsAsObserver || []).length,
      lessonsTaught: (observationsAsTeacher || []).length,
      averageScore,

      // 备课统计
      lessonsPrepared: (preparationsAsHost || []).length,
      lessonsParticipated: (preparationsAsParticipant || []).length,

      // 课题研究
      projects: projectData,

      // 培训研修
      trainings: (trainings || []).map(t => ({
        id: t.id,
        name: t.name,
        hours: t.hours,
        completedAt: t.completed_at,
      })),
      totalTrainingHours,

      // 教学成果
      achievements: (achievements || []).map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        level: a.level,
        date: a.date,
      })),

      // 成长记录
      growthRecords: growthRecords || [],

      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Failed to fetch teacher profile:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师档案失败',
    }, { status: 500 });
  }
}
