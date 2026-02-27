import { NextRequest, NextResponse } from 'next/server';

// 新生注册申请类型
interface NewStudentApplication {
  id: string;
  // 学生基本信息
  studentName: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  
  // 申请信息
  applyGrade: number;          // 申请年级
  applyClass?: string;         // 分配班级（教务分配）
  
  // 家庭信息
  parentName: string;
  parentPhone: string;
  parentRelation: string;      // 与学生关系
  parent2Name?: string;
  parent2Phone?: string;
  parent2Relation?: string;
  
  // 地址
  homeAddress: string;
  
  // 学生类型
  studentType: '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭';
  
  // 状态
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'synced';
  
  // 时间戳
  submittedAt: string;         // 家长提交时间
  reviewedAt?: string;         // 教务审核时间
  syncedAt?: string;           // 同步到学生管理时间
  
  reviewedBy?: string;         // 审核人
  syncedBy?: string;           // 同步人
  notes?: string;              // 备注
}

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
    applyGrade: 1,
    parentName: '张伟',
    parentPhone: '13800138001',
    parentRelation: '父亲',
    parent2Name: '李芳',
    parent2Phone: '13800138002',
    parent2Relation: '母亲',
    homeAddress: '龙岩市新罗区东城街道xx路xx号',
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
    parentName: '林建国',
    parentPhone: '13900139001',
    parentRelation: '父亲',
    homeAddress: '龙岩市新罗区西城街道xx路xx号',
    studentType: '随迁子女',
    status: 'approved',
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
    applyGrade: 1,
    applyClass: '一年(1)班',
    parentName: '王志强',
    parentPhone: '13700137001',
    parentRelation: '父亲',
    parent2Name: '刘小燕',
    parent2Phone: '13700137002',
    parent2Relation: '母亲',
    homeAddress: '龙岩市新罗区南城街道xx路xx号',
    studentType: '普通',
    status: 'synced',
    submittedAt: '2024-08-10 09:15:00',
    reviewedAt: '2024-08-12 10:00:00',
    reviewedBy: '王主任',
    syncedAt: '2024-08-20 14:30:00',
    syncedBy: '王主任',
  },
];

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
  try {
    const body = await request.json();
    
    const newApplication: NewStudentApplication = {
      id: `ns${String(mockApplications.length + 1).padStart(3, '0')}`,
      ...body,
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    
    mockApplications.unshift(newApplication);
    
    return NextResponse.json({
      success: true,
      data: newApplication,
      message: '新生注册申请已提交'
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: '提交失败'
    }, { status: 400 });
  }
}

// PUT - 更新申请状态（审核/同步）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, applyClass, notes, operator } = body;
    
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
        app.status = 'reviewing';
        app.reviewedBy = operator;
        app.reviewedAt = now;
        break;
      case 'approve':
        app.status = 'approved';
        app.applyClass = applyClass;
        app.reviewedBy = operator;
        app.reviewedAt = now;
        app.notes = notes;
        break;
      case 'reject':
        app.status = 'rejected';
        app.reviewedBy = operator;
        app.reviewedAt = now;
        app.notes = notes;
        break;
      case 'sync':
        app.status = 'synced';
        app.syncedBy = operator;
        app.syncedAt = now;
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
