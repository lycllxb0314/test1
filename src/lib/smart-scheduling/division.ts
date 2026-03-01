/**
 * 智能分工算法
 * 
 * 核心理念：
 * 1. 教务主任只需配置教师数量，系统自动生成最优分工方案
 * 2. 遵循最佳实践规则：主科不跨年级、技能科跨年级、班主任匹配
 * 3. 工作量均衡，避免教师过劳或闲置
 * 4. 提供清晰的指导和建议
 */

import type { 
  SchoolBaseConfig, 
  TeachingTask, 
  TeacherAssignment, 
  DivisionPlan,
  DivisionGuidance,
  BestPractice 
} from './types';
import { GRADE_COURSE_CONFIGS } from './configs';

// ==================== 数据生成 ====================

interface InternalTeacher {
  id: string;
  name: string;
  subject: string;
  role: 'chinese' | 'math' | 'skill';
  maxPeriods: number;
  currentPeriods: number;
  assignedGrades: Set<number>;
  assignedClasses: Set<string>;
  isHeadTeacher: boolean;
  headTeacherClassId?: string;
}

interface InternalClass {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
}

/**
 * 生成班级列表
 */
function generateClasses(config: SchoolBaseConfig): InternalClass[] {
  const classes: InternalClass[] = [];
  const gradeNames = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  
  for (let i = 1; i <= config.classCount; i++) {
    const grade = Math.ceil(i / config.classesPerGrade);
    const classNumber = ((i - 1) % config.classesPerGrade) + 1;
    classes.push({
      id: `c${String(i).padStart(3, '0')}`,
      name: `${gradeNames[grade]}${classNumber}班`,
      grade,
      classNumber,
    });
  }
  
  return classes;
}

/**
 * 生成教师列表
 */
function generateTeachers(config: SchoolBaseConfig): InternalTeacher[] {
  const teachers: InternalTeacher[] = [];
  let id = 1;
  
  // 语文教师
  for (let i = 1; i <= config.chineseTeachers; i++) {
    teachers.push({
      id: `t${String(id++).padStart(3, '0')}`,
      name: `语文教师${i}`,
      subject: '语文',
      role: 'chinese',
      maxPeriods: 16,  // 语文教师标准课时
      currentPeriods: 0,
      assignedGrades: new Set(),
      assignedClasses: new Set(),
      isHeadTeacher: false,
    });
  }
  
  // 数学教师
  for (let i = 1; i <= config.mathTeachers; i++) {
    teachers.push({
      id: `t${String(id++).padStart(3, '0')}`,
      name: `数学教师${i}`,
      subject: '数学',
      role: 'math',
      maxPeriods: 18,
      currentPeriods: 0,
      assignedGrades: new Set(),
      assignedClasses: new Set(),
      isHeadTeacher: false,
    });
  }
  
  // 技能科教师
  const skillSubjects = [
    { name: '体育', key: 'pe' as const, periods: 20 },
    { name: '音乐', key: 'music' as const, periods: 20 },
    { name: '美术', key: 'art' as const, periods: 20 },
    { name: '道德与法治', key: 'moral' as const, periods: 18 },
    { name: '科学', key: 'science' as const, periods: 18 },
    { name: '英语', key: 'english' as const, periods: 18 },
  ];
  
  for (const { name, key, periods } of skillSubjects) {
    for (let i = 1; i <= config.skillTeachers[key]; i++) {
      teachers.push({
        id: `t${String(id++).padStart(3, '0')}`,
        name: `${name}教师${i}`,
        subject: name,
        role: 'skill',
        maxPeriods: periods,
        currentPeriods: 0,
        assignedGrades: new Set(),
        assignedClasses: new Set(),
        isHeadTeacher: false,
      });
    }
  }
  
  return teachers;
}

/**
 * 生成教学任务
 */
function generateTasks(config: SchoolBaseConfig, classes: InternalClass[]): TeachingTask[] {
  const tasks: TeachingTask[] = [];
  let taskId = 1;
  
  for (const cls of classes) {
    const gradeConfig = GRADE_COURSE_CONFIGS[cls.grade - 1];
    if (!gradeConfig) continue;
    
    const { courses } = gradeConfig;
    
    // 各科目任务
    const subjectMap: Record<string, number> = {
      '语文': courses.chinese,
      '数学': courses.math,
      '体育': courses.pe,
      '音乐': courses.music,
      '美术': courses.art,
      '道德与法治': courses.moral,
      '科学': courses.science,
      '英语': courses.english,
      '劳动': courses.labor,
      '班会': courses.meeting,
    };
    
    for (const [subject, periods] of Object.entries(subjectMap)) {
      if (periods > 0) {
        tasks.push({
          id: `task${taskId++}`,
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          subject,
          periodsPerWeek: periods,
        });
      }
    }
  }
  
  return tasks;
}

// ==================== 分工算法 ====================

/**
 * 分配主科教师（语文、数学）
 * 
 * 规则：
 * 1. 主科教师不跨年级
 * 2. 每位教师任教2个班级
 * 3. 班主任由语文或数学老师担任
 */
function assignMainSubjects(
  tasks: TeachingTask[],
  teachers: InternalTeacher[],
  classes: InternalClass[],
  subject: '语文' | '数学'
): void {
  const subjectTasks = tasks.filter(t => t.subject === subject);
  const subjectTeachers = teachers.filter(t => t.subject === subject);
  
  // 按年级分组
  const tasksByGrade = new Map<number, TeachingTask[]>();
  for (const task of subjectTasks) {
    const grade = task.grade;
    if (!tasksByGrade.has(grade)) {
      tasksByGrade.set(grade, []);
    }
    tasksByGrade.get(grade)!.push(task);
  }
  
  // 为每个年级分配教师
  for (const [grade, gradeTasks] of tasksByGrade) {
    const gradeTeachers = subjectTeachers.filter(t => 
      t.assignedGrades.size === 0 || t.assignedGrades.has(grade)
    );
    
    // 按班级分配教师
    const classesInGrade = classes.filter(c => c.grade === grade);
    
    for (let i = 0; i < classesInGrade.length; i++) {
      const cls = classesInGrade[i];
      const classTasks = gradeTasks.filter(t => t.classId === cls.id);
      
      // 找一个合适的教师
      // 每位教师教2个班，奇数班的老师教当前班和下一个班
      const teacherIndex = Math.floor(i / 2) % gradeTeachers.length;
      const teacher = gradeTeachers[teacherIndex];
      
      if (teacher) {
        teacher.assignedGrades.add(grade);
        teacher.assignedClasses.add(cls.id);
        teacher.currentPeriods += classTasks.reduce((sum, t) => sum + t.periodsPerWeek, 0);
        
        // 标记任务已分配
        for (const task of classTasks) {
          (task as any).teacherId = teacher.id;
          (task as any).teacherName = teacher.name;
        }
        
        // 班主任分配：语文老师负责奇数班，数学老师负责偶数班
        const isOddClass = cls.classNumber % 2 === 1;
        if ((subject === '语文' && isOddClass) || (subject === '数学' && !isOddClass)) {
          teacher.isHeadTeacher = true;
          teacher.headTeacherClassId = cls.id;
        }
      }
    }
  }
}

/**
 * 分配技能科教师
 * 
 * 规则：
 * 1. 技能科教师可跨年级
 * 2. 按工作量均衡分配
 * 3. 劳动由班主任承担
 */
function assignSkillSubjects(
  tasks: TeachingTask[],
  teachers: InternalTeacher[],
  classes: InternalClass[]
): void {
  const skillSubjects = ['体育', '音乐', '美术', '道德与法治', '科学', '英语'];
  
  for (const subject of skillSubjects) {
    const subjectTasks = tasks.filter(t => t.subject === subject && !(t as any).teacherId);
    const subjectTeachers = teachers.filter(t => t.subject === subject);
    
    if (subjectTeachers.length === 0) continue;
    
    // 按班级分配教师（跨年级）
    for (const task of subjectTasks) {
      // 找工作量最少的教师
      const availableTeachers = subjectTeachers.filter(t => 
        t.currentPeriods + task.periodsPerWeek <= t.maxPeriods
      );
      
      if (availableTeachers.length > 0) {
        // 选择工作量最少的
        availableTeachers.sort((a, b) => a.currentPeriods - b.currentPeriods);
        const teacher = availableTeachers[0];
        
        teacher.assignedClasses.add(task.classId);
        teacher.assignedGrades.add(task.grade);
        teacher.currentPeriods += task.periodsPerWeek;
        
        (task as any).teacherId = teacher.id;
        (task as any).teacherName = teacher.name;
      }
    }
  }
  
  // 劳动由班主任承担
  const laborTasks = tasks.filter(t => t.subject === '劳动');
  for (const task of laborTasks) {
    const cls = classes.find(c => c.id === task.classId);
    if (!cls) continue;
    
    // 找该班的班主任
    const headTeacher = teachers.find(t => t.headTeacherClassId === cls.id);
    if (headTeacher) {
      (task as any).teacherId = headTeacher.id;
      (task as any).teacherName = headTeacher.name;
      headTeacher.currentPeriods += task.periodsPerWeek;
    }
  }
  
  // 班会由班主任承担
  const meetingTasks = tasks.filter(t => t.subject === '班会');
  for (const task of meetingTasks) {
    const cls = classes.find(c => c.id === task.classId);
    if (!cls) continue;
    
    const headTeacher = teachers.find(t => t.headTeacherClassId === cls.id);
    if (headTeacher) {
      (task as any).teacherId = headTeacher.id;
      (task as any).teacherName = headTeacher.name;
      headTeacher.currentPeriods += task.periodsPerWeek;
    }
  }
}

// ==================== 结果生成 ====================

/**
 * 生成分工方案
 */
function buildDivisionPlan(
  config: SchoolBaseConfig,
  tasks: TeachingTask[],
  teachers: InternalTeacher[]
): DivisionPlan {
  // 构建教师分配结果
  const assignments: TeacherAssignment[] = teachers
    .filter(t => t.currentPeriods > 0)
    .map(teacher => {
      const teacherTasks = tasks.filter(t => (t as any).teacherId === teacher.id);
      
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: teacher.subject,
        tasks: teacherTasks.map(t => ({
          classId: t.classId,
          className: t.className,
          grade: t.grade,
          subject: t.subject,
          periodsPerWeek: t.periodsPerWeek,
        })),
        totalPeriods: teacher.currentPeriods,
        classCount: teacher.assignedClasses.size,
        gradeCount: teacher.assignedGrades.size,
        isCrossGrade: teacher.assignedGrades.size > 1,
        isHeadTeacher: teacher.isHeadTeacher,
        headTeacherClassId: teacher.headTeacherClassId,
      };
    });
  
  // 计算质量指标
  const totalTasks = tasks.length;
  const assignedTasks = tasks.filter(t => (t as any).teacherId).length;
  
  const periods = teachers.map(t => t.currentPeriods).filter(p => p > 0);
  const avgPeriods = periods.reduce((a, b) => a + b, 0) / periods.length;
  const variance = periods.reduce((sum, p) => sum + Math.pow(p - avgPeriods, 2), 0) / periods.length;
  const balanceScore = Math.max(0, 100 - Math.sqrt(variance) * 2);
  
  const crossGradeTeachers = teachers.filter(t => t.assignedGrades.size > 1).length;
  const totalAssignedTeachers = teachers.filter(t => t.currentPeriods > 0).length;
  
  const headTeachers = teachers.filter(t => t.isHeadTeacher).length;
  const expectedHeadTeachers = config.classCount;
  
  // 生成建议和警告
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  if (assignedTasks < totalTasks) {
    warnings.push(`有 ${totalTasks - assignedTasks} 个教学任务未分配教师`);
  }
  
  if (balanceScore < 80) {
    recommendations.push('建议调整教师配置，使工作量更均衡');
  }
  
  if (headTeachers < expectedHeadTeachers) {
    warnings.push(`缺少 ${expectedHeadTeachers - headTeachers} 位班主任`);
  }
  
  return {
    id: `dp_${Date.now()}`,
    name: `${config.name}智能分工方案`,
    createdAt: new Date().toISOString(),
    config,
    allTasks: tasks,
    assignments,
    quality: {
      coverage: (assignedTasks / totalTasks) * 100,
      balanceScore,
      crossGradeRatio: crossGradeTeachers / totalAssignedTeachers,
      headTeacherMatch: (headTeachers / expectedHeadTeachers) * 100,
    },
    recommendations,
    warnings,
  };
}

// ==================== 主入口 ====================

/**
 * 智能分工算法入口
 */
export function generateDivisionPlan(config: SchoolBaseConfig): DivisionPlan {
  console.log('=== 智能分工算法 ===');
  console.log(`学校: ${config.name}`);
  console.log(`班级: ${config.classCount}个`);
  console.log(`教师: ${config.teacherCount}位`);
  
  // 1. 生成基础数据
  const classes = generateClasses(config);
  const teachers = generateTeachers(config);
  const tasks = generateTasks(config, classes);
  
  console.log(`\n教学任务: ${tasks.length}个`);
  
  // 2. 分配主科教师
  console.log('\n分配语文教师...');
  assignMainSubjects(tasks, teachers, classes, '语文');
  
  console.log('分配数学教师...');
  assignMainSubjects(tasks, teachers, classes, '数学');
  
  // 3. 分配技能科教师
  console.log('\n分配技能科教师...');
  assignSkillSubjects(tasks, teachers, classes);
  
  // 4. 生成分工方案
  const plan = buildDivisionPlan(config, tasks, teachers);
  
  console.log(`\n分工完成:`);
  console.log(`  覆盖率: ${plan.quality.coverage.toFixed(1)}%`);
  console.log(`  均衡度: ${plan.quality.balanceScore.toFixed(1)}分`);
  console.log(`  班主任匹配: ${plan.quality.headTeacherMatch.toFixed(1)}%`);
  
  return plan;
}

/**
 * 生成分工指导
 */
export function generateDivisionGuidance(config: SchoolBaseConfig): DivisionGuidance {
  const teachers = generateTeachers(config);
  const classes = generateClasses(config);
  
  const periods = teachers.map(t => t.maxPeriods);
  const totalPeriods = periods.reduce((a, b) => a + b, 0);
  
  const practices: BestPractice[] = [];
  
  // 计算需求
  const totalNeeded = classes.length * 30; // 粗略估算每班每周30节
  const avgPeriods = totalPeriods / teachers.length;
  
  // 检查教师数量是否充足
  if (totalNeeded > totalPeriods * 0.9) {
    practices.push({
      type: 'warning',
      category: 'teacher',
      title: '教师资源紧张',
      description: `当前教师总数${teachers.length}位，可能无法满足全部教学需求`,
      action: {
        label: '查看详情',
      },
    });
  }
  
  // 最佳实践建议
  practices.push({
    type: 'info',
    category: 'teacher',
    title: '主科教师配置建议',
    description: '语文、数学教师建议每位负责2个班级，不跨年级教学',
  });
  
  practices.push({
    type: 'info',
    category: 'teacher',
    title: '班主任配置建议',
    description: '班主任优先由语文或数学老师担任，奇数班由语文老师担任，偶数班由数学老师担任',
  });
  
  practices.push({
    type: 'info',
    category: 'schedule',
    title: '技能科教师配置建议',
    description: '技能科教师可跨年级教学，建议配置足够的教师以保证教学质量',
  });
  
  return {
    currentStatus: {
      teacherCount: teachers.length,
      classCount: classes.length,
      avgPeriodsPerTeacher: Math.round(avgPeriods),
      maxPeriodsPerTeacher: Math.max(...periods),
      minPeriodsPerTeacher: Math.min(...periods),
    },
    practices,
  };
}
