/**
 * 测试107位教师的排课效果
 */

import { NextResponse } from 'next/server';
import { generateScheduleWithMCMF } from '@/lib/schedule-mcmf';

// 生成随机姓名
function generateName(gender: string): string {
  const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
  const maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '辉', '鹏', '华', '飞', '刚', '波', '斌', '超', '志', '宇', '浩', '凯'];
  const femaleNames = ['芳', '娜', '敏', '静', '丽', '艳', '娟', '霞', '燕', '玲', '婷', '莉', '萍', '红', '梅', '雪', '云', '琳', '欣', '慧'];
  
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const names = gender === 'male' ? maleNames : femaleNames;
  const name = names[Math.floor(Math.random() * names.length)];
  
  return surname + name;
}

export async function GET() {
  console.log('=== 测试107位教师排课 ===');
  
  // 生成60个班级
  const classes = [];
  for (let grade = 1; grade <= 6; grade++) {
    for (let classNum = 1; classNum <= 10; classNum++) {
      const classId = `c${String((grade - 1) * 10 + classNum).padStart(3, '0')}`;
      classes.push({
        id: classId,
        name: `${grade}年级${classNum}班`,
        grade,
      });
    }
  }
  
  // 生成107位教师
  // 策略：班主任跨班教学
  const teachers = [];
  let tIdx = 1;
  
  // 30位语文班主任（每人教2个班）
  const chineseHeadTeachers: any[] = [];
  for (let i = 0; i < 30; i++) {
    const teacher = {
      id: `t${String(tIdx).padStart(3, '0')}`,
      name: generateName(Math.random() > 0.3 ? 'male' : 'female'),
      primarySubject: '语文',
      baseWeeklyHours: 14,  // 语文6节×2班 + 班会1节×2班 = 14节
    };
    teachers.push(teacher);
    chineseHeadTeachers.push(teacher);
    tIdx++;
  }
  
  // 30位数学班主任（每人教2个班）
  const mathHeadTeachers: any[] = [];
  for (let i = 0; i < 30; i++) {
    const teacher = {
      id: `t${String(tIdx).padStart(3, '0')}`,
      name: generateName(Math.random() > 0.3 ? 'male' : 'female'),
      primarySubject: '数学',
      baseWeeklyHours: 14,  // 数学5节×2班 + 劳动1节×2班 + 班会1节×2班 = 14节
    };
    teachers.push(teacher);
    mathHeadTeachers.push(teacher);
    tIdx++;
  }
  
  // 技能科教师（共47人）
  const skillSubjects = [
    { subject: '道德与法治', count: 10, hours: 12 },
    { subject: '科学', count: 8, hours: 13 },
    { subject: '英语', count: 8, hours: 13 },
    { subject: '体育', count: 8, hours: 16 },
    { subject: '音乐', count: 7, hours: 17 },
    { subject: '美术', count: 6, hours: 17 },
  ];
  
  for (const { subject, count, hours } of skillSubjects) {
    for (let i = 0; i < count; i++) {
      teachers.push({
        id: `t${String(tIdx).padStart(3, '0')}`,
        name: generateName(Math.random() > 0.5 ? 'male' : 'female'),
        primarySubject: subject,
        baseWeeklyHours: hours,
      });
      tIdx++;
    }
  }
  
  console.log(`教师总数: ${teachers.length}人`);
  console.log(`  - 语文班主任: ${chineseHeadTeachers.length}人`);
  console.log(`  - 数学班主任: ${mathHeadTeachers.length}人`);
  console.log(`  - 技能科教师: ${teachers.length - 60}人`);
  
  // 生成分配方案
  // 107位教师配置：
  // - 60位班主任（语数各30人，每人教1个班的主科+班会）
  // - 47位技能科教师
  
  const tasks = [];
  
  // 给班级分配班主任和主科
  // 奇数班：语文班主任，需要数学老师
  // 偶数班：数学班主任，需要语文老师
  
  // 收集需要科任的班级
  const needMathTeacher: string[] = [];  // 奇数班需要数学老师
  const needChineseTeacher: string[] = [];  // 偶数班需要语文老师
  
  for (let i = 0; i < 60; i++) {
    const cls = classes[i];
    const classNum = (i % 10) + 1;
    
    const isOddClass = classNum % 2 === 1;
    
    // 确定班主任（每个班主任只教1个班）
    const grade = cls.grade;
    const gradeOffset = (grade - 1) * 10;  // 该年级起始索引
    
    if (isOddClass) {
      // 奇数班：语文班主任
      const teacherIdx = Math.floor(classNum / 2);  // 0, 1, 2, 3, 4 对应 1, 3, 5, 7, 9 班
      const teacher = chineseHeadTeachers[teacherIdx + (grade - 1) * 5];
      
      // 语文课（6节）
      for (let j = 0; j < 6; j++) {
        tasks.push({
          classId: cls.id,
          subject: '语文',
          teacherId: teacher.id,
        });
      }
      
      // 班会（1节）
      tasks.push({
        classId: cls.id,
        subject: '班会',
        teacherId: teacher.id,
      });
      
      // 需要数学老师
      needMathTeacher.push(cls.id);
    } else {
      // 偶数班：数学班主任
      const teacherIdx = Math.floor((classNum - 2) / 2);  // 0, 1, 2, 3, 4 对应 2, 4, 6, 8, 10 班
      const teacher = mathHeadTeachers[teacherIdx + (grade - 1) * 5];
      
      // 数学课（5节）
      for (let j = 0; j < 5; j++) {
        tasks.push({
          classId: cls.id,
          subject: '数学',
          teacherId: teacher.id,
        });
      }
      
      // 劳动课（1节）
      tasks.push({
        classId: cls.id,
        subject: '劳动',
        teacherId: teacher.id,
      });
      
      // 班会（1节）
      tasks.push({
        classId: cls.id,
        subject: '班会',
        teacherId: teacher.id,
      });
      
      // 需要语文老师
      needChineseTeacher.push(cls.id);
    }
  }
  
  // 现在问题是：奇数班需要数学老师，偶数班需要语文老师
  // 但我们已经用了30位语文班主任和30位数学班主任
  // 只剩47位技能科教师...
  
  // 解决方案：班主任跨班教学！
  // 语文班主任可以教偶数班的语文（作为科任）
  // 数学班主任可以教奇数班的数学（作为科任）
  
  // 重新分配：让班主任跨班
  // 每个语文班主任教2个班：1个班当班主任（奇数班），1个班当科任（偶数班）
  // 每个数学班主任教2个班：1个班当班主任（偶数班），1个班当科任（奇数班）
  
  // 清空任务，重新分配
  tasks.length = 0;
  
  for (let grade = 1; grade <= 6; grade++) {
    const gradeClasses = classes.filter(c => c.grade === grade);
    const gradeOffset = (grade - 1) * 5;  // 该年级在班主任数组中的起始索引
    
    for (let i = 0; i < 10; i++) {
      const cls = gradeClasses[i];
      const classNum = i + 1;
      const isOddClass = classNum % 2 === 1;
      
      // 班主任索引（每个年级5对班主任）
      const teacherPairIdx = Math.floor(i / 2);  // 0, 0, 1, 1, 2, 2, 3, 3, 4, 4
      
      if (isOddClass) {
        // 奇数班：语文班主任
        const chineseTeacher = chineseHeadTeachers[gradeOffset + teacherPairIdx];
        const mathTeacher = mathHeadTeachers[gradeOffset + teacherPairIdx];
        
        // 语文（班主任教）
        for (let j = 0; j < 6; j++) {
          tasks.push({ classId: cls.id, subject: '语文', teacherId: chineseTeacher.id });
        }
        
        // 数学（数学老师跨班教）
        for (let j = 0; j < 5; j++) {
          tasks.push({ classId: cls.id, subject: '数学', teacherId: mathTeacher.id });
        }
        
        // 劳动（数学老师教）
        tasks.push({ classId: cls.id, subject: '劳动', teacherId: mathTeacher.id });
        
        // 班会
        tasks.push({ classId: cls.id, subject: '班会', teacherId: chineseTeacher.id });
        
      } else {
        // 偶数班：数学班主任
        const chineseTeacher = chineseHeadTeachers[gradeOffset + teacherPairIdx];
        const mathTeacher = mathHeadTeachers[gradeOffset + teacherPairIdx];
        
        // 语文（语文老师跨班教）
        for (let j = 0; j < 6; j++) {
          tasks.push({ classId: cls.id, subject: '语文', teacherId: chineseTeacher.id });
        }
        
        // 数学（班主任教）
        for (let j = 0; j < 5; j++) {
          tasks.push({ classId: cls.id, subject: '数学', teacherId: mathTeacher.id });
        }
        
        // 劳动（班主任教）
        tasks.push({ classId: cls.id, subject: '劳动', teacherId: mathTeacher.id });
        
        // 班会
        tasks.push({ classId: cls.id, subject: '班会', teacherId: mathTeacher.id });
      }
    }
  }
  
  // 分配技能科教师
  const skillTeachers = teachers.filter(t => 
    !chineseHeadTeachers.includes(t) && !mathHeadTeachers.includes(t)
  );
  
  const subjectTeacherMap = new Map<string, typeof skillTeachers>();
  for (const t of skillTeachers) {
    const subject = t.primarySubject;
    if (!subjectTeacherMap.has(subject)) {
      subjectTeacherMap.set(subject, []);
    }
    subjectTeacherMap.get(subject)!.push(t);
  }
  
  // 分配技能科
  const skillSubjectsList = ['道德与法治', '科学', '英语', '体育', '音乐', '美术'];
  
  for (const cls of classes) {
    const grade = cls.grade;
    
    // 道德与法治：所有年级2节
    const moralTeachers = subjectTeacherMap.get('道德与法治') || [];
    for (let i = 0; i < 2; i++) {
      const teacher = moralTeachers[(cls.id.charCodeAt(1) * 2 + i) % moralTeachers.length];
      if (teacher) {
        tasks.push({
          classId: cls.id,
          subject: '道德与法治',
          teacherId: teacher.id,
        });
      }
    }
    
    // 科学：低年级1节，中高年级2节
    const scienceTeachers = subjectTeacherMap.get('科学') || [];
    const scienceCount = grade <= 2 ? 1 : 2;
    for (let i = 0; i < scienceCount; i++) {
      const teacher = scienceTeachers[(cls.id.charCodeAt(1) * 3 + i) % scienceTeachers.length];
      if (teacher) {
        tasks.push({
          classId: cls.id,
          subject: '科学',
          teacherId: teacher.id,
        });
      }
    }
    
    // 英语：低年级0节，三四年级2节，五六年级3节
    if (grade >= 3) {
      const englishTeachers = subjectTeacherMap.get('英语') || [];
      const englishCount = grade <= 4 ? 2 : 3;
      for (let i = 0; i < englishCount; i++) {
        const teacher = englishTeachers[(cls.id.charCodeAt(1) * 4 + i) % englishTeachers.length];
        if (teacher) {
          tasks.push({
            classId: cls.id,
            subject: '英语',
            teacherId: teacher.id,
          });
        }
      }
    }
    
    // 体育：3节
    const peTeachers = subjectTeacherMap.get('体育') || [];
    for (let i = 0; i < 3; i++) {
      const teacher = peTeachers[(cls.id.charCodeAt(1) * 5 + i) % peTeachers.length];
      if (teacher) {
        tasks.push({
          classId: cls.id,
          subject: '体育',
          teacherId: teacher.id,
        });
      }
    }
    
    // 音乐：2节
    const musicTeachers = subjectTeacherMap.get('音乐') || [];
    for (let i = 0; i < 2; i++) {
      const teacher = musicTeachers[(cls.id.charCodeAt(1) * 6 + i) % musicTeachers.length];
      if (teacher) {
        tasks.push({
          classId: cls.id,
          subject: '音乐',
          teacherId: teacher.id,
        });
      }
    }
    
    // 美术：2节
    const artTeachers = subjectTeacherMap.get('美术') || [];
    for (let i = 0; i < 2; i++) {
      const teacher = artTeachers[(cls.id.charCodeAt(1) * 7 + i) % artTeachers.length];
      if (teacher) {
        tasks.push({
          classId: cls.id,
          subject: '美术',
          teacherId: teacher.id,
        });
      }
    }
  }
  
  console.log(`教学任务总数: ${tasks.length}个`);
  
  // 执行排课
  const startTime = Date.now();
  const slots = generateScheduleWithMCMF(classes, teachers, tasks);
  const duration = Date.now() - startTime;
  
  // 统计结果
  const statistics = {
    totalSlots: slots.length,
    totalTasks: tasks.length,
    coverage: (slots.length / 1520 * 100).toFixed(1),
    duration,
  };
  
  // 按科目统计
  const subjectStats: Record<string, number> = {};
  for (const s of slots) {
    subjectStats[s.subject] = (subjectStats[s.subject] || 0) + 1;
  }
  
  // 统计缺课
  const missing: string[] = [];
  for (let i = 1; i <= 60; i++) {
    const cid = `c${String(i).padStart(3, '0')}`;
    const grade = Math.ceil(i / 10);
    const classSlots = slots.filter(s => s.classId === cid);
    
    const standards: Record<string, number> = {
      '语文': 6, '数学': 5, '道德与法治': 2,
      '体育': 3, '音乐': 2, '美术': 2, '劳动': 1, '班会': 1
    };
    
    if (grade <= 2) {
      standards['科学'] = 1;
    } else if (grade <= 4) {
      standards['科学'] = 2;
      standards['英语'] = 2;
    } else {
      standards['科学'] = 2;
      standards['英语'] = 3;
    }
    
    for (const [subject, target] of Object.entries(standards)) {
      const actual = classSlots.filter(s => s.subject === subject).length;
      if (actual < target) {
        missing.push(`${cid} ${subject}: ${actual}/${target}节`);
      }
    }
  }
  
  return NextResponse.json({
    success: true,
    config: {
      teacherCount: teachers.length,
      classCount: classes.length,
      chineseHeadTeachers: chineseHeadTeachers.length,
      mathHeadTeachers: mathHeadTeachers.length,
      skillTeachers: skillTeachers.length,
    },
    statistics,
    subjectStats,
    missingCount: missing.length,
    missing: missing.slice(0, 20),
    slots: slots.slice(0, 50),  // 只返回前50条
  });
}
