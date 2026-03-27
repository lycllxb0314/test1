/**
 * 服务层统一导出
 * 
 * 所有业务逻辑都通过 Service 进行，协调多个 Repository
 * 
 * @example
 * ```ts
 * import { userService, approvalService, studentService } from '@/services';
 * 
 * // 用户登录
 * const result = await userService.login('username', 'password');
 * 
 * // 提交审批
 * const approval = await approvalService.submitApproval({ ... });
 * 
 * // 获取学生列表
 * const students = await studentService.listStudents({ page: 1, pageSize: 20 });
 * ```
 */

// ============================================
// 基础类
// ============================================
export { BaseService } from './base.service';
export type { ServiceResult, PaginatedServiceResult } from './base.service';

// ============================================
// 用户服务
// ============================================
export { UserService, userService } from './user.service';
export type { CreateUserParams, UpdateUserParams } from './user.service';

// ============================================
// 学生服务
// ============================================
export { StudentService, studentService } from './student.service';
export type { 
  CreateStudentParams, 
  UpdateStudentParams, 
  StudentQueryParams 
} from './student.service';

// ============================================
// 教师服务
// ============================================
export { TeacherService, teacherService } from './teacher.service';
export type { 
  CreateTeacherParams, 
  UpdateTeacherParams, 
  TeacherQueryParams 
} from './teacher.service';

// ============================================
// 班级服务
// ============================================
export { ClassService, classService } from './class.service';
export type { 
  CreateClassParams, 
  UpdateClassParams, 
  ClassQueryParams 
} from './class.service';

// ============================================
// 考勤服务
// ============================================
export { AttendanceService, attendanceService } from './attendance.service';
export type { 
  RecordAttendanceParams, 
  BatchAttendanceParams, 
  AttendanceQueryParams 
} from './attendance.service';

// ============================================
// 审批服务
// ============================================
export { ApprovalService, approvalService } from './approval.service';
export type { 
  SubmitApprovalParams,
  ApprovalListParams
} from './approval.service';

// ============================================
// 课程服务
// ============================================
export { CourseService, courseService } from './course.service';

// ============================================
// 考试服务
// ============================================
export { ExamService, examService, ExamScoreService, examScoreService } from './exam.service';

// ============================================
// 作业服务
// ============================================
export {
  HomeworkService,
  homeworkService,
  HomeworkSubmissionService,
  homeworkSubmissionService,
} from './homework.service';

// ============================================
// 教研服务
// ============================================
export {
  ResearchActivityService,
  researchActivityService,
  ResearchStageService,
  researchStageService,
  ResearchAchievementService,
  researchAchievementService,
  ResearchResourceService,
  researchResourceService,
} from './research.service';

// ============================================
// 德育服务
// ============================================
export {
  MoralActivityService,
  moralActivityService,
  MoralActivitySubmissionService,
  moralActivitySubmissionService,
} from './moral.service';

// ============================================
// 习惯培养服务
// ============================================
export {
  HabitGoalService,
  habitGoalService,
  StudentHabitGoalService,
  studentHabitGoalService,
  HabitRecordService,
  habitRecordService,
  HabitStarService,
  habitStarService,
} from './habit.service';

// ============================================
// 信息采集服务
// ============================================
export {
  InformationCollectionService,
  informationCollectionService,
  CollectionResponseService,
  collectionResponseService,
} from './information-collection.service';
