/**
 * 班级相关Mock数据
 */

import type { ClassInfo } from '@/types';

// 辅助函数：创建班级数据
function createClass(
  id: string,
  name: string,
  grade: number,
  classNumber: number,
  headTeacherId: string,
  headTeacherName: string,
  studentCount: number,
  maleCount: number,
  femaleCount: number,
  classroomId: string,
  classroomName: string,
  building: string
): ClassInfo {
  return {
    id,
    name,
    grade,
    classNumber,
    headTeacherId,
    headTeacherName,
    studentCount,
    maleCount,
    femaleCount,
    classroomId,
    classroomName,
    building,
    status: 'active',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  };
}

// 班级列表Mock数据
export const MOCK_CLASSES: ClassInfo[] = [
  // 一年级
  createClass('c001', '一年级1班', 1, 1, 't001', '张明华', 45, 23, 22, 'r001', '教学楼A101', '教学楼A'),
  createClass('c002', '一年级2班', 1, 2, 't002', '李秀芳', 43, 21, 22, 'r002', '教学楼A102', '教学楼A'),
  createClass('c003', '一年级3班', 1, 3, 't003', '王建国', 44, 22, 22, 'r003', '教学楼A103', '教学楼A'),
  // 二年级
  createClass('c004', '二年级1班', 2, 1, 't004', '赵丽萍', 46, 24, 22, 'r004', '教学楼A201', '教学楼A'),
  createClass('c005', '二年级2班', 2, 2, 't005', '刘伟强', 45, 23, 22, 'r005', '教学楼A202', '教学楼A'),
  createClass('c006', '二年级3班', 2, 3, 't006', '陈美玲', 44, 22, 22, 'r006', '教学楼A203', '教学楼A'),
  // 三年级
  createClass('c007', '三年级1班', 3, 1, 't007', '周志明', 47, 24, 23, 'r007', '教学楼B101', '教学楼B'),
  createClass('c008', '三年级2班', 3, 2, 't008', '陈思思', 45, 22, 23, 'r008', '教学楼B102', '教学楼B'),
  // 四年级
  createClass('c009', '四年级1班', 4, 1, 't009', '王强', 46, 23, 23, 'r009', '教学楼B201', '教学楼B'),
  createClass('c010', '四年级2班', 4, 2, 't010', '林小燕', 44, 22, 22, 'r010', '教学楼B202', '教学楼B'),
  // 五年级
  createClass('c011', '五年级1班', 5, 1, 't001', '张明华', 48, 25, 23, 'r011', '教学楼C101', '教学楼C'),
  createClass('c012', '五年级2班', 5, 2, 't002', '李秀芳', 45, 23, 22, 'r012', '教学楼C102', '教学楼C'),
  // 六年级
  createClass('c013', '六年级1班', 6, 1, 't003', '王建国', 47, 24, 23, 'r013', '教学楼C201', '教学楼C'),
  createClass('c014', '六年级2班', 6, 2, 't004', '赵丽萍', 46, 23, 23, 'r014', '教学楼C202', '教学楼C'),
];

/**
 * 获取班级列表Mock数据
 */
export function getMockClasses(filters?: {
  grade?: string | number;
  search?: string;
}): ClassInfo[] {
  let result = [...MOCK_CLASSES];
  
  if (filters?.grade && filters.grade !== 'all') {
    const grade = typeof filters.grade === 'string' ? parseInt(filters.grade) : filters.grade;
    result = result.filter(c => c.grade === grade);
  }
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.headTeacherName.toLowerCase().includes(search)
    );
  }
  
  return result;
}

/**
 * 获取班级详情Mock数据
 */
export function getMockClass(id: string): ClassInfo | undefined {
  return MOCK_CLASSES.find(c => c.id === id);
}

/**
 * 按年级分组获取班级
 */
export function getMockClassesByGrade(): Record<number, ClassInfo[]> {
  const result: Record<number, ClassInfo[]> = {};
  
  for (const cls of MOCK_CLASSES) {
    if (!result[cls.grade]) {
      result[cls.grade] = [];
    }
    result[cls.grade].push(cls);
  }
  
  return result;
}
