/**
 * 基础 Service 类
 * 
 * 提供通用的业务逻辑处理能力
 * 所有领域 Service 都继承此类
 */

import { userRepository, approvalRepository, messageRepository } from '@/repositories';

/**
 * 业务逻辑执行结果
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * 基础 Service 抽象类
 */
export abstract class BaseService {
  /**
   * 成功结果
   */
  protected ok<T>(data?: T): ServiceResult<T> {
    return { success: true, data };
  }
  
  /**
   * 失败结果
   */
  protected fail<T = void>(error: string, code?: string): ServiceResult<T> {
    return { success: false, error, code };
  }
  
  /**
   * 执行事务性操作
   */
  protected async transaction<T>(
    operations: () => Promise<T>
  ): Promise<ServiceResult<T>> {
    try {
      const result = await operations();
      return this.ok(result);
    } catch (error) {
      console.error('[Service] Transaction error:', error);
      return this.fail(
        error instanceof Error ? error.message : '操作失败',
        'TRANSACTION_ERROR'
      );
    }
  }
  
  /**
   * 获取当前用户信息
   */
  protected async getCurrentUser(userId: string) {
    return userRepository.findById(userId);
  }
  
  /**
   * 检查用户权限
   */
  protected async checkPermission(
    userId: string,
    requiredRole?: string
  ): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;
    
    if (requiredRole) {
      return (user as any).role === requiredRole;
    }
    
    return true;
  }
  
  /**
   * 发送通知消息
   */
  protected async sendNotification(
    title: string,
    content: string,
    targetUsers: string[],
    options?: { type?: string; senderId?: string; senderName?: string }
  ): Promise<boolean> {
    try {
      const message = await messageRepository.create({
        title,
        content,
        type: options?.type || 'notification',
        target_users: targetUsers,
        sender_id: options?.senderId || 'system',
        sender_name: options?.senderName || '系统通知',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
      
      return !!message;
    } catch (error) {
      console.error('[Service] Send notification error:', error);
      return false;
    }
  }
}

/**
 * 分页查询结果
 */
export interface PaginatedServiceResult<T> extends ServiceResult<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
