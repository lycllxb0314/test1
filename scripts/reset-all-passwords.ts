/**
 * 批量重置所有用户密码为 lysf2026
 * 
 * 执行方式：npx tsx scripts/reset-all-passwords.ts
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = 'https://br-frank-gaur-2470b25e.supabase2.aidap-global.cn-beijing.volces.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0NTU2NjcsInJvbGUiOiJhbm9uIn0.862265lU7fg3qMpdhPmzEEph2fKt03jUPcJC55h1zSc';

const client = createClient(supabaseUrl, supabaseKey);

const NEW_PASSWORD = 'lysf2026';

async function main() {
  console.log('开始批量重置密码...\n');
  
  // 1. 生成 bcrypt 哈希
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
  console.log(`新密码: ${NEW_PASSWORD}`);
  console.log(`哈希值: ${passwordHash}\n`);
  
  // 2. 获取所有活跃用户的 employee_id
  console.log('正在获取用户列表...');
  const { data: users, error: fetchError } = await client
    .from('users')
    .select('id, employee_id, name')
    .eq('status', 'active');
  
  if (fetchError) {
    console.error('获取用户列表失败:', fetchError);
    process.exit(1);
  }
  console.log(`找到 ${users?.length || 0} 个活跃用户`);
  
  // 3. 分批更新 users 表（每批 50 条）
  const batchSize = 50;
  let updatedCount = 0;
  
  console.log('正在更新 users 表...');
  for (let i = 0; i < (users?.length || 0); i += batchSize) {
    const batch = users!.slice(i, i + batchSize);
    const ids = batch.map(u => u.id);
    
    const { error: updateError } = await client
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .in('id', ids);
    
    if (updateError) {
      console.error(`更新批次 ${Math.floor(i/batchSize) + 1} 失败:`, updateError.message);
    } else {
      updatedCount += batch.length;
      process.stdout.write(`\r✓ 已更新 ${updatedCount}/${users?.length} 条...`);
    }
  }
  console.log(`\n✓ users 表已更新 ${updatedCount} 条记录`);
  
  // 4. 分批更新 teachers 表（存储明文密码）
  console.log('正在更新 teachers 表...');
  const { data: teachers, error: fetchTeachersError } = await client
    .from('teachers')
    .select('id, employee_id, name')
    .not('employee_id', 'is', null);
  
  if (fetchTeachersError) {
    console.error('获取教师列表失败:', fetchTeachersError);
    process.exit(1);
  }
  console.log(`找到 ${teachers?.length || 0} 个教师`);
  
  let teacherUpdatedCount = 0;
  for (let i = 0; i < (teachers?.length || 0); i += batchSize) {
    const batch = teachers!.slice(i, i + batchSize);
    const ids = batch.map(t => t.id);
    
    const { error: updateError } = await client
      .from('teachers')
      .update({ 
        password: NEW_PASSWORD,
        updated_at: new Date().toISOString()
      })
      .in('id', ids);
    
    if (updateError) {
      console.error(`更新教师批次 ${Math.floor(i/batchSize) + 1} 失败:`, updateError.message);
    } else {
      teacherUpdatedCount += batch.length;
      process.stdout.write(`\r✓ 已更新 ${teacherUpdatedCount}/${teachers?.length} 条...`);
    }
  }
  console.log(`\n✓ teachers 表已更新 ${teacherUpdatedCount} 条记录`);
  
  console.log('\n✅ 密码重置完成！');
  console.log(`所有用户密码已设置为: ${NEW_PASSWORD}`);
}

main().catch(console.error);
