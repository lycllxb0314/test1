'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Wrench,
  ShoppingCart,
  CheckCircle,
  User,
  Clock,
  GitBranch,
  Workflow,
  Sparkles,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowConfig, WorkflowType } from '@/types';

const workflowTypes = [
  { value: 'leave', label: '请假审批', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { value: 'repair', label: '报修审批', icon: Wrench, color: 'bg-orange-100 text-orange-600' },
  { value: 'purchase', label: '采购审批', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
];

export default function WorkflowConfigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [configs, setConfigs] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const res = await fetch(`/api/workflow/config${params}`);
      const data = await res.json();
      setConfigs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const openCreatePage = (type?: string) => {
    const url = type 
      ? `/workflow/config/edit?type=${type}`
      : '/workflow/config/edit';
    router.push(url);
  };

  const openEditPage = (config: WorkflowConfig) => {
    router.push(`/workflow/config/edit?id=${config.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个审批流程配置吗？')) return;

    try {
      await fetch(`/api/workflow/config?id=${id}`, { method: 'DELETE' });
      fetchConfigs();
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const handleSetActive = async (config: WorkflowConfig) => {
    try {
      const res = await fetch('/api/workflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          isActive: true,
          createdBy: user?.name,
        }),
      });

      if (res.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to activate config:', error);
    }
  };

  const getTypeStyle = (type: string) => {
    return workflowTypes.find(t => t.value === type) || workflowTypes[0];
  };

  // 检查用户是否有权限配置流程
  const canConfig = ['principal', 'secretary', 'vice_principal'].includes(user?.role || '');

  if (!canConfig) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">无访问权限</h2>
            <p className="text-gray-500">只有校长、书记、分管副校长可以配置审批流程</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审批流程配置</h1>
          <p className="text-gray-500 mt-1">配置请假、报修、采购的标准化审批流程，支持条件分支</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {workflowTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => openCreatePage()} className="gap-2">
            <Plus className="h-4 w-4" />
            新建流程
          </Button>
        </div>
      </div>

      {/* 流程类型卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        {workflowTypes.map(type => {
          const Icon = type.icon;
          const typeConfigs = configs.filter(c => c.type === type.value);
          const activeConfig = typeConfigs.find(c => c.isActive);
          
          return (
            <Card 
              key={type.value} 
              className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group ${
                selectedType === type.value ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedType(type.value)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${type.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{type.label}</h3>
                    <p className="text-sm text-gray-500">{typeConfigs.length} 个配置</p>
                  </div>
                </div>
                
                {activeConfig ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        启用中
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {activeConfig.nodes?.filter(n => n.type === 'approval').length || 0} 个审批节点
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate">{activeConfig.name}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPage(activeConfig);
                        }}
                        className="flex-1 gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreatePage(type.value);
                        }}
                        className="flex-1 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        新建
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge variant="outline" className="text-gray-500">
                      未配置
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreatePage(type.value);
                      }}
                      className="w-full gap-1 group-hover:bg-primary group-hover:text-white transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      使用模板创建
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 使用说明 */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-2">流程配置说明</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li><strong>条件分支</strong>：根据申请类型、天数、金额等条件，走不同的审批路径</li>
                <li><strong>拒绝处理</strong>：可设置拒绝后退回到哪个节点（申请人修改/上一节点/指定节点）</li>
                <li><strong>实时预览</strong>：配置时右侧实时显示流程图，方便判断逻辑是否正确</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">流程配置列表</CardTitle>
          <CardDescription>
            {selectedType === 'all' ? '显示所有类型的审批流程配置' : `显示「${getTypeStyle(selectedType).label}」的配置`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Workflow className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>暂无流程配置</p>
              <Button onClick={() => openCreatePage()} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                创建流程配置
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => {
                const typeStyle = getTypeStyle(config.type);
                const Icon = typeStyle.icon;
                
                // 统计节点数量
                const approvalCount = config.nodes?.filter(n => n.type === 'approval').length || 0;
                const conditionCount = config.nodes?.filter(n => n.type === 'condition').length || 0;
                
                return (
                  <div
                    key={config.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      config.isActive 
                        ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${typeStyle.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{config.name}</p>
                        {config.isActive && (
                          <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            启用中
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {approvalCount} 个审批节点
                        </span>
                        {conditionCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <GitBranch className="h-3 w-3" />
                            {conditionCount} 个条件分支
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(config.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!config.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(config)}
                          className="text-green-600 hover:text-green-700"
                        >
                          启用
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditPage(config)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id as any)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
