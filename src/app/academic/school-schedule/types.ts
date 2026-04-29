// app/academic/school-schedule/types.ts

export interface SlotData {
  id: string;
  class_id: string;
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
  class_name?: string;
  grade?: number;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  head_teacher_id?: string;
  sub_teacher_id?: string;
  head_teacher?: { id: string; name: string; primary_subject: string };
  sub_teacher?: { id: string; name: string; primary_subject: string };
  headTeacherName?: string;
  subTeacherName?: string;
  headTeacher?: { subject?: string };
  subTeacher?: { subject?: string };
  slots: SlotData[];
}

export interface GradeData {
  grade: number;
  gradeName: string;
  classes: ClassInfo[];
  classCount: number;
}

export interface TeacherInfo {
  id: string;
  name: string;
  primary_subject: string;
  employee_id?: string;
  slots: SlotData[];
  totalHours: number;
}

export interface SubjectGroup {
  subject: string;
  teachers: TeacherInfo[];
  teacherCount: number;
}

export interface SummaryData {
  totalClasses: number;
  totalSlots: number;
  totalTeachers: number;
  gradeStats: Array<{
    grade: number;
    gradeName: string;
    classCount: number;
    slotCount: number;
  }>;
  subjectStats: Array<{
    subject: string;
    hours: number;
  }>;
}

export type ViewMode = 'classes' | 'teachers' | 'summary';

export interface DetailDialog {
  type: 'class' | 'teacher';
  data: ClassInfo | TeacherInfo;
  scheduleMatrix: (SlotData | null)[][];
}
