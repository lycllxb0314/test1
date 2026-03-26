/**
 * 服务层统一导出
 * 
 * 所有业务逻辑都通过 Service 进行，协调多个 Repository
 * 
 * @example
 * ```ts
 * import { userService, approvalService } from '@/services';
 * 
 * // 用户登录
 * const result = await userService.login('username', 'password');
 * 
 * // 提交审批
 * const approval = await approvalService.submitApproval({ ... });
 * ```
 */

// 基础类
export { BaseService } from './base.service';
export type { ServiceResult, PaginatedServiceResult } from './base.service';

// 用户服务
export { UserService, userService } from './user.service';
export type { CreateUserParams, UpdateUserParams } from './user.service';

// 审批服务
export { ApprovalService, approvalService } from './approval.service';
export type { 
  SubmitApprovalParams, 
  ApprovalNodeParams, 
  ApprovalActionParams 
} from './approval.service';
