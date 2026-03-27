#!/usr/bin/env node
/**
 * API 文档生成脚本
 * 
 * 用法：pnpm run docs:api
 */

import { generateApiDocs } from '../src/lib/api-docs';
import fs from 'fs';
import path from 'path';

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '..');

// 配置
const config = {
  title: '教务管理系统 API 文档',
  version: '1.0.0',
  description: '教务管理系统 RESTful API 接口文档',
  baseUrl: process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000',
  tags: [
    { name: 'auth', description: '认证相关' },
    { name: 'teachers', description: '教师管理' },
    { name: 'students', description: '学生管理' },
    { name: 'classes', description: '班级管理' },
    { name: 'courses', description: '课程管理' },
    { name: 'attendance', description: '考勤管理' },
    { name: 'grades', description: '成绩管理' },
    { name: 'approvals', description: '审批流程' },
    { name: 'leave-requests', description: '请假管理' },
    { name: 'academic', description: '教务安排' },
    { name: 'parents', description: '家长端' },
    { name: 'portal', description: '门户公开' },
    { name: 'finance', description: '财务管理' },
    { name: 'assets', description: '资产管理' },
    { name: 'moral', description: '德育活动' },
    { name: 'habit', description: '习惯培养' },
  ],
};

console.log('🔍 扫描 API 路由...');
const { openapi, markdown } = generateApiDocs(projectRoot, config);

// 确保文档目录存在
const docsDir = path.join(projectRoot, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 写入 OpenAPI JSON
const openapiPath = path.join(docsDir, 'api-openapi.json');
fs.writeFileSync(openapiPath, JSON.stringify(openapi, null, 2));
console.log(`✅ OpenAPI 文档已生成: ${openapiPath}`);

// 写入 Markdown 文档
const markdownPath = path.join(docsDir, 'API.md');
fs.writeFileSync(markdownPath, markdown);
console.log(`✅ Markdown 文档已生成: ${markdownPath}`);

console.log('\n📊 统计信息:');
const endpoints = (openapi as { paths: Record<string, unknown> }).paths;
const pathCount = Object.keys(endpoints || {}).length;
console.log(`   - API 端点: ${pathCount} 个`);
console.log(`   - 文档版本: ${config.version}`);

console.log('\n💡 提示:');
console.log('   - 可使用 Swagger UI 渲染 api-openapi.json');
console.log('   - Markdown 文档可直接在 GitHub 查看');
