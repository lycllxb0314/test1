'use client';

/**
 * 项目式教学设计编辑组件
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Lightbulb,
  Target,
  Users,
  Calendar,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUBJECTS, type ProjectDesign, type ProjectTask, type TeamRole } from '@/types/research';

interface ProjectEditorProps {
  themeId: string;
  design?: ProjectDesign;
  onSave?: (data: Partial<ProjectDesign>) => void;
}

export default function ProjectEditor({ themeId, design, onSave }: ProjectEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    projectName: design?.projectName || '',
    grade: design?.grade || 3,
    subjects: design?.subjects || ['语文'],
    drivingQuestion: design?.drivingQuestion || '',
    projectGoal: design?.projectGoal || '',
    tasks: design?.tasks || [] as ProjectTask[],
    teamRoles: design?.teamRoles || [] as TeamRole[],
    reflection: design?.reflection || '',
  });
  
  useEffect(() => {
    if (design) {
      setFormData({
        projectName: design.projectName || '',
        grade: design.grade || 3,
        subjects: design.subjects || ['语文'],
        drivingQuestion: design.drivingQuestion || '',
        projectGoal: design.projectGoal || '',
        tasks: design.tasks || [],
        teamRoles: design.teamRoles || [],
        reflection: design.reflection || '',
      });
    }
  }, [design]);
  
  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };
  
  const handleSave = async () => {
    if (!formData.projectName || !formData.drivingQuestion) {
      toast.error('请填写项目名称和驱动问题');
      return;
    }
    
    if (formData.subjects.length === 0) {
      toast.error('请至少选择一个学科');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        projectName: formData.projectName,
        grade: formData.grade,
        subjects: formData.subjects,
        drivingQuestion: formData.drivingQuestion,
        projectGoal: formData.projectGoal,
        tasks: formData.tasks,
        teamRoles: formData.teamRoles,
        reflection: formData.reflection,
      };
      
      const res = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('保存成功');
        onSave?.(payload);
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            项目基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>项目名称 *</Label>
              <Input
                placeholder="如：校园植物调查"
                value={formData.projectName}
                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Select 
                value={String(formData.grade)} 
                onValueChange={v => setFormData({ ...formData, grade: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>涉及学科 *（支持跨学科）</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(subject => (
                <Badge
                  key={subject}
                  variant={formData.subjects.includes(subject) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleSubjectToggle(subject)}
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>驱动问题 *</Label>
            <Textarea
              placeholder="如：如何让校园里的植物更好地生长？"
              value={formData.drivingQuestion}
              onChange={e => setFormData({ ...formData, drivingQuestion: e.target.value })}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>项目目标</Label>
            <Textarea
              placeholder="描述项目学习目标"
              value={formData.projectGoal}
              onChange={e => setFormData({ ...formData, projectGoal: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 任务分工 */}
      <Tabs defaultValue="tasks">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="tasks">
            <Target className="h-4 w-4 mr-1" />
            阶段任务
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-1" />
            团队分工
          </TabsTrigger>
          <TabsTrigger value="reflection">
            <FileText className="h-4 w-4 mr-1" />
            教学反思
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">阶段任务</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tasks: [
                        ...prev.tasks,
                        { phase: `阶段${prev.tasks.length + 1}`, name: '', description: '', deliverables: [], duration: 1 }
                      ],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加阶段
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.tasks.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无阶段任务，点击"添加阶段"开始</p>
              ) : (
                <div className="space-y-4">
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{task.phase}</Badge>
                        <Input
                          placeholder="任务名称"
                          value={task.name}
                          onChange={e => {
                            const newTasks = [...formData.tasks];
                            newTasks[index] = { ...newTasks[index], name: e.target.value };
                            setFormData({ ...formData, tasks: newTasks });
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="周数"
                          value={task.duration}
                          onChange={e => {
                            const newTasks = [...formData.tasks];
                            newTasks[index] = { ...newTasks[index], duration: parseInt(e.target.value) || 1 };
                            setFormData({ ...formData, tasks: newTasks });
                          }}
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              tasks: prev.tasks.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="任务描述"
                        value={task.description}
                        onChange={e => {
                          const newTasks = [...formData.tasks];
                          newTasks[index] = { ...newTasks[index], description: e.target.value };
                          setFormData({ ...formData, tasks: newTasks });
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">团队角色分工</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      teamRoles: [
                        ...prev.teamRoles,
                        { role: '', responsibilities: [''] }
                      ],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加角色
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.teamRoles.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无角色分工</p>
              ) : (
                <div className="space-y-4">
                  {formData.teamRoles.map((role, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="角色名称"
                          value={role.role}
                          onChange={e => {
                            const newRoles = [...formData.teamRoles];
                            newRoles[index] = { ...newRoles[index], role: e.target.value };
                            setFormData({ ...formData, teamRoles: newRoles });
                          }}
                          className="w-40"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              teamRoles: prev.teamRoles.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">职责</Label>
                        {role.responsibilities.map((resp, respIndex) => (
                          <div key={respIndex} className="flex gap-2">
                            <Input
                              placeholder="职责描述"
                              value={resp}
                              onChange={e => {
                                const newRoles = [...formData.teamRoles];
                                const newResps = [...newRoles[index].responsibilities];
                                newResps[respIndex] = e.target.value;
                                newRoles[index] = { ...newRoles[index], responsibilities: newResps };
                                setFormData({ ...formData, teamRoles: newRoles });
                              }}
                            />
                            {role.responsibilities.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newRoles = [...formData.teamRoles];
                                  newRoles[index] = {
                                    ...newRoles[index],
                                    responsibilities: newRoles[index].responsibilities.filter((_, i) => i !== respIndex)
                                  };
                                  setFormData({ ...formData, teamRoles: newRoles });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-gray-400" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newRoles = [...formData.teamRoles];
                            newRoles[index] = {
                              ...newRoles[index],
                              responsibilities: [...newRoles[index].responsibilities, '']
                            };
                            setFormData({ ...formData, teamRoles: newRoles });
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          添加职责
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reflection" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>教学反思</Label>
                <Textarea
                  placeholder="记录项目实施过程中的经验、问题和改进建议"
                  value={formData.reflection}
                  onChange={e => setFormData({ ...formData, reflection: e.target.value })}
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          保存设计
        </Button>
      </div>
    </div>
  );
}
