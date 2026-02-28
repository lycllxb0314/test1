/**
 * 认证中间件系统
 * 提供统一的认证和权限控制功能
 */

// 从 auth-middleware 导出认证相关功能
export {
  // 类型
  type AuthResult,
  
  // 函数
  extractUserId,
  validateSession,
  authenticateRequest,
  createAuthErrorResponse,
  checkModuleAccess,
  checkPermission,
  withAuth,
  withRole,
  withModuleAccess,
  withPermission,
} from './auth-middleware';

// 从 permissions 导出权限相关功能
export {
  // 配置
  ROLE_PERMISSIONS,
  MODULE_NAMES,
  PERMISSION_NAMES,
  ROUTE_MODULE_MAP,
  
  // 函数
  getRoleModules,
  canAccessModule,
  getModulePermissions,
  hasPermission,
  getRoleConfig,
  getAllRoleConfigs,
  getModuleForPath,
  isAdminRole,
  isTeacherRole,
  isDirectorRole,
} from './permissions';

// 从 route-protection 导出路由保护功能
export {
  // 类型
  type AuthContext,
  type ExtendedRouteContext,
  type NativeRouteContext,
  type ProtectedRouteHandler,
  type ProtectionOptions,
  
  // 函数
  protectedRoute,
  adminOnlyRoute,
  teacherOnlyRoute,
  headTeacherOnlyRoute,
  academicRoute,
  moralRoute,
  generalRoute,
  composeProtection,
  selfOnly,
  classAccess,
} from './route-protection';
