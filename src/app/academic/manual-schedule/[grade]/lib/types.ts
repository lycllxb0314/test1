export interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  maxHours: number;
  usedHours: number;
  remainingHours: number;
  hasSlotConflict?: boolean;
  slotConflict?: {
    gradeName: string;
    className: string;
    subject: string;
  };
  gradeAssignments?: Array<{
    grade: number;
    gradeName: string;
    classes: Array<{ id: string; name: string }>;
  }>;
}

export interface SubjectGroup {
  subject: string;
  teachers: TeacherInfo[];
}

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
  headTeacherId?: string;
  headTeacherName?: string;
  headTeacher?: { id: string; name: string; primarySubject: string };
  subTeacherId?: string;
  subTeacherName?: string;
  subTeacher?: { id: string; name: string; primarySubject: string };
  chineseTeacherId?: string;
  chineseTeacherName?: string;
  mathTeacherId?: string;
  mathTeacherName?: string;
  classTeacherBySubject?: Record<string, Array<{ id: string; name: string }>>;
}

export interface SelectedSlot {
  classId: string;
  className: string;
  weekDay: number;
  periodIndex: number;
  currentSubject?: string;
  currentTeacherName?: string;
  headTeacherId?: string;
  headTeacherName?: string;
  chineseTeacherId?: string;
  chineseTeacherName?: string;
  mathTeacherId?: string;
  mathTeacherName?: string;
  classTeacherBySubject?: Record<string, Array<{ id: string; name: string }>>;
}

export interface ContextMenuData {
  x: number;
  y: number;
  classId: string;
  className: string;
  weekDay: number;
  periodIndex: number;
  hasSlot: boolean;
}

export interface ClipboardData {
  subject: string;
  teacherId: string | null;
  teacherName: string | null;
}

export interface ScheduleStatus {
  hasDraft: boolean;
  draftSlotsCount: number;
  hasOfficial: boolean;
  officialSlotsCount: number;
}
