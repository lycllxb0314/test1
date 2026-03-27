/**
 * 数据访问抽象接口
 * 
 * 定义统一的数据访问接口，所有Repository都需要实现这些接口
 * 这样可以保证数据访问层的一致性，便于测试和替换实现
 * 
 * @module abstract/interfaces
 */

/**
 * 查询选项
 */
export interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  pagination?: { page: number; pageSize: number };
  search?: { fields: string[]; value: string };
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 基础数据访问接口
 * 
 * 所有Repository必须实现此接口
 */
export interface IRepository<T> {
  /**
   * 根据ID查询单条记录
   */
  findById(id: string, select?: string): Promise<T | null>;

  /**
   * 查询所有记录
   */
  findAll(select?: string): Promise<T[]>;

  /**
   * 分页查询
   */
  findPaginated(options?: QueryOptions): Promise<PaginatedResult<T>>;

  /**
   * 根据条件查询
   */
  findWhere(filters: Record<string, unknown>, select?: string): Promise<T[]>;

  /**
   * 创建记录
   */
  create(data: Partial<T>): Promise<T | null>;

  /**
   * 批量创建
   */
  createMany(data: Partial<T>[]): Promise<T[]>;

  /**
   * 更新记录
   */
  update(id: string, data: Partial<T>): Promise<T | null>;

  /**
   * 删除记录
   */
  delete(id: string): Promise<boolean>;

  /**
   * 统计记录数
   */
  count(filters?: Record<string, unknown>): Promise<number>;

  /**
   * 检查记录是否存在
   */
  exists(filters: Record<string, unknown>): Promise<boolean>;
}

/**
 * 软删除接口
 * 
 * 支持软删除的Repository需要实现此接口
 */
export interface ISoftDeleteRepository<T> extends IRepository<T> {
  /**
   * 软删除
   */
  softDelete(id: string): Promise<boolean>;

  /**
   * 恢复删除
   */
  restore(id: string): Promise<T | null>;

  /**
   * 查询包含已删除的记录
   */
  findWithDeleted(options?: QueryOptions): Promise<PaginatedResult<T>>;
}

/**
 * 树形结构接口
 * 
 * 支持树形结构的Repository需要实现此接口
 */
export interface ITreeRepository<T> extends IRepository<T> {
  /**
   * 获取子节点
   */
  findChildren(parentId: string): Promise<T[]>;

  /**
   * 获取所有后代节点
   */
  findDescendants(id: string): Promise<T[]>;

  /**
   * 获取祖先路径
   */
  findAncestors(id: string): Promise<T[]>;

  /**
   * 移动节点
   */
  move(id: string, newParentId: string | null): Promise<boolean>;
}

/**
 * 时间范围查询接口
 * 
 * 支持时间范围查询的Repository需要实现此接口
 */
export interface ITimeRangeRepository<T> extends IRepository<T> {
  /**
   * 按时间范围查询
   */
  findByTimeRange(
    startField: string,
    startDate: string,
    endDate: string
  ): Promise<T[]>;

  /**
   * 按创建时间查询
   */
  findByCreatedAt(startDate: string, endDate: string): Promise<T[]>;

  /**
   * 按更新时间查询
   */
  findByUpdatedAt(startDate: string, endDate: string): Promise<T[]>;
}
