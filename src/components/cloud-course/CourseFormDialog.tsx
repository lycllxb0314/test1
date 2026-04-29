import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/ui/image-uploader';
import { FileUploadField } from '@/components/cloud-course/FileUploadField';
import { Plus, Trash2 } from 'lucide-react';
import type { CourseDomain } from '@/types/cloud-course';
import type { DomainConfig } from './constants';

type CourseFormData = {
  title: string;
  description: string;
  domain: CourseDomain;
  format: 'live' | 'recorded';
  category: string;
  targetAudience: string;
  coverImage: string;
};

type ChapterData = {
  title: string;
  videoUrl: string;
  documentUrl: string;
  duration: number;
};

type CourseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: CourseFormData;
  setForm: React.Dispatch<React.SetStateAction<CourseFormData>>;
  chapters: ChapterData[];
  setChapters: React.Dispatch<React.SetStateAction<ChapterData[]>>;
  onSubmit: () => void;
  creatableDomains: DomainConfig[];
  submitLabel: string;
};

export const CourseFormDialog = memo(function CourseFormDialog({
  open, onOpenChange, title, form, setForm, chapters, setChapters, onSubmit, creatableDomains, submitLabel,
}: CourseFormDialogProps) {
  const addChapter = () => setChapters(prev => [...prev, { title: '', videoUrl: '', documentUrl: '', duration: 0 }]);
  const updateChapter = (i: number, field: string, value: string | number) => setChapters(prev => prev.map((ch, idx) => idx === i ? { ...ch, [field]: value } : ch));
  const removeChapter = (i: number) => setChapters(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-5 mt-4">
          <Input placeholder="课程标题" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea placeholder="课程描述" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">课程域</label>
              <select className="w-full border rounded-md p-2 text-sm bg-background focus:ring-1 focus:ring-primary" value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value as CourseDomain }))}>
                {creatableDomains.map(dc => <option key={dc.domain} value={dc.domain}>{dc.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">课程形态</label>
              <select className="w-full border rounded-md p-2 text-sm bg-background focus:ring-1 focus:ring-primary" value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value as 'live' | 'recorded' }))}>
                <option value="recorded">录播(慕课)</option>
                <option value="live">直播</option>
              </select>
            </div>
          </div>
          <ImageUploader value={form.coverImage || undefined} onChange={(url) => setForm(p => ({ ...p, coverImage: url || '' }))} folder="cloud-course/covers" className="w-full" />
          <Input placeholder="分类（如：语文教研、安全教育）" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <Input placeholder="目标受众（如：全校教师、一年级家长）" value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))} />

          {form.format === 'recorded' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">课程章节</label>
                <Button size="sm" variant="outline" onClick={addChapter}><Plus className="h-3 w-3 mr-1" />添加章节</Button>
              </div>
              {chapters.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">
                  点击"添加章节"创建课程内容，视频支持B站/YouTube等平台链接或MP4直链
                </p>
              ) : (
                <div className="space-y-3">
                  {chapters.map((ch, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">第 {i + 1} 章</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => removeChapter(i)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <Input placeholder="章节标题" value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} className="h-8 text-sm" />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <FileUploadField value={ch.videoUrl} onChange={(url) => updateChapter(i, 'videoUrl', url)} category="video" folder="cloud-course/videos" placeholder="支持B站/YouTube/优酷链接 或 MP4直链" iconType="video" />
                        </div>
                        <div className="flex-1">
                          <FileUploadField value={ch.documentUrl} onChange={(url) => updateChapter(i, 'documentUrl', url)} category="document" folder="cloud-course/courseware" placeholder="课件链接（可选）" iconType="document" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={onSubmit} className="w-full" disabled={!form.title}>{submitLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
