/**
 * JWT 会话管理工具
 * 
 * 使用 jose 库实现 JWT token 的生成、验证和刷新
 * 支持 Access Token 和 Refresh Token 双 token 机制
 */

import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { User } from '@/types';

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'smart-campus-jwt-secret-key-2024';
const JWT_ISSUER = 'smart-campus';
const JWT_AUDIENCE = 'smart-campus-users';

// Token 有效期配置
const ACCESS_TOKEN_EXPIRES = '1h';   // Access Token 1小时
const REFRESH_TOKEN_EXPIRES = '3d';  // Refresh Token 3天

// Cookie 配置
export const ACCESS_TOKEN_COOKIE = 'smart_campus_access_token';
export const REFRESH_TOKEN_COOKIE = 'smart_campus_refresh_token';
export const USER_ID_COOKIE = 'smart_campus_user_id';

// 将密钥转换为 Uint8Array
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * JWT Payload 结构
 */
export interface JwtPayload {
  userId: string;
  name: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Token 对
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access Token 过期时间（秒）
  refreshExpiresIn: number; // Refresh Token 过期时间（秒）
}

/**
 * 生成 Access Token
 */
export async function generateAccessToken(user: Pick<User, 'id' | 'name' | 'role'>): Promise<string> {
  const secretKey = getSecretKey();
  
  const token = await new SignJWT({
    userId: user.id,
    name: user.name,
    role: user.role,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(secretKey);

  return token;
}

/**
 * 生成 Refresh Token
 */
export async function generateRefreshToken(user: Pick<User, 'id' | 'name' | 'role'>): Promise<string> {
  const secretKey = getSecretKey();
  
  const token = await new SignJWT({
    userId: user.id,
    name: user.name,
    role: user.role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(secretKey);

  return token;
}

/**
 * 生成 Token 对
 */
export async function generateTokenPair(user: Pick<User, 'id' | 'name' | 'role'>): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user),
  ]);

  // 解码 Access Token 获取过期时间
  const decoded = decodeJwt(accessToken);
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600; // 1小时
  
  // Refresh Token 过期时间（3天 = 259200秒）
  const refreshExpiresIn = 259200;

  return {
    accessToken,
    refreshToken,
    expiresIn,
    refreshExpiresIn,
  };
}

/**
 * 验证 Token
 */
export async function verifyToken(token: string, expectedType?: 'access' | 'refresh'): Promise<JwtPayload | null> {
  try {
    const secretKey = getSecretKey();
    
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    // 检查 token 类型
    if (expectedType && payload.type !== expectedType) {
      return null;
    }

    // 类型断言：确保 payload 包含必要字段
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      role: payload.role as string,
      type: payload.type as 'access' | 'refresh',
      iat: payload.iat as number,
      exp: payload.exp as number,
      iss: payload.iss as string,
      aud: payload.aud as string,
    };
  } catch (error) {
    // Token 无效或已过期
    return null;
  }
}

/**
 * 解码 Token（不验证签名）
 * 用于获取 token 中的信息而不验证其有效性
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return decodeJwt(token) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 检查 Token 是否即将过期（小于10分钟）
 */
export function isTokenExpiringSoon(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  // 如果剩余时间小于10分钟（600秒），认为即将过期
  return timeUntilExpiry < 600;
}

/**
 * Cookie 配置选项
 */
export function getCookieOptions(isProduction: boolean = false) {
  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };

  return {
    accessToken: {
      ...baseOptions,
      maxAge: 3600, // 1小时
    },
    refreshToken: {
      ...baseOptions,
      maxAge: 259200, // 3天
    },
    userId: {
      ...baseOptions,
      httpOnly: false, // 允许前端读取
      maxAge: 259200, // 3天
    },
  };
}
