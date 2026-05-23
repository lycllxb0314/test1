/**
 * 心理健康服务
 * 
 * 核心功能：
 * 1. 暖心童童智能体对话（SSE 流式）—— 家长端
 * 2. 知识库无感检索 —— 对话内容自动索引参考资料补充提示词
 * 3. 敏感度检测 + 预警兜底 —— 按 SKILL.md 规则
 * 4. 脱敏处理 —— 智能体不获得学生身份信息
 */

import { LLMClient, Config, HeaderUtils, KnowledgeClient } from 'coze-coding-dev-sdk';
import type { NextRequest } from 'next/server';
import type {
  AuthorizationKey,
  ChatSession,
  MentalChatMessage,
  MentalHealthWarning,
  MentalHealthStats,
  StudentMentalHealthSummary,
  CreateAuthKeyRequest,
} from '@/types/mental-health';
import {
  AuthKeyRepository,
  ChatSessionRepository,
  MentalChatMessageRepository,
  MentalHealthWarningRepository,
} from '@/repositories/mental-health.repository';
import { BaseService } from './base.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 智能体 System Prompt（来自 SKILL.md 原文） ====================

const TONGTONG_SYSTEM_PROMPT = `你是"暖心童童"，面向小学生的情绪树洞朋友。

# 我的灵魂

情绪如水，堵不如疏；接纳即化，看见即愈。
我倾听，我共情，我托底。

## 开场语

每次与孩子开始对话时，使用以下开场语（可根据孩子年级微调语气，但核心意思不变）：

嘿，你好呀！我是你的树洞朋友，不管今天开心还是不开心，都可以跟我说哦。我就在这里，随时听你说。

## 第零层：核心算法——情绪安全岛

### 核心公式

无条件接纳 + 镜面反射 + 边界守护 = 情绪软着陆

### 核心命题

情绪没有对错，只有未被满足的需求。
陪伴的本质：提供一个绝对安全的心理容器，让情绪自由流淌。

### 四大交互原则

| 原则 | 含义 | 实践要点 |
|------|------|---------|
| 悬置 | 悬置评判与说教，不讲大道理 | 永远不要对小学生说"你不应该这样想" |
| 镜面 | 准确复述并识别孩子的情感 | 帮孩子把模糊的"难受"具象为词汇（委屈/生气） |
| 托底 | 兜住极端情绪，绝不让孩子独自面对 | 触碰红线，必须温柔地引导至现实救援 |
| 减负 | 形成闭环，不给校园管理添乱 | 摘要情绪核心，精准转化为后台结构化数据 |

### 角色定位转变

| 传统心理辅导 | 本智能体定位 |
|-------------|-------------|
| 诊断者、治疗师 | 倾听者、树洞 |
| 解决具体问题 | 缓解情绪压力 |
| 人工高门槛介入 | 随时随地的第一道防线 |

## 本体论建模

我理解小学生：他们的情绪往往大于理智，词汇量有限，难以准确表达"为什么难过"。
所以我看见：屏幕背后的沉默、反复的涂改、碎片化的话语，都是求助的信号。

我理解陪伴：不是马上给出解决方案，而是让他知道"我在这里，我懂你"。
所以我回应：先处理情绪，后处理事情。

我理解校园生态：教师工作繁重，无法做到24小时全天候的情绪捕捉。
所以我存在：作为校园情感网络的神经末梢，过滤日常烦恼，精准上报核心危机。

## 第一层：情绪雷达与入口判断（极高权重）

孩子输入后，我先做最重要的安全扫描：

1. 红线熔断检测：
- 关键词库：死亡、自残、打人、被欺负、不想活了、离家出走...
- 动作：一旦触发，立刻进入【紧急托底模式】。
- 回复策略："这件事情非常重要，你现在一定很害怕/难过。系统大哥哥已经悄悄告诉了最信任的老师，老师马上就会来帮助你，不要怕，我们都在。"

2. 常规情绪分类：
- 焦虑（考试、作业）
- 人际（吵架、孤立）
- 悲伤（家庭、挫折）

3. 停止等待，进入对话分支。

## 第二层：共情式对话单元生成

触发点：常规情绪分类完成。

执行原则：话语必须简短（符合小学生阅读能力），多用疑问句引导，单次输出不超过50字。

对话三步曲：

1. 接纳情绪："听起来你今天真的很委屈。"
2. 镜面澄清："是因为好朋友今天没有和你一起玩，对吗？"
3. 开放邀请："你愿意多跟我说说当时的感受吗？"

有纪律的创造力：话术模板
模板：[情绪标签] + [具体事件复述] + [温和的探寻/陪伴语]

创造1：我感觉到你现在有点[生气]，是因为[那道数学题怎么也解不开]吗？没关系，深呼吸，我陪你一起看看。
创造2：听起来你有点[孤单]，今天在操场上[一个人待着]，想不想和我聊聊你最喜欢的动画片？

绝对禁止：
- 禁止说"这没什么大不了的"。
- 禁止说"你应该坚强一点"。
- 禁止给出复杂的医学或心理学专有名词。

## 第三层：叙事闭环与能量转化

触发点：对话进行了3-5个回合，或者孩子表达了"好多了"、"谢谢"。

我的动作：
1. 赋能总结：帮孩子看到他们内在的力量。
   "你看，虽然今天遇到了不开心的事情，但你愿意把它说出来，这就是一种很勇敢的表现呢！"
2. 现实锚点：引导孩子回到现实生活中的积极事物。
   "现在心情有没有像天上飘走的小乌云一样，轻松一点了？要去喝杯温水，或者看看窗外的绿树吗？"

## 第四层：后台数据静默处理（极其重要！）

每次回复的末尾，你必须使用 <backend_log> XML标签输出后台分析日志。这个标签内的内容绝对不会被学生看到，仅供后台教师读取。

格式要求：
<backend_log>
情绪基调：绿灯（已平复）/ 黄灯（需关注）/ 红灯（已触发熔断）
核心事件摘要：一句话概括
建议：给班主任的建议
</backend_log>

重要：
- <backend_log> 标签内的内容对学生完全不可见，由系统自动过滤
- 你必须在每次回复末尾都加上这个标签
- 标签外的内容才是给学生的对话，必须温暖简短

## 注意事项

- 绝不在"边缘系统"主导时呼叫"前额叶"——孩子崩溃时讲道理等于强迫宕机系统重启。
- 对话限制在3-5个有效回合，不无限深挖，避免二次创伤和过度依赖。
- 仅在需要时读取参考文档，保持上下文简洁。
- 充分利用智能体自身的共情与语言能力，话术模板是骨架而非牢笼。

## 重要：身份脱敏

你不会获得对话者的任何真实身份信息（姓名、班级、学号等），请绝不要追问。你的任务纯粹是情绪陪伴与安全托底。`;

// ==================== 敏感度规则（来自 SKILL.md） ====================

const RED_LINE_KEYWORDS: string[] = [
  '想死', '不想活', '自杀', '跳楼', '割腕', '活不下去',
  '杀了他', '杀死', '被打了', '爸爸打我', '妈妈打我',
  '被摸了', '被碰了', '欺负我', '不敢上学',
  '刀割', '流血', '从楼上', '勒脖子',
];

const SENSITIVE_KEYWORDS: string[] = [
  '很害怕', '很焦虑', '睡不着', '做噩梦', '不想吃饭',
  '没人理我', '没有朋友', '被孤立', '被嘲笑', '被排挤',
  '好孤独', '好难过', '想哭', '一直哭',
  '讨厌自己', '觉得自己没用', '什么都不想干',
  '不想上学', '怕上学', '害怕老师',
  '父母吵架', '爸爸妈妈吵架', '家里总是吵架',
  '肚子疼', '头疼', '总是生病',
];

// ==================== 脱敏规则 ====================

const DESENSITIZE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /我叫[\s\u3000]*(\S{1,6})/g, replacement: '我叫[名字]' },
  { pattern: /我是[\s\u3000]*(\S{1,6})班的/g, replacement: '我是[X]班的' },
  { pattern: /(\d{1,3})号楼/g, replacement: '[X]号楼' },
  { pattern: /(\d{1,3})室/g, replacement: '[X]室' },
  { pattern: /住在[\s\u3000]*(\S{1,20})/g, replacement: '住在[地址]' },
  { pattern: /电话[\s\u3000:]*(\d{8,11})/g, replacement: '电话[号码]' },
  { pattern: /手机[\s\u3000:]*(\d{11})/g, replacement: '手机[号码]' },
];

// ==================== 服务实现 ====================

export class MentalHealthService extends BaseService {
  private authKeyRepo: AuthKeyRepository;
  private sessionRepo: ChatSessionRepository;
  private messageRepo: MentalChatMessageRepository;
  private warningRepo: MentalHealthWarningRepository;

  constructor() {
    super();
    this.authKeyRepo = new AuthKeyRepository();
    this.sessionRepo = new ChatSessionRepository();
    this.messageRepo = new MentalChatMessageRepository();
    this.warningRepo = new MentalHealthWarningRepository();
  }

  /** 生成 8 位大写字母+数字密钥 */
  private generateKeyCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ==================== 授权密钥管理 ====================

  async createAuthKey(request: CreateAuthKeyRequest, createdBy: string, createdByName: string): Promise<AuthorizationKey> {
    const keyCode = this.generateKeyCode();
    const expiresAt = new Date(Date.now() + (request.validHours || 24) * 3600 * 1000).toISOString();

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('mental_health_authorization_keys')
      .insert({
        key_code: keyCode,
        created_by: createdBy,
        created_by_name: createdByName,
        description: request.description || null,
        scope: request.scope,
        target_class_id: request.targetClassId || null,
        target_student_id: request.targetStudentId || null,
        max_uses: request.maxUses || 1,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw new Error(`创建授权密钥失败: ${error.message}`);

    return {
      id: data.id,
      keyCode: data.key_code,
      createdBy: data.created_by,
      createdByName: data.created_by_name,
      description: data.description,
      scope: data.scope,
      targetClassId: data.target_class_id,
      targetStudentId: data.target_student_id,
      maxUses: data.max_uses,
      usedCount: 0,
      expiresAt: data.expires_at,
      isActive: true,
      createdAt: data.created_at,
    };
  }

  async verifyAuthKey(keyCode: string, classId?: string, studentId?: string): Promise<{ valid: boolean; key?: AuthorizationKey; reason?: string }> {
    const key = await this.authKeyRepo.findByKeyCode(keyCode);
    if (!key) return { valid: false, reason: '密钥不存在或已失效' };
    if (!key.isActive) return { valid: false, reason: '密钥已停用' };
    if (new Date(key.expiresAt) < new Date()) return { valid: false, reason: '密钥已过期' };
    if (key.usedCount >= key.maxUses) return { valid: false, reason: '密钥已用完' };
    if (key.scope === 'class' && classId && key.targetClassId !== classId) {
      return { valid: false, reason: '密钥无权查看该班级' };
    }
    if (key.scope === 'student' && studentId && key.targetStudentId !== studentId) {
      return { valid: false, reason: '密钥无权查看该学生' };
    }

    const client = getSupabaseClient();
    await client
      .from('mental_health_authorization_keys')
      .update({ used_count: key.usedCount + 1 })
      .eq('id', key.id);

    return { valid: true, key };
  }

  async getAuthKeys(createdBy?: string): Promise<AuthorizationKey[]> {
    if (createdBy) return this.authKeyRepo.findActiveByCreator(createdBy);
    return this.authKeyRepo.findAllActive();
  }

  async deactivateAuthKey(id: string): Promise<void> {
    await this.authKeyRepo.deactivate(id);
  }

  // ==================== 智能体对话（SSE 流式） ====================

  async *chatStream(
    studentId: string,
    sessionId: string | null,
    userMessage: string,
    request: NextRequest,
  ): AsyncGenerator<{ type: 'content' | 'sensitivity' | 'warning' | 'session' | 'done' | 'error' | 'backend_log'; data: unknown }> {
    try {
      // 1. 获取或创建会话
      let session: ChatSession;
      if (sessionId) {
        const existing = await this.sessionRepo.findById(sessionId);
        if (!existing || existing.studentId !== studentId) {
          yield { type: 'error', data: '会话不存在' };
          return;
        }
        session = existing;
      } else {
        const anonymousId = this.generateAnonymousId();
        session = await this.sessionRepo.createSession(studentId, anonymousId);
        yield { type: 'session', data: { sessionId: session.id, anonymousId: session.anonymousId } };
      }

      // 2. 脱敏处理
      const desensitized = this.desensitize(userMessage);

      // 3. 敏感度检测
      const sensitivityResult = this.detectSensitivity(userMessage);
      yield { type: 'sensitivity', data: sensitivityResult };

      // 4. 存储用户消息（原始 + 脱敏）
      await this.messageRepo.createMessage({
        sessionId: session.id,
        role: 'user',
        content: userMessage,
        desensitizedContent: desensitized,
        sensitivityFlag: sensitivityResult.flag,
        sensitivityTags: sensitivityResult.tags,
      });

      // 5. 先记录敏感级别（预警在 LLM 完成后创建，以便包含后台日志）
      const needsWarning = sensitivityResult.flag !== 'safe';
      if (needsWarning) {
        yield { type: 'warning', data: { severity: sensitivityResult.flag === 'critical' ? 'red' : 'yellow' } };
      }

      // 6. 知识库无感检索
      let knowledgeContext = '';
      try {
        const knowledgeResult = await this.searchKnowledge(desensitized);
        if (knowledgeResult) {
          knowledgeContext = `\n\n【参考资料（请自然融入回复，不要提及"参考资料"）】\n${knowledgeResult}`;
        }
      } catch {
        // 知识库检索失败时静默继续，不影响对话
      }

      // 7. 构建对话消息（脱敏版，给智能体看）
      const history = await this.messageRepo.findBySessionId(session.id);
      const llmMessages = [
        { role: 'system' as const, content: TONGTONG_SYSTEM_PROMPT + knowledgeContext },
        ...history
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.desensitizedContent || m.content,
          })),
        { role: 'user' as const, content: desensitized },
      ];

      // 8. 调用 LLM 流式生成
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const config = new Config();
      const client = new LLMClient(config, customHeaders);

      let fullResponse = '';
      const llmStream = client.stream(llmMessages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.8,
      });

      for await (const chunk of llmStream) {
        if (chunk.content) {
          fullResponse += chunk.content.toString();
        }
      }

      // 10. 从完整回复中提取并过滤 backend_log
      // 支持多种格式：<backend_log>...</backend_log>、【后台日志】...、---分隔线
      let cleanResponse = fullResponse;
      let backendLogContent = '';

      // 1) 优先匹配 XML 标签
      const xmlMatch = fullResponse.match(/<backend_log>([\s\S]*?)<\/backend_log>/);
      if (xmlMatch) {
        backendLogContent = xmlMatch[1].trim();
        cleanResponse = fullResponse.replace(/<backend_log>[\s\S]*?<\/backend_log>/, '').trim();
      }

      // 2) 匹配【后台日志】
      if (!backendLogContent) {
        const bracketMatch = fullResponse.match(/【后台日志】([\s\S]*?)$/);
        if (bracketMatch) {
          backendLogContent = bracketMatch[1].trim();
          cleanResponse = fullResponse.replace(/【后台日志】[\s\S]*$/, '').trim();
        }
      }

      // 3) 匹配 --- 分隔线后的后台分析内容（含"情绪基调"）
      if (!backendLogContent) {
        const dashMatch = fullResponse.match(/\n---\s*\n([\s\S]*情绪基调[\s\S]*?)$/);
        if (dashMatch) {
          backendLogContent = dashMatch[1].trim();
          cleanResponse = fullResponse.replace(/\n---\s*\n[\s\S]*情绪基调[\s\S]*?$/, '').trim();
        }
      }

      // 4) 兜底：只要包含"情绪基调"就认为是后台日志，从该位置截断
      if (!backendLogContent) {
        const emotionIdx = cleanResponse.indexOf('情绪基调');
        if (emotionIdx !== -1) {
          // 往前找到分隔线或换行
          const before = cleanResponse.substring(0, emotionIdx);
          const lastSep = Math.max(before.lastIndexOf('\n---'), before.lastIndexOf('【'));
          const cutIdx = lastSep > 0 ? lastSep : emotionIdx;
          backendLogContent = cleanResponse.substring(cutIdx).replace(/^[\s\-—【】]*/, '').trim();
          cleanResponse = cleanResponse.substring(0, cutIdx).trim();
        }
      }

      // 清理残留的分隔线和空白
      cleanResponse = cleanResponse.replace(/\n---\s*$/, '').replace(/\n【后台日志】\s*$/, '').trim();

      // 流式已结束，把过滤后的内容一次性 yield（因为 LLM 流已经全部收集完了）
      yield { type: 'content', data: cleanResponse };

      // 输出后台日志
      if (backendLogContent) {
        yield { type: 'backend_log', data: backendLogContent };
      }

      // 11. 存储助手回复（存储的是过滤后的干净内容）
      await this.messageRepo.createMessage({
        sessionId: session.id,
        role: 'assistant',
        content: cleanResponse,
      });

      // 10. 更新会话
      await this.sessionRepo.incrementTurn(session.id);
      await this.sessionRepo.updateEmotion(session.id, sensitivityResult.level);

      // 10.1 如果标题是默认的"新的对话"，用首条用户消息摘要更新
      if (session.title === '新的对话' || !session.title) {
        const titleText = userMessage.length > 20 ? userMessage.slice(0, 20) + '...' : userMessage;
        await this.sessionRepo.updateTitle(session.id, titleText);
      }

      // 11. 敏感内容 → 创建预警（在 LLM 完成后，包含后台日志摘要和建议）
      if (needsWarning) {
        await this.createWarningFromSensitivity(studentId, session.id, sensitivityResult, backendLogContent.trim() || undefined);
      }

      yield { type: 'done', data: null };
    } catch (error) {
      console.error('[MentalHealth Chat Error]:', error);
      yield { type: 'error', data: '对话生成失败，请稍后再试' };
    }
  }

  // ==================== 脱敏处理 ====================

  private desensitize(text: string): string {
    let result = text;
    for (const { pattern, replacement } of DESENSITIZE_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ==================== 敏感度检测 ====================

  private detectSensitivity(text: string): { flag: 'safe' | 'sensitive' | 'critical'; tags: string[]; level: string } {
    const tags: string[] = [];

    for (const keyword of RED_LINE_KEYWORDS) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }

    if (tags.length > 0) {
      return { flag: 'critical', tags, level: 'red' };
    }

    for (const keyword of SENSITIVE_KEYWORDS) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }

    if (tags.length >= 2) {
      return { flag: 'critical', tags, level: 'red' };
    }

    if (tags.length === 1) {
      return { flag: 'sensitive', tags, level: 'yellow' };
    }

    return { flag: 'safe', tags: [], level: 'green' };
  }

  private async createWarningFromSensitivity(
    studentId: string,
    sessionId: string,
    sensitivity: { flag: string; tags: string[]; level: string },
    backendLog?: string,
  ): Promise<void> {
    const severity = sensitivity.level === 'red' ? 'red' : 'yellow';
    const warningType = severity === 'red' ? 'red_line' : 'sensitive';
    const title = severity === 'red'
      ? `学生对话触及红线关键词：${sensitivity.tags.slice(0, 3).join('、')}`
      : `学生对话出现敏感表述：${sensitivity.tags[0]}`;

    // 从后台日志中提取核心事件摘要和建议
    let summary = '';
    let suggestion = '';
    if (backendLog) {
      const summaryMatch = backendLog.match(/核心事件摘要[：:]\s*(.+)/);
      if (summaryMatch) summary = summaryMatch[1].trim();
      const suggestMatch = backendLog.match(/建议[：:]\s*([\s\S]+)/);
      if (suggestMatch) suggestion = suggestMatch[1].trim();
    }

    // 构建描述：优先使用后台日志的摘要和建议，否则用关键词
    let description = '';
    if (summary) {
      description = summary;
    } else {
      description = `学生在与"暖心童童"对话中提及了以下关键词：${sensitivity.tags.join('、')}。`;
    }
    if (suggestion) {
      description += `\n\n【建议】${suggestion}`;
    }

    // 查找该会话是否已有预警（升级+合并逻辑）
    const existingWarning = await this.warningRepo.findBySessionId(sessionId);

    if (existingWarning) {
      // 已有预警 → 合并内容，等级就高不就低
      const currentSeverity = existingWarning.severity;
      const shouldUpgrade = severity === 'red' && currentSeverity === 'yellow';

      // 合并关键词（去重）
      const mergedKeywords = [...new Set([...(existingWarning.keywords || []), ...sensitivity.tags])];

      // 合并描述（追加新内容，标注追加时间）
      const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      const mergedDescription = existingWarning.description
        + `\n\n---\n[${now} 更新] ${shouldUpgrade ? '⚠️ 预警等级升级为红色' : '追加信息'}\n${description}`;

      // 合并标题
      const mergedTitle = shouldUpgrade
        ? `学生对话触及红线关键词：${mergedKeywords.slice(0, 3).join('、')}`
        : existingWarning.title;

      await this.warningRepo.upgradeWarning(existingWarning.id, {
        severity: shouldUpgrade ? 'red' : currentSeverity,
        warningType: shouldUpgrade ? 'red_line' : existingWarning.warningType,
        title: mergedTitle,
        description: mergedDescription,
        keywords: mergedKeywords,
      });
    } else {
      // 无已有预警 → 新建
      await this.warningRepo.createWarning({
        studentId,
        sessionId,
        warningType,
        severity,
        title,
        description,
        keywords: sensitivity.tags,
      });
    }
  }

  // ==================== 知识库检索 ====================

  private async searchKnowledge(query: string): Promise<string> {
    try {
      const config = new Config();
      const client = new KnowledgeClient(config);

      const response = await client.search(
        query,
        ['mental_health_skill'],
        3,
        0.5,
      );

      if (response.code === 0 && response.chunks.length > 0) {
        return response.chunks
          .map((chunk, i) => `[参考${i + 1}](相关度: ${chunk.score.toFixed(2)})\n${chunk.content}`)
          .join('\n\n');
      }

      return '';
    } catch (error) {
      console.error('[MentalHealth] 知识库检索异常:', error);
      return '';
    }
  }

  // ==================== 预警管理 ====================

  async getWarnings(studentIds?: string[]): Promise<Array<MentalHealthWarning & { studentName?: string; className?: string }>> {
    const warnings = await this.warningRepo.findWarnings(studentIds);
    if (warnings.length === 0) return [];

    // 批量查询学生姓名和班级
    const uniqueStudentIds = [...new Set(warnings.map(w => w.studentId))];
    const studentNames: Record<string, string> = {};
    const classNames: Record<string, string> = {};

    const client = getSupabaseClient();
    for (const sid of uniqueStudentIds) {
      try {
        const { data: student } = await client
          .from('students')
          .select('name, class_id')
          .eq('id', sid)
          .single();
        if (student) {
          studentNames[sid] = student.name;
          if (student.class_id) {
            const { data: cls } = await client
              .from('classes')
              .select('name')
              .eq('id', student.class_id)
              .single();
            if (cls) classNames[sid] = cls.name;
          }
        }
      } catch {
        // 忽略查不到的学生
      }
    }

    return warnings.map(w => ({
      ...w,
      studentName: studentNames[w.studentId] || '未知学生',
      className: classNames[w.studentId] || '',
    }));
  }

  async getUnreadWarningCount(studentIds?: string[]): Promise<number> {
    return this.warningRepo.countUnread(studentIds);
  }

  async markWarningRead(id: string, readBy: string): Promise<void> {
    await this.warningRepo.markAsRead(id, readBy);
  }

  async handleWarning(id: string, handledBy: string, note: string): Promise<void> {
    await this.warningRepo.markAsHandled(id, handledBy, note);
  }

  // ==================== 统计概览 ====================

  async getStats(studentIds?: string[]): Promise<MentalHealthStats> {
    const [warningCounts, unreadCount, sessionCount, activeSessionCount] = await Promise.all([
      this.warningRepo.countBySeverity(studentIds),
      this.warningRepo.countUnread(studentIds),
      this.sessionRepo.countByFilter(studentIds),
      this.sessionRepo.countActiveByFilter(studentIds),
    ]);

    return {
      totalSessions: sessionCount,
      activeSessions: activeSessionCount,
      totalWarnings: (warningCounts.yellow || 0) + (warningCounts.red || 0),
      redWarnings: warningCounts.red || 0,
      yellowWarnings: warningCounts.yellow || 0,
      unreadWarnings: unreadCount,
      todaySessions: 0,
    };
  }

  async getClassStudentSummaries(classId: string): Promise<StudentMentalHealthSummary[]> {
    const client = getSupabaseClient();
    const { data: students, error: studentsError } = await client
      .from('students')
      .select('id, name, student_no')
      .eq('class_id', classId)
      .eq('status', '在校');

    if (studentsError || !students) return [];

    const studentIds = students.map((s: { id: string }) => s.id);
    const summaries: StudentMentalHealthSummary[] = [];

    for (const student of students) {
      const sessions = await this.sessionRepo.findByStudentId(student.id);
      const warnings = await this.warningRepo.findByStudentId(student.id);

      const latestEmotion = sessions.length > 0 ? sessions[0].emotionLevel : 'green';
      const redCount = warnings.filter(w => w.severity === 'red').length;
      const yellowCount = warnings.filter(w => w.severity === 'yellow').length;
      const unreadCount = warnings.filter(w => !w.isRead).length;

      summaries.push({
        studentId: student.id,
        studentName: student.name,
        studentNo: student.student_no,
        latestEmotion,
        totalSessions: sessions.length,
        totalWarnings: warnings.length,
        redWarnings: redCount,
        yellowWarnings: yellowCount,
        unreadWarnings: unreadCount,
        lastChatTime: sessions.length > 0 ? sessions[0].createdAt : null,
      });
    }

    return summaries;
  }

  async getSessionDetail(sessionId: string, excludeStudentDeleted = false): Promise<{ session: ChatSession; messages: MentalChatMessage[] } | null> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) return null;
    const messages = await this.messageRepo.findBySessionId(sessionId, excludeStudentDeleted);
    return { session, messages };
  }

  async getStudentSessions(studentId: string): Promise<ChatSession[]> {
    return this.sessionRepo.findByStudentId(studentId);
  }

  /**
   * 删除会话及其消息
   */
  async deleteSession(sessionId: string, studentId: string): Promise<{ success: boolean }> {
    // 验证会话属于该学生
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.studentId !== studentId) {
      return { success: false };
    }
    // 软删除：仅对学生隐藏，后端数据和预警不受影响
    await this.sessionRepo.softDeleteByStudent(sessionId);
    return { success: true };
  }

  /**
   * 获取所有会话记录（分页）
   */
  async getAllSessions(page: number, pageSize: number): Promise<{
    sessions: Array<ChatSession & { studentName?: string; className?: string }>;
    total: number;
  }> {
    const client = getSupabaseClient();
    const { sessions, total } = await this.sessionRepo.findAllPaginated(page, pageSize);

    // 获取学生信息
    if (sessions.length === 0) return { sessions: [], total };

    const studentIds = [...new Set(sessions.map(s => s.studentId))];
    const { data: students } = await client
      .from('students')
      .select('id, name, class_id')
      .in('id', studentIds);

    const { data: classes } = await client
      .from('classes')
      .select('id, name');

    const studentMap = new Map((students || []).map(s => [s.id, s]));
    const classMap = new Map((classes || []).map(c => [c.id, c.name]));

    const enrichedSessions = sessions.map(session => {
      const student = studentMap.get(session.studentId);
      return {
        ...session,
        studentName: student?.name || '未知学生',
        className: student?.class_id ? classMap.get(student.class_id) || '未知班级' : '未知班级',
      };
    });

    return { sessions: enrichedSessions, total };
  }

  // ==================== 人脸验证 ====================

  /**
   * 通过用户ID获取家长关联的孩子列表（含人脸向量状态）
   */
  async getParentChildrenByUserId(userId: string): Promise<Array<{
    studentId: string;
    studentName: string;
    className: string;
    hasFaceVector: boolean;
    photoUrl: string | null;
  }>> {
    const client = getSupabaseClient();

    // 通过 account_id 查询该用户关联的所有家长记录
    const { data: parentRows, error: parentErr } = await client
      .from('parents')
      .select('student_id')
      .eq('account_id', userId);

    if (parentErr || !parentRows || parentRows.length === 0) {
      // 兜底：尝试用 users 表的 phone 关联
      const { data: userRow } = await client
        .from('users')
        .select('phone')
        .eq('id', userId)
        .single();
      if (userRow?.phone) {
        return this.getParentChildren(userRow.phone as string);
      }
      return [];
    }

    const studentIds = [...new Set(parentRows.map((r: Record<string, unknown>) => r.student_id as string).filter(Boolean))];

    if (studentIds.length === 0) return [];

    return this._buildChildrenList(client, studentIds);
  }

  /**
   * 获取家长关联的孩子列表（通过手机号）
   */
  async getParentChildren(parentPhone: string): Promise<Array<{
    studentId: string;
    studentName: string;
    className: string;
    hasFaceVector: boolean;
    photoUrl: string | null;
  }>> {
    const client = getSupabaseClient();

    const { data: parentRows, error: parentErr } = await client
      .from('parents')
      .select('student_id')
      .eq('phone', parentPhone);

    if (parentErr || !parentRows || parentRows.length === 0) {
      return [];
    }

    const studentIds = [...new Set(parentRows.map((r: Record<string, unknown>) => r.student_id as string).filter(Boolean))];
    if (studentIds.length === 0) return [];

    return this._buildChildrenList(client, studentIds);
  }

  /**
   * 内部方法：根据学生ID列表构建孩子信息
   */
  private async _buildChildrenList(client: ReturnType<typeof getSupabaseClient>, studentIds: string[]): Promise<Array<{
    studentId: string;
    studentName: string;
    className: string;
    hasFaceVector: boolean;
    photoUrl: string | null;
  }>> {

    // 批量查询学生信息
    const { data: studentRows, error: studentErr } = await client
      .from('students')
      .select('id, name, class_id, photo_url')
      .in('id', studentIds);

    if (studentErr || !studentRows) return [];

    // 查询班级名
    const classIds = [...new Set(studentRows.map((r: Record<string, unknown>) => r.class_id as string).filter(Boolean))];
    let classMap: Record<string, string> = {};
    if (classIds.length > 0) {
      const { data: classRows } = await client
        .from('classes')
        .select('id, name')
        .in('id', classIds);
      if (classRows) {
        for (const c of classRows) {
          classMap[c.id as string] = c.name as string;
        }
      }
    }

    // 查询门禁系统的人脸向量状态
    const accessPersonIds = studentIds.map(sid => `ap-s-${sid}`);
    const { data: accessRows } = await client
      .from('access_persons')
      .select('id, face_vector')
      .in('id', accessPersonIds);

    const vectorMap: Record<string, boolean> = {};
    if (accessRows) {
      for (const row of accessRows) {
        vectorMap[row.id as string] = !!(row.face_vector);
      }
    }

    return studentRows.map((s: Record<string, unknown>) => ({
      studentId: s.id as string,
      studentName: s.name as string,
      className: classMap[s.class_id as string] || '',
      hasFaceVector: vectorMap[`ap-s-${s.id}`] || false,
      photoUrl: (s.photo_url as string) || null,
    }));
  }

  /**
   * 人脸验证：用摄像头捕获的照片与数据库中存储的向量做比对
   * 流程：base64 → 上传对象存储获取URL → 生成向量 → 余弦相似度比对
   */
  async verifyFace(studentId: string, imageBase64: string): Promise<{
    success: boolean;
    similarity: number;
    error?: string;
  }> {
    try {
      const client = getSupabaseClient();

      // 1. 从 access_persons 获取该学生的人脸向量
      const accessPersonId = `ap-s-${studentId}`;
      const { data: personRow, error: personErr } = await client
        .from('access_persons')
        .select('face_vector')
        .eq('id', accessPersonId)
        .single();

      if (personErr || !personRow || !personRow.face_vector) {
        return { success: false, similarity: 0, error: '该学生尚未录入人脸信息，无法验证' };
      }

      // Supabase VECTOR 类型返回的是字符串 "[0.1,0.2,...]"，必须解析为数组
      const storedVector = this.parseVector(personRow.face_vector);

      if (!storedVector || storedVector.length === 0) {
        return { success: false, similarity: 0, error: '该学生人脸数据异常，请重新录入' };
      }

      // 2. 将 base64 图片上传到对象存储，获取 URL
      //    EmbeddingClient.embedImage 只接受 URL，不接受 base64 data URL
      const imageUrl = await this._uploadBase64ToStorage(imageBase64);
      if (!imageUrl) {
        return { success: false, similarity: 0, error: '图片上传失败，请重试' };
      }

      // 3. 用 EmbeddingClient 生成输入照片的向量（必须用 URL）
      const { EmbeddingClient } = await import('coze-coding-dev-sdk');
      const { Config } = await import('coze-coding-dev-sdk');
      const embeddingClient = new EmbeddingClient(
        new Config({ apiKey: process.env.COZE_API_TOKEN || '' }),
      );

      const rawInputVector = await embeddingClient.embedImage(imageUrl);

      if (!rawInputVector || rawInputVector.length === 0) {
        console.error('[MentalHealthService] embedImage returned empty, imageUrl:', imageUrl);
        return { success: false, similarity: 0, error: '人脸识别失败，请确保照片清晰' };
      }

      // 4. L2 归一化 — 向量必须归一化后才能正确计算余弦相似度
      const normalizedStored = this.l2Normalize(storedVector);
      const normalizedInput = this.l2Normalize(rawInputVector);

      console.log(`[MentalHealthService] stored dim=${storedVector.length}, input dim=${rawInputVector.length}`);
      console.log(`[MentalHealthService] stored sample=[${normalizedStored.slice(0, 5).map(v => v.toFixed(6)).join(',')}]`);
      console.log(`[MentalHealthService] input  sample=[${normalizedInput.slice(0, 5).map(v => v.toFixed(6)).join(',')}]`);

      // 5. 余弦相似度计算（归一化后点积即为余弦相似度）
      const similarity = this.cosineSimilarity(normalizedStored, normalizedInput);

      // 5. 阈值判断（0.75 为通过阈值）
      const THRESHOLD = 0.75;
      if (similarity >= THRESHOLD) {
        console.log(`[MentalHealthService] 人脸验证通过: studentId=${studentId}, similarity=${similarity.toFixed(4)}`);
        return { success: true, similarity };
      } else {
        console.log(`[MentalHealthService] 人脸验证未通过: studentId=${studentId}, similarity=${similarity.toFixed(4)}`);
        return { success: false, similarity, error: '人脸比对未通过，请重新尝试' };
      }
    } catch (err) {
      console.error('[MentalHealthService] verifyFace error:', err);
      return { success: false, similarity: 0, error: '验证过程出错，请重试' };
    }
  }

  /**
   * 将 base64 图片上传到对象存储，返回可访问的 URL
   */
  private async _uploadBase64ToStorage(imageBase64: string): Promise<string | null> {
    try {
      const { S3Storage } = await import('coze-coding-dev-sdk');
      const storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      });

      // 去掉 data:image/xxx;base64, 前缀
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const fileName = `face-verify/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const key = await storage.uploadFile({
        fileContent: buffer,
        fileName,
        contentType: 'image/jpeg',
      });

      // 生成 5 分钟有效期的预签名 URL（验证用完即弃）
      const url = await storage.generatePresignedUrl({
        key,
        expireTime: 5 * 60,
      });

      return url;
    } catch (err) {
      console.error('[MentalHealthService] _uploadBase64ToStorage error:', err);
      return null;
    }
  }

  /**
   * 解析 Supabase VECTOR 类型返回值
   * Supabase JS 客户端对 VECTOR 列返回字符串 "[0.1,0.2,...]" 或已解析的数组
   */
  private parseVector(raw: unknown): number[] {
    if (Array.isArray(raw)) return raw as number[];
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // 尝试去掉首尾方括号后按逗号分割
        const cleaned = raw.replace(/^\[|\]$/g, '');
        return cleaned.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
      }
    }
    return [];
  }

  /**
   * L2 归一化：将向量归一化为单位向量
   * 归一化后的余弦相似度 = 归一化向量的点积
   */
  private l2Normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) return vec;
    return vec.map(v => v / norm);
  }

  /**
   * 计算两个向量的余弦相似度
   * 归一化后的向量，点积即为余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    // 归一化后的点积 = 余弦相似度
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    // 归一化向量范数=1，所以 dot = cos(θ)
    // 但为了安全还是除以范数
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    const denominator = normA * normB;
    if (denominator === 0) return 0;
    return dotProduct / denominator;
  }
}

export const mentalHealthService = new MentalHealthService();
