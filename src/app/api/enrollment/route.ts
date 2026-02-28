import { NextRequest, NextResponse } from 'next/server';
import type { Parent } from '@/types';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { encryptObject, decryptObject, getEncryptedFields } from '@/lib/encryption';
import { maskIdCard, maskPhone, maskAddress } from '@/lib/masking';

// 扩展的新生注册申请类型 - 与 StudentFullProfile 对齐
interface NewStudentApplication {
  id: string;
  
  // === 基本信息（与学生管理对齐）===
  studentName: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;     // 政治面貌（少先队员等）
  
  // === 申请信息 ===
  applyGrade: number;           // 申请年级（1-6）
  applyClassId?: string;        // 分配班级ID（教务分配）
  applyClassName?: string;      // 分配班级名称
  
  // === 联系信息 ===
  homeAddress: string;
  phone?: string;               // 学生联系电话（可选）
  
  // === 家庭信息（与学生管理对齐）===
  familyType?: '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他';
  parents: Parent[];            // 家长信息列表
  emergencyContact?: string;    // 紧急联系人
  emergencyPhone?: string;      // 紧急联系电话
  
  // === 学生类型 ===
  studentType: '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭';
  
  // === 附件 ===
  attachments?: {
    idCardFront?: string;       // 身份证正面
    idCardBack?: string;        // 身份证背面
    householdRegister?: string; // 户口本
    birthCertificate?: string;  // 出生证明
    other?: string[];           // 其他证明材料
  };
  
  // === 状态 ===
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'synced';
  
  // === 时间戳 ===
  submittedAt: string;          // 家长提交时间
  reviewedAt?: string;          // 教务审核时间
  syncedAt?: string;            // 同步到学生管理时间
  
  // === 操作人 ===
  reviewedBy?: string;
  syncedBy?: string;
  notes?: string;
  
  // === 同步结果 ===
  syncResult?: {
    success: boolean;
    studentId?: string;         // 同步后的学生ID
    studentNo?: string;         // 分配的学号
    error?: string;
  };
}

// 需要加密的敏感字段
const ENCRYPTED_FIELDS = ['idCard', 'homeAddress', 'phone'];

// Mock数据
let mockApplications: NewStudentApplication[] = [
  {
    id: 'ns001',
    studentName: '张明轩',
    gender: 'male',
    birthDate: '2019-03-15',
    idCard: '350802201903150011',
    ethnicity: '汉族',
    nativePlace: '福建龙岩',
    politicalStatus: '少先队员',
    applyGrade: 1,
    homeAddress: '龙岩市新罗区东城街道xx路xx号',
    familyType: '核心家庭',
    parents: [
      { id: 'p1', name: '张伟', relationship: '父亲', phone: '13800138001', isPrimary: true },
      { id: 'p2', name: '李芳', relationship: '母亲', phone: '13800138002', isPrimary: false }
    ],
    emergencyContact: '张伟',
    emergencyPhone: '13800138001',
    studentType: '普通',
    status: 'pending',
    submittedAt: '2024-08-15 10:30:00',
  },
  {
    id: 'ns002',
    studentName: '林思雨',
    gender: 'female',
    birthDate: '2019-05-20',
    idCard: '350802201905200022',
    ethnicity: '汉族',
    nativePlace: '福建龙岩',
    applyGrade: 1,
    homeAddress: '龙岩市新罗区西城街道xx路xx号',
    familyType: '单亲家庭',
    parents: [
      { id: 'p1', name: '林建国', relationship: '父亲', phone: '13900139001', isPrimary: true }
    ],
    emergencyContact: '林建国',
    emergencyPhone: '13900139001',
    studentType: '随迁子女',
    status: 'approved',
    applyClassId: 'c1-1',
    applyClassName: '一年(1)班',
    submittedAt: '2024-08-14 14:20:00',
    reviewedAt: '2024-08-16 09:00:00',
    reviewedBy: '王主任',
  },
  {
    id: 'ns003',
    studentName: '王浩然',
    gender: 'male',
    birthDate: '2018-11-08',
    idCard: '350802201811080033',
    ethnicity: '汉族',
    nativePlace: '福建龙岩',
    politicalStatus: '少先队员',
    applyGrade: 1,
    applyClassId: 'c1-1',
    applyClassName: '一年(1)班',
    homeAddress: '龙岩市新罗区南城街道xx路xx号',
    familyType: '核心家庭',
    parents: [
      { id: 'p1', name: '王志强', relationship: '父亲', phone: '13700137001', isPrimary: true },
      { id: 'p2', name: '刘小燕', relationship: '母亲', phone: '13700137002', isPrimary: false }
    ],
    emergencyContact: '王志强',
    emergencyPhone: '13700137001',
    studentType: '普通',
    status: 'synced',
    submittedAt: '2024-08-10 09:15:00',
    reviewedAt: '2024-08-12 10:00:00',
    reviewedBy: '王主任',
    syncedAt: '2024-08-20 14:30:00',
    syncedBy: '王主任',
    syncResult: {
      success: true,
      studentId: 's-new-001',
      studentNo: '2024001'
    }
  },
];

// 年级名称映射
const gradeNames: Record<number, string> = {
  1: '一年级',
  2: '二年级', 
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级'
};

// 生成学号（年份 + 年级 + 班级号 + 序号）
function generateStudentNo(grade: number, classNumber: number, sequence: number): string {
  const year = new Date().getFullYear();
  const gradeStr = String(grade);
  const classStr = String(classNumber).padStart(2, '0');
  const seqStr = String(sequence).padStart(3, '0');
  return `${year}${gradeStr}${classStr}${seqStr}`;
}

// 将新生申请转换为学生记录格式
function convertToStudentRecord(app: NewStudentApplication, classNumber: number, sequence: number) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  return {
    // 基本信息
    id: `s-${app.id}`,
    studentNo: generateStudentNo(app.applyGrade, classNumber, sequence),
    name: app.studentName,
    gender: app.gender,
    birthDate: app.birthDate,
    idCard: app.idCard,
    ethnicity: app.ethnicity,
    nativePlace: app.nativePlace,
    politicalStatus: app.politicalStatus,
    
    // 学籍信息
    grade: app.applyGrade,
    gradeName: gradeNames[app.applyGrade],
    classId: app.applyClassId,
    className: app.applyClassName,
    classNumber: classNumber,
    enrollmentDate: now.split(' ')[0],
    studentType: app.studentType,
    
    // 联系信息
    phone: app.phone,
    address: app.homeAddress,
    homeAddress: app.homeAddress,
    
    // 家庭信息
    familyType: app.familyType,
    parents: app.parents,
    emergencyContact: app.emergencyContact,
    emergencyPhone: app.emergencyPhone,
    
    // 状态
    status: '在校' as const,
    
    // 初始化空数组
    academicRecords: [],
    honors: [],
    growthRecords: [{
      id: `gr-${app.id}`,
      studentId: `s-${app.id}`,
      type: '入学' as const,
      title: '新生入学',
      description: `通过新生注册审核入学，分配至${app.applyClassName}`,
      date: now.split(' ')[0],
      operator: app.syncedBy,
      createdAt: now
    }],
    moralRecords: [],
    
    // 时间戳
    createdAt: now,
    updatedAt: now
  };
}

// GET - 获取新生注册列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const grade = searchParams.get('grade');
  
  let filtered = [...mockApplications];
  
  if (status && status !== 'all') {
    filtered = filtered.filter(app => app.status === status);
  }
  
  if (grade) {
    filtered = filtered.filter(app => app.applyGrade === parseInt(grade));
  }
  
  return NextResponse.json({
    success: true,
    data: filtered,
    summary: {
      total: mockApplications.length,
      pending: mockApplications.filter(a => a.status === 'pending').length,
      reviewing: mockApplications.filter(a => a.status === 'reviewing').length,
      approved: mockApplications.filter(a => a.status === 'approved').length,
      rejected: mockApplications.filter(a => a.status === 'rejected').length,
      synced: mockApplications.filter(a => a.status === 'synced').length,
    }
  });
}

// POST - 创建新生注册申请（家长端提交）
export async function POST(request: NextRequest) {
  // 限流检查（高并发保护：开学季家长集中提交）
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  try {
    const body = await request.json();
    
    // 转换家长信息格式
    const parents: Parent[] = [];
    if (body.parentName && body.parentPhone) {
      parents.push({
        id: `p1-${Date.now()}`,
        name: body.parentName,
        relationship: body.parentRelation || '父亲',
        phone: body.parentPhone,
        isPrimary: true,
        wechat: body.parentWechat
      });
    }
    if (body.parent2Name && body.parent2Phone) {
      parents.push({
        id: `p2-${Date.now()}`,
        name: body.parent2Name,
        relationship: body.parent2Relation || '母亲',
        phone: body.parent2Phone,
        isPrimary: false,
        wechat: body.parent2Wechat
      });
    }
    
    const newApplication: NewStudentApplication = {
      id: `ns${String(mockApplications.length + 1).padStart(3, '0')}`,
      studentName: body.studentName,
      gender: body.gender,
      birthDate: body.birthDate,
      idCard: body.idCard,
      ethnicity: body.ethnicity,
      nativePlace: body.nativePlace,
      politicalStatus: body.politicalStatus,
      applyGrade: body.applyGrade || 1,
      homeAddress: body.homeAddress,
      phone: body.phone,
      familyType: body.familyType,
      parents: parents,
      emergencyContact: body.emergencyContact || body.parentName,
      emergencyPhone: body.emergencyPhone || body.parentPhone,
      studentType: body.studentType || '普通',
      attachments: body.attachments,
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    
    // 加密敏感字段（身份证、地址、手机号）
    const encryptedApp = encryptObject(newApplication as unknown as Record<string, unknown>, ENCRYPTED_FIELDS);
    
    // 对家长手机号也加密
    if (Array.isArray(encryptedApp.parents)) {
      encryptedApp.parents = (encryptedApp.parents as Parent[]).map((p: Parent) => 
        encryptObject(p as unknown as Record<string, unknown>, ['phone'])
      );
    }
    
    mockApplications.unshift(encryptedApp as unknown as NewStudentApplication);
    
    // 返回时对敏感字段脱敏
    const maskedResult = {
      ...newApplication,
      idCard: newApplication.idCard ? maskIdCard(newApplication.idCard) : undefined,
      homeAddress: newApplication.homeAddress ? maskAddress(newApplication.homeAddress) : undefined,
      phone: newApplication.phone ? maskPhone(newApplication.phone) : undefined,
      parents: newApplication.parents?.map((p: Parent) => ({
        ...p,
        phone: p.phone ? maskPhone(p.phone) : undefined,
      })),
    };
    
    return NextResponse.json({
      success: true,
      data: maskedResult,
      message: '新生注册申请已提交'
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: '提交失败'
    }, { status: 400 });
  }
}

// PUT - 更新申请状态（审核/分配班级/同步）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, applyClassId, applyClassName, notes, operator } = body;
    
    const appIndex = mockApplications.findIndex(a => a.id === id);
    if (appIndex === -1) {
      return NextResponse.json({
        success: false,
        message: '申请不存在'
      }, { status: 404 });
    }
    
    const app = mockApplications[appIndex];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    switch (action) {
      case 'review':
        // 开始审核
        app.status = 'reviewing';
        app.reviewedBy = operator;
        app.reviewedAt = now;
        break;
        
      case 'approve':
        // 审核通过并分配班级
        if (!applyClassId || !applyClassName) {
          return NextResponse.json({
            success: false,
            message: '请选择分配班级'
          }, { status: 400 });
        }
        app.status = 'approved';
        app.applyClassId = applyClassId;
        app.applyClassName = applyClassName;
        app.reviewedBy = operator;
        app.reviewedAt = now;
        app.notes = notes;
        break;
        
      case 'reject':
        // 审核拒绝
        app.status = 'rejected';
        app.reviewedBy = operator;
        app.reviewedAt = now;
        app.notes = notes;
        break;
        
      case 'sync':
        // 同步到学生管理系统
        if (app.status !== 'approved') {
          return NextResponse.json({
            success: false,
            message: '只能同步已审核通过的申请'
          }, { status: 400 });
        }
        
        try {
          // 从班级名称提取班级号
          const classNumberMatch = app.applyClassName?.match(/(\d+)班/);
          const classNumber = classNumberMatch ? parseInt(classNumberMatch[1]) : 1;
          
          // 转换为学生记录
          const studentRecord = convertToStudentRecord(app, classNumber, appIndex + 1);
          
          // 这里应该调用学生管理API创建学生记录
          // 目前仅更新状态，实际项目中需要调用数据库或学生管理API
          
          app.status = 'synced';
          app.syncedBy = operator;
          app.syncedAt = now;
          app.syncResult = {
            success: true,
            studentId: studentRecord.id,
            studentNo: studentRecord.studentNo
          };
        } catch (syncError) {
          app.syncResult = {
            success: false,
            error: syncError instanceof Error ? syncError.message : '同步失败'
          };
          return NextResponse.json({
            success: false,
            message: '同步失败',
            error: app.syncResult.error
          }, { status: 500 });
        }
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: '无效操作'
        }, { status: 400 });
    }
    
    mockApplications[appIndex] = app;
    
    return NextResponse.json({
      success: true,
      data: app,
      message: '操作成功'
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: '操作失败'
    }, { status: 400 });
  }
}

// DELETE - 批量同步已审核通过的学生
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, operator } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请选择要同步的申请'
      }, { status: 400 });
    }
    
    const results: { id: string; success: boolean; studentNo?: string; error?: string }[] = [];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    for (const id of ids) {
      const appIndex = mockApplications.findIndex(a => a.id === id);
      if (appIndex === -1) {
        results.push({ id, success: false, error: '申请不存在' });
        continue;
      }
      
      const app = mockApplications[appIndex];
      
      if (app.status !== 'approved') {
        results.push({ id, success: false, error: '只能同步已审核通过的申请' });
        continue;
      }
      
      try {
        // 从班级名称提取班级号
        const classNumberMatch = app.applyClassName?.match(/(\d+)班/);
        const classNumber = classNumberMatch ? parseInt(classNumberMatch[1]) : 1;
        
        // 转换为学生记录
        const studentRecord = convertToStudentRecord(app, classNumber, appIndex + 1);
        
        // 更新申请状态
        app.status = 'synced';
        app.syncedBy = operator;
        app.syncedAt = now;
        app.syncResult = {
          success: true,
          studentId: studentRecord.id,
          studentNo: studentRecord.studentNo
        };
        
        mockApplications[appIndex] = app;
        results.push({ id, success: true, studentNo: studentRecord.studentNo });
      } catch (syncError) {
        results.push({ 
          id, 
          success: false, 
          error: syncError instanceof Error ? syncError.message : '同步失败' 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `成功同步 ${successCount} 条，失败 ${failCount} 条`,
      results
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: '批量同步失败'
    }, { status: 400 });
  }
}
