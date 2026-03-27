/**
 * API 文档生成器
 * 
 * 自动从 API 路由生成 OpenAPI 兼容的文档
 * 
 * @module lib/api-docs
 */

import fs from 'fs';
import path from 'path';

// ============================================
// 类型定义
// ============================================

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses?: ApiResponses;
  security?: string[];
  deprecated?: boolean;
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: ApiSchema;
}

export interface ApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, {
    schema: ApiSchema;
    examples?: Record<string, unknown>;
  }>;
}

export interface ApiResponses {
  [statusCode: string]: {
    description: string;
    content?: Record<string, {
      schema: ApiSchema;
      examples?: Record<string, unknown>;
    }>;
  };
}

export interface ApiSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  format?: string;
  description?: string;
  properties?: Record<string, ApiSchema>;
  items?: ApiSchema;
  required?: string[];
  enum?: (string | number)[];
  default?: unknown;
  example?: unknown;
  $ref?: string;
}

export interface ApiDocsConfig {
  title: string;
  version: string;
  description?: string;
  baseUrl?: string;
  tags?: { name: string; description?: string }[];
}

// ============================================
// OpenAPI 文档生成器
// ============================================

export class ApiDocsGenerator {
  private config: ApiDocsConfig;
  private endpoints: ApiEndpoint[] = [];

  constructor(config: ApiDocsConfig) {
    this.config = config;
  }

  /**
   * 添加 API 端点
   */
  addEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * 批量添加端点
   */
  addEndpoints(endpoints: ApiEndpoint[]): void {
    this.endpoints.push(...endpoints);
  }

  /**
   * 生成 OpenAPI 文档
   */
  generateOpenApi(): object {
    const paths: Record<string, Record<string, object>> = {};

    for (const endpoint of this.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const method = endpoint.method.toLowerCase();
      (paths[endpoint.path] as Record<string, object>)[method] = this.buildPathItem(endpoint);
    }

    return {
      openapi: '3.0.3',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
      },
      servers: this.config.baseUrl
        ? [{ url: this.config.baseUrl }]
        : [],
      tags: this.config.tags,
      paths,
      components: {
        schemas: this.buildSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
  }

  /**
   * 构建路径项
   */
  private buildPathItem(endpoint: ApiEndpoint): object {
    const item: Record<string, unknown> = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags || [],
      deprecated: endpoint.deprecated,
    };

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      item.parameters = endpoint.parameters.map((p) => ({
        name: p.name,
        in: p.in,
        description: p.description,
        required: p.required,
        schema: p.schema || { type: 'string' },
      }));
    }

    if (endpoint.requestBody) {
      item.requestBody = {
        description: endpoint.requestBody.description,
        required: endpoint.requestBody.required,
        content: Object.entries(endpoint.requestBody.content).reduce(
          (acc, [contentType, config]) => ({
            ...acc,
            [contentType]: {
              schema: config.schema,
              examples: config.examples,
            },
          }),
          {}
        ),
      };
    }

    if (endpoint.responses) {
      item.responses = Object.entries(endpoint.responses).reduce(
        (acc, [status, response]) => ({
          ...acc,
          [status]: {
            description: response.description,
            content: response.content
              ? Object.entries(response.content).reduce(
                  (cAcc, [contentType, config]) => ({
                    ...cAcc,
                    [contentType]: {
                      schema: config.schema,
                      examples: config.examples,
                    },
                  }),
                  {}
                )
              : undefined,
          },
        }),
        {}
      );
    } else {
      // 默认响应
      item.responses = {
        '200': {
          description: '成功响应',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          },
        },
        '400': {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        '500': {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      };
    }

    if (endpoint.security) {
      item.security = endpoint.security.map((s) => ({ [s]: [] }));
    }

    return item;
  }

  /**
   * 构建通用 Schema
   */
  private buildSchemas(): Record<string, ApiSchema> {
    return {
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: '请求是否成功',
          },
          data: {
            type: 'object',
            description: '响应数据',
          },
          error: {
            type: 'string',
            description: '错误信息',
          },
          message: {
            type: 'string',
            description: '提示信息',
          },
          pagination: {
            $ref: '#/components/schemas/Pagination',
          },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            description: '错误信息',
          },
          errorCode: {
            type: 'string',
            description: '错误代码',
          },
        },
        required: ['success', 'error'],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: '当前页码',
          },
          pageSize: {
            type: 'integer',
            description: '每页数量',
          },
          total: {
            type: 'integer',
            description: '总记录数',
          },
          totalPages: {
            type: 'integer',
            description: '总页数',
          },
        },
        required: ['page', 'pageSize', 'total', 'totalPages'],
      },
    };
  }

  /**
   * 生成 Markdown 文档
   */
  generateMarkdown(): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${this.config.title}`);
    lines.push('');
    lines.push(`版本: ${this.config.version}`);
    lines.push('');

    if (this.config.description) {
      lines.push(this.config.description);
      lines.push('');
    }

    // 按标签分组
    const groupedEndpoints = this.groupByTag();

    for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
      lines.push(`## ${tag}`);
      lines.push('');

      for (const endpoint of endpoints) {
        lines.push(this.endpointToMarkdown(endpoint));
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 按 Tag 分组
   */
  private groupByTag(): Record<string, ApiEndpoint[]> {
    const groups: Record<string, ApiEndpoint[]> = {};

    for (const endpoint of this.endpoints) {
      const tag = endpoint.tags?.[0] || '默认';
      if (!groups[tag]) {
        groups[tag] = [];
      }
      groups[tag].push(endpoint);
    }

    return groups;
  }

  /**
   * 端点转 Markdown
   */
  private endpointToMarkdown(endpoint: ApiEndpoint): string {
    const lines: string[] = [];

    // 标题
    const methodBadge = this.getMethodBadge(endpoint.method);
    lines.push(`### ${methodBadge} \`${endpoint.path}\``);
    lines.push('');

    // 描述
    lines.push(`**${endpoint.summary}**`);
    if (endpoint.description) {
      lines.push('');
      lines.push(endpoint.description);
    }
    lines.push('');

    // 参数
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      lines.push('#### 参数');
      lines.push('');
      lines.push('| 名称 | 位置 | 类型 | 必填 | 描述 |');
      lines.push('|------|------|------|------|------|');
      
      for (const param of endpoint.parameters) {
        const type = param.schema?.type || 'string';
        const required = param.required ? '✓' : '';
        lines.push(
          `| ${param.name} | ${param.in} | ${type} | ${required} | ${param.description || ''} |`
        );
      }
      lines.push('');
    }

    // 请求体
    if (endpoint.requestBody) {
      lines.push('#### 请求体');
      lines.push('');
      
      const jsonContent = endpoint.requestBody.content['application/json'];
      if (jsonContent) {
        lines.push('```json');
        lines.push(JSON.stringify(jsonContent.schema.example || {}, null, 2));
        lines.push('```');
        lines.push('');
      }
    }

    // 响应
    if (endpoint.responses) {
      lines.push('#### 响应');
      lines.push('');

      for (const [status, response] of Object.entries(endpoint.responses)) {
        lines.push(`**${status}** - ${response.description}`);
        
        if (response.content?.['application/json']) {
          lines.push('');
          lines.push('```json');
          lines.push(
            JSON.stringify(
              response.content['application/json'].examples?.['example'] ||
                response.content['application/json'].schema.example ||
                {},
              null,
              2
            )
          );
          lines.push('```');
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 获取方法徽章
   */
  private getMethodBadge(method: string): string {
    const badges: Record<string, string> = {
      GET: '🟢 GET',
      POST: '🔵 POST',
      PUT: '🟡 PUT',
      PATCH: '🟠 PATCH',
      DELETE: '🔴 DELETE',
    };
    return badges[method] || method;
  }
}

// ============================================
// API 扫描器
// ============================================

/**
 * 扫描 API 路由目录
 */
export function scanApiRoutes(basePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const apiDir = path.join(basePath, 'src/app/api');

  if (!fs.existsSync(apiDir)) {
    console.warn(`API 目录不存在: ${apiDir}`);
    return endpoints;
  }

  function scanDir(dir: string, basePath: string = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const newBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
        scanDir(fullPath, newBasePath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        // 解析路径
        const apiPath = `/api/${basePath}`;
        const normalizedPath = apiPath.replace(/\[([^\]]+)\]/g, '{$1}');

        // 解析路由文件
        const endpoint = parseRouteFile(fullPath, normalizedPath);
        if (endpoint) {
          endpoints.push(endpoint);
        }
      }
    }
  }

  scanDir(apiDir);

  return endpoints;
}

/**
 * 解析路由文件
 */
function parseRouteFile(filePath: string, apiPath: string): ApiEndpoint | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 提取 HTTP 方法
    const methods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[] = [];
    const methodPatterns = [
      { pattern: /export\s+async\s+function\s+GET/, method: 'GET' as const },
      { pattern: /export\s+async\s+function\s+POST/, method: 'POST' as const },
      { pattern: /export\s+async\s+function\s+PUT/, method: 'PUT' as const },
      { pattern: /export\s+async\s+function\s+PATCH/, method: 'PATCH' as const },
      { pattern: /export\s+async\s+function\s+DELETE/, method: 'DELETE' as const },
    ];

    for (const { pattern, method } of methodPatterns) {
      if (pattern.test(content)) {
        methods.push(method);
      }
    }

    if (methods.length === 0) {
      return null;
    }

    // 提取注释作为描述
    const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    const description = commentMatch
      ? commentMatch[1]
          .split('\n')
          .map((line) => line.replace(/^\s*\*\s*/, '').trim())
          .filter((line) => line && !line.startsWith('@'))
          .join(' ')
      : '';

    // 提取标签（从路径）
    const pathParts = apiPath.split('/').filter(Boolean);
    const tag = pathParts[1] || '默认';

    // 构建端点
    return {
      path: apiPath,
      method: methods[0], // 主方法
      summary: description || `${apiPath} 接口`,
      description,
      tags: [tag],
      parameters: extractParameters(content, apiPath),
    };
  } catch (error) {
    console.error(`解析路由文件失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 提取参数
 */
function extractParameters(content: string, apiPath: string): ApiParameter[] {
  const parameters: ApiParameter[] = [];

  // 提取路径参数
  const pathParams = apiPath.match(/\{([^}]+)\}/g);
  if (pathParams) {
    for (const param of pathParams) {
      const name = param.slice(1, -1);
      parameters.push({
        name,
        in: 'path',
        required: true,
        description: `${name} 标识符`,
        schema: { type: 'string' },
      });
    }
  }

  // 提取查询参数
  const searchParamsPattern = /searchParams\.get\(['"](\w+)['"]\)/g;
  let match;
  while ((match = searchParamsPattern.exec(content)) !== null) {
    const name = match[1];
    if (!parameters.some((p) => p.name === name)) {
      parameters.push({
        name,
        in: 'query',
        required: false,
        description: `${name} 参数`,
        schema: { type: 'string' },
      });
    }
  }

  return parameters;
}

// ============================================
// 文档生成函数
// ============================================

/**
 * 生成 API 文档
 */
export function generateApiDocs(
  basePath: string,
  config: ApiDocsConfig
): { openapi: object; markdown: string } {
  const generator = new ApiDocsGenerator(config);
  
  // 扫描路由
  const endpoints = scanApiRoutes(basePath);
  generator.addEndpoints(endpoints);

  return {
    openapi: generator.generateOpenApi(),
    markdown: generator.generateMarkdown(),
  };
}

export default ApiDocsGenerator;
