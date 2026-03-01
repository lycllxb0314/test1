/**
 * 批量数据生成API
 * 
 * 生成数据：
 * - 教师：110人
 * - 班级：60个（每年级10个），每个班分配班主任和科任
 * - 学生：3000人（每班50人）
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

    // ==================== 2. 生成教师数据（110人） ====================
    console.log('生成教师数据...');
    
    // 教师科目分配：语文30人、数学30人可当班主任，其他科目不能
    const teacherSubjects = [
      { subject: '语文', count: 30 },  // 可当班主任
      { subject: '数学', count: 30 },  // 可当班主任
      { subject: '英语', count: 12 },
      { subject: '体育', count: 10 },
      { subject: '音乐', count: 8 },
      { subject: '美术', count: 8 },
      { subject: '科学', count: 6 },
      { subject: '道德与法治', count: 6 },
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
        
        // 根据科目确定教师角色
        // 主科（语文、数学）：subject_teacher
        // 技能科（英语、体育、音乐、美术、科学、道德与法治）：skill_teacher
        const isMainSubject = subject === '语文' || subject === '数学';
        const teacherRole = isMainSubject ? 'subject_teacher' : 'skill_teacher';
        
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
          secondary_subjects: [],
          total_weekly_hours: isMainSubject ? 15 : 17, // 主科14-16节，技能科16-18节
          main_class_count: isMainSubject ? 2 : 0,
          main_subject_hours: isMainSubject ? 10 : 0,
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

    // ==================== 3. 生成班级数据（60个班，分配班主任和科任） ====================
    console.log('生成班级数据...');
    
    const classesData: any[] = [];
    const gradeNames = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
    
    // 用于追踪已分配的教师
    const assignedHeadTeachers = new Set<string>();
    const assignedSubTeachers = new Set<string>();
    
    for (let grade = 1; grade <= 6; grade++) {
      for (let classNum = 1; classNum <= 10; classNum++) {
        const classId = `c${String((grade - 1) * 10 + classNum).padStart(3, '0')}`;
        const building = grade <= 2 ? '教学楼A栋' : grade <= 4 ? '教学楼B栋' : '教学楼C栋';
        const room = `${grade}${String(classNum).padStart(2, '0')}教室`;
        
        // 班主任：语文和数学老师交替分配
        // 单数班级用语文老师，双数班级用数学老师
        let headTeacher: any;
        if (classNum % 2 === 1) {
          // 从未分配的语文老师中选
          headTeacher = chineseTeachers.find(t => !assignedHeadTeachers.has(t.id));
          if (!headTeacher) {
            // 如果都用完了，复用第一个
            headTeacher = chineseTeachers[(grade * 10 + classNum) % chineseTeachers.length];
          }
        } else {
          // 从未分配的数学老师中选
          headTeacher = mathTeachers.find(t => !assignedHeadTeachers.has(t.id));
          if (!headTeacher) {
            headTeacher = mathTeachers[(grade * 10 + classNum) % mathTeachers.length];
          }
        }
        assignedHeadTeachers.add(headTeacher.id);
        
        // 科任：从另一个学科中选择未分配的老师
        let subTeacher: any;
        if (classNum % 2 === 1) {
          // 班主任是语文，科任用数学老师
          subTeacher = mathTeachers.find(t => !assignedSubTeachers.has(t.id) && t.id !== headTeacher.id);
          if (!subTeacher) {
            subTeacher = mathTeachers[(grade * 10 + classNum + 5) % mathTeachers.length];
          }
        } else {
          // 班主任是数学，科任用语文老师
          subTeacher = chineseTeachers.find(t => !assignedSubTeachers.has(t.id) && t.id !== headTeacher.id);
          if (!subTeacher) {
            subTeacher = chineseTeachers[(grade * 10 + classNum + 5) % chineseTeachers.length];
          }
        }
        assignedSubTeachers.add(subTeacher.id);
        
        classesData.push({
          id: classId,
          name: `${gradeNames[grade]}${classNum}班`,
          grade: grade,
          grade_name: gradeNames[grade],
          class_number: classNum,
          head_teacher_id: headTeacher.id,
          head_teacher_name: headTeacher.name,
          sub_teacher_id: subTeacher.id,
          sub_teacher_name: subTeacher.name,
          classroom_id: `room_${classId}`,
          classroom_name: room,
          building: building,
          student_count: 50,
        });
      }
    }

    const { error: classesError } = await client.from('classes').insert(classesData);
    if (classesError) {
      errors.push(`班级插入失败: ${classesError.message}`);
      return NextResponse.json({ success: false, errors }, { status: 500 });
    }
    console.log(`班级数据生成完成: ${classesData.length}个`);
    console.log(`  - 已分配班主任: ${assignedHeadTeachers.size}人`);
    console.log(`  - 已分配科任: ${assignedSubTeachers.size}人`);

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
      
      for (let num = 1; num <= 50; num++) {
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
      headTeachers: assignedHeadTeachers.size,
      subTeachers: assignedSubTeachers.size,
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
