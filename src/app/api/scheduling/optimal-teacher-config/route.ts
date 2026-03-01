/**
 * 教师配置优化计算器
 * 
 * 根据课程需求和课时标准，计算最优教师配置
 * 确保：
 * 1. 课时符合国家标准
 * 2. 供需基本平衡
 * 3. 同角色课时均匀
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 国家课程标准 - 每周课时数
 */
const CURRICULUM_STANDARD = {
  // 主科（班主任或科任）
  语文: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 8, 2: 8, 3: 7, 4: 7, 5: 6, 6: 6 }, canBeHeadTeacher: true },
  数学: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 5, 6: 5 }, canBeHeadTeacher: true },
  // 技能科
  英语: { grades: [3, 4, 5, 6], hoursPerGrade: { 3: 2, 4: 2, 5: 2, 6: 2 }, canBeHeadTeacher: false },
  体育: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 4, 2: 4, 3: 3, 4: 3, 5: 3, 6: 3 }, canBeHeadTeacher: false },
  音乐: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }, canBeHeadTeacher: false },
  美术: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }, canBeHeadTeacher: false },
  科学: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 }, canBeHeadTeacher: false },
  道德与法治: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 }, canBeHeadTeacher: false },
  // 其他课程（由班主任或科任兼任）
  劳动: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, assignedTo: 'math_teacher' },
  班会: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, assignedTo: 'head_teacher' },
  书法: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, assignedTo: 'chinese_teacher' },
  综合实践: { grades: [3, 4, 5, 6], hoursPerGrade: { 3: 1, 4: 1, 5: 1, 6: 1 }, assignedTo: 'multiple' },
  校本课程: { grades: [1, 2, 3, 4, 5, 6], hoursPerGrade: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, assignedTo: 'multiple' },
};

/**
 * 国家课时标准
 */
const WORKLOAD_STANDARD = {
  head_teacher: { min: 12, max: 14, target: 13 },  // 班主任考虑班级管理
  subject_teacher: { min: 14, max: 16, target: 15 }, // 科任教师
  skill_teacher: { min: 16, max: 18, target: 17 },   // 技能科教师
};

interface SubjectAnalysis {
  name: string;
  demand: number;
  currentTeachers: number;
  optimalTeachers: number;
  surplus: number;
  hoursPerTeacher: number;
  teacherType: 'head_teacher' | 'subject_teacher' | 'skill_teacher';
}

export async function GET() {
  const client = getSupabaseClient();
  
  try {
    // 1. 获取班级数据
    const { data: classes } = await client.from('classes').select('id, grade');
    const { data: teachers } = await client.from('teachers').select('id, name, role, primary_subject, subjects');
    
    const totalClasses = classes?.length || 60;
    const gradeClassCount: Record<number, number> = {};
    for (let g = 1; g <= 6; g++) {
      gradeClassCount[g] = classes?.filter(c => c.grade === g).length || 10;
    }
    
    // 2. 计算各学科课时需求
    const subjectDemand: Record<string, number> = {};
    for (const [subject, config] of Object.entries(CURRICULUM_STANDARD)) {
      let total = 0;
      for (const grade of config.grades) {
        const classCount = gradeClassCount[grade] || 0;
        const hours = config.hoursPerGrade[grade as keyof typeof config.hoursPerGrade] || 0;
        total += classCount * hours;
      }
      subjectDemand[subject] = total;
    }
    
    // 3. 计算班主任需求
    const headTeacherDemand = totalClasses; // 每班一个班主任
    
    // 4. 分析各学科教师配置
    const analyses: SubjectAnalysis[] = [];
    
    // 主科分析（语文、数学）
    for (const subject of ['语文', '数学'] as const) {
      const demand = subjectDemand[subject];
      const config = CURRICULUM_STANDARD[subject];
      
      // 计算兼任课程
      let additionalDemand = 0;
      if (subject === '语文') {
        additionalDemand = subjectDemand['道德与法治'] + subjectDemand['书法'];
      } else if (subject === '数学') {
        additionalDemand = subjectDemand['劳动'];
      }
      
      const totalDemand = demand + additionalDemand;
      
      // 班主任课时计算
      // 班主任：主科课时 + 班会（1节） = 目标课时（12-14节）
      // 假设班主任主科课时约 10-12 节
      const headTeacherMainHours = 11; // 平均主科课时
      const headTeacherTotalHours = headTeacherMainHours + 1; // 加班会
      
      // 班主任能覆盖的主科课时
      const headTeacherCapacity = headTeacherDemand * headTeacherMainHours;
      
      // 剩余需要科任教师覆盖的课时
      const remainingDemand = totalDemand - headTeacherCapacity;
      
      // 科任教师数量（每人目标15节）
      const subjectTeacherCount = Math.max(0, Math.ceil(remainingDemand / WORKLOAD_STANDARD.subject_teacher.target));
      
      // 班主任中该学科的数量
      const currentHeadTeachers = teachers?.filter(t => 
        t.role === 'head_teacher' && 
        (t.primary_subject === subject || t.subjects?.includes(subject))
      ).length || 0;
      
      // 科任教师数量
      const currentSubjectTeachers = teachers?.filter(t => 
        t.role === 'subject_teacher' && 
        (t.primary_subject === subject || t.subjects?.includes(subject))
      ).length || 0;
      
      // 最优配置
      // 班主任数量 = 班级数，按语文:数学 = 1:1 配置
      const optimalHeadTeachers = Math.ceil(headTeacherDemand / 2);
      const optimalSubjectTeachers = subjectTeacherCount;
      
      analyses.push({
        name: subject,
        demand: totalDemand,
        currentTeachers: currentHeadTeachers + currentSubjectTeachers,
        optimalTeachers: optimalHeadTeachers + optimalSubjectTeachers,
        surplus: (currentHeadTeachers + currentSubjectTeachers) - (optimalHeadTeachers + optimalSubjectTeachers),
        hoursPerTeacher: Math.round(totalDemand / (currentHeadTeachers + currentSubjectTeachers)),
        teacherType: 'head_teacher',
      });
    }
    
    // 技能科分析
    const skillSubjects = ['英语', '体育', '音乐', '美术', '科学', '道德与法治'];
    for (const subject of skillSubjects) {
      const demand = subjectDemand[subject];
      const currentCount = teachers?.filter(t => 
        t.primary_subject === subject || t.subjects?.includes(subject)
      ).length || 0;
      
      // 技能科教师目标课时17节
      const optimalCount = Math.ceil(demand / WORKLOAD_STANDARD.skill_teacher.target);
      
      analyses.push({
        name: subject,
        demand,
        currentTeachers: currentCount,
        optimalTeachers: optimalCount,
        surplus: currentCount - optimalCount,
        hoursPerTeacher: currentCount > 0 ? Math.round(demand / currentCount) : 0,
        teacherType: 'skill_teacher',
      });
    }
    
    // 5. 计算优化后的课时配置
    const optimizedWorkload: Record<string, { role: string; targetHours: number; mainSubject: string; additionalSubjects: string[] }> = {};
    
    // 语文班主任配置
    const chineseHeadCount = Math.ceil(headTeacherDemand / 2);
    const chineseHeadMainHours = Math.round((subjectDemand['语文'] + subjectDemand['道德与法治'] + subjectDemand['书法']) / chineseHeadCount / 3) * 3;
    // 班主任主科课时 + 班会 = 总课时，控制在12-14节
    const chineseHeadTotal = Math.min(14, Math.max(12, chineseHeadMainHours + 1));
    optimizedWorkload['语文班主任'] = {
      role: 'head_teacher',
      targetHours: chineseHeadTotal,
      mainSubject: '语文',
      additionalSubjects: ['道德与法治', '班会', '书法'],
    };
    
    // 数学班主任配置
    const mathHeadCount = Math.floor(headTeacherDemand / 2);
    const mathHeadMainHours = Math.round((subjectDemand['数学'] + subjectDemand['劳动']) / mathHeadCount);
    const mathHeadTotal = Math.min(14, Math.max(12, mathHeadMainHours + 1));
    optimizedWorkload['数学班主任'] = {
      role: 'head_teacher',
      targetHours: mathHeadTotal,
      mainSubject: '数学',
      additionalSubjects: ['劳动', '班会'],
    };
    
    // 科任教师配置
    const remainingChinese = subjectDemand['语文'] + subjectDemand['道德与法治'] + subjectDemand['书法'] - (chineseHeadCount * (chineseHeadTotal - 1));
    const chineseSubCount = Math.ceil(remainingChinese / WORKLOAD_STANDARD.subject_teacher.target);
    if (chineseSubCount > 0) {
      optimizedWorkload['语文科任'] = {
        role: 'subject_teacher',
        targetHours: WORKLOAD_STANDARD.subject_teacher.target,
        mainSubject: '语文',
        additionalSubjects: ['道德与法治', '书法'],
      };
    }
    
    const remainingMath = subjectDemand['数学'] + subjectDemand['劳动'] - (mathHeadCount * (mathHeadTotal - 1));
    const mathSubCount = Math.ceil(remainingMath / WORKLOAD_STANDARD.subject_teacher.target);
    if (mathSubCount > 0) {
      optimizedWorkload['数学科任'] = {
        role: 'subject_teacher',
        targetHours: WORKLOAD_STANDARD.subject_teacher.target,
        mainSubject: '数学',
        additionalSubjects: ['劳动'],
      };
    }
    
    // 技能科教师配置
    for (const subject of skillSubjects) {
      const demand = subjectDemand[subject];
      const count = Math.ceil(demand / WORKLOAD_STANDARD.skill_teacher.target);
      const hours = Math.round(demand / count);
      optimizedWorkload[subject + '教师'] = {
        role: 'skill_teacher',
        targetHours: Math.min(18, Math.max(16, hours)),
        mainSubject: subject,
        additionalSubjects: [],
      };
    }
    
    // 6. 生成建议
    const recommendations: string[] = [];
    
    for (const a of analyses) {
      if (a.surplus > 5) {
        recommendations.push(`❌ ${a.name}教师过剩${a.surplus}人，建议调减或转岗`);
      } else if (a.surplus > 0) {
        recommendations.push(`⚠️ ${a.name}教师略多${a.surplus}人，可适当调减`);
      } else if (a.surplus < -5) {
        recommendations.push(`❌ ${a.name}教师不足${-a.surplus}人，急需补充`);
      } else if (a.surplus < 0) {
        recommendations.push(`⚠️ ${a.name}教师略缺${-a.surplus}人，建议补充`);
      } else {
        recommendations.push(`✅ ${a.name}教师配置合理`);
      }
    }
    
    // 计算最优总教师数
    const optimalTotal = Object.entries(optimizedWorkload).reduce((sum, [_, config]) => {
      // 根据需求计算数量
      return sum;
    }, 0);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalClasses,
        totalTeachers: teachers?.length || 0,
        totalDemand: Object.values(subjectDemand).reduce((a, b) => a + b, 0),
        mainDemand: subjectDemand['语文'] + subjectDemand['数学'],
        skillDemand: skillSubjects.reduce((sum, s) => sum + subjectDemand[s], 0),
      },
      analysis: analyses,
      optimizedWorkload,
      recommendations,
      suggestedTeacherCount: {
        headTeachers: headTeacherDemand,
        subjectTeachers: chineseSubCount + mathSubCount,
        skillTeachers: skillSubjects.reduce((sum, s) => sum + Math.ceil(subjectDemand[s] / WORKLOAD_STANDARD.skill_teacher.target), 0),
        total: headTeacherDemand + chineseSubCount + mathSubCount + skillSubjects.reduce((sum, s) => sum + Math.ceil(subjectDemand[s] / WORKLOAD_STANDARD.skill_teacher.target), 0),
      },
      workloadStandard: WORKLOAD_STANDARD,
    });
    
  } catch (error: any) {
    console.error('分析失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
