import { NextRequest, NextResponse } from 'next/server';
import { success, error as err, ErrorCode } from '@/lib/api';
import { accessControlService } from '@/services/access-control.service';

// GET /api/general/staff - 获取后勤人员列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await accessControlService.getStaffList({
      search: searchParams.get('search') || undefined,
      department: searchParams.get('department') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    });

    if (!result.success) {
      return NextResponse.json(err(result.error || '查询失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data));
  } catch (e) {
    console.error('[Staff API] GET error:', e);
    return NextResponse.json(err('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

// POST /api/general/staff - 创建后勤人员
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, position, department, phone, area, photoUrl } = body;

    if (!name || !position || !department) {
      return NextResponse.json(err('姓名、岗位和部门为必填项', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await accessControlService.createStaff({
      name,
      position,
      department,
      phone,
      area,
      photoUrl,
    });

    if (!result.success) {
      return NextResponse.json(err(result.error || '创建失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data));
  } catch (e) {
    console.error('[Staff API] POST error:', e);
    return NextResponse.json(err('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
