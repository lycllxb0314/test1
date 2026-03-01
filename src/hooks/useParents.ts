/**
 * 家长数据管理 Hook
 * 
 * 从学生数据中提取家长信息，支持：
 * - 家长列表展示
 * - 按班级、年级筛选
 * - 家长统计信息
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 家长关系类型 */
export type ParentRelationship = '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他';

/** 家长完整信息 */
export interface ParentInfo {
  id: string;                    // 家长ID（基于学生ID生成）
  name: string;                  // 家长姓名
  relationship: ParentRelationship; // 与学生关系
  phone: string;                 // 联系电话
  wechat?: string;               // 微信号
  isPrimary: boolean;            // 是否主要联系人
  
  // 关联学生信息
  studentId: string;             // 关联学生ID
  studentName: string;           // 学生姓名
  studentNo: string;             // 学号
  classId: string;               // 班级ID
  className: string;             // 班级名称
  grade: number;                 // 年级
  
  // 学生基本信息
  studentGender: 'male' | 'female';
  studentStatus: string;
}

/** 筛选参数 */
export interface ParentFilterParams {
  search?: string;               // 搜索关键词（家长姓名、学生姓名、电话）
  grade?: string;                // 年级筛选
  classId?: string;              // 班级筛选
  relationship?: string;         // 关系筛选
}

/** Hook 返回类型 */
export interface UseParentsReturn {
  // 数据
  parents: ParentInfo[];
  loading: boolean;
  error: string | null;
  
  // 统计
  statistics: {
    total: number;
    fathers: number;
    mothers: number;
    grandparents: number;
    primaryContacts: number;
    byGrade: Record<number, number>;
  };
  
  // 筛选选项
  gradeOptions: Array<{ value: string; label: string }>;
  classOptions: Array<{ value: string; label: string }>;
  relationshipOptions: Array<{ value: ParentRelationship; label: string }>;
  
  // 操作方法
  fetchParents: () => Promise<void>;
  refetch: () => Promise<void>;
  getParentsByStudent: (studentId: string) => ParentInfo[];
  getParentsByClass: (classId: string) => ParentInfo[];
  
  // 工具方法
  getRelationshipLabel: (relationship: ParentRelationship) => string;
}

// ==================== 常量定义 ====================

/** 关系标签映射 */
export const PARENT_RELATIONSHIP_LABELS: Record<ParentRelationship, string> = {
  '父亲': '父亲',
  '母亲': '母亲',
  '爷爷': '爷爷',
  '奶奶': '奶奶',
  '外公': '外公',
  '外婆': '外婆',
  '其他': '其他',
};

/** 关系选项 */
export const PARENT_RELATIONSHIP_OPTIONS: ParentRelationship[] = [
  '父亲',
  '母亲',
  '爷爷',
  '奶奶',
  '外公',
  '外婆',
  '其他',
];

// ==================== Hook 实现 ====================

export function useParents(): UseParentsReturn {
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 关系选项
  const relationshipOptions = useMemo(() => 
    PARENT_RELATIONSHIP_OPTIONS.map(value => ({
      value,
      label: PARENT_RELATIONSHIP_LABELS[value],
    })),
  []);
  
  // 年级选项（1-6年级）
  const gradeOptions = useMemo(() => 
    [1, 2, 3, 4, 5, 6].map(grade => ({
      value: String(grade),
      label: `${grade}年级`,
    })),
  []);
  
  // 班级选项（从家长数据中提取）
  const classOptions = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string; grade: number }>();
    parents.forEach(p => {
      if (!classMap.has(p.classId)) {
        classMap.set(p.classId, { id: p.classId, name: p.className, grade: p.grade });
      }
    });
    return Array.from(classMap.values())
      .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name))
      .map(c => ({
        value: c.id,
        label: c.name,
      }));
  }, [parents]);
  
  // 统计数据
  const statistics = useMemo(() => ({
    total: parents.length,
    fathers: parents.filter(p => p.relationship === '父亲').length,
    mothers: parents.filter(p => p.relationship === '母亲').length,
    grandparents: parents.filter(p => 
      ['爷爷', '奶奶', '外公', '外婆'].includes(p.relationship)
    ).length,
    primaryContacts: parents.filter(p => p.isPrimary).length,
    byGrade: parents.reduce((acc, p) => {
      acc[p.grade] = (acc[p.grade] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
  }), [parents]);
  
  // 获取家长列表（从学生数据提取）
  const fetchParents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 获取所有学生数据
      const response = await fetch('/api/students?pageSize=1000');
      const result = await response.json();
      
      if (result.success && result.data) {
        // 从学生数据中提取家长信息
        const extractedParents: ParentInfo[] = [];
        
        result.data.forEach((student: Record<string, unknown>) => {
          const studentId = student.id as string;
          const studentName = student.name as string;
          const studentNo = student.student_no as string || student.studentNo as string;
          const classId = student.class_id as string || student.classId as string;
          const className = student.class_name as string || student.className as string;
          const grade = student.grade as number || 1;
          const studentGender = (student.gender as 'male' | 'female') || 'male';
          const studentStatus = student.status as string || '在校';
          
          // 如果学生有 parents 数组，使用它
          const studentParents = student.parents as Array<Record<string, unknown>> | undefined;
          if (studentParents && Array.isArray(studentParents) && studentParents.length > 0) {
            studentParents.forEach((parent, index) => {
              extractedParents.push({
                id: parent.id as string || `${studentId}_parent_${index}`,
                name: parent.name as string || '',
                relationship: (parent.relationship as ParentRelationship) || '父亲',
                phone: parent.phone as string || '',
                wechat: parent.wechat as string,
                isPrimary: parent.isPrimary as boolean || index === 0,
                studentId,
                studentName,
                studentNo,
                classId,
                className,
                grade,
                studentGender,
                studentStatus,
              });
            });
          } else {
            // 兼容旧数据：使用 parent_name 和 parent_phone
            const parentName = student.parent_name as string || student.parentName as string;
            const parentPhone = student.parent_phone as string || student.parentPhone as string;
            
            if (parentName || parentPhone) {
              extractedParents.push({
                id: `${studentId}_parent_0`,
                name: parentName || '未填写',
                relationship: '父亲', // 默认
                phone: parentPhone || '',
                isPrimary: true,
                studentId,
                studentName,
                studentNo,
                classId,
                className,
                grade,
                studentGender,
                studentStatus,
              });
            }
          }
        });
        
        setParents(extractedParents);
      }
    } catch (err) {
      console.error('获取家长数据失败:', err);
      setError('获取家长数据失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 根据学生ID获取家长
  const getParentsByStudent = useCallback((studentId: string) => 
    parents.filter(p => p.studentId === studentId),
  [parents]);
  
  // 根据班级ID获取家长
  const getParentsByClass = useCallback((classId: string) => 
    parents.filter(p => p.classId === classId),
  [parents]);
  
  // 获取关系标签
  const getRelationshipLabel = useCallback((relationship: ParentRelationship) => 
    PARENT_RELATIONSHIP_LABELS[relationship] || relationship,
  []);
  
  // 初始化加载
  useEffect(() => {
    fetchParents();
  }, [fetchParents]);
  
  return {
    parents,
    loading,
    error,
    statistics,
    gradeOptions,
    classOptions,
    relationshipOptions,
    fetchParents,
    refetch: fetchParents,
    getParentsByStudent,
    getParentsByClass,
    getRelationshipLabel,
  };
}

// ==================== 导出别名 ====================

export { useParents as useParentData };
