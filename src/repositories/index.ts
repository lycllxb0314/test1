/**
 * Repository 层统一导出
 * 
 * 所有数据访问都通过 Repository 进行，隔离业务逻辑与数据存储
 * 
 * @example
 * ```ts
 * import { userRepository, approvalRepository } from '@/repositories';
 * 
 * // 查询用户
 * const user = await userRepository.findById('xxx');
 * 
 * // 分页查询审批
 * const { data, total } = await approvalRepository.findPaginated({ page: 1, pageSize: 20 });
 * ```
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
export type { TeacherFilters } from './teacher.repository';

// ============================================
// 学生管理
// ============================================
export { StudentRepository, studentRepository } from './student.repository';
export type { StudentFilters } from './student.repository';

// ============================================
// 班级管理
// ============================================
export { ClassRepository, classRepository } from './class.repository';
export type { ClassFilters, ClassStatistics } from './class.repository';

// ============================================
// 考勤管理
// ============================================
export { AttendanceRepository, attendanceRepository } from './attendance.repository';
export type { AttendanceFilters, AttendanceStatistics } from './attendance.repository';

// ============================================
// 课表管理
// ============================================
export { ScheduleRepository, scheduleRepository, ActualScheduleRepository, actualScheduleRepository } from './schedule.repository';
export type { ScheduleFilters } from './schedule.repository';

// ============================================
// 成绩管理
// ============================================
export { GradeRepository, gradeRepository } from './grade.repository';
export type { GradeFilters, GradeStatistics } from './grade.repository';

// ============================================
// 审批管理
// ============================================
export { ApprovalRepository, approvalRepository } from './approval.repository';
export type { ApprovalFilters } from './approval.repository';

// ============================================
// 消息管理
// ============================================
export { MessageRepository, messageRepository } from './message.repository';
export type { MessageFilters } from './message.repository';

// ============================================
// 请假管理
// ============================================
export { LeaveRepository, leaveRepository } from './leave.repository';
export type { LeaveFilters } from './leave.repository';

// ============================================
// 课程管理
// ============================================
export { CourseRepository, courseRepository } from './course.repository';
export type { CourseQueryOptions } from './course.repository';

// ============================================
// 考试管理
// ============================================
export {
  ExamRepository,
  examRepository,
  ExamScoreRepository,
  examScoreRepository,
} from './exam.repository';
export type {
  Exam,
  ExamScore,
  ExamType,
  ExamStatus,
  ExamQueryOptions,
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
export type {
  Homework,
  HomeworkSubmission,
  HomeworkType,
  HomeworkStatus,
  HomeworkQueryOptions,
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
export type {
  ResearchActivity,
  ResearchStage,
  ResearchAchievement,
  ResearchResource,
  ResearchType,
  ResearchStatus,
  ResearchQueryOptions,
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
export type {
  MoralActivity,
  MoralActivitySubmission,
  MoralActivityType,
  MoralActivityStatus,
  MoralQueryOptions,
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
export type {
  HabitGoal,
  StudentHabitGoal,
  HabitRecord,
  HabitStar,
  HabitCategory,
  HabitGoalType,
  HabitQueryOptions,
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
export type {
  InformationCollection,
  CollectionResponse,
  CollectionStatus,
  FieldType,
  FormField,
  CollectionQueryOptions,
} from './information-collection.repository';
