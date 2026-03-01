/**
 * 精确课时分配计算器
 * 
 * 国家标准课时量：
 * 1. 语数教师（班主任/科任）：14-16节/周
 * 2. 英语教师：14-16节/周（特殊技能科，可跨年级段）
 * 3. 其他技能科教师：16-18节/周
 * 4. 同角色课时尽量均匀
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 课程标准配置
 */
const CURRICULUM = {
  语文: { grades: [1,2,3,4,5,6], hours: { 1:8, 2:8, 3:7, 4:7, 5:6, 6:6 } },
  数学: { grades: [1,2,3,4,5,6], hours: { 1:4, 2:4, 3:4, 4:4, 5:5, 6:5 } },
  英语: { grades: [3,4,5,6], hours: { 3:2, 4:2, 5:2, 6:2 } },
  体育: { grades: [1,2,3,4,5,6], hours: { 1:4, 2:4, 3:3, 4:3, 5:3, 6:3 } },
  音乐: { grades: [1,2,3,4,5,6], hours: { 1:2, 2:2, 3:2, 4:2, 5:2, 6:2 } },
  美术: { grades: [1,2,3,4,5,6], hours: { 1:2, 2:2, 3:2, 4:2, 5:2, 6:2 } },
  科学: { grades: [1,2,3,4,5,6], hours: { 1:1, 2:1, 3:2, 4:2, 5:2, 6:2 } },
  道德与法治: { grades: [1,2,3,4,5,6], hours: { 1:2, 2:2, 3:2, 4:2, 5:2, 6:2 } },
  劳动: { grades: [1,2,3,4,5,6], hours: { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1 } },
  班会: { grades: [1,2,3,4,5,6], hours: { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1 } },
  书法: { grades: [1,2,3,4,5,6], hours: { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1 } },
};

const WORKLOAD = {
  head_teacher: { min: 14, max: 16, ideal: 15 },      // 班主任也是语数教师，统一标准
  subject_teacher: { min: 14, max: 16, ideal: 15 },   // 科任教师（语数）
  skill_teacher: { min: 16, max: 18, ideal: 17 },     // 技能科教师
};

export async function GET() {
  const client = getSupabaseClient();
  
  try {
    const { data: classes } = await client.from('classes').select('id, grade');
    const { data: teachers } = await client.from('teachers').select('id, name, role, primary_subject, subjects, total_weekly_hours');
    
    const totalClasses = classes?.length || 60;
    
    // 各年级班级数
    const gradeClassCount: Record<number, number> = {};
    for (let g = 1; g <= 6; g++) {
      gradeClassCount[g] = classes?.filter(c => c.grade === g).length || 10;
    }
    
    // 各学科课时需求
    const subjectDemand: Record<string, number> = {};
    for (const [subject, config] of Object.entries(CURRICULUM)) {
      let total = 0;
      for (const grade of config.grades) {
        total += gradeClassCount[grade] * (config.hours[grade as keyof typeof config.hours] || 0);
      }
      subjectDemand[subject] = total;
    }
    
    // ========== 计算最优配置 ==========
    
    // 1. 班主任数量 = 班级数
    const headTeacherCount = totalClasses;
    
    // 2. 班主任学科分配（语文:数学 = 1:1）
    const chineseHeadCount = Math.ceil(headTeacherCount / 2);  // 30
    const mathHeadCount = Math.floor(headTeacherCount / 2);    // 30
    
    // 3. 计算班主任课时
    // 语文班主任承担：语文 + 班会 + 道德与法治(部分) + 书法
    // 数学班主任承担：数学 + 班会 + 劳动
    
    // 语文班主任人均课时计算（国家标准14-16节）
    const chineseHeadChineseHours = Math.round(subjectDemand['语文'] / chineseHeadCount); // 约14节
    const chineseHeadTotal = Math.min(16, Math.max(14, chineseHeadChineseHours + 1)); // 加班会，控制在14-16节
    
    // 数学班主任人均课时计算（国家标准14-16节）
    const mathHeadMathHours = Math.round(subjectDemand['数学'] / mathHeadCount); // 约9节
    const mathHeadTotal = Math.min(16, Math.max(14, mathHeadMathHours + 2)); // 加班会+劳动，控制在14-16节
    
    // 4. 计算科任教师需求
    // 语文剩余课时
    const chineseCovered = chineseHeadCount * chineseHeadChineseHours;
    const remainingChinese = Math.max(0, subjectDemand['语文'] - chineseCovered);
    const chineseSubCount = remainingChinese > 0 ? Math.ceil(remainingChinese / WORKLOAD.subject_teacher.ideal) : 0;
    
    // 数学剩余课时
    const mathCovered = mathHeadCount * mathHeadMathHours;
    const remainingMath = Math.max(0, subjectDemand['数学'] + subjectDemand['劳动'] - mathCovered);
    const mathSubCount = remainingMath > 0 ? Math.ceil(remainingMath / WORKLOAD.subject_teacher.ideal) : 0;
    
    // 5. 技能科教师
    const skillTeachers: Record<string, { count: number; targetHours: number; demand: number }> = {};
    const skillSubjects = ['英语', '体育', '音乐', '美术', '科学', '道德与法治'];
    
    for (const subject of skillSubjects) {
      let demand = subjectDemand[subject];
      // 道德与法治部分由语文班主任承担
      if (subject === '道德与法治') {
        demand = Math.max(0, demand - chineseHeadCount * 2); // 语文班主任每人教2节
      }
      
      const count = Math.ceil(demand / WORKLOAD.skill_teacher.ideal);
      const hours = Math.round(demand / count);
      
      skillTeachers[subject] = {
        count,
        targetHours: Math.min(18, Math.max(16, hours)),
        demand,
      };
    }
    
    // 6. 汇总最优教师数
    const skillTotal = Object.values(skillTeachers).reduce((s, v) => s + v.count, 0);
    const optimalTotal = chineseHeadCount + mathHeadCount + chineseSubCount + mathSubCount + skillTotal;
    
    // 7. 计算课时均匀度
    const allHours: number[] = [];
    for (let i = 0; i < chineseHeadCount; i++) allHours.push(chineseHeadTotal);
    for (let i = 0; i < mathHeadCount; i++) allHours.push(mathHeadTotal);
    for (let i = 0; i < chineseSubCount; i++) allHours.push(WORKLOAD.subject_teacher.ideal);
    for (let i = 0; i < mathSubCount; i++) allHours.push(WORKLOAD.subject_teacher.ideal);
    for (const config of Object.values(skillTeachers)) {
      for (let i = 0; i < config.count; i++) allHours.push(config.targetHours);
    }
    
    const avgHours = allHours.reduce((a, b) => a + b, 0) / allHours.length;
    const variance = allHours.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) / allHours.length;
    const stdDev = Math.sqrt(variance);
    
    // 8. 当前配置
    const currentByRole = {
      head_teacher: teachers?.filter(t => t.role === 'head_teacher').length || 0,
      subject_teacher: teachers?.filter(t => t.role === 'subject_teacher').length || 0,
      skill_teacher: teachers?.filter(t => t.role === 'skill_teacher').length || 0,
    };
    
    const currentBySubject: Record<string, number> = {};
    teachers?.forEach(t => {
      const subj = t.primary_subject || t.subjects?.[0] || '未知';
      currentBySubject[subj] = (currentBySubject[subj] || 0) + 1;
    });
    
    // 9. 生成建议
    const recommendations: string[] = [];
    const surplus = (teachers?.length || 0) - optimalTotal;
    
    if (surplus > 10) {
      recommendations.push(`🔴 教师总数过剩${surplus}人，建议精简编制`);
    } else if (surplus > 0) {
      recommendations.push(`🟡 教师略多${surplus}人，可适当调减`);
    } else if (surplus < 0) {
      recommendations.push(`🔴 教师不足${-surplus}人，急需补充`);
    } else {
      recommendations.push(`✅ 教师总数配置合理`);
    }
    
    // 语文教师过剩检查
    const chineseTotal = chineseHeadCount + chineseSubCount;
    const chineseCurrent = currentBySubject['语文'] || 0;
    if (chineseCurrent > chineseTotal + 3) {
      recommendations.push(`🔴 语文教师过剩${chineseCurrent - chineseTotal}人，建议转岗`);
    }
    
    // 数学教师过剩检查
    const mathTotal = mathHeadCount + mathSubCount;
    const mathCurrent = currentBySubject['数学'] || 0;
    if (mathCurrent > mathTotal + 3) {
      recommendations.push(`🔴 数学教师过剩${mathCurrent - mathTotal}人，建议转岗`);
    }
    
    // 英语教师过剩检查
    const engCurrent = currentBySubject['英语'] || 0;
    const engOptimal = skillTeachers['英语']?.count || 0;
    if (engCurrent > engOptimal + 2) {
      recommendations.push(`🔴 英语教师过剩${engCurrent - engOptimal}人`);
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalClasses,
        currentTeachers: teachers?.length || 0,
        optimalTeachers: optimalTotal,
        surplus,
        supplyDemandRatio: Math.round((teachers?.length || 0) / optimalTotal * 100) / 100,
      },
      subjectDemand,
      optimalConfig: {
        headTeachers: {
          chinese: { count: chineseHeadCount, targetHours: chineseHeadTotal, subjects: ['语文', '道德与法治', '班会', '书法'] },
          math: { count: mathHeadCount, targetHours: mathHeadTotal, subjects: ['数学', '劳动', '班会'] },
        },
        subjectTeachers: {
          chinese: { count: chineseSubCount, targetHours: WORKLOAD.subject_teacher.ideal, subjects: ['语文'] },
          math: { count: mathSubCount, targetHours: WORKLOAD.subject_teacher.ideal, subjects: ['数学'] },
        },
        skillTeachers,
      },
      currentConfig: {
        byRole: currentByRole,
        bySubject: currentBySubject,
      },
      uniformity: {
        averageHours: Math.round(avgHours * 10) / 10,
        standardDeviation: Math.round(stdDev * 10) / 10,
        min: Math.min(...allHours),
        max: Math.max(...allHours),
        range: Math.max(...allHours) - Math.min(...allHours),
        assessment: stdDev < 1.5 ? '优秀' : stdDev < 2.5 ? '良好' : '需优化',
      },
      workloadStandard: WORKLOAD,
      recommendations,
    });
    
  } catch (error: any) {
    console.error('计算失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
