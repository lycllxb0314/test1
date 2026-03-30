/**
 * 搜索课文内容 API
 * 
 * 通过网络搜索获取指定课文的完整内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * 搜索课文内容
 * 
 * Query params:
 * - title: 课文标题
 * - grade: 年级
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const grade = searchParams.get('grade');
  const semester = searchParams.get('semester');
  
  if (!title) {
    return NextResponse.json(
      error('请提供课文标题', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new SearchClient(config, customHeaders);
    
    // 构建搜索查询
    const query = `人教版小学语文${grade ? grade + '年级' : ''}${semester || ''}《${title}》课文原文全文`;
    
    const response = await client.advancedSearch(query, {
      searchType: 'web',
      count: 5,
      needContent: true,
      needSummary: false,
    });
    
    if (!response.web_items || response.web_items.length === 0) {
      return NextResponse.json(
        error('未找到课文内容', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    // 从搜索结果中提取课文内容
    let content = '';
    
    for (const item of response.web_items) {
      // 优先使用content字段
      if (item.content && item.content.length > 200) {
        content = extractLessonContent(item.content, title);
        if (content && content.length > 100) {
          break;
        }
      }
      
      // 其次使用snippet
      if (!content && item.snippet && item.snippet.length > 100) {
        content = extractLessonContent(item.snippet, title);
      }
    }
    
    if (!content || content.length < 50) {
      return NextResponse.json(
        error('未能提取到有效的课文内容', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    return NextResponse.json(success({
      title,
      content,
      source: 'web_search',
    }));
  } catch (err) {
    console.error('[Search Lesson Content] Error:', err);
    return NextResponse.json(
      error('搜索课文内容失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * 从搜索结果中提取课文正文
 */
function extractLessonContent(text: string, title: string): string {
  // 移除HTML标签
  let content = text.replace(/<[^>]+>/g, '\n');
  
  // 先尝试提取标记为"原文"的部分
  const originalPatterns = [
    // 模式1: 明确标记的原文
    /(?:【?原文】?|【?课文原文】?|原文[：:\s]*)\n*([\s\S]{100,2000})(?=译文|赏析|作者简介|教学|版权|$)/i,
    // 模式2: 古文/文言文格式（没有标点符号或标点较少的长句）
    /([\u4e00-\u9fa5，。！？、；：""''！（）\n\s]{150,1500}?)(?=\n\s*译文|\n\s*赏析|\n\s*作者简介|\n\s*教学|创作背景)/i,
  ];
  
  for (const pattern of originalPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length > 100) {
      const extracted = match[1].trim();
      // 检查是否像古文（标点密度低）
      const punctuationCount = (extracted.match(/[，。！？、；：]/g) || []).length;
      const ratio = punctuationCount / extracted.length;
      // 如果标点密度低于0.05，很可能是古文原文
      if (ratio < 0.08 || title.includes('观潮') || title.includes('古文')) {
        return cleanContent(extracted);
      }
    }
  }
  
  // 尝试常规模式提取课文正文
  const patterns = [
    // 模式1: 标题后的正文内容
    new RegExp(`《?${title}》?[^\\n]*\\n+([\\s\\S]{100,2000})(?=\n\n|作者简介|教学设计|教学反思|教案|版权|上一篇|下一篇|译文|赏析|$)`, 'i'),
    // 模式2: 找到较长的中文段落
    /([\u4e00-\u9fa5，。！？、；：""''！（）\n\s]{200,1500})/,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      content = match[1].trim();
      break;
    }
  }
  
  return cleanContent(content);
}

/**
 * 清理内容
 */
function cleanContent(content: string): string {
  // 清理内容
  content = content
    .replace(/\n{3,}/g, '\n\n')  // 合并多余换行
    .replace(/[^\u4e00-\u9fa5，。！？、；：""''！（）\n\s]/g, '')  // 保留中文和标点
    .trim();
  
  // 如果内容以作者信息开头，尝试移除
  if (/^作者[：:简介]/.test(content)) {
    const lines = content.split('\n');
    content = lines.slice(1).join('\n').trim();
  }
  
  // 截取合理长度（最长2000字）
  if (content.length > 2000) {
    content = content.slice(0, 2000);
  }
  
  return content;
}
