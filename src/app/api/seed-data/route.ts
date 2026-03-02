/**
 * 批量数据生成API
 * 
 * 生成数据：
 * - 教师：150人（班主任60人、科任30人、技能科教师60人）
 * - 班级：60个（每年级10个），每个班分配班主任和科任
 * - 学生：2700人（每班45人）
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 常用姓氏
const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
// 男性名字
const MALE_NAMES = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '超', '华', '建', '志', '俊', '文', '辉', '龙', '飞', '鹏', '斌', '波', '宇', '浩', '天', '翔', '毅', '威', '峰', '达', '博'];
// 女性名字
const FEMALE_NAMES = ['芳', '娜', '敏', '静', '丽', '艳', '燕', '玲', '婷', '霞', '红', '华', '梅', '萍', '娟', '莉', '琳', '雪', '云', '秀', '英', '慧', '佳', '欣', '怡', '洁', '颖', '蕾', '倩', '璐'];

// 随机选择数组元素
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成随机姓名
function generateName(gender: 'male' | 'female'): string {
  const surname = randomChoice(SURNAMES);
  const names = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  const name = Math.random() > 0.5 ? randomChoice(names) : randomChoice(names) + randomChoice(names);
  return surname + name;
}

// 生成随机手机号后四位
function randomPhoneSuffix(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// 生成随机手机号
function randomPhone(): string {
  const prefixes = ['138', '139', '136', '135', '158', '159', '186', '187', '150', '151'];
  return randomChoice(prefixes) + randomPhoneSuffix() + randomPhoneSuffix().slice(0, 4);
}

interface SeedResult {
  teachers: number;
  classes: number;
  students: number;
  headTeachers: number;
  subTeachers: number;
  errors: string[];
}

export async function POST() {
  const client = getSupabaseClient();
  const errors: string[] = [];
  
  try {
    // ==================== 1. 清空现有数据 ====================
    console.log('清空现有数据...');
    
    await client.from('students').delete().neq('id', 'xxx');
    await client.from('classes').delete().neq('id', 'xxx');
    await client.from('teachers').delete().neq('id', 'xxx');

    // ==================== 2. 生成教师数据（140人） ====================
    console.log('生成教师数据...');
    
    // 教师科目分配：
    // - 语文、数学：各60人，每班一个（班主任）
    // - 技能科教师：可跨班跨年级教学
    const teacherSubjects = [
      { subject: '语文', count: 60 },  // 每班一个班主任
      { subject: '数学', count: 60 },  // 每班一个班主任
      { subject: '道德与法治', count: 8 },  // 60班×2节=120节，8人×18节=144节（部分由语文教师兼任）
      { subject: '科学', count: 10 },   // 60班×(2+3)/2≈150节，10人×18节=180节（足够，无需数学兼任）
      { subject: '英语', count: 14 },  // 40班×4节=160节，14人×15节=210节
      { subject: '体育', count: 18 },  // 60班×3节=180节，18人×18节=324节（允许上午排课）
      { subject: '音乐', count: 8 },   // 60班×(1+2)/2≈90节，8人×18节=144节
      { subject: '美术', count: 8 },   // 60班×(1+2)/2≈90节，8人×18节=144节
      { subject: '信息技术', count: 4 }, // 40班×1节=40节，4人×18节=72节
      { subject: '心育', count: 4 },   // 40班×1节=40节，4人×18节=72节
    ];
    
    const teachersData: any[] = [];
    const chineseTeachers: any[] = [];  // 语文老师（可当班主任）
    const mathTeachers: any[] = [];     // 数学老师（可当班主任）
    
    const titles = ['二级教师', '一级教师', '高级教师', '正高级教师'];
    const titleWeights = [0.3, 0.4, 0.25, 0.05];
    
    let teacherIndex = 1;
    for (const { subject, count } of teacherSubjects) {
      for (let i = 0; i < count; i++) {
        const gender = Math.random() > 0.4 ? 'male' : 'female';
        const name = generateName(gender);
        
        // 根据权重选择职称
        const rand = Math.random();
        let titleIndex = 0;
        let cumulative = 0;
        for (let j = 0; j < titleWeights.length; j++) {
          cumulative += titleWeights[j];
          if (rand < cumulative) {
            titleIndex = j;
            break;
          }
        }
        
        // 根据科目确定教师角色和课时
        // 主科（语文、数学）：subject_teacher，课时14-16节
        // 英语：skill_teacher，但课时同主科14-16节（可跨段教学）
        // 其他技能科：skill_teacher，课时16-18节
        const isMainSubject = subject === '语文' || subject === '数学';
        const isEnglish = subject === '英语';
        const isUpperGradeOnly = subject === '英语' || subject === '信息技术' || subject === '心育';
        const teacherRole = isMainSubject ? 'subject_teacher' : 'skill_teacher';
        
        // 课时量标准：
        // - 语文/数学：16节（含兼任科目）
        // - 英语：15节（特殊技能科，同主科标准）
        // - 其他技能科：18节
        const weeklyHours = isMainSubject ? 16 : (isEnglish ? 15 : 18);
        
        // 兼任科目配置
        let secondarySubjects: string[] = [];
        if (subject === '语文') {
          secondarySubjects = ['道德与法治', '书法', '综合实践', '校本'];
        } else if (subject === '数学') {
          secondarySubjects = ['科学', '劳动', '综合实践', '校本'];
        }
        
        const teacher = {
          id: `t${String(teacherIndex).padStart(3, '0')}`,
          name: name,
          gender: gender,
          subjects: [subject],
          department: `${subject}组`,
          title: titles[titleIndex],
          phone: `138****${randomPhoneSuffix()}`,
          email: `${teacherIndex}@lysf.fx.edu.cn`,
          status: 'active',
          // 新增：角色和主教学科
          role: teacherRole,
          primary_subject: subject,
          secondary_subjects: secondarySubjects,
          total_weekly_hours: weeklyHours,
          main_class_count: isMainSubject ? 2 : 0,
          main_subject_hours: isMainSubject ? 10 : 0,
          teachable_grades: isUpperGradeOnly ? [3, 4, 5, 6] : [1, 2, 3, 4, 5, 6], // 英语/信息/心育只教3-6年级
        };
        
        teachersData.push(teacher);
        
        // 记录可当班主任的老师
        if (subject === '语文') {
          chineseTeachers.push(teacher);
        } else if (subject === '数学') {
          mathTeachers.push(teacher);
        }
        
        teacherIndex++;
      }
    }

    const { error: teachersError } = await client.from('teachers').insert(teachersData);
    if (teachersError) {
      errors.push(`教师插入失败: ${teachersError.message}`);
      return NextResponse.json({ success: false, errors }, { status: 500 });
    }
    console.log(`教师数据生成完成: ${teachersData.length}人`);
    console.log(`  - 语文老师: ${chineseTeachers.length}人`);
    console.log(`  - 数学老师: ${mathTeachers.length}人`);

    // ==================== 3. 生成班级数据（60个班，按年级分配班主任和科任） ====================
    console.log('生成班级数据...');
    
    const classesData: any[] = [];
    const gradeNames = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
    
    // 按年级追踪已分配的教师（确保不跨年级）
    // 关键：使用全局Set追踪已分配教师，每个教师只在一个年级任教
    const assignedTeachers = new Set<string>();
    
    for (let grade = 1; grade <= 6; grade++) {
      // 每个年级需要：
      // - 5个语文班主任（教单数班语文）- 同时兼任双数班的语文科任
      // - 5个数学班主任（教双数班数学）- 同时兼任单数班的数学科任
      
      // 从语文老师中选5个全局未分配的作为本年级语文老师
      const gradeChineseTeachers = chineseTeachers.filter(t => !assignedTeachers.has(t.id)).slice(0, 5);
      // 从数学老师中选5个全局未分配的作为本年级数学老师
      const gradeMathTeachers = mathTeachers.filter(t => !assignedTeachers.has(t.id)).slice(0, 5);
      
      if (gradeChineseTeachers.length < 5 || gradeMathTeachers.length < 5) {
        errors.push(`${grade}年级教师不足：语文${gradeChineseTeachers.length}人，数学${gradeMathTeachers.length}人`);
      }
      
      for (let classNum = 1; classNum <= 10; classNum++) {
        const classId = `c${String((grade - 1) * 10 + classNum).padStart(3, '0')}`;
        const building = grade <= 2 ? '教学楼A栋' : grade <= 4 ? '教学楼B栋' : '教学楼C栋';
        const room = `${grade}${String(classNum).padStart(2, '0')}教室`;
        
        let headTeacher: any;
        let subTeacher: any;
        
        if (classNum % 2 === 1) {
          // 单数班：语文班主任 + 数学科任
          const chineseIdx = Math.floor(classNum / 2);
          headTeacher = gradeChineseTeachers[chineseIdx];
          subTeacher = gradeMathTeachers[chineseIdx];
        } else {
          // 双数班：数学班主任 + 语文科任
          const mathIdx = Math.floor(classNum / 2) - 1;
          headTeacher = gradeMathTeachers[mathIdx];
          subTeacher = gradeChineseTeachers[mathIdx];
        }
        
        // 全局标记已分配
        if (headTeacher) assignedTeachers.add(headTeacher.id);
        if (subTeacher) assignedTeachers.add(subTeacher.id);
        
        classesData.push({
          id: classId,
          name: `${gradeNames[grade]}${classNum}班`,
          grade: grade,
          grade_name: gradeNames[grade],
          class_number: classNum,
          head_teacher_id: headTeacher?.id,
          head_teacher_name: headTeacher?.name,
          sub_teacher_id: subTeacher?.id,
          sub_teacher_name: subTeacher?.name,
          classroom_id: `room_${classId}`,
          classroom_name: room,
          building: building,
          student_count: 45,
        });
      }
    }

    const { error: classesError } = await client.from('classes').insert(classesData);
    if (classesError) {
      errors.push(`班级插入失败: ${classesError.message}`);
      return NextResponse.json({ success: false, errors }, { status: 500 });
    }
    
    // 统计已分配的教师数量
    const assignedTeacherCount = new Set(classesData.flatMap(c => [c.head_teacher_id, c.sub_teacher_id].filter(Boolean))).size;
    console.log(`班级数据生成完成: ${classesData.length}个`);
    console.log(`  - 涉及教师: ${assignedTeacherCount}人`);

    // ==================== 3.5 更新教师角色和班级配置 ====================
    console.log('更新教师配置...');
    
    // 从班级数据中提取班主任和科任信息
    const headTeacherClasses = new Map<string, string>();  // teacherId -> classId
    const subjectHeadClasses = new Map<string, string[]>();  // teacherId -> [classId, ...]
    
    for (const cls of classesData) {
      if (cls.head_teacher_id) {
        headTeacherClasses.set(cls.head_teacher_id, cls.id);
      }
      if (cls.sub_teacher_id) {
        if (!subjectHeadClasses.has(cls.sub_teacher_id)) {
          subjectHeadClasses.set(cls.sub_teacher_id, []);
        }
        subjectHeadClasses.get(cls.sub_teacher_id)!.push(cls.id);
      }
    }
    
    // 批量更新班主任角色
    const headTeacherIds = Array.from(headTeacherClasses.keys());
    if (headTeacherIds.length > 0) {
      const { error: err } = await client
        .from('teachers')
        .update({ 
          role: 'head_teacher',
          total_weekly_hours: 15,
          main_class_count: 1,
          main_subject_hours: 6,
        })
        .in('id', headTeacherIds);
      
      if (err) errors.push(`班主任角色更新失败: ${err.message}`);
      else console.log(`班主任角色更新: ${headTeacherIds.length}人`);
    }
    
    // 批量更新科任角色（语数老师中非班主任的）
    const subjectHeadIds = Array.from(subjectHeadClasses.keys()).filter(id => !headTeacherClasses.has(id));
    if (subjectHeadIds.length > 0) {
      const { error: err } = await client
        .from('teachers')
        .update({ 
          role: 'subject_teacher',
          total_weekly_hours: 15,
          main_class_count: 2,
          main_subject_hours: 12,
        })
        .in('id', subjectHeadIds);
      
      if (err) errors.push(`科任角色更新失败: ${err.message}`);
      else console.log(`科任角色更新: ${subjectHeadIds.length}人`);
    }
    
    console.log(`教师配置更新完成`);

    // ==================== 4. 生成学生数据（3000人，每班50人，含完整信息） ====================
    console.log('生成学生数据...');
    
    // 学生详细信息选项
    const ethnicities = ['汉族', '汉族', '汉族', '汉族', '汉族', '畲族', '回族', '满族', '壮族', '苗族'];
    const nativePlaces = ['福建龙岩', '福建厦门', '福建福州', '福建泉州', '福建漳州', '江西赣州', '广东梅州'];
    const politicalStatuses = ['少先队员', '少先队员', '少先队员', '群众'];
    const studentTypes = ['普通', '普通', '普通', '普通', '随迁子女', '留守儿童', '低保家庭'];
    const familyTypes = ['核心家庭', '核心家庭', '核心家庭', '单亲家庭', '重组家庭', '隔代家庭'];
    const relationships = ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆'];
    const addresses = ['龙岩市新罗区东城街道', '龙岩市新罗区南城街道', '龙岩市新罗区西城街道', '龙岩市新罗区北城街道', '龙岩市新罗区中城街道'];
    
    const studentsData: any[] = [];
    const studentStatuses = ['在校', '请假', '休学'];
    const statusWeights = [0.96, 0.03, 0.01];
    
    let studentIndex = 1;
    for (const classItem of classesData) {
      // 计算入学年份（六年级2020年入学，一年级2025年入学）
      const admissionYear = 2026 - classItem.grade;
      const enrollmentDate = `${admissionYear}-09-01`;
      
      for (let num = 1; num <= 45; num++) {
        const gender = Math.random() > 0.48 ? 'male' : 'female';
        const name = generateName(gender);
        
        // 根据权重选择状态
        const rand = Math.random();
        let status = '在校';
        let cumulative = 0;
        for (let j = 0; j < statusWeights.length; j++) {
          cumulative += statusWeights[j];
          if (rand < cumulative) {
            status = studentStatuses[j];
            break;
          }
        }
        
        // 生成出生日期（入学时6-7岁）
        const birthYear = admissionYear - 7 - Math.floor(Math.random() * 2);
        const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
        
        // 生成家长信息（1-2个家长）
        const parentCount = Math.random() > 0.3 ? 2 : 1;
        const parents: any[] = [];
        const usedRelationships = new Set<string>();
        
        for (let p = 0; p < parentCount; p++) {
          let relationship: string;
          do {
            relationship = randomChoice(relationships);
          } while (usedRelationships.has(relationship) && usedRelationships.size < relationships.length);
          usedRelationships.add(relationship);
          
          const parentGender = (relationship === '父亲' || relationship === '爷爷' || relationship === '外公') ? 'male' : 'female';
          const parentName = generateName(parentGender);
          
          parents.push({
            id: `p${studentIndex}_${p}`,
            name: parentName,
            relationship: relationship,
            phone: randomPhone(),
            isPrimary: p === 0,
            wechat: `wx_${parentName}_${randomPhoneSuffix()}`,
          });
        }
        
        // 家庭地址
        const homeAddress = randomChoice(addresses) + `${Math.floor(Math.random() * 100) + 1}号`;
        
        studentsData.push({
          id: `s${String(studentIndex).padStart(4, '0')}`,
          name: name,
          gender: gender,
          birth_date: birthDate,
          class_id: classItem.id,
          class_name: classItem.name,
          grade: classItem.grade,
          student_no: `${classItem.grade}${String(classItem.class_number).padStart(2, '0')}${String(num).padStart(2, '0')}`,
          status: status,
          // 个人信息
          ethnicity: randomChoice(ethnicities),
          native_place: randomChoice(nativePlaces),
          political_status: randomChoice(politicalStatuses),
          // 学籍信息
          enrollment_date: enrollmentDate,
          student_type: randomChoice(studentTypes),
          // 联系信息
          home_address: homeAddress,
          emergency_contact: parents[0]?.name || '',
          emergency_phone: parents[0]?.phone || '',
          // 家庭信息
          family_type: randomChoice(familyTypes),
          parents: parents,
        });
        studentIndex++;
      }
    }

    // 批量插入学生（每次500条）
    const batchSize = 500;
    let insertedCount = 0;
    for (let i = 0; i < studentsData.length; i += batchSize) {
      const batch = studentsData.slice(i, i + batchSize);
      const { error: studentsError } = await client.from('students').insert(batch);
      if (studentsError) {
        errors.push(`学生插入失败(批次${Math.floor(i/batchSize) + 1}): ${studentsError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }
    console.log(`学生数据生成完成: ${insertedCount}人`);

    // ==================== 5. 返回结果 ====================
    const result: SeedResult = {
      teachers: teachersData.length,
      classes: classesData.length,
      students: insertedCount,
      headTeachers: headTeacherClasses.size,
      subTeachers: subjectHeadClasses.size,
      errors,
    };

    return NextResponse.json({
      success: true,
      message: '数据生成完成',
      data: result,
    });

  } catch (error: any) {
    console.error('数据生成失败:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      errors: [error.message],
    }, { status: 500 });
  }
}
