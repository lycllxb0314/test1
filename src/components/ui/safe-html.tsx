'use client';

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  /** 要渲染的HTML内容 */
  html: string;
  /** 允许的HTML标签（默认：基础格式化标签） */
  allowedTags?: string[];
  /** 允许的HTML属性（默认：href, target, class） */
  allowedAttributes?: Record<string, string[]>;
  /** 额外的CSS类名 */
  className?: string;
}

/**
 * 安全的HTML渲染组件
 * 
 * 使用DOMPurify对HTML内容进行消毒，防止XSS攻击
 * 默认只允许安全的格式化标签
 */
export function SafeHtml({
  html,
  allowedTags,
  allowedAttributes,
  className,
}: SafeHtmlProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';
    
    // 默认允许的标签（安全的格式化标签）
    const defaultAllowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'span', 'div',
    ];
    
    // 默认允许的属性
    const defaultAllowedAttributes: Record<string, string[]> = {
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'style'],
    };
    
    // 配置DOMPurify
    const config = {
      ALLOWED_TAGS: allowedTags || defaultAllowedTags,
      ALLOWED_ATTR: allowedAttributes 
        ? Object.values(allowedAttributes).flat()
        : Object.values(defaultAllowedAttributes).flat(),
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'], // 允许链接在新窗口打开
    };
    
    // 添加rel="noopener noreferrer"到所有外部链接
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    return DOMPurify.sanitize(html, config);
  }, [html, allowedTags, allowedAttributes]);
  
  if (!sanitizedHtml) return null;
  
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * 简单的纯文本渲染组件
 * 将换行符转换为<br>，保留基本格式
 */
export function SafeText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  
  // 转义HTML特殊字符
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // 将换行符转换为<br>
  const formattedText = escapedText.replace(/\n/g, '<br>');
  
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
}

export default SafeHtml;
