/**
 * API路由工具函数
 * 
 * 提供统一的API路由处理模式：
 * 1. 统一响应格式
 * 2. 统一错误处理
 * 3. 统一数据库查询 + Mock fallback
 * 4. 统一分页处理
 * 
 * @module lib/api-route-utils
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  ApiResponse, 
  PaginatedData, 
  Pagination,
  success, 
  error, 
  databaseError,
  ErrorCode 
} from './api-response';

// ============================================
// 类型定义
// ============================================

/**
 * 查询参数
 */
export interface RouteQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 数据库查询选项
 */
export interface DbQueryOptions {
  /** 表名 */
  table: string;
  /** 选择字段 */
  select?: string;
  /** 筛选条件 */
  filters?: Record<string, string | number | boolean | null>;
  /** 搜索配置 */
  search?: {
    fields: string[];
    value: string;
  };
  /** 排序 */
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  /** 分页 */
  pagination?: {
    page: number;
    pageSize: number;
  };
  /** 关联查询 */
  relations?: string;
}

/**
 * API路由处理器选项
 */
export interface RouteHandlerOptions<T> {
  /** Mock数据获取函数 */
  getMockData: (params: RouteQueryParams) => T[] | Promise<T[]>;
  /** Mock分页数据获取函数（可选，用于分页接口） */
  getMockPaginatedData?: (params: RouteQueryParams) => PaginatedData<T> | Promise<PaginatedData<T>>;
  /** 是否使用Mock（默认false，数据库失败时自动fallback） */
  useMock?: boolean;
  /** 响应数据转换函数 */
  transformData?: (data: unknown) => T;
}

/**
 * 分页路由处理器选项
 */
export interface PaginatedRouteHandlerOptions<T> extends RouteHandlerOptions<T> {
  /** 默认每页数量 */
  defaultPageSize?: number;
  /** 最大每页数量 */
  maxPageSize?: number;
}

// ============================================
// 工具函数
// ============================================

/**
 * 解析查询参数
 */
export function parseQueryParams(request: NextRequest): RouteQueryParams {
  const { searchParams } = new URL(request.url);
  
  const params: RouteQueryParams = {};
  
  // 解析分页参数
  params.page = parseInt(searchParams.get('page') || '1');
  params.pageSize = parseInt(searchParams.get('pageSize') || '20');
  
  // 解析搜索参数
  params.search = searchParams.get('search') || undefined;
  
  // 解析其他参数
  searchParams.forEach((value, key) => {
    if (!['page', 'pageSize', 'search'].includes(key)) {
      // 尝试解析为数字或布尔值
      if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    }
  });
  
  return params;
}

/**
 * 创建分页信息
 */
export function createPagination(
  total: number,
  page: number,
  pageSize: number
): Pagination {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 构建数据库查询
 */
export function buildDbQuery(
  client: ReturnType<typeof getSupabaseClient>,
  options: DbQueryOptions
) {
  let query = client
    .from(options.table)
    .select(options.select || '*', { count: options.pagination ? 'exact' : undefined });

  // 应用筛选条件
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query = query.eq(key, value);
      }
    });
  }

  // 应用搜索
  if (options.search && options.search.value) {
    const searchConditions = options.search.fields
      .map(field => `${field}.ilike.%${options.search!.value}%`)
      .join(',');
    query = query.or(searchConditions);
  }

  // 应用排序
  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  // 应用分页
  if (options.pagination) {
    const { page, pageSize } = options.pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  return query;
}

// ============================================
// 路由处理器工厂
// ============================================

/**
 * 创建GET列表路由处理器
 * 自动处理：数据库查询 -> Mock fallback -> 统一响应
 */
export function createListRouteHandler<T>(
  options: RouteHandlerOptions<T>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T[]>>> => {
    const params = parseQueryParams(request);
    
    // 如果强制使用Mock
    if (options.useMock) {
      const mockData = await options.getMockData(params);
      return NextResponse.json(success(mockData, 'mock'));
    }
    
    try {
      const client = getSupabaseClient();
      
      // 尝试数据库查询
      const { data, error } = await client
        .from('teachers') // 需要根据实际情况调整
        .select('*');
      
      if (error) {
        console.log('Database query failed, using mock data:', error.message);
        const mockData = await options.getMockData(params);
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      const result = options.transformData ? data.map(options.transformData) : data as T[];
      return NextResponse.json(success(result, 'database'));
    } catch (err) {
      console.error('Route handler error:', err);
      const mockData = await options.getMockData(params);
      return NextResponse.json(success(mockData, 'mock'));
    }
  };
}

/**
 * 创建GET分页列表路由处理器
 */
export function createPaginatedRouteHandler<T>(
  options: PaginatedRouteHandlerOptions<T>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T[]>>> => {
    const params = parseQueryParams(request);
    
    // 限制每页数量
    const maxPageSize = options.maxPageSize || 100;
    params.pageSize = Math.min(params.pageSize || options.defaultPageSize || 20, maxPageSize);
    
    // 如果强制使用Mock或有getMockPaginatedData
    if (options.useMock || options.getMockPaginatedData) {
      const mockData = options.getMockPaginatedData 
        ? await options.getMockPaginatedData(params)
        : {
            data: await options.getMockData(params),
            pagination: createPagination(100, params.page || 1, params.pageSize || 20),
          };
      
      // 如果getMockData返回的是数组，需要计算分页
      if (Array.isArray(mockData)) {
        const data = mockData as unknown as T[];
        const start = ((params.page || 1) - 1) * (params.pageSize || 20);
        const end = start + (params.pageSize || 20);
        return NextResponse.json({
          success: true,
          data: data.slice(start, end),
          pagination: createPagination(data.length, params.page || 1, params.pageSize || 20),
          source: 'mock',
        });
      }
      
      return NextResponse.json({
        success: true,
        data: mockData.data,
        pagination: mockData.pagination,
        source: 'mock',
      });
    }
    
    try {
      const client = getSupabaseClient();
      
      // 构建查询
      const from = ((params.page || 1) - 1) * (params.pageSize || 20);
      const to = from + (params.pageSize || 20) - 1;
      
      const { data, error, count } = await client
        .from('items') // 需要根据实际情况调整
        .select('*', { count: 'exact' })
        .range(from, to);
      
      if (error) {
        console.log('Database query failed, using mock data:', error.message);
        const mockData = await options.getMockData(params);
        const dataArray = Array.isArray(mockData) ? mockData : [];
        const start = ((params.page || 1) - 1) * (params.pageSize || 20);
        const end = start + (params.pageSize || 20);
        return NextResponse.json({
          success: true,
          data: dataArray.slice(start, end),
          pagination: createPagination(dataArray.length, params.page || 1, params.pageSize || 20),
          source: 'mock',
        });
      }
      
      const result = options.transformData ? data?.map(options.transformData) : data;
      return NextResponse.json({
        success: true,
        data: result || [],
        pagination: createPagination(count || 0, params.page || 1, params.pageSize || 20),
        source: 'database',
      });
    } catch (err) {
      console.error('Route handler error:', err);
      const mockData = await options.getMockData(params);
      const dataArray = Array.isArray(mockData) ? mockData : [];
      const start = ((params.page || 1) - 1) * (params.pageSize || 20);
      const end = start + (params.pageSize || 20);
      return NextResponse.json({
        success: true,
        data: dataArray.slice(start, end),
        pagination: createPagination(dataArray.length, params.page || 1, params.pageSize || 20),
        source: 'mock',
      });
    }
  };
}

/**
 * 创建GET详情路由处理器
 */
export function createDetailRouteHandler<T>(
  options: {
    getMockData: (id: string) => T | undefined | Promise<T | undefined>;
    tableName?: string;
    useMock?: boolean;
  }
) {
  return async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const { id } = params;
    
    if (options.useMock) {
      const mockData = await options.getMockData(id);
      if (!mockData) {
        return NextResponse.json(error('数据不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(mockData, 'mock'));
    }
    
    try {
      const client = getSupabaseClient();
      
      const { data, error: dbError } = await client
        .from(options.tableName || 'items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (dbError || !data) {
        console.log('Database query failed, using mock data:', dbError?.message);
        const mockData = await options.getMockData(id);
        if (!mockData) {
          return NextResponse.json(error('数据不存在', ErrorCode.NOT_FOUND), { status: 404 });
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data as T, 'database'));
    } catch (err) {
      console.error('Route handler error:', err);
      const mockData = await options.getMockData(id);
      if (!mockData) {
        return NextResponse.json(error('数据不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(mockData, 'mock'));
    }
  };
}

/**
 * 创建POST创建路由处理器
 */
export function createCreateRouteHandler<T, CreateDTO = Partial<T>>(
  options: {
    tableName?: string;
    useMock?: boolean;
    mockCreate?: (data: CreateDTO) => T | Promise<T>;
    validate?: (data: CreateDTO) => string | null;
  }
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const body = await request.json() as CreateDTO;
      
      // 验证
      if (options.validate) {
        const validationError = options.validate(body);
        if (validationError) {
          return NextResponse.json(
            error(validationError, ErrorCode.VALIDATION_ERROR),
            { status: 400 }
          );
        }
      }
      
      if (options.useMock || options.mockCreate) {
        let mockData: T;
        if (options.mockCreate) {
          mockData = await options.mockCreate(body);
        } else {
          mockData = { id: `mock_${Date.now()}`, ...body } as T;
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      const client = getSupabaseClient();
      
      const { data, error: dbError } = await client
        .from(options.tableName || 'items')
        .insert({
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database insert error:', dbError);
        const mockCreateFn = options.mockCreate as ((data: CreateDTO) => T | Promise<T>) | undefined;
        let mockData: T;
        if (mockCreateFn) {
          mockData = await mockCreateFn(body);
        } else {
          mockData = { id: `mock_${Date.now()}`, ...body } as T;
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data as T, 'database'));
    } catch (err) {
      console.error('Create route error:', err);
      return NextResponse.json(
        error('创建失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
  };
}

/**
 * 创建PUT更新路由处理器
 */
export function createUpdateRouteHandler<T, UpdateDTO = Partial<T>>(
  options: {
    tableName?: string;
    useMock?: boolean;
    mockUpdate?: (id: string, data: UpdateDTO) => T | Promise<T>;
    getMockData?: (id: string) => T | undefined | Promise<T | undefined>;
    validate?: (data: UpdateDTO) => string | null;
  }
) {
  return async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const { id } = params;
    
    try {
      const body = await request.json() as UpdateDTO;
      
      // 验证
      if (options.validate) {
        const validationError = options.validate(body);
        if (validationError) {
          return NextResponse.json(
            error(validationError, ErrorCode.VALIDATION_ERROR),
            { status: 400 }
          );
        }
      }
      
      if (options.useMock || options.mockUpdate) {
        const mockData = await options.mockUpdate?.(id, body) || {
          id,
          ...(await options.getMockData?.(id) || {}),
          ...body,
        } as T;
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      const client = getSupabaseClient();
      
      const { data, error: dbError } = await client
        .from(options.tableName || 'items')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (dbError || !data) {
        console.error('Database update error:', dbError);
        const mockUpdateFn = options.mockUpdate as ((id: string, data: UpdateDTO) => T | Promise<T>) | undefined;
        const getMockDataFn = options.getMockData as ((id: string) => T | Promise<T> | null) | undefined;
        let mockData: T;
        if (mockUpdateFn) {
          mockData = await mockUpdateFn(id, body);
        } else if (getMockDataFn) {
          const existing = await getMockDataFn(id);
          mockData = { id, ...(existing || {}), ...body } as T;
        } else {
          mockData = { id, ...body } as T;
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data as T, 'database'));
    } catch (err) {
      console.error('Update route error:', err);
      return NextResponse.json(
        error('更新失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
  };
}

/**
 * 创建DELETE删除路由处理器
 */
export function createDeleteRouteHandler(
  options: {
    tableName?: string;
    useMock?: boolean;
  }
) {
  return async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse<ApiResponse<{ id: string }>>> => {
    const { id } = params;
    
    if (options.useMock) {
      return NextResponse.json(success({ id }, 'mock'));
    }
    
    try {
      const client = getSupabaseClient();
      
      const { error: dbError } = await client
        .from(options.tableName || 'items')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        return NextResponse.json(success({ id }, 'mock'));
      }
      
      return NextResponse.json(success({ id }, 'database'));
    } catch (err) {
      console.error('Delete route error:', err);
      return NextResponse.json(
        error('删除失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
  };
}

// ============================================
// 导出
// ============================================

export {
  success,
  error,
  databaseError,
  ErrorCode,
};
