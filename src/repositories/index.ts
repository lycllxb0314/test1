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

// 基础类
export { BaseRepository } from './base.repository';
export type { QueryOptions, PaginatedResult } from './base.repository';

// 用户
export { UserRepository, userRepository } from './user.repository';
export type { UserFilters } from './user.repository';

// 教师
export { TeacherRepository, teacherRepository } from './teacher.repository';
export type { TeacherFilters } from './teacher.repository';

// 学生
export { StudentRepository, studentRepository } from './student.repository';
export type { StudentFilters } from './student.repository';

// 审批
export { ApprovalRepository, approvalRepository } from './approval.repository';
export type { ApprovalFilters } from './approval.repository';

// 消息
export { MessageRepository, messageRepository } from './message.repository';
export type { MessageFilters } from './message.repository';

// 请假
export { LeaveRepository, leaveRepository } from './leave.repository';
export type { LeaveFilters } from './leave.repository';
