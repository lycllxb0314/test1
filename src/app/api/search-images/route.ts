import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { query, count } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new SearchClient(config, customHeaders);

    const response = await client.imageSearch(
      query || '龙岩师范附属小学',
      count || 20
    );

    return NextResponse.json({
      success: true,
      images: response.image_items?.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.image?.url,
        width: item.image?.width,
        height: item.image?.height,
        source: item.site_name,
      })) || [],
    });
  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
