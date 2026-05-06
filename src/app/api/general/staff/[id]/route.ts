import { NextRequest, NextResponse } from 'next/server';
import { success, error as err, ErrorCode } from '@/lib/api';
import { accessControlService } from '@/services/access-control.service';

// PUT /api/general/staff/[id] - 更新后勤人员
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await accessControlService.updateStaff(id, body);

    if (!result.success) {
      return NextResponse.json(err(result.error || '更新失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data));
  } catch (e) {
    console.error('[Staff API] PUT error:', e);
    return NextResponse.json(err('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

// DELETE /api/general/staff/[id] - 删除后勤人员
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await accessControlService.deleteStaff(id);

    if (!result.success) {
      return NextResponse.json(err(result.error || '删除失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(null));
  } catch (e) {
    console.error('[Staff API] DELETE error:', e);
    return NextResponse.json(err('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
