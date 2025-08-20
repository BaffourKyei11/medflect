import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WORKFLOW_BLOCKS, WORKFLOW_BLOCK_TYPES, WorkflowNode } from '@/services/workflow';
import { Search, Plus } from 'lucide-react';

interface WorkflowSidebarProps {
  onAddNode: (blockType: string, position: { x: number; y: number }) => void;
  isReadOnly?: boolean;
}

export function WorkflowSidebar({ onAddNode, isReadOnly = false }: WorkflowSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group blocks by category
  const categories = [...new Set(WORKFLOW_BLOCKS.map(block => block.category))];
  
  const filteredBlocks = WORKFLOW_BLOCKS.filter(block => {
    const matchesSearch = block.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || block.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData('blockType', blockType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddBlock = (blockType: string) => {
    if (isReadOnly) return;
    
    // Add to a default position (center-ish of canvas)
    const position = {
      x: Math.random() * 300 + 100,
      y: Math.random() * 300 + 100,
    };
    onAddNode(blockType, position);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search workflow blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Workflow Blocks */}
        <div className="space-y-2">
          {filteredBlocks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No blocks found matching your search.
            </p>
          ) : (
            filteredBlocks.map(block => (
              <Card
                key={block.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                draggable={!isReadOnly}
                onDragStart={(e) => handleDragStart(e, block.type)}
                onClick={() => handleAddBlock(block.type)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: block.color }}
                    >
                      {block.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{block.label}</h4>
                        {!isReadOnly && (
                          <Plus className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {block.description}
                      </p>
                      
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ 
                          backgroundColor: block.color + '20', 
                          color: block.color,
                          borderColor: block.color + '40'
                        }}
                      >
                        {block.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Start Templates */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Quick Start Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                if (isReadOnly) return;
                
                // Add basic admission workflow
                const templates = [
                  { type: WORKFLOW_BLOCK_TYPES.START, pos: { x: 50, y: 50 } },
                  { type: WORKFLOW_BLOCK_TYPES.ADMISSION, pos: { x: 50, y: 150 } },
                  { type: WORKFLOW_BLOCK_TYPES.TRIAGE, pos: { x: 50, y: 250 } },
                  { type: WORKFLOW_BLOCK_TYPES.ASSESSMENT, pos: { x: 50, y: 350 } },
                  { type: WORKFLOW_BLOCK_TYPES.END, pos: { x: 50, y: 450 } },
                ];
                
                templates.forEach(template => {
                  onAddNode(template.type, template.pos);
                });
              }}
              disabled={isReadOnly}
            >
              🏥 Basic Admission Flow
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                if (isReadOnly) return;
                
                // Add emergency workflow
                const templates = [
                  { type: WORKFLOW_BLOCK_TYPES.START, pos: { x: 50, y: 50 } },
                  { type: WORKFLOW_BLOCK_TYPES.TRIAGE, pos: { x: 50, y: 150 } },
                  { type: WORKFLOW_BLOCK_TYPES.CONDITION, pos: { x: 50, y: 250 } },
                  { type: WORKFLOW_BLOCK_TYPES.ICU_TRANSFER, pos: { x: 200, y: 350 } },
                  { type: WORKFLOW_BLOCK_TYPES.TREATMENT, pos: { x: 50, y: 350 } },
                  { type: WORKFLOW_BLOCK_TYPES.END, pos: { x: 125, y: 450 } },
                ];
                
                templates.forEach(template => {
                  onAddNode(template.type, template.pos);
                });
              }}
              disabled={isReadOnly}
            >
              🚨 Emergency Protocol
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                if (isReadOnly) return;
                
                // Add discharge workflow
                const templates = [
                  { type: WORKFLOW_BLOCK_TYPES.START, pos: { x: 50, y: 50 } },
                  { type: WORKFLOW_BLOCK_TYPES.READMISSION_RISK, pos: { x: 50, y: 150 } },
                  { type: WORKFLOW_BLOCK_TYPES.MEDICATION, pos: { x: 50, y: 250 } },
                  { type: WORKFLOW_BLOCK_TYPES.FOLLOW_UP, pos: { x: 50, y: 350 } },
                  { type: WORKFLOW_BLOCK_TYPES.DISCHARGE, pos: { x: 50, y: 450 } },
                  { type: WORKFLOW_BLOCK_TYPES.END, pos: { x: 50, y: 550 } },
                ];
                
                templates.forEach(template => {
                  onAddNode(template.type, template.pos);
                });
              }}
              disabled={isReadOnly}
            >
              🚪 Discharge Planning
            </Button>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <p>• Drag blocks to the canvas or click to add</p>
            <p>• Click and drag nodes to move them</p>
            <p>• Use connection points to link nodes</p>
            <p>• Select nodes to edit properties</p>
            <p>• Use AI Suggest for optimization tips</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}