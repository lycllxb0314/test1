'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileSignature, CheckCircle, Clock, Circle, SkipForward,
  Upload, X, Loader2, Image as ImageIcon, FileVideo, FileAudio, File, Play,
} from 'lucide-react';
import { SOPExecution } from '@/types/class-sop';
import { categoryConfig, AttachmentData } from '../lib/constants';
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  execution: SOPExecution | null;
  onUpdateStep: (id: string, order: number, action: 'start' | 'complete' | 'skip', content?: string, attachments?: AttachmentData[]) => void;
  onComplete: (id: string, summary: string) => void;
}

// 步骤卡片
const StepCard: React.FC<{
  step: { stepOrder: number; stepTitle: string; status: string; content?: string; attachments?: AttachmentData[] };
  index: number;
  isActive: boolean;
  content: string;
  attachments: AttachmentData[];
  onContentChange: (c: string) => void;
  onAttachmentsChange: (a: AttachmentData[]) => void;
  onStart: () => void;
  onComplete: () => void;
  onSkip: (reason: string) => void;
  executionId?: string;
}> = ({ step, index, isActive, content, attachments, onContentChange, onAttachmentsChange, onStart, onComplete, onSkip, executionId }) => {
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusConfig = {
    pending: { icon: Circle, bg: 'bg-slate-200 text-slate-400', label: '待处理' },
    in_progress: { icon: Clock, bg: 'bg-blue-500 text-white', label: '进行中' },
    completed: { icon: CheckCircle, bg: 'bg-emerald-500 text-white', label: '已完成' },
    skipped: { icon: SkipForward, bg: 'bg-slate-400 text-white', label: '已跳过' },
  };

  const config = statusConfig[step.status as keyof typeof statusConfig];
  const Icon = config.icon;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !executionId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('executionId', executionId);
      formData.append('stepOrder', String(step.stepOrder));

      const res = await fetch('/api/class-sop/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onAttachmentsChange([...attachments, data.data]);
      } else {
        alert(data.error || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (idx: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== idx));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image')) return ImageIcon;
    if (type.startsWith('video')) return FileVideo;
    if (type.startsWith('audio')) return FileAudio;
    return File;
  };

  return (
    <div className={`rounded-xl border ${
      step.status === 'in_progress'
        ? 'border-blue-500 bg-blue-50/50'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${step.status === 'in_progress' ? 'animate-spin' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">{step.stepTitle}</span>
              <Badge variant="outline" className="text-xs">{config.label}</Badge>
            </div>

            {/* 已完成/跳过 */}
            {(step.status === 'completed' || step.status === 'skipped') && step.content && (
              <p className="text-sm text-slate-500 mt-2">{step.content}</p>
            )}

            {/* 显示已有附件 */}
            {step.attachments && step.attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {step.attachments.map((att, i) => {
                  const AttIcon = getAttachmentIcon(att.type);
                  return (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 p-1.5 bg-blue-50 rounded-lg"
                    >
                      <AttIcon className="h-3.5 w-3.5" />
                      <span className="truncate flex-1">{att.name}</span>
                      <span className="text-slate-400">{formatFileSize(att.size)}</span>
                    </a>
                  );
                })}
              </div>
            )}

            {/* 进行中 */}
            {step.status === 'in_progress' && isActive && (
              <div className="mt-3 space-y-3">
                <Textarea
                  placeholder="记录执行内容..."
                  value={content}
                  onChange={e => onContentChange(e.target.value)}
                  rows={2}
                />

                {/* 上传区域 */}
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={FILE_TYPE_CONFIGS.teaching.accept}
                    className="hidden"
                  />

                  {/* 已上传的附件 */}
                  {attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {attachments.map((att, i) => {
                        const AttIcon = getAttachmentIcon(att.type);
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                            <AttIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate flex-1 text-slate-600">{att.name}</span>
                            <span className="text-slate-400">{formatFileSize(att.size)}</span>
                            <button
                              onClick={() => removeAttachment(i)}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1.5" />
                        上传材料留痕
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-slate-400 text-center">
                    支持图片、视频、音频、文档（最大 50MB）
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={onComplete}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    完成
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSkip(!showSkip)}>
                    <SkipForward className="h-3 w-3 mr-1" />
                    跳过
                  </Button>
                </div>
                {showSkip && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="跳过原因..."
                      value={skipReason}
                      onChange={e => setSkipReason(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => skipReason && onSkip(skipReason)}
                      disabled={!skipReason}
                    >
                      确认
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 待处理 */}
            {step.status === 'pending' && isActive && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={onStart}>
                  <Play className="h-3 w-3 mr-1" />
                  开始
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 执行面板
export const ExecutionSheet: React.FC<Props> = ({ open, onOpenChange, execution, onUpdateStep, onComplete }) => {
  const [summary, setSummary] = useState('');
  const [stepContents, setStepContents] = useState<Record<number, string>>({});
  const [stepAttachments, setStepAttachments] = useState<Record<number, AttachmentData[]>>({});

  useEffect(() => {
    if (execution) {
      setSummary('');
      setStepContents({});
      setStepAttachments({});
    }
  }, [execution?.id]);

  if (!execution) return null;

  const completed = execution.steps.filter(s => s.status === 'completed').length;
  const total = execution.steps.length;
  const allDone = execution.steps.every(s => s.status !== 'pending');
  const config = categoryConfig[execution.category];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <SheetTitle>{execution.templateName}</SheetTitle>
              <p className="text-sm text-slate-500">{execution.className}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 进度 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">执行进度</span>
              <span className="text-sm font-medium">{completed}/{total}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${config.gradient} transition-all`}
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>

          {/* 步骤 */}
          <div className="space-y-3">
            {execution.steps.map((step, index) => (
              <StepCard
                key={index}
                step={{
                  ...step,
                  attachments: step.attachments?.map(a => ({
                    key: a.id,
                    url: a.url,
                    name: a.name,
                    size: a.size || 0,
                    type: a.type,
                    evidenceType: a.type.startsWith('image') ? 'photo' :
                                  a.type.startsWith('video') ? 'video' :
                                  a.type.startsWith('audio') ? 'audio' : 'document',
                  })),
                }}
                index={index}
                isActive={execution.status === 'in_progress'}
                content={stepContents[step.stepOrder] || ''}
                attachments={stepAttachments[step.stepOrder] || []}
                onContentChange={(c) => setStepContents(prev => ({ ...prev, [step.stepOrder]: c }))}
                onAttachmentsChange={(a) => setStepAttachments(prev => ({ ...prev, [step.stepOrder]: a }))}
                onStart={() => onUpdateStep(execution.id, step.stepOrder, 'start')}
                onComplete={() => onUpdateStep(
                  execution.id,
                  step.stepOrder,
                  'complete',
                  stepContents[step.stepOrder],
                  stepAttachments[step.stepOrder]
                )}
                onSkip={(reason) => onUpdateStep(execution.id, step.stepOrder, 'skip', reason)}
                executionId={execution.id}
              />
            ))}
          </div>

          {/* 完成 */}
          {execution.status === 'in_progress' && allDone && (
            <div className="pt-4 border-t space-y-4">
              <div>
                <Label className="text-sm text-slate-600">执行总结</Label>
                <Textarea
                  placeholder="请总结本次执行情况..."
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => summary && onComplete(execution.id, summary)}
                disabled={!summary}
              >
                <FileSignature className="h-4 w-4 mr-2" />
                完成并归档
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
