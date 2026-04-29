import { TeacherInfo, SubjectGroup, SelectedSlot } from './types';

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
export const MORNING_PERIODS = ['第1节', '第2节', '第3节'];
export const AFTERNOON_PERIODS = ['第4节', '第5节', '第6节'];

export const SUBJECT_ORDER = [
  '语文', '数学', '英语', '科学', '道德与法治',
  '音乐', '美术', '体育', '信息技术', '书法', '劳动', '综合实践', '校本', '班会'
];

export type SubjectRule = 'chinese_only' | 'math_only' | 'head_teacher_only' | 'all_chinese' | 'science_rule' | 'all_chinese_math' | 'all_subject';

export const SUBJECT_RULES: Record<string, SubjectRule> = {
  '语文': 'chinese_only',
  '数学': 'math_only',
  '书法': 'chinese_only',
  '班会': 'head_teacher_only',
  '道德与法治': 'all_chinese',
  '科学': 'science_rule',
  '校本': 'all_chinese_math',
  '综合实践': 'all_chinese_math',
  '劳动': 'all_chinese_math',
};

export function getFilteredTeachers(
  teachers: SubjectGroup[],
  selectedSubject: string,
  selectedSlot: SelectedSlot | null,
  searchQuery: string,
  grade: number
): TeacherInfo[] {
  if (!selectedSubject) return [];
  const rule = SUBJECT_RULES[selectedSubject] || 'all_subject';

  const getClassTeacher = (type: 'chinese' | 'math'): TeacherInfo | null => {
    const teacherId = type === 'chinese' ? selectedSlot?.chineseTeacherId : selectedSlot?.mathTeacherId;
    const teacherName = type === 'chinese' ? selectedSlot?.chineseTeacherName : selectedSlot?.mathTeacherName;
    const subject = type === 'chinese' ? '语文' : '数学';
    const subjectGroup = teachers.find(g => g.subject === subject);
    const teacherInfo = subjectGroup?.teachers.find(t => t.id === teacherId);
    if (teacherInfo) return teacherInfo;
    if (teacherId) {
      return { id: teacherId, name: teacherName || '未知', subject, maxHours: 16, usedHours: 0, remainingHours: 16 };
    }
    return null;
  };

  switch (rule) {
    case 'chinese_only': {
      const ct = getClassTeacher('chinese');
      return ct ? [ct] : [];
    }
    case 'math_only': {
      const mt = getClassTeacher('math');
      return mt ? [mt] : [];
    }
    case 'head_teacher_only': {
      if (!selectedSlot?.headTeacherId) return [];
      const allT = teachers.flatMap(g => g.teachers);
      const ht = allT.find(t => t.id === selectedSlot.headTeacherId);
      return ht ? [ht] : [{ id: selectedSlot.headTeacherId, name: selectedSlot.headTeacherName || '未知', subject: '班主任', maxHours: 16, usedHours: 0, remainingHours: 16 }];
    }
    case 'all_chinese': {
      const chineseGroup = teachers.find(g => g.subject === '语文');
      const filtered = (chineseGroup?.teachers || []).filter(t => !searchQuery || t.name.includes(searchQuery));
      const priorityIds = new Set([selectedSlot?.headTeacherId, selectedSlot?.chineseTeacherId, selectedSlot?.mathTeacherId].filter(Boolean) as string[]);
      return filtered.sort((a, b) => {
        const aIsPriority = priorityIds.has(a.id) ? 0 : 1;
        const bIsPriority = priorityIds.has(b.id) ? 0 : 1;
        if (aIsPriority !== bIsPriority) return aIsPriority - bIsPriority;
        return a.remainingHours - b.remainingHours;
      });
    }
    case 'science_rule': {
      const allTeachers = [...(teachers.find(g => g.subject === '数学')?.teachers || []), ...(teachers.find(g => g.subject === '科学')?.teachers || [])];
      const filtered = allTeachers.filter(t => !searchQuery || t.name.includes(searchQuery));
      const classMathTeacherId = selectedSlot?.mathTeacherId;
      return filtered.sort((a, b) => {
        const aIsClassMath = a.id === classMathTeacherId ? 0 : 1;
        const bIsClassMath = b.id === classMathTeacherId ? 0 : 1;
        if (aIsClassMath !== bIsClassMath) return aIsClassMath - bIsClassMath;
        const aIsScience = a.subject === '科学' ? 0 : 1;
        const bIsScience = b.subject === '科学' ? 0 : 1;
        if (aIsScience !== bIsScience) return aIsScience - bIsScience;
        return a.remainingHours - b.remainingHours;
      });
    }
    case 'all_chinese_math': {
      const allTeachers = [...(teachers.find(g => g.subject === '语文')?.teachers || []), ...(teachers.find(g => g.subject === '数学')?.teachers || [])];
      const filtered = allTeachers.filter(t => !searchQuery || t.name.includes(searchQuery));
      const priorityIds = new Set([selectedSlot?.headTeacherId, selectedSlot?.chineseTeacherId, selectedSlot?.mathTeacherId].filter(Boolean) as string[]);
      return filtered.sort((a, b) => {
        const aIsPriority = priorityIds.has(a.id) ? 0 : 1;
        const bIsPriority = priorityIds.has(b.id) ? 0 : 1;
        if (aIsPriority !== bIsPriority) return aIsPriority - bIsPriority;
        return a.remainingHours - b.remainingHours;
      });
    }
    default: {
      const subjectGroup = teachers.find(g => g.subject === selectedSubject);
      const filtered = (subjectGroup?.teachers || []).filter(t => !searchQuery || t.name.includes(searchQuery));
      const classTeachersForSubject = selectedSlot?.classTeacherBySubject?.[selectedSubject] || [];
      const classTeacherIds = new Set(classTeachersForSubject.map(t => t.id));
      return filtered.sort((a, b) => {
        const aIsClassTeacher = classTeacherIds.has(a.id) ? 0 : 1;
        const bIsClassTeacher = classTeacherIds.has(b.id) ? 0 : 1;
        if (aIsClassTeacher !== bIsClassTeacher) return aIsClassTeacher - bIsClassTeacher;
        return a.remainingHours - b.remainingHours;
      });
    }
  }
}

export function getPeriodDisplay(index: number): string {
  if (index < 3) return MORNING_PERIODS[index];
  return AFTERNOON_PERIODS[index - 3];
}

export function isSlotAvailable(grade: number, weekDay: number, periodIndex: number): boolean {
  if (grade <= 2 && weekDay < 4 && periodIndex >= 5) return false;
  return true;
}
