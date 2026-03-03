/**
 * 统一分页配置
 * 
 * 所有实体hooks（学生、教师、班级、家长）都应使用此配置
 * 确保分页行为一致，避免数据获取不完整
 * 
 * 架构模式：
 * - 数据获取：后端全量获取（支持5000+大数据量）
 * - 前端展示：前端分页（用户可选每页10/30/50条）
 */

/**
 * 分页常量
 */
export const PAGINATION = {
  /**
   * 默认每页数量（API默认值）
   */
  DEFAULT_PAGE_SIZE: 20,
  
  /**
   * 大数据量获取时每批次数量
   * 用于一次性获取所有数据的场景
   */
  BATCH_SIZE: 500,
  
  /**
   * 最大获取数量
   * 防止无限获取，作为安全上限
   */
  MAX_TOTAL: 10000,
  
  /**
   * 前端分页选项（用户可选）
   */
  PAGE_SIZE_OPTIONS: [10, 30, 50] as const,
  
  /**
   * 前端默认每页显示数量
   */
  DEFAULT_DISPLAY_PAGE_SIZE: 10,
  
  /**
   * 实体类型对应的大数据量获取配置
   */
  ENTITY_CONFIG: {
    teachers: {
      fetchPageSize: 500,      // 后端获取时每批数量
      maxTotal: 500,
    },
    students: {
      fetchPageSize: 500,      // 后端获取时每批数量
      maxTotal: 5000,
    },
    classes: {
      fetchPageSize: 200,      // 后端获取时每批数量
      maxTotal: 200,
    },
    parents: {
      fetchPageSize: 500,      // 后端获取时每批数量
      maxTotal: 10000,
    },
  },
} as const;

/**
 * 前端分页状态
 */
export interface FrontendPagination {
  /** 当前页码（从1开始） */
  page: number;
  /** 每页显示数量 */
  pageSize: number;
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 前端分页操作
 */
export interface FrontendPaginationActions {
  /** 跳转到指定页 */
  goToPage: (page: number) => void;
  /** 上一页 */
  prevPage: () => void;
  /** 下一页 */
  nextPage: () => void;
  /** 设置每页显示数量 */
  setPageSize: (size: number) => void;
  /** 获取当前页数据 */
  getCurrentPageData: <T>(data: T[]) => T[];
  /** 可选的每页数量选项 */
  pageSizeOptions: readonly number[];
}

/**
 * 创建前端分页 Hook 的工具函数
 */
export function createFrontendPagination(
  total: number,
  initialPageSize: number = PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE
) {
  let page = 1;
  let pageSize = initialPageSize;
  
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    getPage: () => page,
    getPageSize: () => pageSize,
    getTotalPages: () => totalPages,
    setPage: (newPage: number) => {
      page = Math.max(1, Math.min(newPage, totalPages));
    },
    setPageSize: (newSize: number) => {
      pageSize = newSize;
      page = 1; // 重置到第一页
    },
    getSlice: <T>(data: T[]): T[] => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return data.slice(start, end);
    },
  };
}
