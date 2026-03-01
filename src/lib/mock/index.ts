/**
 * Mock数据统一管理
 * 
 * 设计原则：
 * 1. 集中管理 - 所有Mock数据存放在此目录
 * 2. 类型安全 - 使用统一的类型定义
 * 3. 可切换 - 通过环境变量控制是否使用Mock数据
 * 4. 与API分离 - Mock数据独立于API路由
 * 5. 数据源统一 - 所有主数据从 master-data.ts 导出
 */

// 环境变量控制是否启用Mock
export const MOCK_ENABLED = process.env.NODE_ENV === 'development' || 
  process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

/**
 * 获取Mock数据或从API获取
 * @param mockData Mock数据
 * @param apiFetcher API获取函数
 * @returns 数据结果
 */
export async function withMockFallback<T>(
  mockData: T,
  apiFetcher: () => Promise<T>
): Promise<{ data: T; source: 'database' | 'mock' }> {
  if (MOCK_ENABLED) {
    return { data: mockData, source: 'mock' };
  }
  
  try {
    const data = await apiFetcher();
    return { data, source: 'database' };
  } catch (error) {
    console.warn('API获取失败，使用Mock数据:', error);
    return { data: mockData, source: 'mock' };
  }
}

// 导出主数据（统一数据源）
export * from './master-data';

// 导出各领域Mock数据
export * from './teachers.mock';
export * from './students.mock';
export * from './classes.mock';
export * from './schedules.mock';
export * from './academic.mock';
export * from './access.mock';
export * from './moral.mock';
export * from './general.mock';
export * from './class-teachers.mock';
