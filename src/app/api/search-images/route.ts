/**
 * 图片搜索 API
 * 
 * POST - 搜索图片
 * 
 * ⚠️ 架构原则：
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { SearchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * POST - 搜索图片
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { query, count } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new SearchClient(config, customHeaders);

    const response = await client.imageSearch(
      query || '龙岩师范附属小学',
      count || 20
    );

    return NextResponse.json(success({
      images: response.image_items?.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.image?.url,
        width: item.image?.width,
        height: item.image?.height,
        source: item.site_name,
      })) || [],
    }));
  } catch (err) {
    console.error('Image search error:', err);
    return NextResponse.json(
      error('Failed to search images', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
