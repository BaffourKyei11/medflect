import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { WorkflowSidebar } from '@/components/workflow/WorkflowSidebar';
import { NodePropertiesPanel } from '@/components/workflow/NodePropertiesPanel';
import { workflowService, WorkflowNode, WorkflowEdge, WORKFLOW_BLOCKS } from '@/services/workflow';
import { useWorkflowCache } from '@/hooks/useWorkflowCache';
import type { Workflow, InsertWorkflow } from '@shared/schema';
import { 
  Save, 
  Play, 
  Upload, 
  Download, 
  Settings, 
  Sparkles, 
  Eye, 
  Edit,
  ArrowLeft,
  Zap,
  Users,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

export function WorkflowBuilder() {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute('/workflow-builder/:id?');
  
  const workflowId = params?.id;
  const isNewWorkflow = !workflowId || workflowId === 'new';
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cache = useWorkflowCache();
  
  // Workflow state
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  // Load workflow data
  const { data: workflowData, isLoading } = useQuery({
    queryKey: ['/api/workflows', workflowId],
    enabled: !isNewWorkflow,
    queryFn: () => workflowService.getWorkflow(workflowId!),
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflowData: InsertWorkflow | { id: string; [key: string]: any }) => {
      if ('id' in workflowData) {
        const { id, ...updates } = workflowData;
        return workflowService.updateWorkflow(id, updates);
      } else {
        return workflowService.createWorkflow(workflowData);
      }
    },
    onSuccess: (savedWorkflow) => {
      setWorkflow(savedWorkflow);
      setHasUnsavedChanges(false);
      
      // Cache the workflow
      cache.cacheWorkflow(savedWorkflow, 'synced');
      
      // Update query cache
      queryClient.setQueryData(['/api/workflows', savedWorkflow.id], savedWorkflow);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      
      toast({
        title: "Workflow saved",
        description: `"${savedWorkflow.name}" has been saved successfully.`,
      });
      
      // Navigate to the workflow if it's new
      if (isNewWorkflow) {
        navigate(`/workflow-builder/${savedWorkflow.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to save workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test workflow mutation
  const testWorkflowMutation = useMutation({
    mutationFn: () => workflowService.testWorkflow(workflow!.id),
    onSuccess: (result) => {
      toast({
        title: "Workflow test completed",
        description: `Test passed in ${result.executionTime}ms with ${result.nodesExecuted} nodes executed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Workflow test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deploy workflow mutation
  const deployWorkflowMutation = useMutation({
    mutationFn: () => workflowService.deployWorkflow(workflow!.id),
    onSuccess: (result) => {
      setWorkflow(result.workflow);
      toast({
        title: "Workflow deployed",
        description: "Workflow is now active and ready for use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deployment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get AI suggestions mutation
  const aiSuggestionsMutation = useMutation({
    mutationFn: () => workflowService.getAISuggestions({ nodes, edges }, `Hospital workflow for ${workflow?.name || 'Medical process'}`),
    onSuccess: (suggestions) => {
      setAiSuggestions(suggestions);
      setShowAiPanel(true);
      toast({
        title: "AI suggestions generated",
        description: "Smart recommendations are ready for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to get AI suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize workflow data
  useEffect(() => {
    if (workflowData) {
      setWorkflow(workflowData);
      setNodes(workflowData.definition.nodes as WorkflowNode[] || []);
      setEdges(workflowData.definition.edges as WorkflowEdge[] || []);
      setIsReadOnly(workflowData.status === 'active');
    } else if (isNewWorkflow) {
      // Initialize new workflow
      const newWorkflow: Partial<Workflow> = {
        id: 'temp-id',
        name: 'New Workflow',
        description: null,
        hospitalId: 'demo-hospital',
        createdBy: 'current-user',
        status: 'draft',
        version: '1.0',
        definition: { nodes: [], edges: [] },
        permissions: null,
        metrics: null,
        aiSuggestions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setWorkflow(newWorkflow as Workflow);
      setNodes([]);
      setEdges([]);
      setIsReadOnly(false);
    }
  }, [workflowData, isNewWorkflow]);

  // Mark changes when nodes or edges change
  useEffect(() => {
    if (workflow) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges]);

  // Handle adding new node
  const handleAddNode = useCallback((blockType: string, position: { x: number; y: number }) => {
    const blockConfig = WORKFLOW_BLOCKS.find(block => block.type === blockType) || WORKFLOW_BLOCKS[0];
    
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      position,
      data: {
        label: blockConfig.label,
        description: blockConfig.description,
        icon: blockConfig.icon,
        color: blockConfig.color,
        config: {},
      },
    };

    setNodes(prev => [...prev, newNode]);
  }, []);

  // Handle updating node
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setShowPropertiesPanel(!!nodeId);
  }, []);

  // Save workflow
  const handleSave = useCallback(() => {
    if (!workflow) return;

    const workflowToSave = {
      ...workflow,
      definition: { 
        nodes: nodes as any, 
        edges: edges as any 
      },
    };

    if (isNewWorkflow) {
      const { id, createdAt, updatedAt, ...insertData } = workflowToSave;
      saveWorkflowMutation.mutate(insertData as InsertWorkflow);
    } else {
      saveWorkflowMutation.mutate(workflowToSave);
    }
  }, [workflow, nodes, edges, isNewWorkflow, saveWorkflowMutation]);

  // Auto-save to cache
  useEffect(() => {
    if (workflow && nodes.length > 0) {
      const workflowToCache = {
        ...workflow,
        definition: { nodes, edges },
      };
      cache.cacheWorkflow(workflowToCache, 'pending');
    }
  }, [workflow, nodes, edges, cache]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500">Failed to load workflow</p>
          <Button onClick={() => navigate('/workflow-builder/new')} className="mt-4">
            Create New Workflow
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-3">
              <div>
                <Input
                  value={workflow.name}
                  onChange={(e) => {
                    setWorkflow(prev => prev ? { ...prev, name: e.target.value } : null);
                    setHasUnsavedChanges(true);
                  }}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
                  disabled={isReadOnly}
                />
                <p className="text-sm text-gray-500">
                  {isNewWorkflow ? 'New workflow' : `Version ${workflow.version}`}
                </p>
              </div>
              
              <Badge 
                variant={workflow.status === 'active' ? 'default' : 'secondary'}
                className={workflow.status === 'active' ? 'bg-green-500' : ''}
              >
                {workflow.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Suggestions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => aiSuggestionsMutation.mutate()}
              disabled={aiSuggestionsMutation.isPending || nodes.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggest
            </Button>

            {/* Test Workflow */}
            {!isNewWorkflow && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => testWorkflowMutation.mutate()}
                disabled={testWorkflowMutation.isPending || nodes.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saveWorkflowMutation.isPending || !hasUnsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveWorkflowMutation.isPending ? 'Saving...' : 'Save'}
            </Button>

            {/* Deploy */}
            {!isNewWorkflow && workflow.status === 'draft' && (
              <Button
                onClick={() => deployWorkflowMutation.mutate()}
                disabled={deployWorkflowMutation.isPending || hasUnsavedChanges}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            )}

            {/* Read-only toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReadOnly(!isReadOnly)}
            >
              {isReadOnly ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block Palette */}
        <WorkflowSidebar
          onAddNode={handleAddNode}
          isReadOnly={isReadOnly}
        />

        {/* Canvas */}
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          isReadOnly={isReadOnly}
        />

        {/* Properties Panel */}
        {showPropertiesPanel && (
          <NodePropertiesPanel
            node={nodes.find(n => n.id === selectedNodeId) || null}
            onUpdateNode={handleUpdateNode}
            onClose={() => setShowPropertiesPanel(false)}
            isReadOnly={isReadOnly}
          />
        )}
      </div>

      {/* AI Suggestions Panel */}
      {showAiPanel && aiSuggestions && (
        <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">AI Workflow Suggestions</h3>
                <Badge variant="secondary">{aiSuggestions.generatedAt}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1 text-sm">
                    {aiSuggestions.optimizations.map((suggestion: string, index: number) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">• {suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1 text-sm">
                    {aiSuggestions.nextSteps.map((step: string, index: number) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">• {step}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {aiSuggestions.summary}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm">You have unsaved changes</span>
          <Button size="sm" variant="secondary" onClick={handleSave}>
            Save Now
          </Button>
        </div>
      )}
    </div>
  );
}