/**
 * 排课算法：最小费用最大流 + KM算法
 * 
 * 算法设计：
 * 1. KM算法：用于主科（语文、数学）的全局最优匹配
 * 2. MCMF算法：用于技能科的全局优化
 */

// 使用types中的WeekDay
export type WeekDay = 1 | 2 | 3 | 4 | 5;
export const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5];
export const DEFAULT_PERIODS = [1, 2, 3, 4, 5, 6];
export const MORNING_PERIODS = [1, 2, 3];
export const AFTERNOON_PERIODS_LOW = [4, 5];
export const AFTERNOON_PERIODS_HIGH = [4, 5, 6];

// 内部类型定义（简化版）
export interface SimpleClass {
  id: string;
  name: string;
  grade?: number;
  headTeacherId?: string;
  headTeacherName?: string;
}

export interface SimpleTeacher {
  id: string;
  name: string;
  role?: string;
  primarySubject?: string;
  baseWeeklyHours?: number;
  totalWeeklyHours?: number;
  mainClassCount?: number;
  mainSubjectHours?: number;
  secondarySubjects?: string[];
  teachableGrades?: number[];
  headTeacherClassId?: string;
  subjectHeadClassId?: string;
}

export interface SimpleTask {
  classId: string;
  subject: string;
  teacherId: string;
  weeklyHours?: number;
}

// 排课结果Slot（简化版，用于算法）
export interface ScheduleSlot {
  id?: string;
  classId: string;
  className?: string;
  grade?: number;
  weekDay: WeekDay;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
}

const MAIN_SUBJECTS = ['语文', '数学'];

// 各年级标准课时
function getStandardHours(grade: number): Record<string, number> {
  if (grade <= 2) {
    return {
      '语文': 6, '数学': 5, '道德与法治': 2, '科学': 1,
      '英语': 0, '体育': 3, '音乐': 2, '美术': 2, '劳动': 1, '班会': 1
    };
  } else if (grade <= 4) {
    return {
      '语文': 6, '数学': 5, '道德与法治': 2, '科学': 2,
      '英语': 2, '体育': 3, '音乐': 2, '美术': 2, '劳动': 1, '班会': 1
    };
  } else {
    return {
      '语文': 6, '数学': 5, '道德与法治': 2, '科学': 2,
      '英语': 3, '体育': 3, '音乐': 2, '美术': 2, '劳动': 1, '班会': 1
    };
  }
}

// ==================== KM算法实现 ====================

/**
 * KM算法求解二分图最大权完美匹配
 * 左边：课程任务节点
 * 右边：时段节点
 */
class KMAlgorithm {
  private n: number;  // 左边节点数
  private m: number;  // 右边节点数
  private weight: number[][];  // 权重矩阵
  private lx: number[];  // 左边顶标
  private ly: number[];  // 右边顶标
  private matchX: number[];  // 左边匹配
  private matchY: number[];  // 右边匹配
  private slack: number[];  // 松弛值
  private visX: boolean[];  // 左边访问标记
  private visY: boolean[];  // 右边访问标记
  
  constructor(leftSize: number, rightSize: number) {
    this.n = leftSize;
    this.m = rightSize;
    this.weight = Array(leftSize).fill(null).map(() => Array(rightSize).fill(-Infinity));
    this.lx = Array(leftSize).fill(0);
    this.ly = Array(rightSize).fill(0);
    this.matchX = Array(leftSize).fill(-1);
    this.matchY = Array(rightSize).fill(-1);
    this.slack = Array(rightSize).fill(0);
    this.visX = Array(leftSize).fill(false);
    this.visY = Array(rightSize).fill(false);
  }
  
  // 设置边权重
  setWeight(i: number, j: number, w: number): void {
    if (i < this.n && j < this.m) {
      this.weight[i][j] = w;
    }
  }
  
  // DFS寻找增广路
  private dfs(u: number): boolean {
    this.visX[u] = true;
    
    for (let v = 0; v < this.m; v++) {
      if (this.visY[v]) continue;
      
      const gap = this.lx[u] + this.ly[v] - this.weight[u][v];
      
      if (Math.abs(gap) < 1e-9) {
        this.visY[v] = true;
        if (this.matchY[v] === -1 || this.dfs(this.matchY[v])) {
          this.matchX[u] = v;
          this.matchY[v] = u;
          return true;
        }
      } else {
        this.slack[v] = Math.min(this.slack[v], gap);
      }
    }
    
    return false;
  }
  
  // 执行KM算法
  solve(): { totalWeight: number; matches: Array<[number, number]> } {
    // 初始化左顶标
    for (let i = 0; i < this.n; i++) {
      this.lx[i] = -Infinity;
      for (let j = 0; j < this.m; j++) {
        if (this.weight[i][j] !== -Infinity) {
          this.lx[i] = Math.max(this.lx[i], this.weight[i][j]);
        }
      }
      if (this.lx[i] === -Infinity) {
        this.lx[i] = 0;
      }
    }
    
    // 为每个左边节点寻找匹配
    for (let i = 0; i < this.n; i++) {
      this.slack.fill(Infinity);
      
      while (true) {
        this.visX.fill(false);
        this.visY.fill(false);
        
        if (this.dfs(i)) break;
        
        // 更新顶标
        let delta = Infinity;
        for (let j = 0; j < this.m; j++) {
          if (!this.visY[j]) {
            delta = Math.min(delta, this.slack[j]);
          }
        }
        
        if (delta === Infinity) break;  // 无法匹配
        
        for (let j = 0; j < this.n; j++) {
          if (this.visX[j]) this.lx[j] -= delta;
        }
        for (let j = 0; j < this.m; j++) {
          if (this.visY[j]) {
            this.ly[j] += delta;
          } else {
            this.slack[j] -= delta;
          }
        }
      }
    }
    
    // 收集匹配结果
    const matches: Array<[number, number]> = [];
    let totalWeight = 0;
    
    for (let i = 0; i < this.n; i++) {
      if (this.matchX[i] !== -1) {
        matches.push([i, this.matchX[i]]);
        totalWeight += this.weight[i][this.matchX[i]];
      }
    }
    
    return { totalWeight, matches };
  }
}

// ==================== MCMF算法实现 ====================

interface MCMFEdge {
  to: number;
  rev: number;
  capacity: number;
  cost: number;
}

class MCMFGraph {
  private n: number;
  private graph: MCMFEdge[][];
  
  constructor(n: number) {
    this.n = n;
    this.graph = Array(n).fill(null).map(() => []);
  }
  
  addEdge(from: number, to: number, capacity: number, cost: number): void {
    this.graph[from].push({ to, rev: this.graph[to].length, capacity, cost });
    this.graph[to].push({ to: from, rev: this.graph[from].length - 1, capacity: 0, cost: -cost });
  }
  
  // SPFA求最短路
  private spfa(s: number, t: number, dist: number[], inQueue: boolean[]): boolean {
    dist.fill(Infinity);
    inQueue.fill(false);
    const queue: number[] = [s];
    dist[s] = 0;
    inQueue[s] = true;
    
    while (queue.length > 0) {
      const u = queue.shift()!;
      inQueue[u] = false;
      
      for (const e of this.graph[u]) {
        if (e.capacity > 0 && dist[e.to] > dist[u] + e.cost) {
          dist[e.to] = dist[u] + e.cost;
          if (!inQueue[e.to]) {
            queue.push(e.to);
            inQueue[e.to] = true;
          }
        }
      }
    }
    
    return dist[t] !== Infinity;
  }
  
  // DFS增广
  private dfs(u: number, t: number, flow: number, dist: number[], visited: boolean[]): number {
    if (u === t) return flow;
    visited[u] = true;
    
    let totalFlow = 0;
    for (const e of this.graph[u]) {
      if (!visited[e.to] && e.capacity > 0 && Math.abs(dist[u] + e.cost - dist[e.to]) < 1e-9) {
        const pushed = this.dfs(e.to, t, Math.min(flow - totalFlow, e.capacity), dist, visited);
        if (pushed > 0) {
          e.capacity -= pushed;
          this.graph[e.to][e.rev].capacity += pushed;
          totalFlow += pushed;
          if (totalFlow === flow) break;
        }
      }
    }
    
    return totalFlow;
  }
  
  // 执行MCMF
  solve(s: number, t: number): { maxFlow: number; minCost: number } {
    const dist: number[] = Array(this.n).fill(0);
    const inQueue: boolean[] = Array(this.n).fill(false);
    const visited: boolean[] = Array(this.n).fill(false);
    
    let maxFlow = 0;
    let minCost = 0;
    
    while (this.spfa(s, t, dist, inQueue)) {
      visited.fill(false);
      const pushed = this.dfs(s, t, Infinity, dist, visited);
      if (pushed === 0) break;
      maxFlow += pushed;
      minCost += pushed * dist[t];
    }
    
    return { maxFlow, minCost };
  }
  
  // 获取边的流量
  getFlow(from: number, to: number): number {
    for (const e of this.graph[from]) {
      if (e.to === to && e.capacity === 0) {
        return this.graph[to][e.rev].capacity;
      }
    }
    return 0;
  }
}

// ==================== 排课主算法 ====================

export function generateScheduleWithMCMF(
  classes: SimpleClass[],
  teachers: SimpleTeacher[],
  tasks: SimpleTask[]
): ScheduleSlot[] {
  
  // ==================== 数据准备 ====================
  
  const allSlots: ScheduleSlot[] = [];
  const classUsedTimes = new Map<string, Set<string>>();
  const teacherUsedTimes = new Map<string, Set<string>>();
  const classSubjectCount = new Map<string, Map<string, number>>();
  const teacherHours = new Map<string, number>();
  
  // 初始化
  for (const cls of classes) {
    classUsedTimes.set(cls.id, new Set());
    classSubjectCount.set(cls.id, new Map());
  }
  for (const t of teachers) {
    teacherUsedTimes.set(t.id, new Set());
    teacherHours.set(t.id, 0);
  }
  
  // ==================== 第一步：固定班会 ====================
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const lastPeriod = grade <= 2 ? 5 : 6;
    const headTeacherId = cls.headTeacherId;
    const teacher = teachers.find(t => t.id === headTeacherId);
    
    if (headTeacherId && teacher) {
      allSlots.push({
        classId: cls.id,
        className: cls.name,
        grade,
        weekDay: 5,
        periodIndex: lastPeriod,
        subject: '班会',
        teacherId: headTeacherId,
        teacherName: teacher.name,
      });
      
      const timeKey = `5-${lastPeriod}`;
      classUsedTimes.get(cls.id)!.add(timeKey);
      teacherUsedTimes.get(headTeacherId)!.add(timeKey);
      classSubjectCount.get(cls.id)!.set('班会', 1);
      teacherHours.set(headTeacherId, teacherHours.get(headTeacherId)! + 1);
    }
  }
  
  // ==================== 第二步：使用KM算法排主科 ====================
  
  // 收集主科任务
  interface MainSubjectTask {
    classId: string;
    className: string;
    grade: number;
    subject: '语文' | '数学';
    teacherId: string;
    teacherName: string;
    hourIndex: number;  // 第几节课（1-6）
  }
  
  const mainTasks: MainSubjectTask[] = [];
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    
    for (const subject of ['语文', '数学'] as const) {
      const target = standardHours[subject];
      const task = tasks.find(t => t.classId === cls.id && t.subject === subject);
      
      if (task) {
        const teacher = teachers.find(t => t.id === task.teacherId);
        if (teacher) {
          for (let i = 1; i <= target; i++) {
            mainTasks.push({
              classId: cls.id,
              className: cls.name,
              grade,
              subject,
              teacherId: task.teacherId,
              teacherName: teacher.name,
              hourIndex: i,
            });
          }
        }
      }
    }
  }
  
  // 创建时段节点
  interface TimeSlot {
    day: number;
    period: number;
    key: string;
  }
  
  const timeSlots: TimeSlot[] = [];
  for (const day of [1, 2, 3, 4, 5]) {
    for (const period of [1, 2, 3]) {  // 主科只在上午
      timeSlots.push({ day, period, key: `${day}-${period}` });
    }
  }
  
  // 构建KM算法的权重矩阵
  const km = new KMAlgorithm(mainTasks.length, timeSlots.length);
  
  for (let i = 0; i < mainTasks.length; i++) {
    const task = mainTasks[i];
    
    for (let j = 0; j < timeSlots.length; j++) {
      const slot = timeSlots[j];
      const timeKey = slot.key;
      
      // 检查基本约束
      if (classUsedTimes.get(task.classId)!.has(timeKey)) {
        km.setWeight(i, j, -Infinity);
        continue;
      }
      
      if (teacherUsedTimes.get(task.teacherId)!.has(timeKey)) {
        km.setWeight(i, j, -Infinity);
        continue;
      }
      
      // 计算权重
      let weight = 1000;
      
      // 语文数学第一节轮换（奇数班语文第1节，偶数班数学第1节）
      const classNum = parseInt(task.classId.replace('c', ''));
      const isOddClass = classNum % 2 === 1;
      
      if (slot.period === 1) {
        if ((task.subject === '语文' && isOddClass) || (task.subject === '数学' && !isOddClass)) {
          weight += 1000;  // 符合轮换规则，最高优先级
        } else {
          weight += 500;  // 不符合轮换，但仍然是主科
        }
      } else if (slot.period === 2) {
        weight += 800;  // 第2节次优
      } else if (slot.period === 3) {
        weight += 600;  // 第3节再次
      }
      
      // 同一天分布均匀
      const existingInDay = allSlots.filter(s => 
        s.classId === task.classId && s.weekDay === slot.day && s.subject === task.subject
      ).length;
      weight -= existingInDay * 400;
      
      km.setWeight(i, j, weight);
    }
  }
  
  // 执行KM算法
  const { matches } = km.solve();
  
  // 应用匹配结果
  for (const [taskIdx, slotIdx] of matches) {
    const task = mainTasks[taskIdx];
    const slot = timeSlots[slotIdx];
    const timeKey = slot.key;
    
    // 最终检查半天约束
    const isMorning = slot.period <= 3;
    const halfDaySlots = allSlots.filter(s => 
      s.classId === task.classId && s.weekDay === slot.day &&
      ((isMorning && s.periodIndex <= 3) || (!isMorning && s.periodIndex > 3))
    );
    const subjectInHalfDay = halfDaySlots.filter(s => s.subject === task.subject).length;
    
    if (subjectInHalfDay >= 2) continue;
    
    // 检查是否连续
    const prevSlot = allSlots.find(s => 
      s.classId === task.classId && s.weekDay === slot.day && s.periodIndex === slot.period - 1
    );
    if (prevSlot && prevSlot.subject === task.subject) continue;
    
    // 检查下一节是否同科目
    const nextSlot = allSlots.find(s => 
      s.classId === task.classId && s.weekDay === slot.day && s.periodIndex === slot.period + 1
    );
    if (nextSlot && nextSlot.subject === task.subject) continue;
    
    // 排入
    allSlots.push({
      classId: task.classId,
      className: task.className,
      grade: task.grade,
      weekDay: slot.day as WeekDay,
      periodIndex: slot.period,
      subject: task.subject,
      teacherId: task.teacherId,
      teacherName: task.teacherName,
    });
    
    classUsedTimes.get(task.classId)!.add(timeKey);
    teacherUsedTimes.get(task.teacherId)!.add(timeKey);
    classSubjectCount.get(task.classId)!.set(task.subject, 
      (classSubjectCount.get(task.classId)!.get(task.subject) || 0) + 1);
    teacherHours.set(task.teacherId, teacherHours.get(task.teacherId)! + 1);
  }
  
  // 补充主科剩余课时（贪心，优先填满上午）
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    
    for (const subject of MAIN_SUBJECTS) {
      const target = standardHours[subject];
      let current = classSubjectCount.get(cls.id)?.get(subject) || 0;
      
      // 优先排上午（1-3节）
      while (current < target) {
        const task = tasks.find(t => t.classId === cls.id && t.subject === subject);
        if (!task) break;
        
        const teacher = teachers.find(t => t.id === task.teacherId);
        if (!teacher) break;
        
        let placed = false;
        
        // 先尝试上午时段
        for (const day of [1, 2, 3, 4, 5]) {
          if (placed) break;
          
          for (const period of [1, 2, 3]) {
            if (placed) break;
            
            const timeKey = `${day}-${period}`;
            
            if (classUsedTimes.get(cls.id)!.has(timeKey)) continue;
            if (teacherUsedTimes.get(task.teacherId)!.has(timeKey)) continue;
            
            // 半天约束
            const halfDaySlots = allSlots.filter(s => 
              s.classId === cls.id && s.weekDay === day && s.periodIndex <= 3
            );
            const subjectInHalfDay = halfDaySlots.filter(s => s.subject === subject).length;
            if (subjectInHalfDay >= 2) continue;
            
            // 不连续（前一节）
            const prevSlot = allSlots.find(s => 
              s.classId === cls.id && s.weekDay === day && s.periodIndex === period - 1
            );
            if (prevSlot && prevSlot.subject === subject) continue;
            
            // 不连续（后一节）
            const nextSlot = allSlots.find(s => 
              s.classId === cls.id && s.weekDay === day && s.periodIndex === period + 1
            );
            if (nextSlot && nextSlot.subject === subject) continue;
            
            // 排入
            allSlots.push({
              classId: cls.id,
              className: cls.name,
              grade,
              weekDay: day as WeekDay,
              periodIndex: period,
              subject,
              teacherId: task.teacherId,
              teacherName: teacher.name,
            });
            
            classUsedTimes.get(cls.id)!.add(timeKey);
            teacherUsedTimes.get(task.teacherId)!.add(timeKey);
            current++;
            placed = true;
          }
        }
        
        if (!placed) break;
      }
    }
  }
  
  // ==================== 第三步：使用MCMF算法排技能科 ====================
  
  // 收集技能科任务
  interface SkillTask {
    classId: string;
    className: string;
    grade: number;
    subject: string;
    teacherId: string;
    teacherName: string;
    remaining: number;
  }
  
  const skillTasks: SkillTask[] = [];
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    
    for (const [subject, target] of Object.entries(standardHours)) {
      if (subject === '班会' || MAIN_SUBJECTS.includes(subject)) continue;
      
      const task = tasks.find(t => t.classId === cls.id && t.subject === subject);
      if (task) {
        const teacher = teachers.find(t => t.id === task.teacherId);
        if (teacher) {
          const current = classSubjectCount.get(cls.id)?.get(subject) || 0;
          const remaining = target - current;
          if (remaining > 0) {
            skillTasks.push({
              classId: cls.id,
              className: cls.name,
              grade,
              subject,
              teacherId: task.teacherId,
              teacherName: teacher.name,
              remaining,
            });
          }
        }
      }
    }
  }
  
  // 按缺口排序（大的优先）
  skillTasks.sort((a, b) => b.remaining - a.remaining);
  
  // 使用MCMF算法
  // 节点设计：
  // S(源) -> 任务节点 -> 时段节点 -> T(汇)
  
  const S = 0;
  const T = skillTasks.length + 75 + 1;  // 75个时段（5天×15个时段槽）
  const taskOffset = 1;
  const slotOffset = skillTasks.length + 1;
  
  const mcmf = new MCMFGraph(T + 1);
  
  // 源到任务节点
  for (let i = 0; i < skillTasks.length; i++) {
    mcmf.addEdge(S, taskOffset + i, skillTasks[i].remaining, 0);
  }
  
  // 时段节点到汇
  for (let i = 0; i < 75; i++) {
    mcmf.addEdge(slotOffset + i, T, 1, 0);
  }
  
  // 任务到时段的边
  const skillTimeSlots: TimeSlot[] = [];
  for (const day of [1, 2, 3, 4, 5]) {
    for (const period of [1, 2, 3, 4, 5, 6]) {
      skillTimeSlots.push({ day, period, key: `${day}-${period}` });
    }
  }
  
  for (let i = 0; i < skillTasks.length; i++) {
    const task = skillTasks[i];
    
    for (let j = 0; j < skillTimeSlots.length; j++) {
      const slot = skillTimeSlots[j];
      const timeKey = slot.key;
      
      // 检查约束
      if (classUsedTimes.get(task.classId)!.has(timeKey)) continue;
      if (teacherUsedTimes.get(task.teacherId)!.has(timeKey)) continue;
      
      // 检查当天是否已有该科目
      const hasToday = allSlots.some(s => 
        s.classId === task.classId && s.weekDay === slot.day && s.subject === task.subject
      );
      if (hasToday) continue;
      
      // 计算费用（越小越好）
      let cost = 0;
      
      // 技能科优先下午，上午成本高（第1节最不应该排技能科）
      if (slot.period === 1) {
        cost += 1000;  // 第1节排技能科成本极高
      } else if (slot.period === 2) {
        cost += 500;  // 第2节排技能科成本较高
      } else if (slot.period === 3) {
        cost += 200;  // 第3节排技能科成本中等
      }
      
      // 低年级只有5节课
      if (task.grade <= 2 && slot.period > 5) {
        cost = 10000;  // 禁止排
      }
      
      if (cost < 10000) {
        mcmf.addEdge(taskOffset + i, slotOffset + j, 1, cost);
      }
    }
  }
  
  // 执行MCMF
  const { maxFlow } = mcmf.solve(S, T);
  
  // 提取匹配结果
  for (let i = 0; i < skillTasks.length; i++) {
    for (let j = 0; j < skillTimeSlots.length; j++) {
      const flow = mcmf.getFlow(taskOffset + i, slotOffset + j);
      if (flow > 0) {
        const task = skillTasks[i];
        const slot = skillTimeSlots[j];
        
        // 最终约束检查
        const isMorning = slot.period <= 3;
        const halfDaySlots = allSlots.filter(s => 
          s.classId === task.classId && s.weekDay === slot.day &&
          ((isMorning && s.periodIndex <= 3) || (!isMorning && s.periodIndex > 3))
        );
        const subjectInHalfDay = halfDaySlots.filter(s => s.subject === task.subject).length;
        
        if (subjectInHalfDay >= 2) continue;
        
        const prevSlot = allSlots.find(s => 
          s.classId === task.classId && s.weekDay === slot.day && s.periodIndex === slot.period - 1
        );
        if (prevSlot && prevSlot.subject === task.subject) continue;
        
        // 排入
        allSlots.push({
          classId: task.classId,
          className: task.className,
          grade: task.grade,
          weekDay: slot.day as WeekDay,
          periodIndex: slot.period,
          subject: task.subject,
          teacherId: task.teacherId,
          teacherName: task.teacherName,
        });
        
        const timeKey = slot.key;
        classUsedTimes.get(task.classId)!.add(timeKey);
        teacherUsedTimes.get(task.teacherId)!.add(timeKey);
        classSubjectCount.get(task.classId)!.set(task.subject, 
          (classSubjectCount.get(task.classId)!.get(task.subject) || 0) + 1);
        teacherHours.set(task.teacherId, teacherHours.get(task.teacherId)! + 1);
        
        // 更新剩余课时
        skillTasks[i].remaining--;
      }
    }
  }
  
  // ==================== 第四步：贪心填充剩余 ====================
  
  for (const task of skillTasks) {
    while (task.remaining > 0) {
      let placed = false;
      
      for (const day of [1, 2, 3, 4, 5]) {
        if (placed) break;
        
        for (const period of [1, 2, 3, 4, 5, 6]) {
          if (placed) break;
          
          // 低年级只有5节
          if (task.grade <= 2 && period > 5) continue;
          
          const timeKey = `${day}-${period}`;
          
          // 检查约束
          if (classUsedTimes.get(task.classId)!.has(timeKey)) continue;
          if (teacherUsedTimes.get(task.teacherId)!.has(timeKey)) continue;
          
          // 技能科当天不重复
          const hasToday = allSlots.some(s => 
            s.classId === task.classId && s.weekDay === day && s.subject === task.subject
          );
          if (hasToday) continue;
          
          // 半天约束
          const isMorning = period <= 3;
          const halfDaySlots = allSlots.filter(s => 
            s.classId === task.classId && s.weekDay === day &&
            ((isMorning && s.periodIndex <= 3) || (!isMorning && s.periodIndex > 3))
          );
          const subjectInHalfDay = halfDaySlots.filter(s => s.subject === task.subject).length;
          if (subjectInHalfDay >= 2) continue;
          
          // 不连续
          const prevSlot = allSlots.find(s => 
            s.classId === task.classId && s.weekDay === day && s.periodIndex === period - 1
          );
          if (prevSlot && prevSlot.subject === task.subject) continue;
          
          // 排入
          allSlots.push({
            classId: task.classId,
            className: task.className,
            grade: task.grade,
            weekDay: day as WeekDay,
            periodIndex: period,
            subject: task.subject,
            teacherId: task.teacherId,
            teacherName: task.teacherName,
          });
          
          classUsedTimes.get(task.classId)!.add(timeKey);
          teacherUsedTimes.get(task.teacherId)!.add(timeKey);
          task.remaining--;
          placed = true;
        }
      }
      
      if (!placed) break;  // 无法找到合适时段
    }
  }
  
  return allSlots;
}

// ==================== 辅助函数 ====================

// 获取年级对应节次
export function getPeriodsByGrade(grade: number): number[] {
  return grade <= 2 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
}

// 获取班级课表
export function getClassSchedule(
  slots: ScheduleSlot[],
  classId: string
): ScheduleSlot[] {
  return slots.filter(s => s.classId === classId);
}

// 获取教师课表
export function getTeacherSchedule(
  slots: ScheduleSlot[],
  teacherId: string
): ScheduleSlot[] {
  return slots.filter(s => s.teacherId === teacherId);
}

// 格式化课表为表格
export function formatScheduleAsTable(
  slots: ScheduleSlot[],
  periods: number[] = DEFAULT_PERIODS,
  days: WeekDay[] = WEEK_DAYS
): Record<string, Record<number, ScheduleSlot | null>> {
  const table: Record<string, Record<number, ScheduleSlot | null>> = {};
  
  for (const day of days) {
    table[`周${day}`] = {};
    for (const period of periods) {
      const slot = slots.find(s => s.weekDay === day && s.periodIndex === period);
      table[`周${day}`][period] = slot || null;
    }
  }
  
  return table;
}

// 计算班级各科目课时
export function calculateClassSubjectHours(
  slots: ScheduleSlot[],
  classId: string
): Record<string, number> {
  const hours: Record<string, number> = {};
  
  for (const slot of slots) {
    if (slot.classId === classId) {
      hours[slot.subject] = (hours[slot.subject] || 0) + 1;
    }
  }
  
  return hours;
}

// 计算教师周课时
export function calculateTeacherWeeklyHours(
  slots: ScheduleSlot[],
  teacherId: string
): number {
  return slots.filter(s => s.teacherId === teacherId).length;
}

// 兼容旧API的函数签名
interface GenerateScheduleOptions {
  tasks: SimpleTask[];
  existingSlots?: ScheduleSlot[];
  rules?: unknown;
  periods?: number[];
  weekDays?: readonly WeekDay[];
  semester?: string;
  classes?: SimpleClass[];
  teachers?: SimpleTeacher[];
}

interface GenerateScheduleResult {
  success: boolean;
  slots: ScheduleSlot[];
  adjustments?: Array<{ teacherId: string; suggestedHours: number }>;
  statistics?: {
    totalSlots: number;
    classComplete: number;
    teacherComplete: number;
    arrangedSlots?: number;
    coverageRate?: number;
  };
}

export function generateSchedule(options: GenerateScheduleOptions): GenerateScheduleResult {
  const { classes = [], teachers = [], tasks = [] } = options;
  
  const slots = generateScheduleWithMCMF(classes, teachers, tasks);
  
  // 统计
  const totalSlots = slots.length;
  const classComplete = classes.filter(cls => {
    const grade = cls.grade || 3;
    const standard = getStandardHours(grade);
    const classSlots = slots.filter(s => s.classId === cls.id);
    return Object.entries(standard).every(([subject, target]) => {
      const actual = classSlots.filter(s => s.subject === subject).length;
      return actual >= target;
    });
  }).length;
  
  const teacherComplete = teachers.filter(t => {
    const teacherSlots = slots.filter(s => s.teacherId === t.id);
    return teacherSlots.length <= (t.baseWeeklyHours || 16);
  }).length;
  
  // 计算覆盖率
  let totalRequired = 0;
  let totalArranged = 0;
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standard = getStandardHours(grade);
    for (const [subject, target] of Object.entries(standard)) {
      totalRequired += target;
      const actual = slots.filter(s => s.classId === cls.id && s.subject === subject).length;
      totalArranged += Math.min(actual, target);
    }
  }
  const coverageRate = totalRequired > 0 ? (totalArranged / totalRequired * 100) : 0;
  
  return {
    success: true,
    slots,
    statistics: {
      totalSlots,
      classComplete,
      teacherComplete,
      arrangedSlots: totalArranged,
      coverageRate,
    },
  };
}
