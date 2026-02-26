import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 创建/更新工作流表结构
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 使用 SQL 创建表（Supabase 支持 RPC 调用）
    const createTableSQL = `
      -- 工作流配置表（增强版）
      CREATE TABLE IF NOT EXISTS workflow_configs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        -- 新增字段：支持节点式流程
        nodes JSONB,                    -- 流程节点配置
        steps JSONB,                    -- 兼容旧版步骤配置
        start_node_id VARCHAR(50),      -- 开始节点ID
        end_node_id VARCHAR(50),        -- 结束节点ID
        form_fields JSONB,              -- 表单字段配置
        conditions JSONB,               -- 兼容旧版条件配置
        version INTEGER DEFAULT 1,
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 添加新列（如果表已存在）
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_configs' AND column_name = 'nodes') THEN
          ALTER TABLE workflow_configs ADD COLUMN nodes JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_configs' AND column_name = 'start_node_id') THEN
          ALTER TABLE workflow_configs ADD COLUMN start_node_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_configs' AND column_name = 'end_node_id') THEN
          ALTER TABLE workflow_configs ADD COLUMN end_node_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_configs' AND column_name = 'form_fields') THEN
          ALTER TABLE workflow_configs ADD COLUMN form_fields JSONB;
        END IF;
      END $$;

      -- 工作流实例表（增强版）
      CREATE TABLE IF NOT EXISTS workflow_instances (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        config_id INTEGER NOT NULL REFERENCES workflow_configs(id),
        applicant_id VARCHAR(100) NOT NULL,
        applicant_name VARCHAR(100) NOT NULL,
        applicant_role VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        -- 新增字段：支持节点式流程
        current_node_id VARCHAR(50),    -- 当前节点ID
        node_history JSONB,             -- 节点历史记录
        current_step INTEGER DEFAULT 0, -- 兼容旧版
        steps JSONB,                    -- 兼容旧版
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 添加新列（如果表已存在）
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'current_node_id') THEN
          ALTER TABLE workflow_instances ADD COLUMN current_node_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'node_history') THEN
          ALTER TABLE workflow_instances ADD COLUMN node_history JSONB DEFAULT '[]';
        END IF;
      END $$;

      -- 审批记录表（增强版）
      CREATE TABLE IF NOT EXISTS approval_records (
        id SERIAL PRIMARY KEY,
        instance_id INTEGER NOT NULL REFERENCES workflow_instances(id),
        workflow_type VARCHAR(50) NOT NULL,
        node_id VARCHAR(50) NOT NULL,           -- 节点ID
        step_id VARCHAR(50),                    -- 兼容旧版
        node_name VARCHAR(100) NOT NULL,
        step_name VARCHAR(100),                 -- 兼容旧版
        approver_id VARCHAR(100) NOT NULL,
        approver_name VARCHAR(100) NOT NULL,
        approver_role VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,            -- approve, reject, withdraw, transfer, return
        comment TEXT,
        return_to_node_id VARCHAR(50),          -- 退回到的节点ID
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 添加新列（如果表已存在）
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_records' AND column_name = 'node_id') THEN
          ALTER TABLE approval_records ADD COLUMN node_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_records' AND column_name = 'node_name') THEN
          ALTER TABLE approval_records ADD COLUMN node_name VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_records' AND column_name = 'return_to_node_id') THEN
          ALTER TABLE approval_records ADD COLUMN return_to_node_id VARCHAR(50);
        END IF;
      END $$;

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_workflow_configs_type ON workflow_configs(type);
      CREATE INDEX IF NOT EXISTS idx_workflow_configs_active ON workflow_configs(is_active);
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_applicant ON workflow_instances(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_instances_current_node ON workflow_instances(current_node_id);
      CREATE INDEX IF NOT EXISTS idx_approval_records_instance ON approval_records(instance_id);
      CREATE INDEX IF NOT EXISTS idx_approval_records_node ON approval_records(node_id);

      -- 添加注释
      COMMENT ON TABLE workflow_configs IS '审批流程配置表，支持节点式流程和条件分支';
      COMMENT ON TABLE workflow_instances IS '工作流实例表，记录每个申请的流程状态';
      COMMENT ON TABLE approval_records IS '审批记录表，记录每个节点的审批操作';
    `;
    
    return NextResponse.json({
      success: true,
      message: '请在 Supabase 管理界面执行以下 SQL 创建/更新表结构：',
      sql: createTableSQL,
      hint: '执行方式：Supabase Dashboard > SQL Editor > 粘贴执行',
      changes: [
        'workflow_configs 新增 nodes, start_node_id, end_node_id, form_fields 字段',
        'workflow_instances 新增 current_node_id, node_history 字段',
        'approval_records 新增 node_id, node_name, return_to_node_id 字段',
        '新增多个索引提升查询性能',
      ],
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: '迁移失败',
    }, { status: 500 });
  }
}
