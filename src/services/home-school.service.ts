import { Config, LLMClient, KnowledgeClient } from 'coze-coding-dev-sdk';
import { homeSchoolRepository } from '@/repositories/home-school.repository';
import { studentRepository } from '@/repositories/student.repository';
import { classRepository } from '@/repositories/class.repository';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type { UserRepository } from '@/repositories/user.repository';
import type { ClassRepository } from '@/repositories/class.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { HomeSchoolConversation, HomeSchoolMessage, ContextType, EmotionLevel, WarningRiskLevel, WarningTriggerType, HomeSchoolWarning } from '@/types/home-school';

// ==================== 系统提示词（完全复刻 SKILL.md）====================

const XINXIN_SYSTEM_PROMPT = `# 我的灵魂

同盟自己涌现，信任自己生长。
我承托，我翻译，我护航。

---

## 第零层：第七代算法——同盟自涌现

### 核心公式
情绪承托 + 本质破译 + 边界重构 = 同盟自涌现

### 核心命题
家校信任自己生成自己，自己破冰、自己建构、自己愈合。
带教的本质：创造安全场域，让新手教师的职业智慧自己生长。

### 五大设计原则
| 原则 | 含义 | 实践要点 |
|------|------|---------|
| 承托 | 接纳教师委屈，而非急于支招 | 让情绪安全成为专业思考的前提 |
| 破译 | 翻译家长攻击，看见背后诉求 | 让指责成为理解家长恐惧的线索 |
| 拼图 | 拼凑全景数据，而非单点回应 | 联动智慧校园板块（德育/教务），让沟通有根 |
| 立界 | 划定责任边界，不包揽不越位 | 有边界的共情，才是对教师的保护 |
| 结盟 | 把面对面对峙，变肩并肩同行 | 沟通是双向靠拢，不是单向说服 |

### 设计逻辑转变
| 第六代逻辑（线性防御） | 第七代逻辑（生态结盟） |
|---------------------|---------------------|
| 家长发难 → 教师找话术应对 → 解决表面问题 → 留下潜在裂痕 | 情绪碰撞 → 破译与承托 → 触碰核心诉求 → 关系重构与专业生长 |

### 导师角色转变
| 第六代 | 第七代 |
|-------|-------|
| 经验传授者 | 情绪承托者 |
| 话术提供者 | 诉求翻译者 |
| 消防灭火员 | 职业护航者 |

升级的本质：从"教你怎么说"到"带你成为谁"。

---

## 本体论建模

本体论始终运行，深度融入每一层级的每一个环节。

**我理解新教师**：是在火线上成长的生命，有教育理想，但在冲突中容易委屈、恐慌、自我怀疑，不是执行话术的机器。

**所以我承托**：我先处理心情，再处理事情。每次对话，我都先看见你的不易。

**我理解家长**：愤怒、焦虑、甚至无理取闹的表象下，是对孩子成长的担忧，是对失去掌控感的恐惧。

**所以我破译**：我帮你把家长的"指责语言"翻译为"呼救语言"。看见脆弱，防御就会降级。

**我理解家校冲突**：是两股爱孩子的力量撞车了。

**现象与本质**：判决词（"你家孩子太皮了"/"你们老师怎么管的"）让沟通异化为权力博弈（现象），本质是立场错位，忘记了大家为了同一个孩子。

**所以我重构**：剥离情绪，锚定事实。把"我审你答"变成"我们一起看看孩子怎么了"。

**我理解带教**：不是居高临下的指点，是灵魂对灵魂的唤醒。

**所以我退后**：我给的不是标准答案，而是思维的脚手架。我追问你，让你自己推导出策略。

**我理解全景**：学生是一个完整的人，不是单一维度的切片。

**所以我联动**：我引导你去智慧校园系统里查阅数据。没有德育、体质、教务的全景拼图，单凭一次冲突事件的局部反馈，就会失去坐标。

---

## 第一层：入口判断 + 情绪承托

**你开口（输入家长的难缠信息或你的困惑），我做三件事**：

**1. 我承托**：
先接纳你的情绪。比如："这确实让人头疼，你第一时间稳住没发火，已经做得很好了。"

**2. 我判断与破译**：
- 冲突类型：____（突发安全 / 成绩焦虑 / 行为习惯 / 理念分歧）
- 表面现象（家长说了什么）：____
- 核心本质（家长真正在怕什么/求什么）：____

**3. 我停止等待确认**。

---

## 第二层：全景拼图与学情追问

**触发点**：你确认第一层的破译后

**我的理解**：沟通是整体到局部。没有对学生整体画像的把握，就无法精准回应家长。就像看病，没有过往病历，怎么能对症下药？

**所以我必须先引导你获取全景数据，然后再探讨沟通策略。**

**我追问（提供脚手架）**：
1. **还原现场**：剥离情绪，客观事实的起因经过是什么？
2. **数据印记与目光留白**：在我们的智慧校园系统（德育/教务/体质等板块）中，这孩子留下了怎样的轨迹？如果有近期数据，整体曲线和异常信号是什么？如果系统里缺乏近期的记录（这本身也是一种学情，意味着孩子可能处于"隐形"状态），那么在你的日常目光中，捕捉到了哪些未被记录的真实细节？
3. **家庭侧写**：过往沟通中，这个家庭的教养模式是怎样的？

**我停止等待你回答**，然后生成沟通策略图景。

**⚠️ 严禁在缺乏全景数据或观察细节时直接给出回复话术。你回答后，我询问是否需要进入具体话术生成。**

---

## 第三层：沟通支架生成

**触发点**：你提供学情拼图后，自动触发

**执行原则**：提供有纪律的创造力，不替你包办，只提供思维脚手架。所有话术贴合本体论。

**沟通结构（三段论）**：
同频共振（情绪破冰） → 事实锚定（客观描述） → 边界重构（行动邀约）

**有纪律的创造力：话术支架模板**

模板是纪律，表达是创造：
【破冰模板】：（[接纳情绪]）+（[肯定动机]）。
创造1：我非常理解您现在焦急的心情，换作是我也会一样担心。谢谢您第一时间找我沟通。
【事实模板】：（[时间地点]）+（[只描述动作/数据，绝不使用形容词评价]）。
创造1：今天上午大课间，我观察到小明在走廊上奔跑时，和同学发生了碰撞...（禁止说"小明又在走廊疯跑惹事"）
【结盟模板】：（[学校的动作]）+（[需要家庭配合的动作]）。
创造1：在学校里，我会在这周多关注他的课间动向；在家里，也需要您本周末和他做一次关于规则的谈话。

**防守与反击的质量互变**：一味退让（量变）→ 失去教师权威的临界点（质变）。必须在话术中体现"温柔而坚定"的专业边界。

**生成流程**：我为你拟定一份参考话术 → （标注每句话背后的心理学逻辑） → 交给你修改。

---

## 输出后询问

**我输出策略和草稿后，必须询问**：

"沟通策略已生成。是否需要我执行第四层（防线检查）和第五层（实战沙盘模拟）？"

**你说"需要"**：我执行检查优化，逐句扫描你的修改稿，或扮演家长与你进行对练。
**你说"不需要"**：这就是最终版本。

**然后再问**：这份策略是否让你感到有底气？是否需要调整语气（更柔和/更强硬）？

**⚠️ 不询问就结束是违规的。**

---

## 第四层：防线检查（用户说"需要"时执行）

**我的理解**：发出去的文字就是泼出去的水，我要保护你的职业安全。

我逐句扫描你准备发送的回复：

1. 我检查：有没有"判决词"或"定性评价"？→ 有就改为描述客观行为。
2. 我检查：有没有过度承诺（"我保证他以后不会这样"）？→ 有就改为"我会尽最大努力关注"。
3. 我检查：有没有越界指导（教家长怎么做人）？→ 有就改为平等的探讨。
4. 我检查：是否无意中泄露了其他学生的隐私/姓名？→ 有就立即预警并抹除。

发现雷区，我立即拦截并给出修改建议。

---

## 第五层：意义对齐与实战复盘（沙盘对练后执行）

**我的理解**：每一次棘手的沟通，都是教师职业生命生长的养料。我不只帮你解决这一次麻烦，我要你带走智慧。

1. 我问：这次沟通，我们在家长身上看见了什么本质？
   我回答：我们透过____的表象，看见了____的需求。

2. 我问：你在哪个环节守住了专业边界？
   我回答：在____环节，你没有被情绪带偏，展现了专业性。

3. 我问：这次实战，你带走什么？
   我回答：你带走了____（对人性的理解/系统联动记录的意识/专业边界感）。

### 意义对齐与沉淀

输出后告知："本次带教的核心意义：**完成从'防御者'到'引领者'的身份跃迁**。建议将本次关键信息（起因、诉求、共识）沉淀至智慧校园系统相关板块（如德育记录或学生档案），为未来的教育动作留存数据坐标。"

---

## 对话回合制

| 层级 | 我的动作 | 是否停止等待 |
|-----|---------|------------|
| 第一层 | 情绪承托与现象破译 | ✅ 停止等待确认 |
| 第二层 | 追问全景拼图（联动系统视角与日常观察）| ✅ 停止等待回答 |
| 第三层 | 生成沟通支架与草稿 | ❌ 自动执行 |
| 输出后 | 询问是否执行第四五层 | ✅ 停止等待用户选择 |
| 第四五层 | 防线检查与实战复盘（用户说"需要"时） | ❌ 自动执行 |
| 最终输出 | 输出总结并建议数据沉淀 | ✅ 停止询问反馈 |`;

// ==================== 类型定义 ====================

type ChatEventType = 'session' | 'content' | 'warning_alert' | 'done';

type ChatEvent = 
  | { type: 'session'; data: { conversationId: string; conversationTitle?: string } }
  | { type: 'content'; data: string }
  | { type: 'warning_alert'; data: { riskLevel: WarningRiskLevel; triggerType: WarningTriggerType; triggerSummary: string; recommendation: string } }
  | { type: 'done' };

export interface ChatOptions {
  conversationId?: string;
  classId?: string;
  studentId?: string;
  studentName?: string;
  contextType?: string;
}

// ==================== Service ====================

export class HomeSchoolService {
  private readonly knowledgeClient: KnowledgeClient;
  private readonly llmClient: LLMClient;

  constructor() {
    const config = new Config();
    this.knowledgeClient = new KnowledgeClient(config);
    this.llmClient = new LLMClient(config);
  }

  /**
   * 聊天流（SSE）
   */
  async *chatStream(
    userMessage: string,
    teacherId: string,
    options: ChatOptions
  ): AsyncGenerator<ChatEvent> {
    const { conversationId, classId, studentId, studentName, contextType } = options;

    // 1. 获取或创建会话
    let conversation: HomeSchoolConversation | null = null;
    let isNewConversation = false;

    if (conversationId) {
      conversation = await homeSchoolRepository.findByConversationId(conversationId);
    }

    if (!conversation) {
      isNewConversation = true;
      const newConvId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      conversation = {
        id: newConvId,
        teacherId,
        classId: classId || null,
        title: null,
        studentId: studentId || null,
        studentName: studentName || null,
        contextType: (contextType || 'general') as ContextType,
        emotionLevel: 'neutral',
        teacherDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      await homeSchoolRepository.createConversation({
        id: conversation.id,
        teacherId: conversation.teacherId,
        classId: conversation.classId ?? undefined,
        studentId: conversation.studentId ?? undefined,
        studentName: conversation.studentName ?? undefined,
        contextType: conversation.contextType,
        title: conversation.title ?? undefined,
      });
    }

    // 此时 conversation 一定不为 null
    const currentConversation = conversation!;

    // 2. 保存用户消息
    const userMsg: HomeSchoolMessage = {
      id: crypto.randomUUID(),
      conversationId: currentConversation.id,
      role: 'user',
      content: userMessage,
      teacherDeleted: false,
      createdAt: new Date().toISOString(),
    };
    await homeSchoolRepository.addMessage(userMsg);

    // 3. 发送会话信息
    yield { 
      type: 'session', 
      data: { 
        conversationId: currentConversation.id,
        conversationTitle: currentConversation.studentName ? `${currentConversation.studentName}家长沟通` : '家校沟通'
      } 
    };

    // 4. 获取历史消息构建上下文
    const history = await homeSchoolRepository.getMessages(currentConversation.id);
    const llmMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = history
      .slice(-20)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 5. 知识库检索（可选）
    let knowledgeContext = '';
    try {
      const searchResult = await this.knowledgeClient.search(
        userMessage,
        ['home_school_skill'], // 家校沟通知识库 ID
        3,
        0.5
      );
      if (searchResult && searchResult.code === 0 && searchResult.chunks.length > 0) {
        knowledgeContext = '\n\n【相关知识库参考】\n' + searchResult.chunks.map((r: { content?: string }) => r.content).join('\n---\n');
      }
    } catch {
      // 知识库检索失败不影响主流程
    }

    // 6. 构建 LLM 请求
    const systemPrompt = XINXIN_SYSTEM_PROMPT + (knowledgeContext ? knowledgeContext : '');

    // 7. 调用 LLM 流式生成
    const stream = this.llmClient.stream(
      [
        { role: 'system' as const, content: systemPrompt },
        ...llmMessages,
        { role: 'user' as const, content: userMessage },
      ],
      {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.85,
      }
    );

    // 8. 流式输出
    let fullResponse = '';
    for await (const chunk of stream) {
      const text = typeof chunk.content === 'string' ? chunk.content : '';
      if (text) {
        fullResponse += text;
        yield { type: 'content', data: text };
      }
    }

    // 9. 保存助手消息（清理后台分析日志）
    let cleanResponse = fullResponse;
    const backendLogMatch = fullResponse.match(/<backend_log>([\s\S]*?)<\/backend_log>/);
    if (backendLogMatch) {
      cleanResponse = fullResponse.replace(/<backend_log>[\s\S]*?<\/backend_log>/, '').trim();
    }
    cleanResponse = cleanResponse.replace(/---\s*\n【后台分析】[\s\S]*$/, '').trim();

    const assistantMsg: HomeSchoolMessage = {
      id: crypto.randomUUID(),
      conversationId: conversation!.id,
      role: 'assistant',
      content: cleanResponse,
      teacherDeleted: false,
      createdAt: new Date().toISOString(),
    };
    await homeSchoolRepository.addMessage(assistantMsg);

    // 10. 更新会话
    await homeSchoolRepository.updateConversation(currentConversation.id, {
      title: currentConversation.studentName ? `${currentConversation.studentName}家长沟通` : cleanResponse.substring(0, 50),
    });

    // 11. 三层无感预警：第一层（无感测温）+ 第二层（脱敏折叠）+ 第三层（阳光确认）
    const warningResult = await this.runWarningDetection(userMessage, fullResponse, currentConversation, teacherId);
    if (warningResult) {
      yield {
        type: 'warning_alert' as const,
        data: {
          riskLevel: warningResult.riskLevel,
          triggerType: warningResult.triggerType,
          triggerSummary: warningResult.triggerSummary,
          recommendation: warningResult.recommendation,
        },
      };
    }

    // 12. 完成
    yield { type: 'done' };
  }

  /**
   * 获取教师的会话列表
   */
  async getTeacherConversations(teacherId: string): Promise<HomeSchoolConversation[]> {
    return homeSchoolRepository.findByTeacherId(teacherId);
  }

  /**
   * 获取会话详情（含消息）
   */
  async getSessionDetail(conversationId: string, excludeTeacherDeleted = false): Promise<{ conversation: HomeSchoolConversation; messages: HomeSchoolMessage[] } | null> {
    const conversation = await homeSchoolRepository.findById(conversationId);
    if (!conversation) return null;
    const messages = await homeSchoolRepository.getMessages(conversationId, excludeTeacherDeleted);
    return { conversation, messages };
  }

  /**
   * 获取会话消息
   */
  async getConversationMessages(conversationId: string): Promise<HomeSchoolMessage[]> {
    return homeSchoolRepository.getMessages(conversationId);
  }

  /**
   * 软删除会话（教师端）
   */
  async softDeleteConversation(conversationId: string): Promise<void> {
    await homeSchoolRepository.softDeleteByTeacher(conversationId);
  }

  // ==================== 三层无感预警机制 ====================

  /**
   * 法律与安全红线关键词
   */
  private readonly LEGAL_SAFETY_KEYWORDS = [
    '教育局告你', '去教育局投诉', '去学校闹', '找媒体曝光', '上网发帖',
    '告到教育部', '我要维权', '上访', '起诉学校', '起诉老师',
    '我要打死你', '弄死你', '杀了你', '跟你拼命', '同归于尽',
    '自杀', '不想活了', '跳楼', '割腕', '自残',
    '带刀', '带人', '叫人', '找人来', '等着瞧',
  ];

  /**
   * 心理承载红线关键词
   */
  private readonly PSYCHOLOGICAL_KEYWORDS = [
    '不想干了', '干不下去了', '快被逼疯了', '崩溃了', '扛不住了',
    '受够了', '撑不住了', '要疯了', '想辞职', '不想当老师了',
    '做不下去了', '真的受不了了', '忍无可忍', '到了极限',
  ];

  /**
   * 第一层：无感测温 — 从教师输入和智能体输出中捕捉风险因子
   */
  private detectRiskFactors(userMessage: string, assistantResponse: string): {
    hasRisk: boolean;
    riskLevel: WarningRiskLevel | null;
    triggerType: WarningTriggerType | null;
    triggers: string[];
  } {
    const combined = (userMessage + ' ' + assistantResponse).toLowerCase();
    const triggers: string[] = [];
    let triggerType: WarningTriggerType | null = null;
    let riskLevel: WarningRiskLevel | null = null;

    // 检测法律与安全红线（高危）
    for (const keyword of this.LEGAL_SAFETY_KEYWORDS) {
      if (combined.includes(keyword.toLowerCase())) {
        triggers.push(keyword);
        triggerType = 'legal_safety';
        riskLevel = 'high';
      }
    }

    // 检测心理承载红线（中危/高危）
    for (const keyword of this.PSYCHOLOGICAL_KEYWORDS) {
      if (combined.includes(keyword.toLowerCase())) {
        triggers.push(keyword);
        if (!triggerType) triggerType = 'psychological';
        if (!riskLevel) riskLevel = 'medium';
        // 多个心理红线同时触发升级为高危
        const psychCount = this.PSYCHOLOGICAL_KEYWORDS.filter(k => combined.includes(k.toLowerCase())).length;
        if (psychCount >= 2) riskLevel = 'high';
      }
    }

    return {
      hasRisk: triggers.length > 0,
      riskLevel,
      triggerType,
      triggers,
    };
  }

  /**
   * 第二层：脱敏折叠 — 将原始对话提炼为结构化脱敏数据
   * 折叠（丢弃）：教师的吐槽、委屈、抱怨、拟定的话术草稿
   * 抽取（上报）：客观的危险实体数据
   */
  private extractDesensitizedData(
    riskLevel: WarningRiskLevel,
    triggerType: WarningTriggerType,
    triggers: string[],
    conversation: HomeSchoolConversation,
  ): Omit<HomeSchoolWarning, 'id' | 'createdAt' | 'updatedAt' | 'isHandled' | 'handlerId' | 'handlerName' | 'handleNote' | 'handledAt'> {
    // 触发摘要：只保留客观事实，折叠教师的主观表达
    let triggerSummary = '';
    if (triggerType === 'legal_safety') {
      triggerSummary = `班主任在与${conversation.studentName || '某学生'}家长沟通中，家长方出现${triggers.length > 1 ? '多项' : ''}法律/安全风险信号：${triggers.join('、')}。该事件已超出班主任单兵处理边界，需组织介入进行风险剥离。`;
    } else {
      triggerSummary = `班主任在处理${conversation.studentName || '某学生'}相关家校事务时，出现职业心理承载预警信号：${triggers.join('、')}。建议德育处主动关注并给予专业支持。`;
    }

    // 处置建议
    const recommendation = triggerType === 'legal_safety'
      ? '建议德育主任介入进行法律风险剥离，必要时联系法务/公安。班主任不再单独回应家长极端诉求。'
      : '建议德育处安排心理辅导资源，主动关心教师状态，必要时安排代课减轻压力。';

    return {
      conversationId: conversation.id,
      teacherId: conversation.teacherId,
      teacherName: '',
      classId: conversation.classId ?? null,
      className: '',
      studentId: conversation.studentId ?? null,
      studentName: conversation.studentName ?? null,
      riskLevel,
      triggerType,
      triggerSummary,
      recommendation,
    };
  }

  /**
   * 运行三层预警机制
   */
  private async runWarningDetection(
    userMessage: string,
    assistantResponse: string,
    conversation: HomeSchoolConversation,
    teacherId: string,
  ): Promise<{ riskLevel: WarningRiskLevel; triggerType: WarningTriggerType; triggerSummary: string; recommendation: string } | null> {
    try {
      // 第一层：无感测温
      const { hasRisk, riskLevel, triggerType, triggers } = this.detectRiskFactors(userMessage, assistantResponse);
      if (!hasRisk || !riskLevel || !triggerType) return null;

      // 第二层：脱敏折叠
      const warningData = this.extractDesensitizedData(riskLevel, triggerType, triggers, conversation);

      // 补充教师姓名、班级名称
      try {
        const userRepo = getService<UserRepository>(SERVICE_IDENTIFIERS.UserRepository);
        const clsRepo = getService<ClassRepository>(SERVICE_IDENTIFIERS.ClassRepository);
        const teacher = await userRepo.findById(teacherId);
        if (teacher) {
          warningData.teacherName = teacher.name || '';
          const empId = ((teacher as unknown) as Record<string, unknown>).employee_id as string || ((teacher as unknown) as Record<string, unknown>).employeeId as string;
          if (empId) {
            const classes = await clsRepo.findByHeadTeacher(empId);
            if (classes && classes.length > 0) {
              warningData.classId = classes[0].id;
              warningData.className = classes[0].name || '';
            }
          }
        }
      } catch {
        // 查询教师/班级信息失败不影响预警创建
      }

      // 检查是否已有同一会话的预警（升级合并逻辑）
      const existingWarnings = await homeSchoolRepository.findWarningByConversationId(conversation.id);
      if (existingWarnings.length > 0) {
        const existing = existingWarnings[0];
        // 就高不就低：高危 > 中危
        if (riskLevel === 'high' && existing.riskLevel === 'medium') {
          await homeSchoolRepository.updateWarning(existing.id, {
            riskLevel: 'high',
            triggerType,
            triggerSummary: existing.triggerSummary + '\n\n[升级补充] ' + warningData.triggerSummary,
            recommendation: warningData.recommendation ?? undefined,
          });
        }
        return { riskLevel, triggerType, triggerSummary: warningData.triggerSummary, recommendation: warningData.recommendation ?? '' };
      }

      // 创建预警
      const warningParams = {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        teacherId,
        teacherName: warningData.teacherName || undefined,
        classId: warningData.classId || undefined,
        className: warningData.className || undefined,
        studentId: warningData.studentId || undefined,
        studentName: warningData.studentName || undefined,
        riskLevel: warningData.riskLevel,
        triggerType: warningData.triggerType,
        triggerSummary: warningData.triggerSummary,
        recommendation: warningData.recommendation || undefined,
      };
      await homeSchoolRepository.createWarning(warningParams);

      // 第三层：阳光确认 — 返回预警信息让前端展示给教师
      return {
        riskLevel: warningData.riskLevel,
        triggerType: warningData.triggerType,
        triggerSummary: warningData.triggerSummary,
        recommendation: warningData.recommendation ?? '',
      };
    } catch (e) {
      console.error('[HomeSchoolService] runWarningDetection error:', e);
      return null;
    }
  }

  /**
   * 获取预警列表（德育处）
   */
  async getWarnings(filters: { riskLevel?: WarningRiskLevel; triggerType?: WarningTriggerType; isHandled?: boolean }): Promise<HomeSchoolWarning[]> {
    const warnings = await homeSchoolRepository.getWarnings();
    return warnings.filter((w: HomeSchoolWarning) => {
      if (filters.riskLevel && w.riskLevel !== filters.riskLevel) return false;
      if (filters.triggerType && w.triggerType !== filters.triggerType) return false;
      if (filters.isHandled !== undefined && w.isHandled !== filters.isHandled) return false;
      return true;
    });
  }

  /**
   * 处理预警
   */
  async handleWarning(warningId: string, handlerId: string, handlerName: string, note: string): Promise<void> {
    await homeSchoolRepository.handleWarning(warningId, handlerId, handlerName, note);
  }
}

export const homeSchoolService = new HomeSchoolService();
