/**
 * 认证中间件系统
 * 提供统一的认证和权限控制功能
 */

// 从增强版中间件导出
export {
  // 类型
  type AuthResult,
  type ApiHandler,
  type AuthOptions,
  
  // 核心函数
  authenticateRequest,
  clearUserCache,
  getCachedUser,
  setCachedUser,
  
  // 装饰器
  withAuth,
  withRole,
  withAdmin,
  withTeacher,
  withHeadTeacher,
  withOptionalAuth,
  withAuthAndParams,
} from './middleware';

// 从 auth-middleware 导出兼容功能
export {
  extractUserId,
  extractUserIdLegacy,
  validateSession,
  validateSessionLegacy,
  checkModuleAccess,
  checkPermission,
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

// 从 jwt 导出 JWT 相关功能
export {
  // 类型
  type JwtPayload,
  type TokenPair,
  
  // 函数
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  isTokenExpiringSoon,
  getCookieOptions,
  
  // 常量
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ID_COOKIE,
} from './jwt';

// 从 session 导出会话管理功能
export {
  // 类型
  type LoginResult,
  type SessionResult,
  
  // 函数
  login,
  refreshToken,
  validateSession as validateJwtSession,
  extractTokens,
  setAuthCookies,
  clearAuthCookies,
} from './session';
