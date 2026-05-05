/**
 * 公开的访客申请 API (门户端使用，无需登录)
 * POST - 提交访客/家长通行申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { accessControlService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.applicantName || !body.purpose || !body.expectedDate) {
      return NextResponse.json(
        error('缺少必填字段：姓名、来访事由、预计日期', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    if (!body.applicantType || !['parent', 'visitor'].includes(body.applicantType)) {
      return NextResponse.json(
        error('申请类型无效', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const result = await accessControlService.createApplication(body);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '提交失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch {
    return NextResponse.json(
      error('请求处理失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};
