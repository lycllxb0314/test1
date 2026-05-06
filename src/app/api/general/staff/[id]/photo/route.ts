import { NextRequest, NextResponse } from 'next/server';
import { success, error as err, ErrorCode } from '@/lib/api';
import { accessControlService } from '@/services/access-control.service';

// POST /api/general/staff/[id]/photo - 上传/更新后勤人员照片
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { photoUrl } = body;

    if (!photoUrl) {
      return NextResponse.json(err('照片URL不能为空', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await accessControlService.updateStaffPhoto(id, photoUrl);

    if (!result.success) {
      return NextResponse.json(err(result.error || '更新照片失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success({ message: '照片已更新，人脸向量正在后台生成' }));
  } catch (e) {
    console.error('[Staff Photo API] POST error:', e);
    return NextResponse.json(err('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
