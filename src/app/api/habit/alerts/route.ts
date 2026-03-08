import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type HabitCategory, habitCategoryNames } from '@/types';

// 预警阈值配置
const ALERT_THRESHOLDS = {
  student_low_rate: 60,  // 学生达成率低于60%
  class_decline: -5,     // 班级下降超过5%
  class_low_rate: 70,    // 班级达成率低于70%
};

/**
 * GET - 获取预警列表
 * 查询参数：
 * - month: 月份 YYYY-MM
 * - status: active, acknowledged, resolved
 * - alertType: student_low_rate, class_decline, grade_attention
 * - severity: info, warning, critical
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const alertType = searchParams.get('alertType');
    const severity = searchParams.get('severity');

    // 构建查询
    let query = client
      .from('habit_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      throw error;
    }

    // 补充学生/班级信息
    let enrichedData = data || [];
    
    // 获取学生预警的学生信息
    const studentAlerts = enrichedData.filter(a => a.student_id);
    if (studentAlerts.length > 0) {
      const studentIds = [...new Set(studentAlerts.map(a => a.student_id))];
      const { data: studentsData } = await client
        .from('students')
        .select('id, name, student_number, grade, class_name')
        .in('id', studentIds);
      
      const studentMap = (studentsData || []).reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {} as Record<string, { name: string; student_number: string; grade: number; class_name: string }>);

      enrichedData = enrichedData.map(alert => {
        if (alert.student_id) {
          const student = studentMap[alert.student_id];
          return {
            ...alert,
            studentName: student?.name,
            studentNumber: student?.student_number,
            studentGrade: student?.grade,
            studentClassName: student?.class_name,
          };
        }
        return alert;
      });
    }

    // 转换为前端格式
    const formattedData = enrichedData.map(alert => ({
      id: alert.id,
      alertType: alert.alert_type,
      severity: alert.severity,
      studentId: alert.student_id,
      studentName: alert.student_name,
      studentNumber: alert.student_number,
      studentGrade: alert.student_grade,
      studentClassName: alert.student_class_name,
      classId: alert.class_id,
      grade: alert.grade,
      title: alert.title,
      description: alert.description,
      metricValue: alert.metric_value,
      thresholdValue: alert.threshold_value,
      category: alert.category,
      categoryName: alert.category ? habitCategoryNames[alert.category as HabitCategory] : null,
      periodStart: alert.period_start,
      periodEnd: alert.period_end,
      month: alert.month,
      status: alert.status,
      acknowledgedAt: alert.acknowledged_at,
      acknowledgedBy: alert.acknowledged_by,
      acknowledgerName: alert.acknowledger_name,
      resolvedAt: alert.resolved_at,
      resolvedBy: alert.resolved_by,
      resolverName: alert.resolver_name,
      resolutionNotes: alert.resolution_notes,
      createdAt: alert.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json({
      success: false,
      error: '获取预警列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 生成预警（自动检测）
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { month, forceRegenerate = false } = body;

    if (!month) {
      return NextResponse.json({
        success: false,
        error: '缺少月份参数',
      }, { status: 400 });
    }

    // 如果强制重新生成，先删除旧数据
    if (forceRegenerate) {
      await client
        .from('habit_alerts')
        .delete()
        .eq('month', month)
        .eq('status', 'active');
    }

    const alerts: Array<{
      alert_type: string;
      severity: string;
      student_id?: string;
      class_id?: string;
      grade?: number;
      title: string;
      description: string;
      metric_value: number;
      threshold_value: number;
      category?: string;
      month: string;
    }> = [];

    // 1. 检测学生低达成率
    const { data: studentGoals } = await client
      .from('student_goals')
      .select('student_id, completed_count, target_count')
      .eq('month', month);

    if (studentGoals && studentGoals.length > 0) {
      // 按学生聚合
      const studentRates: Record<string, { completed: number; total: number }> = {};
      for (const goal of studentGoals) {
        if (!studentRates[goal.student_id]) {
          studentRates[goal.student_id] = { completed: 0, total: 0 };
        }
        studentRates[goal.student_id].completed += goal.completed_count || 0;
        studentRates[goal.student_id].total += goal.target_count || 0;
      }

      // 检测低达成率学生
      for (const [studentId, rates] of Object.entries(studentRates)) {
        const rate = rates.total > 0 ? (rates.completed / rates.total) * 100 : 0;
        
        if (rate < ALERT_THRESHOLDS.student_low_rate) {
          const severity = rate < 40 ? 'critical' : rate < 50 ? 'warning' : 'info';
          alerts.push({
            alert_type: 'student_low_rate',
            severity,
            student_id: studentId,
            title: `习惯达成率偏低`,
            description: `本月习惯达成率为 ${rate.toFixed(1)}%，低于正常水平`,
            metric_value: rate,
            threshold_value: ALERT_THRESHOLDS.student_low_rate,
            month,
          });
        }
      }
    }

    // 2. 检测班级下降趋势
    const prevMonth = getPrevMonth(month);
    
    // 获取本月班级统计
    const { data: classesData } = await client
      .from('classes')
      .select('id, name, grade, head_teacher_name');

    if (classesData && classesData.length > 0) {
      for (const cls of classesData) {
        // 获取班级学生
        const { data: classStudents } = await client
          .from('students')
          .select('id')
          .eq('class_id', cls.id);

        if (!classStudents || classStudents.length === 0) continue;

        const studentIds = classStudents.map(s => s.id);

        // 本月达成率
        const { data: currentGoals } = await client
          .from('student_goals')
          .select('completed_count, target_count')
          .eq('month', month)
          .in('student_id', studentIds);

        const currentRate = calculateRate(currentGoals || []);

        // 上月达成率
        const { data: prevGoals } = await client
          .from('student_goals')
          .select('completed_count, target_count')
          .eq('month', prevMonth)
          .in('student_id', studentIds);

        const prevRate = calculateRate(prevGoals || []);

        // 计算变化
        const change = prevRate > 0 ? currentRate - prevRate : 0;

        if (change < ALERT_THRESHOLDS.class_decline) {
          alerts.push({
            alert_type: 'class_decline',
            severity: Math.abs(change) > 10 ? 'critical' : 'warning',
            class_id: cls.id,
            title: `${cls.name} 习惯达成率下降`,
            description: `本月达成率 ${currentRate.toFixed(1)}%，较上月下降 ${Math.abs(change).toFixed(1)}%`,
            metric_value: change,
            threshold_value: ALERT_THRESHOLDS.class_decline,
            month,
          });
        }

        // 检测班级低达成率
        if (currentRate < ALERT_THRESHOLDS.class_low_rate && currentRate > 0) {
          alerts.push({
            alert_type: 'class_low_rate',
            severity: currentRate < 60 ? 'critical' : 'warning',
            class_id: cls.id,
            title: `${cls.name} 整体达成率偏低`,
            description: `班级本月达成率 ${currentRate.toFixed(1)}%，需要关注`,
            metric_value: currentRate,
            threshold_value: ALERT_THRESHOLDS.class_low_rate,
            month,
          });
        }
      }
    }

    // 保存预警数据
    if (alerts.length > 0) {
      const { error: insertError } = await client
        .from('habit_alerts')
        .insert(alerts);

      if (insertError) {
        console.error('Failed to insert alerts:', insertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `已生成 ${alerts.length} 条预警`,
      data: {
        alertCount: alerts.length,
        bySeverity: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length,
          info: alerts.filter(a => a.severity === 'info').length,
        },
      },
    });
  } catch (error) {
    console.error('Failed to generate alerts:', error);
    return NextResponse.json({
      success: false,
      error: '生成预警失败',
    }, { status: 500 });
  }
}

/**
 * PATCH - 处理预警（确认/解决）
 */
export async function PATCH(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, action, operatorId, operatorName, notes } = body;

    if (!id || !action || !operatorId || !operatorName) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'acknowledge') {
      updateData.status = 'acknowledged';
      updateData.acknowledged_at = new Date().toISOString();
      updateData.acknowledged_by = operatorId;
      updateData.acknowledger_name = operatorName;
    } else if (action === 'resolve') {
      updateData.status = 'resolved';
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = operatorId;
      updateData.resolver_name = operatorName;
      updateData.resolution_notes = notes;
    }

    const { data, error } = await client
      .from('habit_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Failed to update alert:', error);
    return NextResponse.json({
      success: false,
      error: '处理预警失败',
    }, { status: 500 });
  }
}

// 辅助函数
function getPrevMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  if (m === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${(m - 1).toString().padStart(2, '0')}`;
}

function calculateRate(goals: Array<{ completed_count: number; target_count: number }>): number {
  if (!goals || goals.length === 0) return 0;
  const total = goals.reduce((sum, g) => sum + (g.target_count || 0), 0);
  const completed = goals.reduce((sum, g) => sum + (g.completed_count || 0), 0);
  return total > 0 ? (completed / total) * 100 : 0;
}
