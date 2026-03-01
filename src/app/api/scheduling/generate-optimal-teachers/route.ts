/**
 * 重新生成最优教师配置
 * 
 * 根据国家标准课时量配置：
 * - 语文班主任：30人，14-16节/周（国家标准）
 * - 数学班主任：30人，14-16节/周（国家标准）
 * - 数学科任：4人，14-16节/周
 * - 英语：5人，14-16节/周（特殊技能科，可跨年级段）
 * - 体育：12人，16-18节/周
 * - 音乐：8人，16-18节/周
 * - 美术：8人，16-18节/周
 * - 科学：6人，16-18节/周
 * - 道德与法治：4人，16-18节/周
 * 总计：107人
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 姓名生成器
const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
const MALE_NAMES = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '超', '华', '建', '志', '俊', '文', '辉', '龙', '飞', '鹏', '斌'];
const FEMALE_NAMES = ['芳', '娜', '敏', '静', '丽', '艳', '燕', '玲', '婷', '霞', '红', '华', '梅', '萍', '娟', '莉', '琳', '雪', '云', '英'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(gender: 'male' | 'female'): string {
  const surname = randomChoice(SURNAMES);
  const names = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  const name = Math.random() > 0.5 ? randomChoice(names) : randomChoice(names) + randomChoice(names);
  return surname + name;
}

function randomPhone(): string {
  const prefixes = ['138', '139', '136', '135', '158', '159', '186', '187', '150', '151'];
  return randomChoice(prefixes) + String(Math.floor(10000000 + Math.random() * 90000000));
}

// 最优配置（基于国家标准课时量）
const OPTIMAL_CONFIG = {
  chinese_head: { count: 30, role: 'head_teacher', primary: '语文', secondary: ['道德与法治', '班会', '书法'], hours: 15 },  // 14-16节
  math_head: { count: 30, role: 'head_teacher', primary: '数学', secondary: ['劳动', '班会'], hours: 15 },  // 14-16节
  math_sub: { count: 4, role: 'subject_teacher', primary: '数学', secondary: ['科学', '劳动'], hours: 15 },  // 14-16节
  english: { count: 5, role: 'skill_teacher', primary: '英语', secondary: [], hours: 15, grades: [3,4,5,6] },  // 14-16节
  pe: { count: 12, role: 'skill_teacher', primary: '体育', secondary: [], hours: 17 },  // 16-18节
  music: { count: 8, role: 'skill_teacher', primary: '音乐', secondary: [], hours: 17 },  // 16-18节
  art: { count: 8, role: 'skill_teacher', primary: '美术', secondary: [], hours: 17 },  // 16-18节
  science: { count: 6, role: 'skill_teacher', primary: '科学', secondary: [], hours: 17 },  // 16-18节
  moral: { count: 4, role: 'skill_teacher', primary: '道德与法治', secondary: [], hours: 17 },  // 16-18节
};

const TITLES = ['二级教师', '一级教师', '高级教师'];
const TITLE_WEIGHTS = [0.4, 0.45, 0.15];

export async function POST() {
  const client = getSupabaseClient();
  
  try {
    // 1. 清空现有教师数据
    console.log('清空现有教师数据...');
    await client.from('teachers').delete().neq('id', 'xxx');
    
    // 2. 获取班级数据（用于分配班主任）
    const { data: classes } = await client.from('classes').select('id, name, grade').order('id');
    
    // 3. 生成教师数据
    const teachers: any[] = [];
    const departmentMap: Record<string, string> = {
      '语文': '语文组',
      '数学': '数学组',
      '英语': '英语组',
      '体育': '体育组',
      '音乐': '音乐组',
      '美术': '美术组',
      '科学': '科学组',
      '道德与法治': '道法组',
    };
    
    let teacherId = 1;
    const classList = classes || [];
    
    // 生成各类教师
    for (const [type, config] of Object.entries(OPTIMAL_CONFIG)) {
      for (let i = 0; i < config.count; i++) {
        const gender = Math.random() > 0.4 ? 'male' : 'female';
        const name = generateName(gender);
        
        // 选择职称
        const rand = Math.random();
        let titleIndex = 0;
        let cumulative = 0;
        for (let j = 0; j < TITLE_WEIGHTS.length; j++) {
          cumulative += TITLE_WEIGHTS[j];
          if (rand < cumulative) {
            titleIndex = j;
            break;
          }
        }
        
        const teacher: any = {
          id: `t${String(teacherId).padStart(3, '0')}`,
          name,
          gender,
          subjects: [config.primary],
          is_head_teacher: config.role === 'head_teacher',
          head_teacher_class_ids: [],
          department: departmentMap[config.primary] || '综合组',
          title: TITLES[titleIndex],
          phone: randomPhone(),
          email: `${name.toLowerCase().replace(/\s/g, '')}@lysf.fx.edu.cn`,
          status: 'active',
          role: config.role,
          primary_subject: config.primary,
          secondary_subjects: config.secondary,
          total_weekly_hours: config.hours,
          main_class_count: config.role === 'head_teacher' ? 1 : (config.role === 'subject_teacher' ? 2 : 0),
          main_subject_hours: config.role === 'head_teacher' ? config.hours - 2 : (config.role === 'subject_teacher' ? config.hours : 0),
          teachable_grades: (config as any).grades || [1,2,3,4,5,6],
          additional_roles: [],
        };
        
        // 计算可任教科目
        // teachable_subjects = primary_subject + secondary_subjects
        
        teachers.push(teacher);
        teacherId++;
      }
    }
    
    // 4. 分配班主任到班级
    const headTeachers = teachers.filter(t => t.role === 'head_teacher');
    const chineseHeads = headTeachers.filter(t => t.primary_subject === '语文');
    const mathHeads = headTeachers.filter(t => t.primary_subject === '数学');
    
    // 按班级顺序分配班主任（语文、数学交替）
    for (let i = 0; i < classList.length; i++) {
      const cls = classList[i];
      const isChinese = i % 2 === 0;
      const teacherList = isChinese ? chineseHeads : mathHeads;
      const index = Math.floor(i / 2);
      
      if (index < teacherList.length) {
        teacherList[index].head_teacher_class_ids = [cls.id];
      }
    }
    
    // 5. 插入数据库
    console.log(`插入 ${teachers.length} 位教师数据...`);
    
    const { error: insertError } = await client.from('teachers').insert(teachers);
    
    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }
    
    // 6. 更新班级表的班主任信息
    console.log('更新班级班主任信息...');
    for (const t of teachers.filter(t => t.head_teacher_class_ids.length > 0)) {
      await client
        .from('classes')
        .update({ head_teacher_id: t.id, head_teacher_name: t.name })
        .eq('id', t.head_teacher_class_ids[0]);
    }
    
    // 7. 统计结果
    const stats = {
      total: teachers.length,
      byRole: {
        head_teacher: teachers.filter(t => t.role === 'head_teacher').length,
        subject_teacher: teachers.filter(t => t.role === 'subject_teacher').length,
        skill_teacher: teachers.filter(t => t.role === 'skill_teacher').length,
      },
      bySubject: {} as Record<string, number>,
      hoursDistribution: {
        min: Math.min(...teachers.map(t => t.total_weekly_hours)),
        max: Math.max(...teachers.map(t => t.total_weekly_hours)),
        avg: Math.round(teachers.reduce((s, t) => s + t.total_weekly_hours, 0) / teachers.length * 10) / 10,
      },
    };
    
    teachers.forEach(t => {
      stats.bySubject[t.primary_subject] = (stats.bySubject[t.primary_subject] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      message: `成功生成 ${teachers.length} 位教师数据`,
      stats,
      config: OPTIMAL_CONFIG,
    });
    
  } catch (error: any) {
    console.error('生成失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    config: OPTIMAL_CONFIG,
    summary: {
      totalTeachers: Object.values(OPTIMAL_CONFIG).reduce((s, c) => s + c.count, 0),
      headTeachers: OPTIMAL_CONFIG.chinese_head.count + OPTIMAL_CONFIG.math_head.count,
      subjectTeachers: OPTIMAL_CONFIG.math_sub.count,
      skillTeachers: OPTIMAL_CONFIG.english.count + OPTIMAL_CONFIG.pe.count + 
        OPTIMAL_CONFIG.music.count + OPTIMAL_CONFIG.art.count + 
        OPTIMAL_CONFIG.science.count + OPTIMAL_CONFIG.moral.count,
    },
  });
}
