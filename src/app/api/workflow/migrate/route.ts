import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 创建工作流配置表
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 使用 SQL 创建表（Supabase 支持 RPC 调用）
    const createTableSQL = `
      -- 工作流配置表
      CREATE TABLE IF NOT EXISTS workflow_configs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        steps JSONB NOT NULL,
        conditions JSONB,
        version INTEGER DEFAULT 1,
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 工作流实例表
      CREATE TABLE IF NOT EXISTS workflow_instances (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        config_id INTEGER NOT NULL,
        applicant_id VARCHAR(100) NOT NULL,
        applicant_name VARCHAR(100) NOT NULL,
        applicant_role VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        current_step INTEGER DEFAULT 0,
        steps JSONB NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 审批记录表
      CREATE TABLE IF NOT EXISTS approval_records (
        id SERIAL PRIMARY KEY,
        instance_id INTEGER NOT NULL,
        workflow_type VARCHAR(50) NOT NULL,
        step_id VARCHAR(50) NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        approver_id VARCHAR(100) NOT NULL,
        approver_name VARCHAR(100) NOT NULL,
        approver_role VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_workflow_configs_type ON workflow_configs(type);
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_applicant ON workflow_instances(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_approval_records_instance ON approval_records(instance_id);
    `;
    
    // 注意：Supabase 需要通过管理界面或迁移工具创建表
    // 这里我们返回 SQL 供用户手动执行，或者假设表已存在
    
    return NextResponse.json({
      success: true,
      message: '请在 Supabase 管理界面执行以下 SQL 创建表：',
      sql: createTableSQL,
      hint: '或者使用 Supabase CLI: supabase db push',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: '迁移失败',
    }, { status: 500 });
  }
}
