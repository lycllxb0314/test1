/**
 * Repository 层统一导出
 * 
 * 🚨 推荐从具体模块导入，提高代码可读性：
 * 
 * ✅ 推荐：
 *   import { studentRepository } from '@/repositories/student.repository';
 *   import type { Student } from '@/types/student';
 * 
 * ⚠️ 仅在需要多个 Repository 时使用此入口：
 *   import { studentRepository, teacherRepository } from '@/repositories';
 * 
 * @module repositories
 */

// ============================================
// 基础类
// ============================================
export { BaseRepository } from './base.repository';
export type { QueryOptions, PaginatedResult } from './base.repository';

// ============================================
// 用户与权限
// ============================================
export { UserRepository, userRepository } from './user.repository';
export type { UserFilters } from './user.repository';

// ============================================
// 教师管理
// ============================================
export { TeacherRepository, teacherRepository } from './teacher.repository';

// ============================================
// 学生管理
// ============================================
export { StudentRepository, studentRepository } from './student.repository';

// ============================================
// 班级管理
// ============================================
export { ClassRepository, classRepository } from './class.repository';

// ============================================
// 考勤管理
// ============================================
export { AttendanceRepository, attendanceRepository } from './attendance.repository';

// ============================================
// 课表管理
// ============================================
export {
  ScheduleRepository,
  scheduleRepository,
  ActualScheduleRepository,
  actualScheduleRepository,
} from './schedule.repository';

// ============================================
// 成绩管理
// ============================================
export { GradeRepository, gradeRepository } from './grade.repository';

// ============================================
// 审批管理
// ============================================
export { ApprovalRepository, approvalRepository } from './approval.repository';

// ============================================
// 消息管理
// ============================================
export { MessageRepository, messageRepository } from './message.repository';

// ============================================
// 请假管理
// ============================================
export { LeaveRepository, leaveRepository } from './leave.repository';

// ============================================
// 课程管理
// ============================================
export { CourseRepository, courseRepository } from './course.repository';

// ============================================
// 考试管理
// ============================================
export {
  ExamRepository,
  examRepository,
  ExamScoreRepository,
  examScoreRepository,
} from './exam.repository';

// ============================================
// 作业管理
// ============================================
export {
  HomeworkRepository,
  homeworkRepository,
  HomeworkSubmissionRepository,
  homeworkSubmissionRepository,
} from './homework.repository';

// ============================================
// 教研管理
// ============================================
export {
  ResearchActivityRepository,
  researchActivityRepository,
  ResearchStageRepository,
  researchStageRepository,
  ResearchAchievementRepository,
  researchAchievementRepository,
  ResearchResourceRepository,
  researchResourceRepository,
} from './research.repository';

// ============================================
// 德育管理
// ============================================
export {
  MoralActivityRepository,
  moralActivityRepository,
  MoralActivitySubmissionRepository,
  moralActivitySubmissionRepository,
} from './moral.repository';

// ============================================
// 习惯培养管理
// ============================================
export {
  HabitGoalRepository,
  habitGoalRepository,
  StudentHabitGoalRepository,
  studentHabitGoalRepository,
  HabitRecordRepository,
  habitRecordRepository,
  HabitStarRepository,
  habitStarRepository,
} from './habit.repository';

// ============================================
// 信息采集管理
// ============================================
export {
  InformationCollectionRepository,
  informationCollectionRepository,
  CollectionResponseRepository,
  collectionResponseRepository,
} from './information-collection.repository';

// ============================================
// 班级常规评比管理
// ============================================
export {
  ClassRoutineRepository,
  classRoutineRepository,
} from './class-routine.repository';

export {
  DutyTeacherRepository,
  dutyTeacherRepository,
} from './duty-teacher.repository';

export {
  WeeklyEvaluationRepository,
  weeklyEvaluationRepository,
} from './weekly-evaluation.repository';

// ============================================
// 班级座位表管理
// ============================================
export {
  SeatingPlanRepository,
  seatingPlanRepository,
} from './seating-plan.repository';

// ============================================
// 备课中心管理
// ============================================
export {
  LessonPrepRepository,
  lessonPrepRepository,
} from './lesson-prep.repository';

// ============================================
// 数学教学内容管理
// ============================================
export {
  MathTeachingContentRepository,
  mathTeachingContentRepository,
} from './math-teaching-content.repository';

// ============================================
// P0 新增 Repository
// ============================================
export { ParentRepository, parentRepository } from './parent.repository';
export {
  RoomRepository, roomRepository,
  RoomBookingRepository, roomBookingRepository,
  ScheduleSlotRepository, scheduleSlotRepository,
  ScheduleDraftRepository, scheduleDraftRepository,
} from './academic.repository';
