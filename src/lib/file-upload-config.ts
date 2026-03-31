/**
 * 文件上传统一配置
 * 
 * @module lib/file-upload-config
 * 
 * 统一管理项目中所有文件上传的类型限制
 * 确保全域一致，方便维护和扩展
 */

/**
 * 文件分类类型
 */
export type FileCategory = 
  | 'all'           // 所有支持的文件
  | 'image'         // 图片
  | 'video'         // 视频
  | 'audio'         // 音频
  | 'document'      // 文档（PDF、Office）
  | 'archive'       // 压缩包
  | 'media'         // 媒体文件（图片+视频+音频）
  | 'image-document'// 图片+文档
  | 'teaching'      // 教学资源（图片+视频+音频+文档）
  | 'avatar'        // 头像（仅图片）
  | 'attachment';   // 附件（常用文件）

/**
 * 文件类型配置
 */
export interface FileTypeConfig {
  /** accept 属性值 */
  accept: string;
  /** 显示名称 */
  label: string;
  /** 提示文本 */
  hint: string;
  /** 最大文件大小（字节），0 表示不限制 */
  maxSize: number;
  /** 文件扩展名列表 */
  extensions: string[];
}

/**
 * 文件类型详细配置
 */
export const FILE_TYPE_CONFIGS: Record<FileCategory, FileTypeConfig> = {
  /**
   * 所有支持的文件类型
   * 图片 + 视频 + 音频 + 文档 + 压缩包
   */
  all: {
    accept: [
      // 图片
      'image/*',
      // 视频
      'video/*',
      // 音频
      'audio/*',
      // PDF
      '.pdf',
      // Word
      '.doc,.docx',
      // Excel
      '.xls,.xlsx',
      // PowerPoint
      '.ppt,.pptx',
      // 文本
      '.txt,.md,.rtf',
      // 压缩包
      '.zip,.rar,.7z,.tar,.gz',
    ].join(','),
    label: '所有文件',
    hint: '支持图片、视频、音频、文档、压缩包',
    maxSize: 100 * 1024 * 1024, // 100MB
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
      'mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm',
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'txt', 'md', 'rtf',
      'zip', 'rar', '7z', 'tar', 'gz',
    ],
  },

  /**
   * 图片文件
   * 支持常见图片格式
   */
  image: {
    accept: 'image/*',
    label: '图片文件',
    hint: '支持 JPG、PNG、GIF、WebP、SVG 等格式',
    maxSize: 20 * 1024 * 1024, // 20MB
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif'],
  },

  /**
   * 视频文件
   * 支持常见视频格式
   */
  video: {
    accept: 'video/*',
    label: '视频文件',
    hint: '支持 MP4、MOV、AVI、WMV、WebM 等格式',
    maxSize: 500 * 1024 * 1024, // 500MB
    extensions: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp'],
  },

  /**
   * 音频文件
   * 支持常见音频格式
   */
  audio: {
    accept: 'audio/*',
    label: '音频文件',
    hint: '支持 MP3、WAV、OGG、FLAC、AAC 等格式',
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff'],
  },

  /**
   * 文档文件
   * PDF + Office 文档
   */
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.rtf',
    label: '文档文件',
    hint: '支持 PDF、Word、Excel、PPT、TXT 等格式',
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf'],
  },

  /**
   * 压缩包文件
   */
  archive: {
    accept: '.zip,.rar,.7z,.tar,.gz',
    label: '压缩文件',
    hint: '支持 ZIP、RAR、7Z、TAR、GZ 格式',
    maxSize: 200 * 1024 * 1024, // 200MB
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
  },

  /**
   * 媒体文件
   * 图片 + 视频 + 音频
   */
  media: {
    accept: 'image/*,video/*,audio/*',
    label: '媒体文件',
    hint: '支持图片、视频、音频文件',
    maxSize: 500 * 1024 * 1024, // 500MB
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
      'mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm',
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
    ],
  },

  /**
   * 图片 + 文档
   * 常用于需要上传图片和证明材料的场景
   */
  'image-document': {
    accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
    label: '图片或文档',
    hint: '支持图片、PDF、Word、Excel、PPT',
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    ],
  },

  /**
   * 教学资源
   * 图片 + 视频 + 音频 + 文档
   */
  teaching: {
    accept: [
      'image/*',
      'video/*',
      'audio/*',
      '.pdf',
      '.doc,.docx',
      '.xls,.xlsx',
      '.ppt,.pptx',
      '.txt,.md',
    ].join(','),
    label: '教学资源',
    hint: '支持图片、视频、音频、PDF、Office 文档',
    maxSize: 200 * 1024 * 1024, // 200MB
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'mp4', 'mov', 'avi', 'wmv', 'webm',
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md',
    ],
  },

  /**
   * 头像
   * 仅限图片，且限制大小
   */
  avatar: {
    accept: 'image/*',
    label: '头像图片',
    hint: '支持 JPG、PNG、GIF 格式，建议使用正方形图片',
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  /**
   * 附件
   * 常用文件类型（排除视频等大文件）
   */
  attachment: {
    accept: [
      'image/*',
      'audio/*',
      '.pdf',
      '.doc,.docx',
      '.xls,.xlsx',
      '.ppt,.pptx',
      '.txt,.md',
      '.zip,.rar',
    ].join(','),
    label: '附件',
    hint: '支持图片、音频、PDF、Office 文档、压缩包',
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp',
      'mp3', 'wav', 'ogg', 'aac', 'm4a',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md',
      'zip', 'rar',
    ],
  },
};

/**
 * 获取文件类型配置
 */
export function getFileTypeConfig(category: FileCategory): FileTypeConfig {
  return FILE_TYPE_CONFIGS[category];
}

/**
 * 获取 accept 属性值
 */
export function getFileAccept(category: FileCategory): string {
  return FILE_TYPE_CONFIGS[category].accept;
}

/**
 * 获取文件大小限制（MB）
 */
export function getMaxFileSizeMB(category: FileCategory): number {
  return Math.floor(FILE_TYPE_CONFIGS[category].maxSize / (1024 * 1024));
}

/**
 * 验证文件类型是否允许
 */
export function isFileTypeAllowed(file: File, category: FileCategory): boolean {
  const config = FILE_TYPE_CONFIGS[category];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // 检查 MIME 类型
  if (config.accept.includes('image/*') && file.type.startsWith('image/')) return true;
  if (config.accept.includes('video/*') && file.type.startsWith('video/')) return true;
  if (config.accept.includes('audio/*') && file.type.startsWith('audio/')) return true;
  
  // 检查扩展名
  if (config.extensions.includes(extension)) return true;
  
  return false;
}

/**
 * 验证文件大小是否允许
 */
export function isFileSizeAllowed(file: File, category: FileCategory): boolean {
  const config = FILE_TYPE_CONFIGS[category];
  return file.size <= config.maxSize;
}

/**
 * 格式化文件大小显示
 */
export function formatMaxFileSize(category: FileCategory): string {
  const size = FILE_TYPE_CONFIGS[category].maxSize;
  if (size === 0) return '不限制';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(0)} MB`;
}

/**
 * 获取文件图标类型
 */
export function getFileIconType(fileName: string): 'image' | 'video' | 'audio' | 'pdf' | 'word' | 'excel' | 'ppt' | 'archive' | 'text' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['txt', 'md', 'rtf'].includes(ext)) return 'text';
  
  return 'other';
}
