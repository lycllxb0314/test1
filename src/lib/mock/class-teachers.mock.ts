/**
 * 班级教师关系Mock数据
 * 用于管理班主任和科任教师与班级的关系
 */

import type { ClassTeacher, ClassTeacherPosition, ClassTeacherStatus } from '@/types';

// 当前学期
const CURRENT_SEMESTER = '2024-2025-1';

// 辅助函数：创建班级教师关系
function createClassTeacher(
  id: string,
  classId: string,
  className: string,
  grade: number,
  teacherId: string,
  teacherName: string,
  position: ClassTeacherPosition,
  subjects: string[],
  status: ClassTeacherStatus = 'active',
  createdBy?: string,
  createdByName?: string
): ClassTeacher {
  return {
    id,
    classId,
    className,
    grade,
    teacherId,
    teacherName,
    position,
    subjects,
    semester: CURRENT_SEMESTER,
    status,
    createdBy,
    createdByName,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  };
}

/**
 * 班级教师关系Mock数据
 * 包含班主任和科任教师
 */
export const MOCK_CLASS_TEACHERS: ClassTeacher[] = [
  // === 一年级1班 ===
  // 班主任
  createClassTeacher('ct001', 'c001', '一年级1班', 1, 't001', '张明华', 'head_teacher', ['语文']),
  // 科任
  createClassTeacher('ct002', 'c001', '一年级1班', 1, 't010', '林小燕', 'subject_teacher', ['数学']),
  createClassTeacher('ct003', 'c001', '一年级1班', 1, 't015', '陈小明', 'subject_teacher', ['英语']),
  
  // === 一年级2班 ===
  createClassTeacher('ct004', 'c002', '一年级2班', 1, 't002', '李秀芳', 'head_teacher', ['数学']),
  createClassTeacher('ct005', 'c002', '一年级2班', 1, 't001', '张明华', 'subject_teacher', ['语文']),
  createClassTeacher('ct006', 'c002', '一年级2班', 1, 't015', '陈小明', 'subject_teacher', ['英语']),
  
  // === 一年级3班 ===
  createClassTeacher('ct007', 'c003', '一年级3班', 1, 't003', '王建国', 'head_teacher', ['语文']),
  createClassTeacher('ct008', 'c003', '一年级3班', 1, 't010', '林小燕', 'subject_teacher', ['数学']),
  
  // === 二年级1班 ===
  createClassTeacher('ct009', 'c004', '二年级1班', 2, 't004', '赵丽萍', 'head_teacher', ['语文']),
  createClassTeacher('ct010', 'c004', '二年级1班', 2, 't011', '周海燕', 'subject_teacher', ['数学']),
  
  // === 二年级2班 ===
  createClassTeacher('ct011', 'c005', '二年级2班', 2, 't005', '刘伟强', 'head_teacher', ['数学']),
  createClassTeacher('ct012', 'c005', '二年级2班', 2, 't004', '赵丽萍', 'subject_teacher', ['语文']),
  
  // === 二年级3班 ===
  createClassTeacher('ct013', 'c006', '二年级3班', 2, 't006', '陈美玲', 'head_teacher', ['语文']),
  createClassTeacher('ct014', 'c006', '二年级3班', 2, 't011', '周海燕', 'subject_teacher', ['数学']),
  
  // === 三年级1班 ===
  createClassTeacher('ct015', 'c007', '三年级1班', 3, 't007', '周志明', 'head_teacher', ['数学']),
  createClassTeacher('ct016', 'c007', '三年级1班', 3, 't012', '王丽华', 'subject_teacher', ['语文']),
  
  // === 三年级2班 ===
  createClassTeacher('ct017', 'c008', '三年级2班', 3, 't008', '陈思思', 'head_teacher', ['语文']),
  createClassTeacher('ct018', 'c008', '三年级2班', 3, 't007', '周志明', 'subject_teacher', ['数学']),
  
  // === 四年级1班 ===
  createClassTeacher('ct019', 'c009', '四年级1班', 4, 't009', '王强', 'head_teacher', ['体育']),
  createClassTeacher('ct020', 'c009', '四年级1班', 4, 't012', '王丽华', 'subject_teacher', ['语文']),
  createClassTeacher('ct021', 'c009', '四年级1班', 4, 't013', '李国强', 'subject_teacher', ['数学']),
  
  // === 四年级2班 ===
  createClassTeacher('ct022', 'c010', '四年级2班', 4, 't010', '林小燕', 'head_teacher', ['数学']),
  createClassTeacher('ct023', 'c010', '四年级2班', 4, 't014', '张晓红', 'subject_teacher', ['语文']),
  
  // === 五年级1班 ===
  createClassTeacher('ct024', 'c011', '五年级1班', 5, 't001', '张明华', 'head_teacher', ['语文']),
  createClassTeacher('ct025', 'c011', '五年级1班', 5, 't013', '李国强', 'subject_teacher', ['数学']),
  
  // === 五年级2班 ===
  createClassTeacher('ct026', 'c012', '五年级2班', 5, 't002', '李秀芳', 'head_teacher', ['数学']),
  createClassTeacher('ct027', 'c012', '五年级2班', 5, 't014', '张晓红', 'subject_teacher', ['语文']),
  
  // === 六年级1班 ===
  createClassTeacher('ct028', 'c013', '六年级1班', 6, 't003', '王建国', 'head_teacher', ['语文']),
  createClassTeacher('ct029', 'c013', '六年级1班', 6, 't011', '周海燕', 'subject_teacher', ['数学']),
  
  // === 六年级2班 ===
  createClassTeacher('ct030', 'c014', '六年级2班', 6, 't004', '赵丽萍', 'head_teacher', ['语文']),
  createClassTeacher('ct031', 'c014', '六年级2班', 6, 't013', '李国强', 'subject_teacher', ['数学']),
  
  // === 上学期已失效的记录（示例） ===
  createClassTeacher('ct100', 'c001', '一年级1班', 1, 't020', '李老师', 'subject_teacher', ['音乐'], 'expired'),
];

/**
 * 获取班级的所有教师（班主任+科任）
 */
export function getMockClassTeachersByClassId(classId: string, includeExpired = false): ClassTeacher[] {
  return MOCK_CLASS_TEACHERS.filter(ct => 
    ct.classId === classId && (includeExpired || ct.status === 'active')
  );
}

/**
 * 获取教师任教的所有班级
 */
export function getMockClassTeachersByTeacherId(teacherId: string, includeExpired = false): ClassTeacher[] {
  return MOCK_CLASS_TEACHERS.filter(ct => 
    ct.teacherId === teacherId && (includeExpired || ct.status === 'active')
  );
}

/**
 * 检查教师是否是某班的班主任或科任
 */
export function getMockTeacherClassRelation(
  classId: string, 
  teacherId: string
): ClassTeacher | undefined {
  return MOCK_CLASS_TEACHERS.find(ct => 
    ct.classId === classId && 
    ct.teacherId === teacherId && 
    ct.status === 'active'
  );
}

/**
 * 判断教师是否可以查看某班学生的敏感数据
 */
export function mockCanTeacherViewClassStudents(teacherId: string, classId: string): boolean {
  const relation = getMockTeacherClassRelation(classId, teacherId);
  return !!relation; // 是班主任或科任就可以查看
}

/**
 * 获取教师可访问的所有班级ID
 */
export function getMockTeacherAccessibleClassIds(teacherId: string): string[] {
  return MOCK_CLASS_TEACHERS
    .filter(ct => ct.teacherId === teacherId && ct.status === 'active')
    .map(ct => ct.classId);
}

/**
 * 添加班级教师关系
 */
export function addMockClassTeacher(classTeacher: ClassTeacher): ClassTeacher {
  MOCK_CLASS_TEACHERS.push(classTeacher);
  return classTeacher;
}

/**
 * 更新班级教师关系
 */
export function updateMockClassTeacher(
  id: string, 
  updates: Partial<ClassTeacher>
): ClassTeacher | undefined {
  const index = MOCK_CLASS_TEACHERS.findIndex(ct => ct.id === id);
  if (index !== -1) {
    MOCK_CLASS_TEACHERS[index] = {
      ...MOCK_CLASS_TEACHERS[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return MOCK_CLASS_TEACHERS[index];
  }
  return undefined;
}

/**
 * 删除班级教师关系
 */
export function deleteMockClassTeacher(id: string): boolean {
  const index = MOCK_CLASS_TEACHERS.findIndex(ct => ct.id === id);
  if (index !== -1) {
    MOCK_CLASS_TEACHERS.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * 批量过期上学期的科任关系
 */
export function expireLastSemesterRelations(currentSemester: string): number {
  let count = 0;
  MOCK_CLASS_TEACHERS.forEach(ct => {
    if (ct.semester !== currentSemester && ct.status === 'active') {
      ct.status = 'expired';
      ct.updatedAt = new Date().toISOString();
      count++;
    }
  });
  return count;
}
