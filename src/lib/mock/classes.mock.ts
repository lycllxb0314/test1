/**
 * 班级相关Mock数据
 * 
 * 数据来源：从 master-data.ts 导入统一主数据
 */

import type { ClassInfo } from '@/types';
import { MASTER_CLASSES, MASTER_TEACHERS, getMasterClassById, getMasterTeacherById } from './master-data';

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

// 班级列表Mock数据（基于 master-data.ts）
export const MOCK_CLASSES: ClassInfo[] = MASTER_CLASSES.map(cls => {
  const teacher = getMasterTeacherById(cls.headTeacherId);
  return createClass(
    cls.id,
    cls.name,
    cls.grade,
    cls.classNumber,
    cls.headTeacherId,
    cls.headTeacherName,
    45, // studentCount
    23, // maleCount
    22, // femaleCount
    cls.classroomId,
    cls.classroomName,
    cls.building
  );
});

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
