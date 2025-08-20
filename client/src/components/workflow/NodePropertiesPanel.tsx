import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WorkflowNode, WORKFLOW_BLOCKS, WORKFLOW_BLOCK_TYPES } from '@/services/workflow';
import { X, Save, Sparkles } from 'lucide-react';

interface NodePropertiesPanelProps {
  node: WorkflowNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function NodePropertiesPanel({ 
  node, 
  onUpdateNode, 
  onClose, 
  isReadOnly = false 
}: NodePropertiesPanelProps) {
  const [localNode, setLocalNode] = useState<WorkflowNode | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalNode(node);
    setHasChanges(false);
  }, [node]);

  if (!node || !localNode) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center text-gray-500">
        Select a node to view its properties
      </div>
    );
  }

  const blockConfig = WORKFLOW_BLOCKS.find(block => block.type === node.type) || WORKFLOW_BLOCKS[0];

  const updateLocalNode = (updates: Partial<WorkflowNode>) => {
    if (isReadOnly) return;
    
    setLocalNode(prev => prev ? { ...prev, ...updates } : null);
    setHasChanges(true);
  };

  const updateNodeData = (dataUpdates: Partial<WorkflowNode['data']>) => {
    updateLocalNode({
      data: { ...localNode.data, ...dataUpdates }
    });
  };

  const saveChanges = () => {
    if (!hasChanges || !localNode || isReadOnly) return;
    
    onUpdateNode(localNode.id, localNode);
    setHasChanges(false);
  };

  const resetChanges = () => {
    setLocalNode(node);
    setHasChanges(false);
  };

  // Get configuration options based on node type
  const getConfigFields = () => {
    const config = localNode.data.config || {};
    
    switch (localNode.type) {
      case WORKFLOW_BLOCK_TYPES.CONDITION:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="condition-type">Condition Type</Label>
              <Select
                value={config.conditionType || 'patient_age'}
                onValueChange={(value) => updateNodeData({ config: { ...config, conditionType: value } })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient_age">Patient Age</SelectItem>
                  <SelectItem value="vital_signs">Vital Signs</SelectItem>
                  <SelectItem value="diagnosis">Diagnosis</SelectItem>
                  <SelectItem value="lab_results">Lab Results</SelectItem>
                  <SelectItem value="medication_allergy">Medication Allergy</SelectItem>
                  <SelectItem value="insurance_type">Insurance Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="condition-operator">Operator</Label>
              <Select
                value={config.operator || 'greater_than'}
                onValueChange={(value) => updateNodeData({ config: { ...config, operator: value } })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="exists">Exists</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="condition-value">Condition Value</Label>
              <Input
                id="condition-value"
                value={config.conditionValue || ''}
                onChange={(e) => updateNodeData({ config: { ...config, conditionValue: e.target.value } })}
                placeholder="Enter condition value..."
                disabled={isReadOnly}
              />
            </div>
          </div>
        );

      case WORKFLOW_BLOCK_TYPES.DELAY:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="delay-duration">Duration</Label>
              <Input
                id="delay-duration"
                type="number"
                value={config.duration || 5}
                onChange={(e) => updateNodeData({ config: { ...config, duration: parseInt(e.target.value) } })}
                placeholder="Duration"
                disabled={isReadOnly}
              />
            </div>
            
            <div>
              <Label htmlFor="delay-unit">Time Unit</Label>
              <Select
                value={config.timeUnit || 'minutes'}
                onValueChange={(value) => updateNodeData({ config: { ...config, timeUnit: value } })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case WORKFLOW_BLOCK_TYPES.NOTIFICATION:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select
                value={config.notificationType || 'email'}
                onValueChange={(value) => updateNodeData({ config: { ...config, notificationType: value } })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="pager">Pager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notification-recipients">Recipients</Label>
              <Input
                id="notification-recipients"
                value={config.recipients || ''}
                onChange={(e) => updateNodeData({ config: { ...config, recipients: e.target.value } })}
                placeholder="Enter email addresses or phone numbers..."
                disabled={isReadOnly}
              />
            </div>
            
            <div>
              <Label htmlFor="notification-template">Message Template</Label>
              <Textarea
                id="notification-template"
                value={config.messageTemplate || ''}
                onChange={(e) => updateNodeData({ config: { ...config, messageTemplate: e.target.value } })}
                placeholder="Enter notification message template..."
                disabled={isReadOnly}
              />
            </div>
          </div>
        );

      case WORKFLOW_BLOCK_TYPES.READMISSION_RISK:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-ai"
                checked={config.enableAI !== false}
                onCheckedChange={(checked) => updateNodeData({ config: { ...config, enableAI: checked } })}
                disabled={isReadOnly}
              />
              <Label htmlFor="enable-ai">Enable AI Prediction</Label>
            </div>
            
            <div>
              <Label htmlFor="risk-threshold">Risk Threshold (%)</Label>
              <Input
                id="risk-threshold"
                type="number"
                min="0"
                max="100"
                value={config.riskThreshold || 30}
                onChange={(e) => updateNodeData({ config: { ...config, riskThreshold: parseInt(e.target.value) } })}
                disabled={isReadOnly}
              />
            </div>
            
            <div>
              <Label htmlFor="risk-factors">Risk Factors to Consider</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['age', 'comorbidities', 'previous_admissions', 'medication_compliance', 'social_factors', 'discharge_disposition'].map(factor => (
                  <div key={factor} className="flex items-center space-x-2">
                    <Switch
                      id={`factor-${factor}`}
                      checked={config.riskFactors?.includes(factor) || false}
                      onCheckedChange={(checked) => {
                        const factors = config.riskFactors || [];
                        const updated = checked 
                          ? [...factors, factor]
                          : factors.filter((f: string) => f !== factor);
                        updateNodeData({ config: { ...config, riskFactors: updated } });
                      }}
                      disabled={isReadOnly}
                    />
                    <Label htmlFor={`factor-${factor}`} className="text-sm capitalize">
                      {factor.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="auto-advance">Auto-advance to next step</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="auto-advance"
                  checked={config.autoAdvance !== false}
                  onCheckedChange={(checked) => updateNodeData({ config: { ...config, autoAdvance: checked } })}
                  disabled={isReadOnly}
                />
                <span className="text-sm text-gray-500">
                  Automatically proceed when complete
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="estimated-duration">Estimated Duration (minutes)</Label>
              <Input
                id="estimated-duration"
                type="number"
                value={config.estimatedDuration || 15}
                onChange={(e) => updateNodeData({ config: { ...config, estimatedDuration: parseInt(e.target.value) } })}
                placeholder="Duration in minutes"
                disabled={isReadOnly}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Node Properties</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Node Type Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: blockConfig.color }}
              >
                {blockConfig.icon}
              </div>
              <div>
                <h4 className="font-medium">{blockConfig.label}</h4>
                <p className="text-sm text-gray-500">{blockConfig.description}</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              style={{ 
                backgroundColor: blockConfig.color + '20', 
                color: blockConfig.color 
              }}
            >
              {blockConfig.category}
            </Badge>
          </CardContent>
        </Card>

        {/* Basic Properties */}
        <div className="space-y-4">
          <h4 className="font-medium">Basic Properties</h4>
          
          <div>
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={localNode.data.label}
              onChange={(e) => updateNodeData({ label: e.target.value })}
              placeholder="Enter node label..."
              disabled={isReadOnly}
            />
          </div>

          <div>
            <Label htmlFor="node-description">Description</Label>
            <Textarea
              id="node-description"
              value={localNode.data.description || ''}
              onChange={(e) => updateNodeData({ description: e.target.value })}
              placeholder="Enter node description..."
              disabled={isReadOnly}
            />
          </div>

          <div>
            <Label htmlFor="node-position">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={Math.round(localNode.position.x)}
                onChange={(e) => updateLocalNode({ 
                  position: { ...localNode.position, x: parseInt(e.target.value) || 0 } 
                })}
                placeholder="X"
                type="number"
                disabled={isReadOnly}
              />
              <Input
                value={Math.round(localNode.position.y)}
                onChange={(e) => updateLocalNode({ 
                  position: { ...localNode.position, y: parseInt(e.target.value) || 0 } 
                })}
                placeholder="Y"
                type="number"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Node-specific Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Configuration</h4>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          
          {getConfigFields()}
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="space-y-2">
            <Button
              onClick={saveChanges}
              disabled={!hasChanges}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            
            {hasChanges && (
              <Button
                variant="outline"
                onClick={resetChanges}
                className="w-full"
              >
                Reset Changes
              </Button>
            )}
          </div>
        )}

        {/* Node ID (for debugging) */}
        <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <strong>Node ID:</strong> {localNode.id}
        </div>
      </div>
    </div>
  );
}