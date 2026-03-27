/**
 * Repository 接口类型定义
 * 
 * 所有 Repository 接口统一定义在此文件，遵循：
 * 1. 业务模型统一使用 type
 * 2. 禁止在 Service/API/组件中自定义 interface/type
 * 3. 所有类型从 @/types 导入
 * 
 * @module types/repository
 */

import type { QueryOptions, PaginatedResult } from '@/repositories/base.repository';

// ==================== 基础类型 ====================

/** 基础 Repository 接口 */
export type IBaseRepository<T> = {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findWhere(conditions: Record<string, unknown>): Promise<T[]>;
  create(data: Partial<T>): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  findPaginated(options: QueryOptions): Promise<PaginatedResult<T>>;
};

// ==================== 用户与权限 ====================

export type IUserRepository = IBaseRepository<import('./user').User> & {
  findByUsername(username: string): Promise<import('./user').User | null>;
  findByEmployeeId(employeeId: string): Promise<import('./user').User | null>;
  findByPhone(phone: string): Promise<import('./user').User | null>;
  findByRole(role: string): Promise<import('./user').User[]>;
  updateLastLogin(id: string): Promise<void>;
};

// ==================== 教师管理 ====================

export type ITeacherRepository = IBaseRepository<import('./teacher').Teacher> & {
  findByDepartment(department: string): Promise<import('./teacher').Teacher[]>;
  findByStatus(status: string): Promise<import('./teacher').Teacher[]>;
};

// ==================== 学生管理 ====================

export type IStudentRepository = IBaseRepository<import('./student').Student> & {
  findByStudentNumber(studentNumber: string): Promise<import('./student').Student | null>;
  findByClass(classId: string): Promise<import('./student').Student[]>;
  findByGrade(grade: string): Promise<import('./student').Student[]>;
  findWithClass(filters: Record<string, unknown>, options: QueryOptions): Promise<PaginatedResult<import('./student').Student>>;
  findDetailById(id: string): Promise<{ parents: unknown[] }>;
  promoteGrade(currentGrade: string, nextGrade: string): Promise<number>;
};

// ==================== 班级管理 ====================

export type IClassRepository = IBaseRepository<import('./class').Class> & {
  findByGrade(grade: number): Promise<import('./class').Class[]>;
  findByGradeWithStudentCount(grade: number): Promise<(import('./class').Class & { student_count: number })[]>;
};

// ==================== 成绩管理 ====================

export type IGradeRepository = IBaseRepository<import('./grade').StudentGrade> & {
  findByExam(examId: string): Promise<import('./grade').StudentGrade[]>;
  findByStudent(studentId: string): Promise<import('./grade').StudentGrade[]>;
  findByClass(classId: string, examId: string): Promise<import('./grade').StudentGrade[]>;
};

// ==================== 审批管理 ====================

export type IApprovalRepository = IBaseRepository<import('./approval').Approval> & {
  findByApplicant(applicantId: string): Promise<import('./approval').Approval[]>;
  findByApprover(approverId: string): Promise<import('./approval').Approval[]>;
  findPending(): Promise<import('./approval').Approval[]>;
};

// ==================== 消息管理 ====================

export type IMessageRepository = IBaseRepository<import('./message').Message> & {
  findByRecipient(recipientId: string): Promise<import('./message').Message[]>;
  findBySender(senderId: string): Promise<import('./message').Message[]>;
  markAsRead(id: string): Promise<boolean>;
};

// ==================== 课程管理 ====================

export type ICourseRepository = IBaseRepository<import('./course').Course> & {
  findByTeacher(teacherId: string): Promise<import('./course').Course[]>;
  findByClass(classId: string): Promise<import('./course').Course[]>;
  findBySemester(semester: string): Promise<import('./course').Course[]>;
};

// ==================== 考试管理 ====================

export type ExamQueryOptions = QueryOptions & {
  type?: 'midterm' | 'final' | 'unit' | 'mock';
  status?: import('./exam').ExamStatus;
  semester?: string;
  grade?: number;
};

export type IExamRepository = IBaseRepository<import('./exam').Exam> & {
  findBySemester(semester: string): Promise<import('./exam').Exam[]>;
  findByStatus(status: import('./exam').ExamStatus): Promise<import('./exam').Exam[]>;
  updateStatus(id: string, status: import('./exam').ExamStatus): Promise<import('./exam').Exam | null>;
  getStatistics(id: string): Promise<import('./exam').ExamStatistics>;
};

export type IExamScoreRepository = IBaseRepository<import('./exam').ExamScore> & {
  findByExamId(examId: string): Promise<import('./exam').ExamScore[]>;
  findByStudentId(studentId: string): Promise<import('./exam').ExamScore[]>;
  importScores(scores: Partial<import('./exam').ExamScore>[]): Promise<import('./exam').ExamScore[]>;
  getClassStatistics(examId: string, classId: string): Promise<{
    count: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
  }>;
};

// ==================== 作业管理 ====================

export type HomeworkQueryOptions = QueryOptions & {
  type?: 'daily' | 'weekly' | 'project' | 'practice';
  status?: import('./homework').HomeworkStatus;
  subject?: string;
  classId?: string;
  teacherId?: string;
};

export type IHomeworkRepository = IBaseRepository<import('./homework').Homework> & {
  findByTeacher(teacherId: string): Promise<import('./homework').Homework[]>;
  findByClass(classId: string): Promise<import('./homework').Homework[]>;
  findBySubject(subject: string): Promise<import('./homework').Homework[]>;
  getStatistics(id: string): Promise<import('./homework').HomeworkStatistics>;
};

export type IHomeworkSubmissionRepository = IBaseRepository<import('./homework').HomeworkSubmission> & {
  findByHomework(homeworkId: string): Promise<import('./homework').HomeworkSubmission[]>;
  findByStudent(studentId: string): Promise<import('./homework').HomeworkSubmission[]>;
};

// ==================== 教研管理 ====================

export type ResearchQueryOptions = QueryOptions & {
  type?: string;
  status?: import('./research').ActivityStatus;
  organizerId?: string;
};

export type IResearchActivityRepository = IBaseRepository<import('./research').ResearchActivity> & {
  findByOrganizer(organizerId: string): Promise<import('./research').ResearchActivity[]>;
  findByStatus(status: import('./research').ActivityStatus): Promise<import('./research').ResearchActivity[]>;
  findOngoing(): Promise<import('./research').ResearchActivity[]>;
  getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
};

export type IResearchStageRepository = IBaseRepository<import('./research').ResearchStage> & {
  findByActivity(activityId: string): Promise<import('./research').ResearchStage[]>;
};

export type IResearchAchievementRepository = IBaseRepository<import('./research').ResearchAchievement> & {
  findByActivity(activityId: string): Promise<import('./research').ResearchAchievement[]>;
  findByAuthor(authorId: string): Promise<import('./research').ResearchAchievement[]>;
};

export type IResearchResourceRepository = IBaseRepository<import('./research').ResearchResource> & {
  findByActivity(activityId: string): Promise<import('./research').ResearchResource[]>;
  incrementDownloadCount(id: string): Promise<void>;
};

// ==================== 德育管理 ====================

export type MoralQueryOptions = QueryOptions & {
  type?: string;
  status?: import('./moral').MoralActivityStatus;
  organizerId?: string;
};

export type IMoralActivityRepository = IBaseRepository<import('./moral').MoralActivity> & {
  findByOrganizer(organizerId: string): Promise<import('./moral').MoralActivity[]>;
  findByType(type: string): Promise<import('./moral').MoralActivity[]>;
};

export type IMoralActivitySubmissionRepository = IBaseRepository<import('./moral').MoralActivitySubmission> & {
  findByActivity(activityId: string): Promise<import('./moral').MoralActivitySubmission[]>;
  findByStudent(studentId: string): Promise<import('./moral').MoralActivitySubmission[]>;
};

// ==================== 习惯培养 ====================

export type HabitQueryOptions = QueryOptions & {
  category?: import('./habit').HabitCategory;
  type?: import('./habit').HabitGoalType;
  isActive?: boolean;
};

export type IHabitGoalRepository = IBaseRepository<import('./habit').HabitGoal> & {
  findActive(): Promise<import('./habit').HabitGoal[]>;
  findByCategory(category: import('./habit').HabitCategory): Promise<import('./habit').HabitGoal[]>;
};

export type IStudentHabitGoalRepository = IBaseRepository<import('./habit').StudentHabitGoal> & {
  findByStudent(studentId: string): Promise<import('./habit').StudentHabitGoal[]>;
  findByGoal(goalId: string): Promise<import('./habit').StudentHabitGoal[]>;
};

export type IHabitRecordRepository = IBaseRepository<import('./habit').HabitRecord> & {
  findByStudent(studentId: string, date: string): Promise<import('./habit').HabitRecord[]>;
  findByDate(date: string): Promise<import('./habit').HabitRecord[]>;
};

export type IHabitStarRepository = IBaseRepository<import('./habit').HabitStar> & {
  findByStudent(studentId: string): Promise<import('./habit').HabitStar[]>;
  findByDate(date: string): Promise<import('./habit').HabitStar[]>;
};

// ==================== 信息采集 ====================

export type CollectionQueryOptions = QueryOptions & {
  status?: import('./information-collection').CollectionStatus;
  creatorId?: string;
};

export type IInformationCollectionRepository = IBaseRepository<import('./information-collection').InformationCollection> & {
  findByCreator(creatorId: string): Promise<import('./information-collection').InformationCollection[]>;
  findByStatus(status: import('./information-collection').CollectionStatus): Promise<import('./information-collection').InformationCollection[]>;
};

export type ICollectionResponseRepository = IBaseRepository<import('./information-collection').CollectionResponse> & {
  findByCollection(collectionId: string): Promise<import('./information-collection').CollectionResponse[]>;
  findByResponder(responderId: string): Promise<import('./information-collection').CollectionResponse[]>;
};
