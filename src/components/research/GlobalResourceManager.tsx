'use client';

/**
 * 全局资源库组件
 * 
 * 功能：
 * - 展示所有专项教研主题的资源
 * - 按专项教研类型（大单元教学/项目式教学/学科实践/AI赋能教学）分组
 * - 按资源标签（教学设计/优秀课例/学术论文/课件资源/其他）分类
 * - 数据来源于各专项教研主题的资源库
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FolderOpen,
  Download,
  Search,
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Lightbulb,
  FlaskConical,
  Cpu,
  Target,
  Video,
  Award,
  Presentation,
  File,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

interface ResearchTheme {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  subject: string;
}

interface Resource {
  id: string;
  title: string;
  resourceType: string;
  type: string;
  size?: number;
  fileKey?: string;
  fileUrl?: string;
  teacherName?: string;
  createdAt: string;
  themeId: string;
  themeTitle: string;
  themeType: string;
  themeTypeLabel: string;
  activityTitle?: string;
}

interface ThemeGroup {
  themeId: string;
  themeTitle: string;
  themeType: string;
  themeTypeLabel: string;
  subject: string;
  resources: Resource[];
}

// ==================== 配置 ====================

const THEME_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string; color: string }> = {
  big_unit: { label: '大单元教学', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', color: 'text-blue-500 bg-blue-50' },
  project: { label: '项目式教学', icon: Lightbulb, gradient: 'from-amber-500 to-orange-500', color: 'text-amber-500 bg-amber-50' },
  practice: { label: '学科实践', icon: FlaskConical, gradient: 'from-emerald-500 to-teal-500', color: 'text-emerald-500 bg-emerald-50' },
  ai_enabled: { label: 'AI赋能教学', icon: Cpu, gradient: 'from-violet-500 to-purple-500', color: 'text-violet-500 bg-violet-50' },
  custom: { label: '自定义主题', icon: Target, gradient: 'from-slate-500 to-gray-500', color: 'text-slate-500 bg-slate-50' },
};

const RESOURCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lesson_design: { label: '教学设计', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  excellent_case: { label: '优秀课例', icon: Video, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  academic_paper: { label: '学术论文', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  courseware: { label: '课件资源', icon: Presentation, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  other: { label: '其他资源', icon: FolderOpen, color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

// ==================== 组件 ====================

export default function GlobalResourceManager() {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [themeGroups, setThemeGroups] = useState<ThemeGroup[]>([]);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [filterThemeType, setFilterThemeType] = useState<string>('all');
  const [filterResourceType, setFilterResourceType] = useState<string>('all');
  
  // 展开状态
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    loadAllResources();
  }, []);
  
  const loadAllResources = async () => {
    setLoading(true);
    try {
      // 1. 获取所有教研主题
      const themesRes = await fetch('/api/research/themes?pageSize=100');
      const themesData = await themesRes.json();
      
      if (!themesData.success) {
        throw new Error('获取主题失败');
      }
      
      const themes = themesData.data || [];
      
      // 2. 获取每个主题的资源
      const resourcePromises = themes.map((theme: any) => 
        fetch(`/api/research/resources?themeId=${theme.id}`).then(res => res.json())
      );
      
      const resourcesResults = await Promise.all(resourcePromises);
      
      // 3. 组装数据
      const allResources: Resource[] = [];
      const groups: ThemeGroup[] = [];
      
      themes.forEach((theme: any, index: number) => {
        const themeResources = resourcesResults[index]?.data || [];
        
        if (themeResources.length > 0) {
          const themeConfig = THEME_TYPE_CONFIG[theme.type] || THEME_TYPE_CONFIG.custom;
          
          // 为每个资源添加主题信息
          const resourcesWithTheme = themeResources.map((r: any) => ({
            ...r,
            themeTitle: theme.title,
            themeType: theme.type,
            themeTypeLabel: themeConfig.label,
          }));
          
          allResources.push(...resourcesWithTheme);
          
          groups.push({
            themeId: theme.id,
            themeTitle: theme.title,
            themeType: theme.type,
            themeTypeLabel: themeConfig.label,
            subject: theme.subject,
            resources: resourcesWithTheme,
          });
        }
      });
      
      setResources(allResources);
      setThemeGroups(groups);
      
      // 默认展开第一个分组
      if (groups.length > 0) {
        setExpandedGroups(new Set([groups[0].themeId]));
      }
      
    } catch (err) {
      console.error('加载资源失败:', err);
      toast.error('加载资源失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async (resource: Resource) => {
    if (resource.fileKey) {
      try {
        const res = await fetch(`/api/download?key=${encodeURIComponent(resource.fileKey)}`);
        const data = await res.json();
        
        if (data.url) {
          const response = await fetch(data.url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = resource.title;
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
      } catch (err) {
        toast.error('下载失败');
      }
    }
  };
  
  const toggleGroup = (themeId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedGroups(newExpanded);
  };
  
  // 筛选资源
  const filteredGroups = themeGroups
    .filter(group => filterThemeType === 'all' || group.themeType === filterThemeType)
    .map(group => ({
      ...group,
      resources: group.resources.filter(r => {
        const matchesSearch = !searchQuery || 
          r.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterResourceType === 'all' || r.resourceType === filterResourceType;
        return matchesSearch && matchesType;
      }),
    }))
    .filter(group => group.resources.length > 0);
  
  // 统计信息
  const stats = {
    total: resources.length,
    byThemeType: {} as Record<string, number>,
    byResourceType: {} as Record<string, number>,
  };
  
  resources.forEach(r => {
    stats.byThemeType[r.themeType] = (stats.byThemeType[r.themeType] || 0) + 1;
    stats.byResourceType[r.resourceType] = (stats.byResourceType[r.resourceType] || 0) + 1;
  });
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-6 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
            <div className="text-xs text-slate-500">全部资源</div>
          </CardContent>
        </Card>
        
        {Object.entries(THEME_TYPE_CONFIG).slice(0, 4).map(([key, config]) => (
          <Card key={key} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`inline-flex p-1.5 rounded-lg ${config.color} mb-1`}>
                <config.icon className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-slate-700">{stats.byThemeType[key] || 0}</div>
              <div className="text-xs text-slate-500">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* 工具栏 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterThemeType} onValueChange={setFilterThemeType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="专项教研类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(THEME_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterResourceType} onValueChange={setFilterResourceType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="资源类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部标签</SelectItem>
            {Object.entries(RESOURCE_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* 资源列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">暂无资源</p>
            <p className="text-sm text-slate-400 mt-1">资源来源于各专项教研主题的资源库</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(group => {
            const themeConfig = THEME_TYPE_CONFIG[group.themeType] || THEME_TYPE_CONFIG.custom;
            const ThemeIcon = themeConfig.icon;
            const isExpanded = expandedGroups.has(group.themeId);
            
            return (
              <Card key={group.themeId} className="border-0 shadow-sm overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.themeId)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${themeConfig.color}`}>
                          <ThemeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900">{group.themeTitle}</h4>
                            <Badge variant="outline" className="text-xs">
                              {themeConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {group.subject} · {group.resources.length} 个资源
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{group.resources.length}</Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-slate-100">
                      {/* 按资源类型分组显示 */}
                      {Object.entries(RESOURCE_TYPE_CONFIG).map(([resType, resConfig]) => {
                        const typeResources = group.resources.filter(r => r.resourceType === resType);
                        if (typeResources.length === 0) return null;
                        
                        return (
                          <div key={resType} className="border-b border-slate-100 last:border-b-0">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50">
                              <resConfig.icon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-600">{resConfig.label}</span>
                              <Badge variant="secondary" className="text-xs">{typeResources.length}</Badge>
                            </div>
                            <div className="divide-y divide-slate-50">
                              {typeResources.map(resource => {
                                const resourceConfig = RESOURCE_TYPE_CONFIG[resource.resourceType] || RESOURCE_TYPE_CONFIG.other;
                                return (
                                  <div 
                                    key={resource.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                                  >
                                    <div className={`p-1.5 rounded ${resourceConfig.color}`}>
                                      <resourceConfig.icon className="h-4 w-4" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-medium text-slate-900 truncate">{resource.title}</h5>
                                      <div className="flex items-center gap-2 text-xs text-slate-400">
                                        {resource.teacherName && (
                                          <>
                                            <span>{resource.teacherName}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                          </>
                                        )}
                                        {resource.size && (
                                          <>
                                            <span>{formatFileSize(resource.size)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                          </>
                                        )}
                                        {resource.activityTitle && (
                                          <>
                                            <Activity className="h-3 w-3" />
                                            <span className="text-indigo-500">{resource.activityTitle}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="text-xs text-slate-400">
                                      {new Date(resource.createdAt).toLocaleDateString()}
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(resource);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
