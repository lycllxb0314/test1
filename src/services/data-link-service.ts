/**
 * 数据关联服务
 * 处理跨系统数据流转和业务关联
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 请假通过后触发调课
 * 当请假申请审批通过后，自动创建调课任务
 */
export async function triggerScheduleAdjustment(leaveInstanceId: string): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 1. 获取请假实例详情
    const { data: leaveInstance, error: leaveError } = await client
      .from('workflow_instances')
      .select('*')
      .eq('id', leaveInstanceId)
      .single();

    if (leaveError || !leaveInstance) {
      return { success: false, error: '请假记录不存在' };
    }

    // 2. 解析请假内容
    const content = leaveInstance.content;
    const teacherId = leaveInstance.applicant_id;
    const teacherName = leaveInstance.applicant_name;
    const startDate = content.start_date;
    const endDate = content.end_date;
    const leaveType = content.leave_type;

    // 3. 查询请假期间教师的所有课程
    const { data: schedules, error: scheduleError } = await client
      .from('teaching_schedules')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (scheduleError) {
      console.error('Failed to fetch schedules:', scheduleError);
      return { success: false, error: '查询课程安排失败' };
    }

    // 4. 如果没有需要调课的课程，直接返回成功
    if (!schedules || schedules.length === 0) {
      return { 
        success: true, 
        data: { message: '请假期间无课程安排，无需调课' } 
      };
    }

    // 5. 创建调课任务
    const adjustmentTask = {
      leave_instance_id: leaveInstanceId,
      teacher_id: teacherId,
      teacher_name: teacherName,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      affected_schedules: schedules,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data: adjustment, error: adjustmentError } = await client
      .from('schedule_adjustments')
      .insert(adjustmentTask)
      .select()
      .single();

    if (adjustmentError) {
      console.error('Failed to create adjustment:', adjustmentError);
      return { success: false, error: '创建调课任务失败' };
    }

    // 6. 通知年段长（如果请假时间较长）
    if (schedules.length >= 3) {
      // 获取该教师所在年级的年段长
      const { data: teacherInfo } = await client
        .from('teachers')
        .select('grade_range')
        .eq('id', teacherId)
        .single();

      if (teacherInfo?.grade_range) {
        // 发送通知给年段长
        await client.from('notifications').insert({
          type: 'schedule_adjustment',
          title: `教师请假调课通知`,
          content: `${teacherName}老师请假（${startDate}至${endDate}），共${schedules.length}节课需要安排调课`,
          target_role: 'grade_head',
          target_grades: teacherInfo.grade_range,
          reference_id: adjustment.id,
          created_at: new Date().toISOString(),
        });
      }
    }

    return { 
      success: true, 
      data: { 
        adjustmentId: adjustment.id,
        affectedCount: schedules.length 
      } 
    };
  } catch (error) {
    console.error('Failed to trigger schedule adjustment:', error);
    return { success: false, error: '触发调课失败' };
  }
}

/**
 * 调课完成后同步课表
 * 将调课结果同步到课表系统
 */
export async function syncScheduleAfterAdjustment(adjustmentId: string): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 1. 获取调课详情
    const { data: adjustment, error: adjError } = await client
      .from('schedule_adjustments')
      .select('*')
      .eq('id', adjustmentId)
      .single();

    if (adjError || !adjustment) {
      return { success: false, error: '调课记录不存在' };
    }

    // 2. 获取调课详情列表
    const { data: details, error: detailsError } = await client
      .from('schedule_adjustment_details')
      .select('*')
      .eq('adjustment_id', adjustmentId);

    if (detailsError) {
      console.error('Failed to fetch adjustment details:', detailsError);
      return { success: false, error: '获取调课详情失败' };
    }

    // 3. 更新课表
    for (const detail of details || []) {
      if (detail.type === 'swap') {
        // 对调课程：更新两条课表记录的教师
        await client
          .from('teaching_schedules')
          .update({ teacher_id: detail.new_teacher_id })
          .eq('id', detail.original_schedule_id);

        await client
          .from('teaching_schedules')
          .update({ teacher_id: detail.original_teacher_id })
          .eq('id', detail.new_schedule_id);
      } else if (detail.type === 'substitute') {
        // 代课：更新课表的代课教师
        await client
          .from('teaching_schedules')
          .update({ 
            substitute_teacher_id: detail.substitute_teacher_id,
            substitute_teacher_name: detail.substitute_teacher_name,
            is_substituted: true 
          })
          .eq('id', detail.original_schedule_id);
      }
    }

    // 4. 更新调课任务状态
    await client
      .from('schedule_adjustments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString() 
      })
      .eq('id', adjustmentId);

    // 5. 记录同步日志
    await client
      .from('sync_logs')
      .insert({
        type: 'schedule_adjustment',
        reference_id: adjustmentId,
        status: 'success',
        details: { updatedCount: details?.length || 0 },
        created_at: new Date().toISOString(),
      });

    return { 
      success: true, 
      data: { 
        message: '课表同步完成',
        updatedCount: details?.length || 0 
      } 
    };
  } catch (error) {
    console.error('Failed to sync schedule:', error);
    return { success: false, error: '课表同步失败' };
  }
}

/**
 * 教室预约关联维修申请
 * 当教室使用后发现问题，关联维修申请
 */
export async function linkBookingToMaintenance(
  bookingId: string, 
  maintenanceId: string
): Promise<{
  success: boolean;
  data?: { message: string };
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 更新预约记录，关联维修申请
    const { error } = await client
      .from('room_bookings')
      .update({ maintenance_request: maintenanceId })
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    // 更新维修申请，关联预约记录
    await client
      .from('repair_requests')
      .update({ 
        related_booking_id: bookingId,
        source: 'room_booking' 
      })
      .eq('id', maintenanceId);

    return { success: true, data: { message: '关联成功' } };
  } catch (error) {
    console.error('Failed to link booking to maintenance:', error);
    return { success: false, error: '关联失败' };
  }
}

/**
 * 学生习惯数据同步到学生档案
 * 将学生的习惯评价数据同步到学生综合档案
 */
export async function syncStudentHabitData(studentId: string): Promise<{
  success: boolean;
  data?: { message: string };
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 1. 获取学生习惯档案数据
    const { data: habitProfile } = await client
      .from('student_habit_profiles')
      .select('*')
      .eq('student_id', studentId)
      .single();

    // 2. 更新学生档案的习惯相关字段
    const updateData = {
      habit_total_score: habitProfile?.total_score || 0,
      habit_level: habitProfile?.level || '待提高',
      habit_star_count: habitProfile?.habit_star_count || 0,
      habit_updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('student_profiles')
      .upsert({
        student_id: studentId,
        ...updateData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: '同步成功' } };
  } catch (error) {
    console.error('Failed to sync student habit data:', error);
    return { success: false, error: '同步失败' };
  }
}

/**
 * 教师教研数据同步到教师档案
 * 将教师的教研活动、听课评课数据同步到教师档案
 */
export async function syncTeacherResearchData(teacherId: string): Promise<{
  success: boolean;
  data?: { message: string };
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 1. 统计教研活动
    const { data: activities } = await client
      .from('research_activities')
      .select('*')
      .contains('participant_ids', [teacherId]);

    // 2. 统计听课评课
    const { data: observations } = await client
      .from('lesson_observations')
      .select('*')
      .contains('observer_ids', [teacherId]);

    const { data: taughtObservations } = await client
      .from('lesson_observations')
      .select('*')
      .eq('teacher_id', teacherId);

    // 3. 统计集体备课
    const { data: preparations } = await client
      .from('collective_preparations')
      .select('*')
      .contains('participant_ids', [teacherId]);

    // 4. 更新教师档案
    const updateData = {
      research_activity_count: (activities || []).length,
      lesson_observed_count: (observations || []).length,
      lesson_taught_count: (taughtObservations || []).length,
      preparation_count: (preparations || []).length,
      research_updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('teacher_profiles')
      .upsert({
        teacher_id: teacherId,
        ...updateData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: '同步成功' } };
  } catch (error) {
    console.error('Failed to sync teacher research data:', error);
    return { success: false, error: '同步失败' };
  }
}

/**
 * 班级习惯统计更新
 * 重新计算班级的习惯养成统计数据
 */
export async function updateClassHabitStats(
  classId: string, 
  month: string
): Promise<{
  success: boolean;
  data?: { message: string };
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 1. 获取班级所有学生
    const { data: students } = await client
      .from('students')
      .select('id')
      .eq('class_id', classId);

    if (!students || students.length === 0) {
      return { success: true, data: { message: '班级暂无学生' } };
    }

    // 2. 统计各习惯类别的平均达成率
    const categories = [
      'civilization', 'writing', 'reading', 'sports',
      'safety', 'hygiene', 'aesthetic', 'labor'
    ];

    const categoryRates = [];
    for (const category of categories) {
      // 获取该类别本月的所有评价记录
      const { data: assessments } = await client
        .from('habit_assessments')
        .select('student_id, score')
        .eq('category', category)
        .in('student_id', students.map(s => s.id))
        .gte('occurred_at', `${month}-01`)
        .lt('occurred_at', `${month}-32`);

      // 计算平均达成率
      const totalScore = (assessments || []).reduce((sum, a) => sum + (a.score || 0), 0);
      const avgRate = students.length > 0 ? totalScore / students.length : 0;

      categoryRates.push({
        category,
        rate: avgRate,
      });
    }

    // 3. 统计习惯之星
    const { data: stars } = await client
      .from('habit_stars')
      .select('student_id, student_name')
      .eq('class_id', classId)
      .eq('month', month);

    // 4. 计算预警学生（多个习惯类别表现较差）
    const warningStudents = [];
    for (const student of students) {
      const { data: studentAssessments } = await client
        .from('habit_assessments')
        .select('category, score')
        .eq('student_id', student.id)
        .gte('occurred_at', `${month}-01`)
        .lt('occurred_at', `${month}-32`);

      // 统计得分较低的类别
      const lowCategories = categories.filter(category => {
        const categoryScores = (studentAssessments || [])
          .filter(a => a.category === category)
          .map(a => a.score || 0);
        const avgScore = categoryScores.length > 0
          ? categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length
          : 0;
        return avgScore < 60;
      });

      if (lowCategories.length >= 2) {
        warningStudents.push({
          studentId: student.id,
          lowCategories,
        });
      }
    }

    // 5. 保存统计结果
    const overallRate = categoryRates.reduce((sum, c) => sum + c.rate, 0) / categories.length;

    const { error } = await client
      .from('class_habit_stats')
      .upsert({
        class_id: classId,
        month,
        category_rates: categoryRates,
        average_rate: overallRate,
        habit_star_count: (stars || []).length,
        habit_stars: stars || [],
        warning_students: warningStudents,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: '更新成功' } };
  } catch (error) {
    console.error('Failed to update class habit stats:', error);
    return { success: false, error: '更新失败' };
  }
}

/**
 * 导出数据关联服务
 */
export const dataLinkService = {
  triggerScheduleAdjustment,
  syncScheduleAfterAdjustment,
  linkBookingToMaintenance,
  syncStudentHabitData,
  syncTeacherResearchData,
  updateClassHabitStats,
};
