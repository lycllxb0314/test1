/**
 * 学生荣誉评选相关类型定义
 *
 * @module types/honor-campaign
 */

// ==================== 枚举类型 ====================

/** 评选活动状态 */
export type CampaignStatus = 'draft' | 'published' | 'closed';

/** 申报状态 */
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/** 最终结果 */
export type FinalStatus = 'passed' | 'failed';

/** 审批步骤 */
export type ApprovalStep = 'head_teacher' | 'moral_dept' | 'moral_vice_principal';

/** 材料类型 */
export type MaterialType = 'award' | 'certificate' | 'photo' | 'other';

/** 荣誉级别 */
export type HonorLevel = '校级' | '区级' | '市级' | '省级' | '国家级' | '国际级';

/** 荣誉类别 */
export type HonorCategory = '综合荣誉' | '学科竞赛' | '体育竞赛' | '艺术竞赛' | '科技竞赛' | '社会实践' | '其他';

// ==================== 学生荣誉类型 ====================

/** 学生荣誉（统一格式） */
export type StudentHonor = {
  /** 荣誉名称 */
  title: string;
  /** 荣誉级别 */
  level: HonorLevel | string;
  /** 荣誉类别 */
  category: HonorCategory | string;
  /** 颁发单位 */
  issuer: string;
  /** 获奖日期 */
  date: string;
  /** 证书编号（可选） */
  certificateNo?: string;
  /** 学年 */
  schoolYear?: string;
};

/** 学生荣誉数据库行 */
export type StudentHonorRow = {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  grade: number | null;
  title: string;
  level: string | null;
  category: string | null;
  issuer: string | null;
  date: string | null;
  certificate_no: string | null;
  description: string | null;
  school_year: string | null;
  created_at: string;
  updated_at: string;
};

// ==================== 表单配置类型 ====================

/** 表单字段类型 */
export type FormFieldType = 'text' | 'textarea' | 'select' | 'date' | 'number';

/** 表单字段配置 */
export type FormFieldConfig = {
  /** 字段名 */
  field: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: FormFieldType;
  /** 是否必填 */
  required: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 选项（用于 select 类型） */
  options?: string[];
  /** 默认值 */
  defaultValue?: string;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 提示信息 */
  hint?: string;
};

/** 表单配置 */
export type FormConfig = {
  /** 表单字段列表 */
  fields: FormFieldConfig[];
  /** 表单说明 */
  instructions?: string;
};

// ==================== 审批配置类型 ====================

/** 审批环节配置 */
export type ApprovalStepConfig = {
  /** 审批步骤 */
  step: ApprovalStep;
  /** 环节名称 */
  name: string;
  /** 环节描述 */
  description?: string;
  /** 时间限制（天数），0 表示无限制 */
  timeLimit?: number;
  /** 超时自动处理方式 */
  timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate' | 'none';
  /** 升级到的审批人（当 timeoutAction 为 escalate 时） */
  escalateTo?: string;
};

/** 审批配置 */
export type ApprovalConfig = {
  /** 审批步骤 */
  steps: ApprovalStep[];
  /** 环节详细配置 */
  stepConfigs?: ApprovalStepConfig[];
  /** 是否允许退回 */
  allowReturn?: boolean;
  /** 审批超时天数（全局默认） */
  timeoutDays?: number;
};

/** 审批意见 */
export type ApprovalComment = {
  /** 审批步骤 */
  step: ApprovalStep;
  /** 审批人ID */
  approverId: string;
  /** 审批人姓名 */
  approverName: string;
  /** 审批结果 */
  result: 'approved' | 'rejected' | 'returned';
  /** 审批意见 */
  comment?: string;
  /** 审批时间 */
  time: string;
};

// ==================== 附件类型 ====================

/** 申报附件 */
export type ApplicationAttachment = {
  /** 文件名 */
  name: string;
  /** 文件URL */
  url: string;
  /** 文件类型 */
  type: 'image' | 'pdf' | 'doc' | 'other';
  /** 文件大小（字节） */
  size?: number;
  /** 上传时间 */
  uploadedAt?: string;
};

// ==================== 数据库行类型 ====================

/** 评选活动数据库行 */
export type HonorCampaignRow = {
  id: string;
  title: string;
  honor_type: string;
  description: string | null;
  requirements: string | null;
  start_date: string;
  end_date: string;
  form_config: FormConfig | null;
  status: CampaignStatus;
  max_applicants_per_class: number;
  approval_config: ApprovalConfig | null;
  school_year: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** 申报记录数据库行 */
export type HonorApplicationRow = {
  id: string;
  campaign_id: string;
  student_id: string;
  class_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_relation: string | null;
  form_data: Record<string, string>;
  attachments: ApplicationAttachment[];
  existing_honors: StudentHonor[];
  approval_instance_id: string | null;
  current_step: ApprovalStep | null;
  status: ApplicationStatus;
  approval_comments: ApprovalComment[];
  final_status: FinalStatus | null;
  certificate_no: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

/** 申报材料数据库行 */
export type HonorApplicationMaterialRow = {
  id: string;
  application_id: string;
  material_type: MaterialType;
  material_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
};

// ==================== 业务类型 ====================

/** 评选活动 */
export type HonorCampaign = {
  id: string;
  title: string;
  honorType: string;
  description: string | null;
  requirements: string | null;
  startDate: string;
  endDate: string;
  formConfig: FormConfig | null;
  status: CampaignStatus;
  maxApplicantsPerClass: number;
  approvalConfig: ApprovalConfig | null;
  schoolYear: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // 扩展字段
  applicantCount?: number;
  approvedCount?: number;
  classCount?: number;
};

/** 申报记录 */
export type HonorApplication = {
  id: string;
  campaignId: string;
  studentId: string;
  classId: string;
  applicantId: string;
  applicantName: string;
  applicantRelation: string;
  formData: Record<string, string>;
  attachments: ApplicationAttachment[];
  existingHonors: StudentHonor[];
  approvalInstanceId: string | null;
  currentStep: ApprovalStep | null;
  status: ApplicationStatus;
  approvalComments: ApprovalComment[];
  finalStatus: FinalStatus | null;
  certificateNo: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;  // 最终审批通过时间
  createdAt: string;
  updatedAt: string;
  // 扩展字段
  campaign?: HonorCampaign;
  studentName?: string;
  studentNo?: string;
  className?: string;
  grade?: number;
};

/** 申报材料 */
export type HonorApplicationMaterial = {
  id: string;
  applicationId: string;
  materialType: MaterialType;
  materialName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  description: string | null;
  createdAt: string;
};

// ==================== API 请求/响应类型 ====================

/** 创建评选活动请求 */
export type CreateCampaignRequest = {
  title: string;
  honorType: string;
  description?: string;
  requirements?: string;
  startDate: string;
  endDate: string;
  formConfig?: FormConfig;
  maxApplicantsPerClass?: number;
  approvalConfig?: ApprovalConfig;
  schoolYear?: string;
};

/** 更新评选活动请求 */
export type UpdateCampaignRequest = Partial<CreateCampaignRequest> & {
  status?: CampaignStatus;
};

/** 创建申报请求 */
export type CreateApplicationRequest = {
  campaignId: string;
  studentId: string;
  formData: Record<string, string>;
  attachments?: ApplicationAttachment[];
  existingHonors?: StudentHonor[];
};

/** 更新申报请求 */
export type UpdateApplicationRequest = {
  formData?: Record<string, string>;
  attachments?: ApplicationAttachment[];
  existingHonors?: StudentHonor[];
};

/** 审批请求 */
export type ApproveApplicationRequest = {
  result: 'approved' | 'rejected' | 'returned';
  comment?: string;
};

/** 申报列表查询参数 */
export type ApplicationQueryParams = {
  campaignId?: string;
  studentId?: string;
  classId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
  currentStep?: ApprovalStep;
  page?: number;
  pageSize?: number;
};

/** 评选活动列表查询参数 */
export type CampaignQueryParams = {
  status?: CampaignStatus;
  honorType?: string;
  page?: number;
  pageSize?: number;
};

// ==================== 统计类型 ====================

/** 评选活动统计 */
export type CampaignStatistics = {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  passedApplications: number;
  classCount: number;
  studentCount: number;
};

/** 班级申报统计 */
export type ClassApplicationStatistics = {
  classId: string;
  className: string;
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

// ==================== 表单配置预设 ====================

/** 表单配置预设 - 优秀少先队员 */
export const FORM_PRESET_EXCELLENT_YOUNG_PIONEER: FormConfig = {
  fields: [
    {
      field: 'motto',
      label: '座右铭',
      type: 'text',
      required: false,
      placeholder: '请输入座右铭',
      maxLength: 50,
    },
    {
      field: 'deeds',
      label: '主要事迹',
      type: 'textarea',
      required: true,
      placeholder: '请详细描述学生的主要事迹和突出表现（500字以内）',
      maxLength: 500,
    },
    {
      field: 'performance',
      label: '学习表现',
      type: 'textarea',
      required: true,
      placeholder: '请描述学生的学习态度、成绩表现等',
      maxLength: 300,
    },
    {
      field: 'moral_character',
      label: '思想品德',
      type: 'textarea',
      required: true,
      placeholder: '请描述学生的思想品德表现',
      maxLength: 300,
    },
    {
      field: 'social_practice',
      label: '社会实践',
      type: 'textarea',
      required: false,
      placeholder: '请描述学生参与的社会实践活动',
      maxLength: 300,
    },
    {
      field: 'specialty',
      label: '特长爱好',
      type: 'textarea',
      required: false,
      placeholder: '请描述学生的特长和爱好',
      maxLength: 200,
    },
  ],
  instructions: '请如实填写申报材料，如有虚假，将取消评选资格。',
};

/** 表单配置预设 - 三好学生 */
export const FORM_PRESET_MERIT_STUDENT: FormConfig = {
  fields: [
    {
      field: 'deeds',
      label: '主要事迹',
      type: 'textarea',
      required: true,
      placeholder: '请详细描述学生在德、智、体、美、劳等方面的突出表现',
      maxLength: 500,
    },
    {
      field: 'study_situation',
      label: '学习情况',
      type: 'textarea',
      required: true,
      placeholder: '请描述学生的学习成绩、学习态度等',
      maxLength: 300,
    },
    {
      field: 'moral_situation',
      label: '品德表现',
      type: 'textarea',
      required: true,
      placeholder: '请描述学生的思想品德、行为习惯等',
      maxLength: 300,
    },
    {
      field: 'sports_situation',
      label: '体育锻炼',
      type: 'textarea',
      required: true,
      placeholder: '请描述学生的体育锻炼情况、体质健康等',
      maxLength: 200,
    },
  ],
  instructions: '三好学生评选标准：品德好、学习好、身体好。',
};

/** 荣誉级别选项 */
export const HONOR_LEVEL_OPTIONS: HonorLevel[] = ['校级', '区级', '市级', '省级', '国家级', '国际级'];

/** 荣誉类别选项 */
export const HONOR_CATEGORY_OPTIONS: HonorCategory[] = ['综合荣誉', '学科竞赛', '体育竞赛', '艺术竞赛', '科技竞赛', '社会实践', '其他'];

/** 获取当前学年（格式：2024-2025） */
export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // 9月之前算上一学年，9月及之后算新一学年
  if (month < 9) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
}

/** 学年选项（最近5年） */
export function getSchoolYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    options.push(`${year}-${year + 1}`);
  }
  return options;
}

/** 默认审批配置 */
export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  steps: ['head_teacher', 'moral_dept', 'moral_vice_principal'],
  allowReturn: true,
  timeoutDays: 7,
};

/** 审批步骤名称映射 */
export const APPROVAL_STEP_NAMES: Record<ApprovalStep, string> = {
  head_teacher: '班主任审批',
  moral_dept: '德育处审批',
  moral_vice_principal: '德育副校长审批',
};

/** 审批步骤顺序 */
export const APPROVAL_STEP_ORDER: ApprovalStep[] = ['head_teacher', 'moral_dept', 'moral_vice_principal'];
