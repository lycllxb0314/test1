/**
 * 服务层统一导出
 * 
 * 🚨 推荐从具体模块导入，提高代码可读性：
 * 
 * ✅ 推荐：
 *   import { studentService } from '@/services/student.service';
 *   import type { Student } from '@/types/student';
 * 
 * ⚠️ 仅在需要多个 Service 时使用此入口：
 *   import { studentService, teacherService } from '@/services';
 * 
 * @module services
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

// ============================================
// 学生服务
// ============================================
export { StudentService, studentService } from './student.service';

// ============================================
// 教师服务
// ============================================
export { TeacherService, teacherService } from './teacher.service';

// ============================================
// 班级服务
// ============================================
export { ClassService, classService } from './class.service';

// ============================================
// 考勤服务
// ============================================
export { AttendanceService, attendanceService } from './attendance.service';

// ============================================
// 审批服务
// ============================================
export { ApprovalService, approvalService } from './approval.service';

// ============================================
// 课程服务
// ============================================
export { CourseService, courseService } from './course.service';

// ============================================
// 考试服务
// ============================================
export {
  ExamService,
  examService,
  ExamScoreService,
  examScoreService,
} from './exam.service';

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

// ============================================
// 班级常规评比服务
// ============================================
export {
  ClassRoutineService,
  classRoutineService,
} from './class-routine.service';
