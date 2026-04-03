/**
 * 申报表打印预览弹窗
 * 
 * @module components/honors/HonorApplicationPrintDialog
 * 
 * 功能：
 * - 立即显示HTML预览（无需等待）
 * - 后台异步生成PDF
 * - 申报专属水印（学校logo+学校名称）
 * - 支持下载和打印
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Download,
  Printer,
  Loader2,
  FileText,
  FileOutput,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { HonorApplication } from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';

/** Props 类型 */
type HonorApplicationPrintDialogProps = {
  /** 是否打开 */
  open: boolean;
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 申报记录 */
  application: HonorApplication | null;
  /** 学校名称 */
  schoolName?: string;
};

/** 水印配置 */
const WATERMARK_CONFIG = {
  color: 'rgba(180, 180, 180, 0.10)',
  fontSize: 16,         // 缩小字体
  rotate: -25,
  gap: 120,             // 缩小间距，增加密度
  logoSize: 24,         // 缩小logo
  logoTextGap: 6,       // logo和文字之间的间距
  scale: 2,             // 高清缩放比例
};

/**
 * 创建带logo的水印图案（返回 data URL）
 * 异步加载学校logo图片后绘制
 * logo和文字在同一条水平线上
 */
async function createWatermarkPattern(schoolName: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const { color, fontSize, rotate, gap, logoSize, logoTextGap, scale } = WATERMARK_CONFIG;
  
  // 设置高清画布尺寸（2倍分辨率）
  canvas.width = gap * 2 * scale;
  canvas.height = gap * 2 * scale;

  // 尝试加载学校logo
  let logoImage: HTMLImageElement | null = null;
  try {
    logoImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Logo load failed'));
      img.src = '/logo-school.png';
    });
  } catch {
    // logo加载失败，仅使用文字
  }

  // 缩放上下文以支持高清绘制
  ctx.scale(scale, scale);

  // 设置字体以测量文字宽度
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  const textWidth = ctx.measureText(schoolName).width;
  
  // 计算总宽度：logo + 间距 + 文字
  const totalWidth = (logoImage ? logoSize + logoTextGap : 0) + textWidth;

  // 移动到中心点并旋转
  ctx.translate(gap, gap);  // 使用未缩放的gap值
  ctx.rotate((rotate * Math.PI) / 180);

  // 从中心点开始绘制，整体水平居中
  let currentX = -totalWidth / 2;

  // 绘制logo（如果有）- 在左边
  if (logoImage) {
    ctx.globalAlpha = 0.15;
    // 启用图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      logoImage,
      currentX,
      -logoSize / 2, // 垂直居中
      logoSize,
      logoSize
    );
    ctx.globalAlpha = 1;
    currentX += logoSize + logoTextGap;
  }

  // 绘制文字 - 在logo右边，同一水平线
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(schoolName, currentX, 0);

  return canvas.toDataURL('image/png');
}

/**
 * 申报表打印预览弹窗
 */
export function HonorApplicationPrintDialog({
  open,
  onOpenChange,
  application,
  schoolName = '龙岩师范附属小学',
}: HonorApplicationPrintDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [watermarkPattern, setWatermarkPattern] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  // 初始化水印（异步加载logo）
  useEffect(() => {
    createWatermarkPattern(schoolName).then(setWatermarkPattern);
  }, [schoolName]);

  // 生成 PDF（后台异步）
  const generatePdf = useCallback(async () => {
    if (!contentRef.current || !application) return;

    setGenerating(true);
    try {
      // 使用 html2canvas 截图（降低 scale 提升速度）
      const canvas = await html2canvas(contentRef.current, {
        scale: 1.5, // 降低 scale 提升速度
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      });

      // 计算 PDF 尺寸 (A4)
      const imgWidth = 210; // A4 宽度 mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 高度 mm

      // 创建 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 创建带logo的水印图案（logo和文字水平对齐，高清）
      const watermarkCanvas = document.createElement('canvas');
      const wCtx = watermarkCanvas.getContext('2d');
      if (wCtx) {
        // 高清尺寸
        const scale = 2;
        const baseSize = 300;
        watermarkCanvas.width = baseSize * 2 * scale;
        watermarkCanvas.height = baseSize * 2 * scale;
        
        // 尝试加载logo
        let logoImg: HTMLImageElement | null = null;
        try {
          logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Logo load failed'));
            img.src = '/logo-school.png';
          });
        } catch {
          // logo加载失败，仅使用文字
        }

        // 缩放上下文
        wCtx.scale(scale, scale);

        // 设置字体测量文字宽度（放大尺寸）
        const fontSize = 24;
        const logoSize = 36;
        const logoTextGap = 8;
        wCtx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const textWidth = wCtx.measureText(schoolName).width;
        const totalWidth = (logoImg ? logoSize + logoTextGap : 0) + textWidth;

        // 移动到中心并旋转
        wCtx.translate(baseSize, baseSize);
        wCtx.rotate((-25 * Math.PI) / 180);

        // 从中心开始绘制，整体水平居中
        let currentX = -totalWidth / 2;

        // 绘制logo（左边）
        if (logoImg) {
          wCtx.globalAlpha = 0.15;
          wCtx.imageSmoothingEnabled = true;
          wCtx.imageSmoothingQuality = 'high';
          wCtx.drawImage(logoImg, currentX, -logoSize / 2, logoSize, logoSize);
          wCtx.globalAlpha = 1;
          currentX += logoSize + logoTextGap;
        }

        // 绘制文字（右边，同一水平线）
        wCtx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        wCtx.fillStyle = 'rgba(180, 180, 180, 0.2)';
        wCtx.textAlign = 'left';
        wCtx.textBaseline = 'middle';
        wCtx.fillText(schoolName, currentX, 0);
      }

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png', 0.8); // 压缩图片

      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果内容超过一页，添加更多页
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 添加水印到每一页
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        if (watermarkCanvas) {
          const watermarkData = watermarkCanvas.toDataURL('image/png');
          // 在页面中心添加水印
          pdf.addImage(watermarkData, 'PNG', 105, 148.5, 80, 80);
        }
      }

      // 生成 Blob URL
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('生成 PDF 失败:', error);
      toast.error('生成 PDF 失败');
    } finally {
      setGenerating(false);
    }
  }, [application, schoolName]);

  // 打开时异步生成 PDF
  useEffect(() => {
    if (open && application) {
      setPdfUrl(null);
      // 延迟生成 PDF，让用户先看到 HTML 预览
      const timer = setTimeout(() => {
        generatePdf();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application?.id]);

  // 关闭时清理
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // 下载 PDF
  const handleDownload = () => {
    if (!pdfUrl || !application) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${application.studentName}_${application.campaign?.title || '申报表'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 打印
  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // 快速打印 HTML（直接打印预览内容）
  const handleQuickPrint = () => {
    if (!contentRef.current || !application) return;
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    // 获取当前内容的 HTML
    const contentHtml = contentRef.current.innerHTML;
    
    // 创建打印页面
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>申报表打印 - ${application.studentName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            box-sizing: border-box;
            background-image: url('${watermarkPattern}');
            background-repeat: repeat;
          }
          @media print {
            .page {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">${contentHtml}</div>
        <script>
          // 自动打印
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!application) return null;

  const campaign = application.campaign;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        {/* 头部 */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary" />
              <span>申报表预览</span>
              {generating && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  生成PDF中...
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickPrint}
                title="直接打印（快速）"
              >
                <FileOutput className="w-4 h-4 mr-1" />
                快速打印
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfUrl}
                title="下载PDF文件"
              >
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={!pdfUrl}
                title="打印PDF文件"
              >
                <Printer className="w-4 h-4 mr-1" />
                打印
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 预览区域 - 立即显示 HTML 预览 */}
        <div className="flex-1 relative overflow-auto bg-gray-100 print:bg-white">
          {/* HTML 内容预览（立即显示） */}
          <div 
            ref={contentRef}
            className="bg-white mx-auto print:mx-0 print:w-full relative"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              padding: '15mm',
              // 水印在文档内容区域内
              backgroundImage: watermarkPattern ? `url(${watermarkPattern})` : 'none',
              backgroundRepeat: 'repeat',
            }}
          >
            {/* 学校 Logo 和标题 */}
            <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                {/* 学校 Logo */}
                <img 
                  src="/logo-school.png" 
                  alt={schoolName}
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                  }}
                />
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
                    {campaign?.title || '荣誉评选申报表'}
                  </h1>
                  {campaign?.honorType && (
                    <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px', margin: '2px 0 0 0' }}>
                      {campaign.honorType}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ width: '100px', height: '3px', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', margin: '0 auto', borderRadius: '2px' }} />
            </div>

            {/* 基本信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ color: '#9ca3af', fontSize: '11px' }}>学生姓名</span>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '2px 0 0 0', color: '#1f2937' }}>{application.studentName}</p>
              </div>
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ color: '#9ca3af', fontSize: '11px' }}>所在班级</span>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '2px 0 0 0', color: '#1f2937' }}>{application.className}</p>
              </div>
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ color: '#9ca3af', fontSize: '11px' }}>申报荣誉</span>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '2px 0 0 0', color: '#1f2937' }}>{campaign?.honorType || '-'}</p>
              </div>
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ color: '#9ca3af', fontSize: '11px' }}>申报日期</span>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '2px 0 0 0', color: '#1f2937' }}>
                  {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* 申报内容 */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                申报内容
              </h2>
              {/* 字段映射：使用formConfig.fields的label */}
              {(() => {
                // 构建字段名到标签的映射
                const fieldLabels: Record<string, string> = {};
                if (campaign?.formConfig?.fields) {
                  campaign.formConfig.fields.forEach(f => {
                    fieldLabels[f.field] = f.label;
                  });
                }
                
                return Object.entries(application.formData).map(([key, value]) => {
                  // 使用映射后的中文标签，如果没有映射则使用原key
                  const label = fieldLabels[key] || key;
                  return (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <h3 style={{ fontWeight: 500, marginBottom: '4px', fontSize: '12px', color: '#4b5563' }}>{label}</h3>
                      <p style={{ color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, fontSize: '13px' }}>
                        {value || '-'}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>

            {/* 已获奖荣誉 */}
            {application.existingHonors && application.existingHonors.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                  已获奖荣誉
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>荣誉名称</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>级别</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>类别</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>颁发单位</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>获奖日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.existingHonors.map((honor, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>{honor.title}</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>{honor.level || '校级'}</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>{honor.category || '其他'}</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>{honor.issuer || '-'}</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>{honor.date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 审批意见 */}
            {application.approvalComments.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                  审批意见
                </h2>
                {application.approvalComments.map((comment, index) => (
                  <div key={index} style={{ marginBottom: '12px', padding: '10px', background: '#f9fafb', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, fontSize: '12px' }}>{APPROVAL_STEP_NAMES[comment.step]}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{comment.approverName}</span>
                        <span style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: comment.result === 'approved' ? '#dcfce7' : '#fee2e2',
                          color: comment.result === 'approved' ? '#16a34a' : '#dc2626',
                        }}>
                          {comment.result === 'approved' ? '同意' : comment.result === 'rejected' ? '不同意' : ''}
                        </span>
                      </div>
                    </div>
                    {comment.comment && (
                      <p style={{ color: '#4b5563', margin: '4px 0 0 0', fontSize: '12px' }}>
                        {comment.comment}
                      </p>
                    )}
                    <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>
                      {new Date(comment.time).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 底部签字栏 */}
            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #d1d5db', height: '40px', marginBottom: '8px' }} />
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>家长签字</p>
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>日期：______年______月______日</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #d1d5db', height: '40px', marginBottom: '8px' }} />
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>班主任签字</p>
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>日期：______年______月______日</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #d1d5db', height: '40px', marginBottom: '8px' }} />
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>学校盖章</p>
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>日期：______年______月______日</p>
              </div>
            </div>

            {/* 底部信息 */}
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <p style={{ margin: 0 }}>申报编号：{application.id}</p>
              <p style={{ marginTop: '4px', margin: '4px 0 0 0' }}>{schoolName}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
