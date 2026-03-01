/**
 * 智能排课系统 v7.0 - 专业优化版
 * 
 * 核心算法框架：
 * 第一层：按年级排主科（数论交替模式）
 * 第二层：全局排技能科（约束传播强化）
 * 第三层：模拟退火优化（Metropolis准则）
 * 
 * 优化亮点：
 * 1. 数论交替模式：避免同年级冲突
 * 2. 约束传播：预计算教师可用时段
 * 3. 真正的模拟退火：温度衰减 + 邻域交换
 * 4. 鲁棒性设计：边界条件保护
 */

// ==================== 类型定义 ====================

export interface SchoolConfig {
  teacherCount: number;
  chineseTeachers: number;
  mathTeachers: number;
  skillTeachers: {
    moral: number;
    science: number;
    english: number;
    pe: number;
    music: number;
    art: number;
  };
  classCount: number;
}

export interface SmartScheduleResult {
  slots: ScheduleSlot[];
  strategy: string;
  quality: {
    coverage: number;
    alternationScore: number;
    rotationScore: number;
    conflictCount: number;
  };
  teacherWorkload: {
    min: number;
    max: number;
    avg: number;
  };
}

export interface ScheduleSlot {
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
}

// ==================== 核心数据结构 ====================

interface Class {
  id: string;
  name: string;
  grade: number;
  maxPeriods: number;
}

interface Teacher {
  id: string;
  name: string;
  primarySubject: string;
  role: string;
}

interface Task {
  id: string;
  classId: string;
  subject: string;
  teacherId: string;
  grade: number;
}

interface GlobalState {
  slots: ScheduleSlot[];
  classUsed: Map<string, Set<string>>;
  teacherUsed: Map<string, Set<string>>;
  teacherAvailable: Map<string, Set<string>>;  // 约束传播核心
}

// ==================== 主入口 ====================

export function smartSchedule(config: SchoolConfig): SmartScheduleResult {
  console.log('=== 智能排课系统 v7.0 ===');
  console.log('数论交替 + 约束传播 + 模拟退火');
  
  // 1. 生成基础数据
  const classes = generateClasses(config.classCount);
  const { teachers, tasks, strategy } = generateAssignments(config, classes);
  
  // 2. 初始化全局状态
  const state: GlobalState = {
    slots: [],
    classUsed: new Map(),
    teacherUsed: new Map(),
    teacherAvailable: new Map(),
  };
  
  for (const cls of classes) {
    state.classUsed.set(cls.id, new Set());
  }
  for (const t of teachers) {
    state.teacherUsed.set(t.id, new Set());
    // 初始化教师可用时段
    const available = new Set<string>();
    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= 6; period++) {
        available.add(`${day}-${period}`);
      }
    }
    state.teacherAvailable.set(t.id, available);
  }
  
  // 3. 第一层：按年级排主科
  console.log('\n第一层：按年级排主科（数论交替模式）...');
  scheduleByGrade(state, classes, teachers, tasks);
  
  // 4. 第二层：全局排技能科
  console.log('\n第二层：全局排技能科（约束传播强化）...');
  scheduleSkillSubjects(state, classes, teachers, tasks);
  
  // 5. 第三层：模拟退火优化
  console.log('\n第三层：模拟退火优化...');
  localOptimization(state, classes, teachers, tasks);
  
  // 6. 计算指标
  const quality = calculateQuality(state.slots, classes);
  const workload = calculateWorkload(state.slots, teachers);
  
  console.log(`\n完成: ${state.slots.length}节, 覆盖率${quality.coverage}%, 冲突${quality.conflictCount}个`);
  
  return { slots: state.slots, strategy, quality, teacherWorkload: workload };
}

// ==================== 生成基础数据 ====================

function generateClasses(count: number): Class[] {
  const classes: Class[] = [];
  const gradeNames = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  
  for (let i = 1; i <= count; i++) {
    const grade = Math.ceil(i / 10);
    classes.push({
      id: `c${String(i).padStart(3, '0')}`,
      name: `${gradeNames[grade]}${((i - 1) % 10) + 1}班`,
      grade,
      maxPeriods: grade <= 2 ? 5 : 6,
    });
  }
  return classes;
}

// 鲁棒性优化：教师分配
function getTeacherByGradeAndSubject(
  teachers: Teacher[],
  subject: string,
  grade: number,
  classNum: number,
  totalPerGrade: number = 5
): Teacher {
  const subjectTeachers = teachers.filter(t => t.primarySubject === subject);
  
  if (subjectTeachers.length === 0) {
    // 返回一个默认教师
    return { id: 't000', name: `${subject}教师`, primarySubject: subject, role: 'skill' };
  }
  
  // 按年级均匀分配，避免越界
  const gradeStartIdx = Math.min((grade - 1) * totalPerGrade, Math.max(0, subjectTeachers.length - totalPerGrade));
  const classIdx = Math.floor((classNum - 1) / 2);
  const teacherIdx = Math.min(gradeStartIdx + classIdx, subjectTeachers.length - 1);
  
  return subjectTeachers[teacherIdx];
}

function generateAssignments(config: SchoolConfig, classes: Class[]) {
  const { chineseTeachers, mathTeachers, skillTeachers } = config;
  const teachers: Teacher[] = [];
  const tasks: Task[] = [];
  
  // 语文教师
  for (let i = 0; i < chineseTeachers; i++) {
    teachers.push({
      id: `t${String(teachers.length + 1).padStart(3, '0')}`,
      name: `语文教师${i + 1}`,
      primarySubject: '语文',
      role: 'chinese',
    });
  }
  
  // 数学教师
  for (let i = 0; i < mathTeachers; i++) {
    teachers.push({
      id: `t${String(teachers.length + 1).padStart(3, '0')}`,
      name: `数学教师${i + 1}`,
      primarySubject: '数学',
      role: 'math',
    });
  }
  
  // 技能科教师
  const skillList = [
    { name: '道德与法治', count: skillTeachers.moral },
    { name: '科学', count: skillTeachers.science },
    { name: '英语', count: skillTeachers.english },
    { name: '体育', count: skillTeachers.pe },
    { name: '音乐', count: skillTeachers.music },
    { name: '美术', count: skillTeachers.art },
  ];
  
  for (const { name, count } of skillList) {
    for (let i = 0; i < count; i++) {
      teachers.push({
        id: `t${String(teachers.length + 1).padStart(3, '0')}`,
        name: `${name}教师${i + 1}`,
        primarySubject: name,
        role: 'skill',
      });
    }
  }
  
  // 生成任务
  let taskId = 0;
  
  for (const cls of classes) {
    const classNum = parseInt(cls.id.replace('c', '')) % 10 || 10;
    const grade = cls.grade;
    
    // 使用鲁棒性函数获取教师
    const chineseTeacher = getTeacherByGradeAndSubject(teachers, '语文', grade, classNum);
    const mathTeacher = getTeacherByGradeAndSubject(teachers, '数学', grade, classNum);
    const headTeacher = classNum % 2 === 1 ? chineseTeacher : mathTeacher;
    
    // 技能科教师：跨年级分配，使用班级编号和索引确定教师
    const getSkillTeacherId = (subject: string, idx: number): string => {
      const subjectTeachers = teachers.filter(t => t.primarySubject === subject);
      if (subjectTeachers.length === 0) {
        return `t000_${subject}`;
      }
      // 使用班级编号和索引计算教师索引，确保跨年级均匀分配
      const teacherIdx = (cls.id.charCodeAt(1) * 10 + parseInt(cls.id.slice(2)) + idx) % subjectTeachers.length;
      return subjectTeachers[teacherIdx].id;
    };
    
    // 语文6节
    for (let i = 0; i < 6; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '语文', teacherId: chineseTeacher.id, grade });
    }
    // 数学5节
    for (let i = 0; i < 5; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '数学', teacherId: mathTeacher.id, grade });
    }
    // 班会1节
    tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '班会', teacherId: headTeacher.id, grade });
    // 体育3节
    for (let i = 0; i < 3; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '体育', teacherId: getSkillTeacherId('体育', i), grade });
    }
    // 道德与法治2节
    for (let i = 0; i < 2; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '道德与法治', teacherId: getSkillTeacherId('道德与法治', i), grade });
    }
    // 音乐2节
    for (let i = 0; i < 2; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '音乐', teacherId: getSkillTeacherId('音乐', i), grade });
    }
    // 美术2节
    for (let i = 0; i < 2; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '美术', teacherId: getSkillTeacherId('美术', i), grade });
    }
    // 科学
    const scienceCount = grade <= 2 ? 1 : 2;
    for (let i = 0; i < scienceCount; i++) {
      tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '科学', teacherId: getSkillTeacherId('科学', i), grade });
    }
    // 英语
    if (grade >= 3) {
      const englishCount = grade <= 4 ? 2 : 3;
      for (let i = 0; i < englishCount; i++) {
        tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '英语', teacherId: getSkillTeacherId('英语', i), grade });
      }
    }
    // 劳动1节
    tasks.push({ id: `task${taskId++}`, classId: cls.id, subject: '劳动', teacherId: mathTeacher.id, grade });
  }
  
  const strategy = '层次化分治 + 约束传播 + 模拟退火';
  
  return { teachers, tasks, strategy };
}

// ==================== 第一层：按年级排主科 ====================

// 数论交替模式（核心优化）
function generateAlternatingPattern(offset: number, grade: number): Array<[number, number]> {
  const patterns: Array<[number, number]> = [];
  // 年级专属种子，避免不同年级模式重复
  const seed = grade * 7 + offset * 3 + 1;
  
  for (let i = 0; i < 20; i++) {
    // 数论均匀分布
    const day = ((i * seed + grade) % 5) + 1;
    const period = ((i + offset + grade * 2) % 3) + 1;
    patterns.push([day, period]);
  }
  
  // 去重
  const seen = new Set<string>();
  const uniquePatterns: Array<[number, number]> = [];
  for (const p of patterns) {
    const key = `${p[0]},${p[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePatterns.push(p);
    }
  }
  
  return uniquePatterns;
}

function scheduleByGrade(
  state: GlobalState,
  classes: Class[],
  teachers: Teacher[],
  tasks: Task[]
): void {
  
  const classMap = new Map(classes.map(c => [c.id, c]));
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  
  for (let grade = 1; grade <= 6; grade++) {
    const gradeClasses = classes.filter(c => c.grade === grade);
    const gradeTasks = tasks.filter(t => t.grade === grade && (t.subject === '语文' || t.subject === '数学'));
    
    console.log(`  年级${grade}: ${gradeClasses.length}个班, ${gradeTasks.length}个主科任务`);
    
    // 先固定班会
    const meetingTasks = tasks.filter(t => t.grade === grade && t.subject === '班会');
    for (const task of meetingTasks) {
      const cls = classMap.get(task.classId);
      if (!cls) continue;
      
      const lastPeriod = cls.maxPeriods;
      const timeKey = `5-${lastPeriod}`;
      
      if (canAssign(state, cls.id, task.teacherId, timeKey)) {
        assign(state, task, cls, timeKey, teacherMap);
      }
    }
    
    // 排语文和数学
    for (const cls of gradeClasses) {
      const classNum = parseInt(cls.id.replace('c', '')) % 10 || 10;
      const isOddClass = classNum % 2 === 1;
      
      const chineseTasks = gradeTasks.filter(t => t.classId === cls.id && t.subject === '语文');
      const mathTasks = gradeTasks.filter(t => t.classId === cls.id && t.subject === '数学');
      
      // 使用数论交替模式
      const chinesePattern = generateAlternatingPattern(isOddClass ? 0 : 2, grade);
      const mathPattern = generateAlternatingPattern(isOddClass ? 2 : 0, grade);
      
      // 排语文
      let chineseIdx = 0;
      for (const task of chineseTasks) {
        let placed = false;
        
        // 优先上午
        for (let attempt = 0; attempt < chinesePattern.length && !placed; attempt++) {
          const [day, period] = chinesePattern[(chineseIdx + attempt) % chinesePattern.length];
          const timeKey = `${day}-${period}`;
          
          if (period <= 3 && canAssign(state, cls.id, task.teacherId, timeKey)) {
            assign(state, task, cls, timeKey, teacherMap);
            placed = true;
            chineseIdx += attempt + 1;
          }
        }
        
        // 如果上午排满，尝试下午
        if (!placed) {
          for (let day = 1; day <= 5 && !placed; day++) {
            for (let period = 4; period <= cls.maxPeriods && !placed; period++) {
              const timeKey = `${day}-${period}`;
              if (canAssign(state, cls.id, task.teacherId, timeKey)) {
                assign(state, task, cls, timeKey, teacherMap);
                placed = true;
              }
            }
          }
        }
      }
      
      // 排数学
      let mathIdx = 0;
      for (const task of mathTasks) {
        let placed = false;
        
        for (let attempt = 0; attempt < mathPattern.length && !placed; attempt++) {
          const [day, period] = mathPattern[(mathIdx + attempt) % mathPattern.length];
          const timeKey = `${day}-${period}`;
          
          if (period <= 3 && canAssign(state, cls.id, task.teacherId, timeKey)) {
            assign(state, task, cls, timeKey, teacherMap);
            placed = true;
            mathIdx += attempt + 1;
          }
        }
        
        if (!placed) {
          for (let day = 1; day <= 5 && !placed; day++) {
            for (let period = 4; period <= cls.maxPeriods && !placed; period++) {
              const timeKey = `${day}-${period}`;
              if (canAssign(state, cls.id, task.teacherId, timeKey)) {
                assign(state, task, cls, timeKey, teacherMap);
                placed = true;
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`  主科排课完成: ${state.slots.length}节`);
}

// ==================== 第二层：全局排技能科（约束传播强化）====================

function scheduleSkillSubjects(
  state: GlobalState,
  classes: Class[],
  teachers: Teacher[],
  tasks: Task[]
): void {
  
  const classMap = new Map(classes.map(c => [c.id, c]));
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  
  const skillSubjects = ['体育', '道德与法治', '音乐', '美术', '科学', '英语', '劳动'];
  
  for (const subject of skillSubjects) {
    const subjectTasks = tasks.filter(t => t.subject === subject);
    
    // 按班级处理，优先排约束强的班级（低年级）
    const sortedClasses = [...classes].sort((a, b) => a.grade - b.grade);
    
    for (const cls of sortedClasses) {
      const classTasks = subjectTasks.filter(t => t.classId === cls.id);
      const usedDays = new Set<number>();
      
      for (const task of classTasks) {
        let placed = false;
        
        // 获取教师可用时段
        const availableTimes = Array.from(state.teacherAvailable.get(task.teacherId) || []);
        
        // 按偏好排序：下午 > 非主科时段 > 其他
        const sortedTimes = availableTimes.sort((a, b) => {
          const [aDay, aPeriod] = a.split('-').map(Number);
          const [bDay, bPeriod] = b.split('-').map(Number);
          
          // 下午优先
          if (aPeriod >= 4 && bPeriod < 4) return -1;
          if (aPeriod < 4 && bPeriod >= 4) return 1;
          
          // 避开主科核心时段
          if (aPeriod > 2 && bPeriod <= 2) return -1;
          if (aPeriod <= 2 && bPeriod > 2) return 1;
          
          return 0;
        });
        
        // 遍历排序后的可用时段
        for (const timeKey of sortedTimes) {
          const [day, period] = timeKey.split('-').map(Number);
          if (period > cls.maxPeriods) continue;
          if (subject !== '体育' && usedDays.has(day)) continue;
          
          if (canAssign(state, cls.id, task.teacherId, timeKey)) {
            assign(state, task, cls, timeKey, teacherMap);
            usedDays.add(day);
            placed = true;
            break;
          }
        }
        
        // 如果还没排上，尝试任意时段
        if (!placed) {
          for (let day = 1; day <= 5 && !placed; day++) {
            if (subject !== '体育' && usedDays.has(day)) continue;
            
            for (let period = 1; period <= cls.maxPeriods && !placed; period++) {
              const timeKey = `${day}-${period}`;
              if (canAssign(state, cls.id, task.teacherId, timeKey)) {
                assign(state, task, cls, timeKey, teacherMap);
                usedDays.add(day);
                placed = true;
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`  技能科排课完成: ${state.slots.length}节`);
}

// ==================== 第三层：模拟退火优化 ====================

function localOptimization(
  state: GlobalState,
  classes: Class[],
  teachers: Teacher[],
  tasks: Task[]
): void {
  
  const totalNeeded = 1520;
  let coverage = state.slots.length / totalNeeded;
  
  console.log(`  当前覆盖率: ${(coverage * 100).toFixed(1)}%`);
  
  // 补空缺
  if (coverage < 1) {
    const classMap = new Map(classes.map(c => [c.id, c]));
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    
    for (const task of tasks) {
      const cls = classMap.get(task.classId);
      if (!cls) continue;
      
      const assignedCount = state.slots.filter(s => s.classId === cls.id && s.subject === task.subject).length;
      const requiredCount = tasks.filter(t => t.classId === cls.id && t.subject === task.subject).length;
      
      if (assignedCount < requiredCount) {
        for (let day = 1; day <= 5; day++) {
          for (let period = 1; period <= cls.maxPeriods; period++) {
            const timeKey = `${day}-${period}`;
            if (canAssign(state, cls.id, task.teacherId, timeKey)) {
              assign(state, task, cls, timeKey, teacherMap);
              break;
            }
          }
        }
      }
    }
  }
  
  // 模拟退火优化软约束
  const T0 = 100;
  const Tmin = 1;
  const alpha = 0.95;
  let T = T0;
  
  let currentScore = calculateSoftScore(state.slots, classes);
  let bestScore = currentScore;
  let bestSlots = [...state.slots];
  
  const maxIterations = 200;
  
  for (let iter = 0; iter < maxIterations && T > Tmin; iter++) {
    // 生成邻域解
    const newSlots = swapRandomSlots([...state.slots], classes, state);
    const newScore = calculateSoftScore(newSlots, classes);
    
    // Metropolis准则
    if (newScore > currentScore || Math.exp((newScore - currentScore) / T) > Math.random()) {
      state.slots = newSlots;
      currentScore = newScore;
      
      if (newScore > bestScore) {
        bestScore = newScore;
        bestSlots = [...newSlots];
      }
    }
    
    T *= alpha;
  }
  
  state.slots = bestSlots;
  
  console.log(`  优化后覆盖率: ${(state.slots.length / totalNeeded * 100).toFixed(1)}%`);
  console.log(`  软约束得分: ${bestScore.toFixed(2)}`);
}

// 计算软约束得分
function calculateSoftScore(slots: ScheduleSlot[], classes: Class[]): number {
  let score = 0;
  
  // 1. 交替得分（权重0.5）
  let alternationScore = 0;
  for (const cls of classes) {
    for (const subject of ['语文', '数学']) {
      const subjectSlots = slots.filter(s => s.classId === cls.id && s.subject === subject);
      alternationScore += calculateAlternation(subjectSlots);
    }
  }
  alternationScore /= classes.length * 2;
  
  // 2. 时段偏好得分（权重0.3）
  let periodScore = 0;
  for (const slot of slots) {
    if (['语文', '数学'].includes(slot.subject) && slot.periodIndex <= 3) {
      periodScore += 1;
    }
    if (['体育', '音乐', '美术'].includes(slot.subject) && slot.periodIndex >= 4) {
      periodScore += 1;
    }
  }
  periodScore /= Math.max(1, slots.length);
  
  // 3. 轮换得分（权重0.2）
  let rotationScore = 0;
  for (const cls of classes) {
    const classNum = parseInt(cls.id.replace('c', '')) % 10 || 10;
    const isOddClass = classNum % 2 === 1;
    
    const monday1st = slots.find(s => s.classId === cls.id && s.weekDay === 1 && s.periodIndex === 1);
    if (monday1st) {
      if ((isOddClass && monday1st.subject === '语文') ||
          (!isOddClass && monday1st.subject === '数学')) {
        rotationScore += 1;
      }
    }
  }
  rotationScore /= classes.length;
  
  return alternationScore * 0.5 + periodScore * 0.3 + rotationScore * 0.2;
}

function calculateAlternation(slots: ScheduleSlot[]): number {
  if (slots.length < 2) return 1;
  
  slots.sort((a, b) => a.weekDay * 10 + a.periodIndex - b.weekDay * 10 - b.periodIndex);
  let alternations = 0;
  
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].periodIndex !== slots[i - 1].periodIndex) {
      alternations++;
    }
  }
  
  return alternations / (slots.length - 1);
}

// 邻域解生成（保证可行性）
function swapRandomSlots(
  slots: ScheduleSlot[],
  classes: Class[],
  state: GlobalState
): ScheduleSlot[] {
  // 随机选一个班级
  const cls = classes[Math.floor(Math.random() * classes.length)];
  const classSlots = slots.filter(s => 
    s.classId === cls.id && 
    !['语文', '数学', '班会'].includes(s.subject)
  );
  
  if (classSlots.length < 2) return slots;
  
  // 随机选两节
  const shuffled = classSlots.sort(() => Math.random() - 0.5);
  const slot1 = shuffled[0];
  const slot2 = shuffled[1];
  
  const idx1 = slots.findIndex(s => 
    s.classId === slot1.classId && 
    s.periodIndex === slot1.periodIndex && 
    s.weekDay === slot1.weekDay &&
    s.subject === slot1.subject
  );
  const idx2 = slots.findIndex(s => 
    s.classId === slot2.classId && 
    s.periodIndex === slot2.periodIndex && 
    s.weekDay === slot2.weekDay &&
    s.subject === slot2.subject
  );
  
  if (idx1 === -1 || idx2 === -1) return slots;
  
  // 检查交换后是否产生冲突
  const timeKey1 = `${slot2.weekDay}-${slot2.periodIndex}`;
  const timeKey2 = `${slot1.weekDay}-${slot1.periodIndex}`;
  
  // 检查教师冲突
  const teacher1OtherSlots = slots.filter(s => s.teacherId === slot1.teacherId && s !== slot1);
  const teacher2OtherSlots = slots.filter(s => s.teacherId === slot2.teacherId && s !== slot2);
  
  const teacher1Conflict = teacher1OtherSlots.some(s => 
    s.weekDay === slot2.weekDay && s.periodIndex === slot2.periodIndex
  );
  const teacher2Conflict = teacher2OtherSlots.some(s => 
    s.weekDay === slot1.weekDay && s.periodIndex === slot1.periodIndex
  );
  
  if (teacher1Conflict || teacher2Conflict) return slots;
  
  // 执行交换
  const tempDay = slots[idx1].weekDay;
  const tempPeriod = slots[idx1].periodIndex;
  
  slots[idx1].weekDay = slots[idx2].weekDay;
  slots[idx1].periodIndex = slots[idx2].periodIndex;
  slots[idx2].weekDay = tempDay;
  slots[idx2].periodIndex = tempPeriod;
  
  return slots;
}

// ==================== 辅助函数 ====================

function canAssign(state: GlobalState, classId: string, teacherId: string, timeKey: string): boolean {
  return !state.classUsed.get(classId)!.has(timeKey) &&
         !state.teacherUsed.get(teacherId)!.has(timeKey);
}

function assign(
  state: GlobalState,
  task: Task,
  cls: Class,
  timeKey: string,
  teacherMap: Map<string, Teacher>
): void {
  const [day, period] = timeKey.split('-').map(Number);
  const teacher = teacherMap.get(task.teacherId);
  
  state.slots.push({
    classId: cls.id,
    className: cls.name,
    grade: cls.grade,
    weekDay: day,
    periodIndex: period,
    subject: task.subject,
    teacherId: task.teacherId,
    teacherName: teacher?.name || '',
  });
  
  state.classUsed.get(cls.id)!.add(timeKey);
  state.teacherUsed.get(task.teacherId)!.add(timeKey);
  state.teacherAvailable.get(task.teacherId)?.delete(timeKey);  // 约束传播
}

function calculateQuality(slots: ScheduleSlot[], classes: Class[]): any {
  const totalNeeded = 1520;
  const coverage = (slots.length / totalNeeded) * 100;
  
  // 交替得分
  let alternationScore = 0;
  for (const cls of classes) {
    for (const subject of ['语文', '数学']) {
      const subjectSlots = slots.filter(s => s.classId === cls.id && s.subject === subject);
      alternationScore += calculateAlternation([...subjectSlots]);
    }
  }
  alternationScore = (alternationScore / (classes.length * 2)) * 100;
  
  // 轮换得分
  let rotationScore = 0;
  for (const cls of classes) {
    const classNum = parseInt(cls.id.replace('c', '')) % 10 || 10;
    const isOddClass = classNum % 2 === 1;
    
    const monday1st = slots.find(s => s.classId === cls.id && s.weekDay === 1 && s.periodIndex === 1);
    if (monday1st) {
      if ((isOddClass && monday1st.subject === '语文') ||
          (!isOddClass && monday1st.subject === '数学')) {
        rotationScore++;
      }
    }
  }
  rotationScore = (rotationScore / classes.length) * 100;
  
  // 冲突检测
  let conflictCount = 0;
  const teacherTimeMap = new Map<string, Set<string>>();
  const classTimeMap = new Map<string, Set<string>>();
  
  for (const slot of slots) {
    const timeKey = `${slot.weekDay}-${slot.periodIndex}`;
    
    if (!teacherTimeMap.has(slot.teacherId)) teacherTimeMap.set(slot.teacherId, new Set());
    if (teacherTimeMap.get(slot.teacherId)!.has(timeKey)) conflictCount++;
    else teacherTimeMap.get(slot.teacherId)!.add(timeKey);
    
    if (!classTimeMap.has(slot.classId)) classTimeMap.set(slot.classId, new Set());
    if (classTimeMap.get(slot.classId)!.has(timeKey)) conflictCount++;
    else classTimeMap.get(slot.classId)!.add(timeKey);
  }
  
  return {
    coverage: parseFloat(coverage.toFixed(1)),
    alternationScore: parseFloat(alternationScore.toFixed(1)),
    rotationScore: parseFloat(rotationScore.toFixed(1)),
    conflictCount,
  };
}

function calculateWorkload(slots: ScheduleSlot[], teachers: Teacher[]): any {
  const workloadMap = new Map<string, number>();
  
  for (const slot of slots) {
    workloadMap.set(slot.teacherId, (workloadMap.get(slot.teacherId) || 0) + 1);
  }
  
  const workloads = Array.from(workloadMap.values());
  
  if (workloads.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  
  return {
    min: Math.min(...workloads),
    max: Math.max(...workloads),
    avg: parseFloat((workloads.reduce((a, b) => a + b, 0) / workloads.length).toFixed(1)),
  };
}
