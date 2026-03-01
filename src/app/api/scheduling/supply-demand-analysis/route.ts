/**
 * 课时供需分析API
 * 
 * 分析逻辑：
 * 1. 根据国家课程标准计算各学科总课时需求
 * 2. 根据教师数量和课时标准计算课时供给
 * 3. 对比供需，发现过剩或不足
 * 4. 提出优化建议
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 国家课程标准 - 每周课时数
 * 参考：《义务教育课程设置实验方案》
 */
const CURRICULUM_STANDARD = {
  // 主科
  语文: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 8, 2: 8, 3: 7, 4: 7, 5: 6, 6: 6 } },
  数学: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 5, 6: 5 } },
  // 技能科
  英语: { grades: [3, 4, 5, 6], hoursPerGrade: { 3: 2, 4: 2, 5: 2, 6: 2 } },
  体育: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 4, 2: 4, 3: 3, 4: 3, 5: 3, 6: 3 } },
  音乐: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 } },
  美术: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 } },
  科学: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 } },
  道德与法治: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 } },
  // 其他课程
  劳动: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  班会: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  书法: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  综合实践: { grades: [3, 4, 5, 6], hoursPerGrade: { 3: 1, 4: 1, 5: 1, 6: 1 } },
  校本课程: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
};

/**
 * 国家课时标准 - 教师周课时量
 * 参考：《中小学教师工作量标准》
 */
const TEACHER_WORKLOAD_STANDARD = {
  head_teacher: { min: 12, max: 14, description: '班主任：12-14节/周（考虑班级管理负担）' },
  subject_teacher: { min: 14, max: 16, description: '科任教师：14-16节/周' },
  skill_teacher: { min: 16, max: 18, description: '技能科教师：16-18节/周' },
};

export async function GET() {
  const client = getSupabaseClient();
  
  try {
    // 1. 获取班级数据
    const { data: classes, error: classError } = await client
      .from('classes')
      .select('id, name, grade');
    
    if (classError) {
      return NextResponse.json({ success: false, error: classError.message }, { status: 500 });
    }
    
    // 2. 获取教师数据
    const { data: teachers, error: teacherError } = await client
      .from('teachers')
      .select('id, name, role, primary_subject, secondary_subjects, subjects, total_weekly_hours');
    
    if (teacherError) {
      return NextResponse.json({ success: false, error: teacherError.message }, { status: 500 });
    }
    
    // 3. 计算各年级班级数
    const gradeClassCount: Record<number, number> = {};
    for (let g = 1; g <= 6; g++) {
      gradeClassCount[g] = classes?.filter(c => c.grade === g).length || 10;
    }
    const totalClasses = classes?.length || 60;
    
    // 4. 计算各学科课时需求
    const subjectDemand: Record<string, { total: number; byGrade: Record<number, number> }> = {};
    
    for (const [subject, config] of Object.entries(CURRICULUM_STANDARD)) {
      let total = 0;
      const byGrade: Record<number, number> = {};
      
      for (const grade of config.grades) {
        const classCount = gradeClassCount[grade] || 0;
        const hoursPerClass = config.hoursPerGrade[grade as keyof typeof config.hoursPerGrade] || 0;
        const gradeTotal = classCount * hoursPerClass;
        byGrade[grade] = gradeTotal;
        total += gradeTotal;
      }
      
      subjectDemand[subject] = { total, byGrade };
    }
    
    // 5. 计算教师课时供给能力
    const teacherSupply: Record<string, {
      teachers: number;
      avgHours: number;
      minSupply: number;
      maxSupply: number;
      actualSupply: number;
    }> = {};
    
    // 按主教学科分组
    const teachersBySubject: Record<string, typeof teachers> = {};
    teachers?.forEach(t => {
      const subject = t.primary_subject || t.subjects?.[0] || '未知';
      if (!teachersBySubject[subject]) {
        teachersBySubject[subject] = [];
      }
      teachersBySubject[subject].push(t);
    });
    
    for (const [subject, subjectTeachers] of Object.entries(teachersBySubject)) {
      const count = subjectTeachers.length;
      const roles = subjectTeachers.map(t => t.role);
      
      // 根据角色确定课时范围
      let totalMinHours = 0;
      let totalMaxHours = 0;
      
      subjectTeachers.forEach(t => {
        const standard = TEACHER_WORKLOAD_STANDARD[t.role as keyof typeof TEACHER_WORKLOAD_STANDARD] 
          || TEACHER_WORKLOAD_STANDARD.skill_teacher;
        totalMinHours += standard.min;
        totalMaxHours += standard.max;
      });
      
      const avgHours = subjectTeachers.reduce((sum, t) => sum + (t.total_weekly_hours || 0), 0) / count;
      
      teacherSupply[subject] = {
        teachers: count,
        avgHours: Math.round(avgHours * 10) / 10,
        minSupply: totalMinHours,
        maxSupply: totalMaxHours,
        actualSupply: subjectTeachers.reduce((sum, t) => sum + (t.total_weekly_hours || 0), 0),
      };
    }
    
    // 6. 供需对比分析
    const analysis: Record<string, {
      demand: number;
      supply: { min: number; max: number; actual: number };
      teachers: number;
      status: 'surplus' | 'balanced' | 'shortage';
      surplus: number;
      suggestion: string;
    }> = {};
    
    for (const [subject, demand] of Object.entries(subjectDemand)) {
      const supply = teacherSupply[subject] || { minSupply: 0, maxSupply: 0, actualSupply: 0, teachers: 0 };
      
      // 使用最小供给来判断是否过剩
      const surplus = supply.minSupply - demand.total;
      let status: 'surplus' | 'balanced' | 'shortage';
      let suggestion = '';
      
      if (surplus > demand.total * 0.1) {
        status = 'surplus';
        const excessTeachers = Math.ceil(surplus / 15); // 假设平均15节/人
        suggestion = `教师过剩约${excessTeachers}人，建议减少或增加其他教学任务`;
      } else if (surplus < -demand.total * 0.1) {
        status = 'shortage';
        const shortageTeachers = Math.ceil(-surplus / 15);
        suggestion = `教师不足约${shortageTeachers}人，需要增加教师`;
      } else {
        status = 'balanced';
        suggestion = '供需基本平衡';
      }
      
      analysis[subject] = {
        demand: demand.total,
        supply: {
          min: supply.minSupply,
          max: supply.maxSupply,
          actual: supply.actualSupply,
        },
        teachers: supply.teachers,
        status,
        surplus,
        suggestion,
      };
    }
    
    // 7. 总体分析
    const totalDemand = Object.values(subjectDemand).reduce((sum, d) => sum + d.total, 0);
    const totalSupply = Object.values(teacherSupply).reduce((sum, s) => sum + s.maxSupply, 0);
    
    // 8. 教师课时均匀度分析
    const teacherHours = teachers?.map(t => t.total_weekly_hours || 0) || [];
    const avgTeacherHours = teacherHours.reduce((a, b) => a + b, 0) / teacherHours.length;
    const hoursVariance = teacherHours.reduce((sum, h) => sum + Math.pow(h - avgTeacherHours, 2), 0) / teacherHours.length;
    const hoursStdDev = Math.sqrt(hoursVariance);
    
    // 按角色统计课时分布
    const hoursByRole: Record<string, { min: number; max: number; avg: number; count: number }> = {};
    teachers?.forEach(t => {
      const role = t.role || 'unknown';
      if (!hoursByRole[role]) {
        hoursByRole[role] = { min: 100, max: 0, avg: 0, count: 0 };
      }
      const h = t.total_weekly_hours || 0;
      hoursByRole[role].min = Math.min(hoursByRole[role].min, h);
      hoursByRole[role].max = Math.max(hoursByRole[role].max, h);
      hoursByRole[role].avg += h;
      hoursByRole[role].count++;
    });
    
    for (const role of Object.keys(hoursByRole)) {
      hoursByRole[role].avg = Math.round(hoursByRole[role].avg / hoursByRole[role].count * 10) / 10;
    }
    
    return NextResponse.json({
      success: true,
      schoolInfo: {
        totalClasses,
        gradeClassCount,
        totalTeachers: teachers?.length || 0,
      },
      curriculumStandard: CURRICULUM_STANDARD,
      workloadStandard: TEACHER_WORKLOAD_STANDARD,
      analysis: {
        totalDemand,
        totalSupply,
        supplyDemandRatio: Math.round(totalSupply / totalDemand * 100) / 100,
        bySubject: analysis,
      },
      uniformity: {
        averageHours: Math.round(avgTeacherHours * 10) / 10,
        standardDeviation: Math.round(hoursStdDev * 10) / 10,
        coefficientOfVariation: Math.round(hoursStdDev / avgTeacherHours * 100) / 100,
        byRole: hoursByRole,
        assessment: hoursStdDev < 2 ? '课时分配较均匀' : hoursStdDev < 4 ? '课时分配存在一定差异' : '课时分配差异较大，需要优化',
      },
      warnings: generateWarnings(analysis, hoursByRole, TEACHER_WORKLOAD_STANDARD),
    });
    
  } catch (error: any) {
    console.error('分析失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateWarnings(
  analysis: Record<string, any>,
  hoursByRole: Record<string, any>,
  standard: typeof TEACHER_WORKLOAD_STANDARD
): string[] {
  const warnings: string[] = [];
  
  // 检查供需失衡
  for (const [subject, data] of Object.entries(analysis)) {
    if (data.status === 'surplus') {
      warnings.push(`⚠️ ${subject}教师过剩：需求${data.demand}节，供给${data.supply.min}-${data.supply.max}节`);
    } else if (data.status === 'shortage') {
      warnings.push(`⚠️ ${subject}教师不足：需求${data.demand}节，供给${data.supply.min}-${data.supply.max}节`);
    }
  }
  
  // 检查课时是否在标准范围内
  for (const [role, data] of Object.entries(hoursByRole)) {
    const std = standard[role as keyof typeof standard];
    if (std) {
      if (data.avg < std.min) {
        warnings.push(`⚠️ ${role}平均课时${data.avg}节，低于国家标准${std.min}-${std.max}节`);
      } else if (data.avg > std.max) {
        warnings.push(`⚠️ ${role}平均课时${data.avg}节，高于国家标准${std.min}-${std.max}节`);
      }
    }
  }
  
  return warnings;
}
