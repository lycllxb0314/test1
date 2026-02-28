/**
 * 字段级加密服务
 * 
 * 采用AES-256-GCM对称加密算法
 * 支持密钥版本管理、自动轮换
 * 
 * @module lib/encryption
 */

import crypto, { CipherGCM, DecipherGCM } from 'crypto';

// ============================================
// 类型定义
// ============================================

/**
 * 加密数据格式
 */
export interface EncryptedData {
  /** 加密算法 */
  algorithm: string;
  /** 密钥版本 */
  keyVersion: string;
  /** 密文（Base64） */
  ciphertext: string;
  /** 初始化向量（Base64） */
  iv: string;
  /** 认证标签（Base64） */
  tag: string;
}

/**
 * 密钥配置
 */
export interface KeyConfig {
  /** 密钥版本 */
  version: string;
  /** 密钥（Base64编码） */
  key: string;
  /** 是否为当前激活版本 */
  active: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 过期时间（可选） */
  expiresAt?: string;
}

/**
 * 加密字段配置
 */
export interface EncryptionFieldConfig {
  /** 字段名 */
  field: string;
  /** 是否加密 */
  encrypted: boolean;
  /** 是否需要脱敏展示 */
  masked: boolean;
  /** 脱敏类型 */
  maskType?: 'phone' | 'idCard' | 'bankAccount' | 'name' | 'address';
}

// ============================================
// 加密配置
// ============================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * 需要加密的敏感字段配置
 */
export const SENSITIVE_FIELDS: EncryptionFieldConfig[] = [
  { field: 'phone', encrypted: true, masked: true, maskType: 'phone' },
  { field: 'emergency_phone', encrypted: true, masked: true, maskType: 'phone' },
  { field: 'id_card', encrypted: true, masked: true, maskType: 'idCard' },
  { field: 'bank_account', encrypted: true, masked: true, maskType: 'bankAccount' },
  { field: 'home_address', encrypted: true, masked: true, maskType: 'address' },
  { field: 'idCardFront', encrypted: false, masked: false }, // 文件URL，不需要加密
  { field: 'idCardBack', encrypted: false, masked: false },
];

// ============================================
// 密钥管理
// ============================================

/**
 * 密钥管理器
 * 负责密钥的获取、轮换、版本管理
 */
class KeyManager {
  private keys = new Map<string, Buffer>();
  private activeVersion: string = 'v1';
  
  constructor() {
    // 初始化默认密钥（生产环境应从KMS或环境变量加载）
    this.initDefaultKeys();
  }
  
  /**
   * 初始化默认密钥
   */
  private initDefaultKeys(): void {
    // 从环境变量获取或生成默认密钥
    const envKey = process.env.ENCRYPTION_KEY;
    const keyV1 = envKey 
      ? Buffer.from(envKey, 'base64')
      : crypto.randomBytes(KEY_LENGTH);
    
    this.keys.set('v1', keyV1);
    this.activeVersion = 'v1';
    
    // 如果有v2密钥（密钥轮换场景）
    const envKeyV2 = process.env.ENCRYPTION_KEY_V2;
    if (envKeyV2) {
      this.keys.set('v2', Buffer.from(envKeyV2, 'base64'));
    }
  }
  
  /**
   * 获取指定版本的密钥
   */
  getKey(version?: string): Buffer {
    const v = version || this.activeVersion;
    const key = this.keys.get(v);
    
    if (!key) {
      throw new Error(`Encryption key version ${v} not found`);
    }
    
    return key;
  }
  
  /**
   * 获取当前激活的密钥版本
   */
  getActiveVersion(): string {
    return this.activeVersion;
  }
  
  /**
   * 添加新密钥
   */
  addKey(version: string, key: string, setActive: boolean = false): void {
    const keyBuffer = Buffer.from(key, 'base64');
    
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length: expected ${KEY_LENGTH}, got ${keyBuffer.length}`);
    }
    
    this.keys.set(version, keyBuffer);
    
    if (setActive) {
      this.activeVersion = version;
    }
  }
  
  /**
   * 激活新密钥版本
   */
  activateVersion(version: string): void {
    if (!this.keys.has(version)) {
      throw new Error(`Key version ${version} not found`);
    }
    this.activeVersion = version;
  }
  
  /**
   * 检查密钥版本是否存在
   */
  hasVersion(version: string): boolean {
    return this.keys.has(version);
  }
}

// 全局密钥管理器实例
const keyManager = new KeyManager();

// ============================================
// 加密服务
// ============================================

/**
 * 字段加密服务
 */
export class FieldEncryption {
  private algorithm = ALGORITHM;
  
  /**
   * 加密字符串
   */
  encrypt(plaintext: string): string {
    if (!plaintext || plaintext.startsWith('enc:')) {
      return plaintext; // 空值或已加密，直接返回
    }
    
    const keyVersion = keyManager.getActiveVersion();
    const key = keyManager.getKey(keyVersion);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 使用 createCipheriv（GCM 模式默认使用 16 字节认证标签）
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as CipherGCM;
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    // 获取认证标签
    const tag = cipher.getAuthTag();
    
    // 格式：enc:算法:版本:密文:IV:Tag
    return [
      'enc',
      this.algorithm,
      keyVersion,
      ciphertext,
      iv.toString('base64'),
      tag.toString('base64'),
    ].join(':');
  }
  
  /**
   * 解密字符串
   */
  decrypt(encryptedValue: string): string {
    if (!encryptedValue || !encryptedValue.startsWith('enc:')) {
      return encryptedValue; // 空值或未加密，直接返回
    }
    
    const parts = encryptedValue.split(':');
    
    if (parts.length !== 6) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [, algorithm, keyVersion, ciphertext, ivBase64, tagBase64] = parts;
    
    if (algorithm !== this.algorithm) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    // 检查密钥版本是否存在
    if (!keyManager.hasVersion(keyVersion)) {
      throw new Error(`Key version ${keyVersion} not found`);
    }
    
    const key = keyManager.getKey(keyVersion);
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    
    try {
      const decipher = crypto.createDecipheriv(algorithm, key, iv) as DecipherGCM;
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: authentication tag mismatch or corrupted data');
    }
  }
  
  /**
   * 检查是否已加密
   */
  isEncrypted(value: string): boolean {
    return value?.startsWith('enc:') ?? false;
  }
  
  /**
   * 批量加密对象字段
   */
  encryptObject<T extends Record<string, unknown>>(
    obj: T,
    fields: string[]
  ): T {
    const result = { ...obj };
    
    for (const field of fields) {
      const value = result[field];
      if (typeof value === 'string' && value && !this.isEncrypted(value)) {
        (result as Record<string, unknown>)[field] = this.encrypt(value);
      }
    }
    
    return result;
  }
  
  /**
   * 批量解密对象字段
   */
  decryptObject<T extends Record<string, unknown>>(
    obj: T,
    fields: string[]
  ): T {
    const result = { ...obj };
    
    for (const field of fields) {
      const value = result[field];
      if (typeof value === 'string' && this.isEncrypted(value)) {
        try {
          (result as Record<string, unknown>)[field] = this.decrypt(value);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // 解密失败时保留原值
        }
      }
    }
    
    return result;
  }
  
  /**
   * 重新加密（使用新密钥版本）
   */
  reEncrypt(encryptedValue: string, newVersion?: string): string {
    const plaintext = this.decrypt(encryptedValue);
    
    if (newVersion) {
      // 使用指定版本加密
      const key = keyManager.getKey(newVersion);
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as CipherGCM;
      
      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');
      const tag = cipher.getAuthTag();
      
      return [
        'enc',
        this.algorithm,
        newVersion,
        ciphertext,
        iv.toString('base64'),
        tag.toString('base64'),
      ].join(':');
    }
    
    // 使用当前激活版本
    return this.encrypt(plaintext);
  }
}

// ============================================
// 全局实例
// ============================================

export const fieldEncryption = new FieldEncryption();

// ============================================
// 便捷方法
// ============================================

/**
 * 加密字符串
 */
export function encrypt(plaintext: string): string {
  return fieldEncryption.encrypt(plaintext);
}

/**
 * 解密字符串
 */
export function decrypt(encryptedValue: string): string {
  return fieldEncryption.decrypt(encryptedValue);
}

/**
 * 加密对象字段
 */
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): T {
  return fieldEncryption.encryptObject(obj, fields);
}

/**
 * 解密对象字段
 */
export function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): T {
  return fieldEncryption.decryptObject(obj, fields);
}

/**
 * 获取需要加密的字段列表
 */
export function getEncryptedFields(): string[] {
  return SENSITIVE_FIELDS.filter(f => f.encrypted).map(f => f.field);
}

/**
 * 获取需要脱敏的字段配置
 */
export function getMaskedFields(): EncryptionFieldConfig[] {
  return SENSITIVE_FIELDS.filter(f => f.masked);
}

// ============================================
// 导出
// ============================================

export { keyManager };
