/**
 * 依赖注入初始化
 * 
 * 注册所有 Repository 和 Service 到 DI 容器
 * 
 * ⚠️ 重要原则：
 * 1. Repository 层只负责数据访问，不依赖其他层
 * 2. Service 层通过 DI 容器获取 Repository，不直接 import
 * 3. API 层通过 DI 容器获取 Service，不直接 import
 * 
 * @module lib/di
 */

import { container, SERVICE_IDENTIFIERS } from './container';

// 导入 Repository 实现
import { UserRepository, userRepository } from '@/repositories/user.repository';
import { TeacherRepository, teacherRepository } from '@/repositories/teacher.repository';
import { StudentRepository, studentRepository } from '@/repositories/student.repository';
import { ClassRepository, classRepository } from '@/repositories/class.repository';
import { AttendanceRepository, attendanceRepository } from '@/repositories/attendance.repository';
import { ScheduleRepository, scheduleRepository, ActualScheduleRepository, actualScheduleRepository } from '@/repositories/schedule.repository';
import { GradeRepository, gradeRepository } from '@/repositories/grade.repository';
import { ApprovalRepository, approvalRepository } from '@/repositories/approval.repository';
import { MessageRepository, messageRepository } from '@/repositories/message.repository';
import { LeaveRepository, leaveRepository } from '@/repositories/leave.repository';
import { CourseRepository, courseRepository } from '@/repositories/course.repository';
import { ExamRepository, examRepository, ExamScoreRepository, examScoreRepository } from '@/repositories/exam.repository';
import { HomeworkRepository, homeworkRepository, HomeworkSubmissionRepository, homeworkSubmissionRepository } from '@/repositories/homework.repository';
import {
  ResearchActivityRepository, researchActivityRepository,
  ResearchStageRepository, researchStageRepository,
  ResearchAchievementRepository, researchAchievementRepository,
  ResearchResourceRepository, researchResourceRepository,
} from '@/repositories/research.repository';
import {
  MoralActivityRepository, moralActivityRepository,
  MoralActivitySubmissionRepository, moralActivitySubmissionRepository,
} from '@/repositories/moral.repository';
import {
  HabitGoalRepository, habitGoalRepository,
  StudentHabitGoalRepository, studentHabitGoalRepository,
  HabitRecordRepository, habitRecordRepository,
  HabitStarRepository, habitStarRepository,
} from '@/repositories/habit.repository';
import {
  InformationCollectionRepository, informationCollectionRepository,
  CollectionResponseRepository, collectionResponseRepository,
} from '@/repositories/information-collection.repository';

// 导入 Service 实现
import { UserService, userService } from '@/services/user.service';
import { StudentService, studentService } from '@/services/student.service';
import { TeacherService, teacherService } from '@/services/teacher.service';
import { ClassService, classService } from '@/services/class.service';
import { AttendanceService, attendanceService } from '@/services/attendance.service';
import { ApprovalService, approvalService } from '@/services/approval.service';
import { CourseService, courseService } from '@/services/course.service';
import { ExamService, examService, ExamScoreService, examScoreService } from '@/services/exam.service';
import { HomeworkService, homeworkService, HomeworkSubmissionService, homeworkSubmissionService } from '@/services/homework.service';
import {
  ResearchActivityService, researchActivityService,
  ResearchStageService, researchStageService,
  ResearchAchievementService, researchAchievementService,
  ResearchResourceService, researchResourceService,
} from '@/services/research.service';
import {
  MoralActivityService, moralActivityService,
  MoralActivitySubmissionService, moralActivitySubmissionService,
} from '@/services/moral.service';
import {
  HabitGoalService, habitGoalService,
  StudentHabitGoalService, studentHabitGoalService,
  HabitRecordService, habitRecordService,
  HabitStarService, habitStarService,
} from '@/services/habit.service';
import {
  InformationCollectionService, informationCollectionService,
  CollectionResponseService, collectionResponseService,
} from '@/services/information-collection.service';

/**
 * 初始化 DI 容器
 * 注册所有服务到容器中
 */
export function initializeDI(): void {
  // ========================================
  // 注册 Repositories（单例）
  // ========================================
  container.registerSingleton(SERVICE_IDENTIFIERS.UserRepository, () => userRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherRepository, () => teacherRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentRepository, () => studentRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassRepository, () => classRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AttendanceRepository, () => attendanceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ScheduleRepository, () => scheduleRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.GradeRepository, () => gradeRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ApprovalRepository, () => approvalRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.MessageRepository, () => messageRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.LeaveRepository, () => leaveRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CourseRepository, () => courseRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamRepository, () => examRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamScoreRepository, () => examScoreRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkRepository, () => homeworkRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkSubmissionRepository, () => homeworkSubmissionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchActivityRepository, () => researchActivityRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchStageRepository, () => researchStageRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchAchievementRepository, () => researchAchievementRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchResourceRepository, () => researchResourceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivityRepository, () => moralActivityRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivitySubmissionRepository, () => moralActivitySubmissionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitGoalRepository, () => habitGoalRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentHabitGoalRepository, () => studentHabitGoalRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitRecordRepository, () => habitRecordRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitStarRepository, () => habitStarRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.InformationCollectionRepository, () => informationCollectionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CollectionResponseRepository, () => collectionResponseRepository);

  // ========================================
  // 注册 Services（单例）
  // ========================================
  container.registerSingleton(SERVICE_IDENTIFIERS.UserService, () => userService);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentService, () => studentService);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherService, () => teacherService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassService, () => classService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AttendanceService, () => attendanceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ApprovalService, () => approvalService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CourseService, () => courseService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamService, () => examService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamScoreService, () => examScoreService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkService, () => homeworkService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkSubmissionService, () => homeworkSubmissionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchActivityService, () => researchActivityService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchStageService, () => researchStageService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchAchievementService, () => researchAchievementService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchResourceService, () => researchResourceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivityService, () => moralActivityService);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivitySubmissionService, () => moralActivitySubmissionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitGoalService, () => habitGoalService);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentHabitGoalService, () => studentHabitGoalService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitRecordService, () => habitRecordService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitStarService, () => habitStarService);
  container.registerSingleton(SERVICE_IDENTIFIERS.InformationCollectionService, () => informationCollectionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CollectionResponseService, () => collectionResponseService);
}

// 导出
export { container, SERVICE_IDENTIFIERS, getService } from './container';
// 从统一类型目录导出 Repository 接口
export type {
  IBaseRepository,
  IUserRepository,
  ITeacherRepository,
  IStudentRepository,
  IClassRepository,
  IGradeRepository,
  IApprovalRepository,
  IMessageRepository,
  ICourseRepository,
  IExamRepository,
  IExamScoreRepository,
  IHomeworkRepository,
  IHomeworkSubmissionRepository,
  IResearchActivityRepository,
  IResearchStageRepository,
  IResearchAchievementRepository,
  IResearchResourceRepository,
  IMoralActivityRepository,
  IMoralActivitySubmissionRepository,
  IHabitGoalRepository,
  IStudentHabitGoalRepository,
  IHabitRecordRepository,
  IHabitStarRepository,
  IInformationCollectionRepository,
  ICollectionResponseRepository,
  ExamQueryOptions,
  HomeworkQueryOptions,
  ResearchQueryOptions,
  MoralQueryOptions,
  HabitQueryOptions,
  CollectionQueryOptions,
} from '@/types/repository';

// 自动初始化（在模块加载时执行）
initializeDI();
