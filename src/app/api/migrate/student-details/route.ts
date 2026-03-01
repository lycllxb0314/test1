/**
 * 全面补充学生详情数据的API
 * 用于生成完整的测试数据
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 随机选择
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// 数据池
const ethnicities = ['汉族', '畲族', '回族', '满族', '壮族'];
const nativePlaces = ['福建龙岩', '福建厦门', '福建泉州', '福建福州', '江西赣州'];
const politicalStatuses = ['少先队员', '群众'];
const familyTypes = ['核心家庭', '单亲家庭', '重组家庭', '隔代家庭', '其他'];
const studentTypes = ['普通', '随迁子女', '留守儿童', '残疾学生', '低保家庭'];

// 习惯类别
const habitCategories = [
  { category: 'civilization', name: '文明习惯' },
  { category: 'writing', name: '书写习惯' },
  { category: 'reading', name: '阅读习惯' },
  { category: 'sports', name: '运动习惯' },
  { category: 'safety', name: '安全习惯' },
  { category: 'hygiene', name: '卫生习惯' },
  { category: 'aesthetic', name: '审美习惯' },
  { category: 'labor', name: '劳动习惯' },
];

// 荣誉池
const honorTemplates = [
  { title: '三好学生', levels: ['班级', '校级', '区级'], category: '综合' },
  { title: '学习之星', levels: ['班级', '校级'], category: '学习' },
  { title: '优秀少先队员', levels: ['校级', '区级', '市级'], category: '德育' },
  { title: '运动会获奖', levels: ['班级', '校级'], category: '体育' },
  { title: '书法比赛获奖', levels: ['校级', '区级', '市级'], category: '艺术' },
  { title: '作文比赛获奖', levels: ['校级', '区级', '市级'], category: '学习' },
];

// 科目
const subjects = ['语文', '数学', '英语'];

// 年级名称映射
const gradeNames: Record<number, string> = {
  1: '一年级', 2: '二年级', 3: '三年级',
  4: '四年级', 5: '五年级', 6: '六年级',
};

export async function POST() {
  const client = getSupabaseClient();
  const results: { table: string; updated: number }[] = [];

  try {
    // 从数据库获取所有学生
    const { data: dbStudents, error: studentsError } = await client
      .from('students')
      .select('*');
    
    if (studentsError || !dbStudents) {
      return NextResponse.json({
        success: false,
        error: '获取学生数据失败: ' + (studentsError?.message || '无数据'),
      }, { status: 500 });
    }

    // 从数据库获取所有班级
    const { data: dbClasses } = await client
      .from('classes')
      .select('*');
    
    const classMap = new Map((dbClasses || []).map(c => [c.id, c]));

    // 1. 更新学生基本信息
    console.log('Updating student basic info...');
    let studentsUpdated = 0;
    
    for (const student of dbStudents) {
      const cls = classMap.get(student.class_id);
      const phonePrefix = randomChoice(['138', '139', '136', '135', '186', '187', '150']);
      
      const updateData = {
        // 民族、籍贯、政治面貌
        ethnicity: randomChoice(ethnicities),
        native_place: randomChoice(nativePlaces),
        political_status: student.grade <= 2 ? '少先队员' : randomChoice(politicalStatuses),
        
        // 入学日期（根据年级推算）
        enrollment_date: `${2018 + (6 - (cls?.grade || 1))}-09-01`,
        student_type: Math.random() > 0.85 ? randomChoice(studentTypes.slice(1)) : '普通',
        
        // 家庭信息
        family_type: randomChoice(familyTypes),
        
        // 家长信息
        parents: [
          {
            id: `p_${student.id}_1`,
            name: `${student.name.charAt(0)}父`,
            relationship: '父亲',
            phone: `${phonePrefix}****${String(randomInt(1000, 9999))}`,
            isPrimary: true,
          },
          {
            id: `p_${student.id}_2`,
            name: `${student.name.charAt(0)}母`,
            relationship: '母亲',
            phone: `${randomChoice(['138', '139', '186'])}****${String(randomInt(1000, 9999))}`,
            isPrimary: false,
          },
        ],
        
        // 紧急联系人
        emergency_contact: student.gender === 'male' ? `${student.name.charAt(0)}先生` : `${student.name.charAt(0)}女士`,
        emergency_phone: `${phonePrefix}****${String(randomInt(1000, 9999))}`,
        
        // 地址
        address: `龙岩市新罗区${randomChoice(['东城', '南城', '西城', '北城', '中城'])}街道`,
        home_address: `龙岩市新罗区${randomChoice(['东城', '南城', '西城', '北城', '中城'])}街道xx路xx号`,
      };
      
      const { error } = await client
        .from('students')
        .update(updateData)
        .eq('id', student.id);
      
      if (error) {
        console.error(`Failed to update student ${student.id}:`, error.message);
      } else {
        studentsUpdated++;
      }
    }
    results.push({ table: 'students', updated: studentsUpdated });

    // 2. 生成学业记录
    console.log('Generating academic records...');
    let academicRecordsCreated = 0;
    
    // 先清空现有记录
    await client.from('student_academic_records').delete().neq('id', 'xxx');
    
    for (const student of dbStudents) {
      // 每个学生生成最近两次考试的成绩
      for (const subject of subjects) {
        for (let examIdx = 0; examIdx < 2; examIdx++) {
          const score = randomInt(60, 100);
          const level = score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 60 ? '合格' : '待提高';
          
          const record = {
            id: `ar_${student.id}_${subject}_${examIdx}`,
            student_id: student.id,
            student_name: student.name,
            class_id: student.class_id,
            semester: examIdx === 0 ? '2024-2025-1' : '2023-2024-2',
            exam_type: examIdx === 0 ? '期中' : '期末',
            subject,
            score,
            level,
            class_rank: randomInt(1, 30),
            grade_rank: randomInt(1, 100),
            created_at: examIdx === 0 ? '2024-11-15' : '2024-06-25',
          };
          
          const { error } = await client.from('student_academic_records').insert(record);
          if (!error) academicRecordsCreated++;
        }
      }
    }
    results.push({ table: 'student_academic_records', updated: academicRecordsCreated });

    // 3. 生成荣誉记录
    console.log('Generating honors...');
    let honorsCreated = 0;
    
    await client.from('student_honors').delete().neq('id', 'xxx');
    
    for (const student of dbStudents) {
      // 每个学生随机1-3个荣誉
      const numHonors = randomInt(1, 3);
      for (let i = 0; i < numHonors; i++) {
        const template = randomChoice(honorTemplates);
        const level = randomChoice(template.levels);
        
        const honor = {
          id: `h_${student.id}_${i}`,
          student_id: student.id,
          title: template.title,
          level,
          category: template.category,
          issuer: level === '班级' ? '班级' : level === '校级' ? '学校' : `${level}教育局`,
          date: `2024-${String(randomInt(1, 12)).padStart(2, '0')}`,
        };
        
        const { error } = await client.from('student_honors').insert(honor);
        if (!error) honorsCreated++;
      }
    }
    results.push({ table: 'student_honors', updated: honorsCreated });

    // 4. 生成成长记录
    console.log('Generating growth records...');
    let growthRecordsCreated = 0;
    
    await client.from('student_growth_records').delete().neq('id', 'xxx');
    
    for (const student of dbStudents) {
      const cls = classMap.get(student.class_id);
      
      // 入学记录
      const enrollmentRecord = {
        id: `gr_${student.id}_enroll`,
        student_id: student.id,
        type: '入学',
        title: '入学登记',
        description: `${gradeNames[cls?.grade || 1] || '一年级'}入学`,
        date: `${2018 + (6 - (cls?.grade || 1))}-09-01`,
        created_at: `${2018 + (6 - (cls?.grade || 1))}-09-01`,
      };
      
      const { error: err1 } = await client.from('student_growth_records').insert(enrollmentRecord);
      if (!err1) growthRecordsCreated++;
      
      // 随机1-2条其他成长记录
      const otherRecords = [
        { type: '表彰', title: '获得表彰', description: '学期表现优秀' },
        { type: '家访', title: '家访记录', description: '了解学生家庭情况' },
        { type: '转班', title: '班级调整', description: '因学校安排调整班级' },
      ];
      
      const numRecords = randomInt(0, 2);
      for (let i = 0; i < numRecords; i++) {
        const record = randomChoice(otherRecords);
        const growthRecord = {
          id: `gr_${student.id}_${i + 1}`,
          student_id: student.id,
          type: record.type,
          title: record.title,
          description: record.description,
          date: `2024-${String(randomInt(1, 11)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          created_at: new Date().toISOString(),
        };
        
        const { error } = await client.from('student_growth_records').insert(growthRecord);
        if (!error) growthRecordsCreated++;
      }
    }
    results.push({ table: 'student_growth_records', updated: growthRecordsCreated });

    // 5. 生成习惯评价数据
    console.log('Generating habit assessments...');
    let habitRecordsCreated = 0;
    
    await client.from('student_habit_assessments').delete().neq('id', 'xxx');
    
    for (const student of dbStudents) {
      // 每个学生生成3-5条习惯评价
      const numAssessments = randomInt(3, 5);
      for (let i = 0; i < numAssessments; i++) {
        const cat = randomChoice(habitCategories);
        const isPraise = Math.random() > 0.2;
        
        const assessment = {
          id: `ha_${student.id}_${i}`,
          student_id: student.id,
          student_name: student.name,
          class_id: student.class_id,
          class_name: student.class_name || '',
          category: cat.category,
          type: isPraise ? 'praise' : 'improve',
          title: isPraise ? `${cat.name}表现优秀` : `${cat.name}需要改进`,
          content: isPraise 
            ? `${cat.name}方面表现良好，值得表扬` 
            : `${cat.name}方面需要加强，请家长配合`,
          score: isPraise ? randomInt(1, 5) : -randomInt(1, 2),
          scene: randomChoice(['campus', 'classroom', 'home']),
          occurred_at: `2024-${String(randomInt(9, 11)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          created_at: new Date().toISOString(),
        };
        
        const { error } = await client.from('student_habit_assessments').insert(assessment);
        if (!error) habitRecordsCreated++;
      }
    }
    results.push({ table: 'student_habit_assessments', updated: habitRecordsCreated });

    // 6. 生成德育记录
    console.log('Generating moral records...');
    let moralRecordsCreated = 0;
    
    await client.from('student_moral_records').delete().neq('id', 'xxx');
    
    for (const student of dbStudents) {
      const numRecords = randomInt(1, 3);
      const moralTypes = [
        { type: '表扬', title: '主动帮助同学', score: 2 },
        { type: '表扬', title: '积极参加活动', score: 2 },
        { type: '志愿服务', title: '参加志愿服务', score: 3 },
        { type: '待改进', title: '课堂纪律需加强', score: -1 },
      ];
      
      for (let i = 0; i < numRecords; i++) {
        const record = randomChoice(moralTypes);
        const moralRecord = {
          id: `mr_${student.id}_${i}`,
          student_id: student.id,
          type: record.type,
          title: record.title,
          content: `${record.title}，表现${record.score > 0 ? '良好' : '需要关注'}`,
          score: record.score,
          date: `2024-${String(randomInt(1, 11)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          recorder: '班主任',
          created_at: new Date().toISOString(),
        };
        
        const { error } = await client.from('student_moral_records').insert(moralRecord);
        if (!error) moralRecordsCreated++;
      }
    }
    results.push({ table: 'student_moral_records', updated: moralRecordsCreated });

    return NextResponse.json({
      success: true,
      message: '学生详情数据补充完成',
      results,
    });
  } catch (error) {
    console.error('Update student details error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新失败',
    }, { status: 500 });
  }
}
