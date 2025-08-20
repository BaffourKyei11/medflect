import type { Workflow, InsertWorkflow } from "@shared/schema";

const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
    icon?: string;
    color?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowTestResult {
  success: boolean;
  executionTime: number;
  nodesExecuted: number;
  issues: string[];
  timestamp: string;
}

export interface AIWorkflowSuggestions {
  optimizations: string[];
  nextSteps: string[];
  summary: string;
  generatedAt: string;
}

class WorkflowService {
  async getWorkflows(hospitalId?: string): Promise<Workflow[]> {
    const url = hospitalId 
      ? `${API_BASE}/api/workflows?hospitalId=${hospitalId}`
      : `${API_BASE}/api/workflows`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }
    return response.json();
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/api/workflows/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch workflow');
    }
    return response.json();
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      throw new Error('Failed to create workflow');
    }
    return response.json();
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/api/workflows/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update workflow');
    }
    return response.json();
  }

  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/workflows/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete workflow');
    }
  }

  async testWorkflow(id: string): Promise<WorkflowTestResult> {
    const response = await fetch(`${API_BASE}/api/workflows/${id}/test`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to test workflow');
    }
    return response.json();
  }

  async deployWorkflow(id: string): Promise<{ message: string; workflow: Workflow }> {
    const response = await fetch(`${API_BASE}/api/workflows/${id}/deploy`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to deploy workflow');
    }
    return response.json();
  }

  async getAISuggestions(currentWorkflow: WorkflowDefinition, context?: string): Promise<AIWorkflowSuggestions> {
    const response = await fetch(`${API_BASE}/api/workflows/ai-suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentWorkflow,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI suggestions');
    }
    return response.json();
  }
}

export const workflowService = new WorkflowService();

// Predefined workflow block types
export const WORKFLOW_BLOCK_TYPES = {
  START: 'start',
  END: 'end',
  ADMISSION: 'admission',
  TRIAGE: 'triage',
  ASSESSMENT: 'assessment',
  DIAGNOSIS: 'diagnosis',
  TREATMENT: 'treatment',
  ICU_TRANSFER: 'icu_transfer',
  DISCHARGE: 'discharge',
  FOLLOW_UP: 'follow_up',
  CONSENT_CHECK: 'consent_check',
  READMISSION_RISK: 'readmission_risk',
  MEDICATION: 'medication',
  LAB_ORDER: 'lab_order',
  IMAGING: 'imaging',
  CONSULTATION: 'consultation',
  CONDITION: 'condition',
  DELAY: 'delay',
  NOTIFICATION: 'notification',
} as const;

export const WORKFLOW_BLOCKS = [
  {
    type: WORKFLOW_BLOCK_TYPES.START,
    label: 'Start',
    description: 'Workflow starting point',
    icon: '🚀',
    color: '#10b981',
    category: 'Control'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.END,
    label: 'End',
    description: 'Workflow ending point',
    icon: '🏁',
    color: '#ef4444',
    category: 'Control'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.ADMISSION,
    label: 'Patient Admission',
    description: 'Patient check-in and registration',
    icon: '🏥',
    color: '#3b82f6',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.TRIAGE,
    label: 'Triage',
    description: 'Patient priority assessment',
    icon: '⚠️',
    color: '#f59e0b',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.ASSESSMENT,
    label: 'Clinical Assessment',
    description: 'Medical evaluation and examination',
    icon: '🩺',
    color: '#8b5cf6',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.DIAGNOSIS,
    label: 'Diagnosis',
    description: 'Medical diagnosis determination',
    icon: '🔍',
    color: '#06b6d4',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.TREATMENT,
    label: 'Treatment',
    description: 'Medical treatment and intervention',
    icon: '💊',
    color: '#84cc16',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.ICU_TRANSFER,
    label: 'ICU Transfer',
    description: 'Transfer patient to intensive care',
    icon: '🚨',
    color: '#dc2626',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.DISCHARGE,
    label: 'Discharge',
    description: 'Patient discharge process',
    icon: '🚪',
    color: '#059669',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.FOLLOW_UP,
    label: 'Follow-up',
    description: 'Schedule follow-up appointments',
    icon: '📅',
    color: '#7c3aed',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.CONSENT_CHECK,
    label: 'Consent Check',
    description: 'Verify patient consent for procedures',
    icon: '✅',
    color: '#16a34a',
    category: 'Compliance'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.READMISSION_RISK,
    label: 'Readmission Risk',
    description: 'AI-powered readmission risk assessment',
    icon: '🤖',
    color: '#9333ea',
    category: 'AI/Analytics'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.MEDICATION,
    label: 'Medication',
    description: 'Medication administration and management',
    icon: '💉',
    color: '#ea580c',
    category: 'Treatment'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.LAB_ORDER,
    label: 'Lab Order',
    description: 'Order laboratory tests',
    icon: '🧪',
    color: '#0ea5e9',
    category: 'Diagnostics'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.IMAGING,
    label: 'Medical Imaging',
    description: 'X-ray, CT, MRI imaging orders',
    icon: '📸',
    color: '#6366f1',
    category: 'Diagnostics'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.CONSULTATION,
    label: 'Specialist Consultation',
    description: 'Consult with medical specialists',
    icon: '👨‍⚕️',
    color: '#8b5cf6',
    category: 'Patient Care'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.CONDITION,
    label: 'Condition Check',
    description: 'Conditional branching based on patient data',
    icon: '❓',
    color: '#f59e0b',
    category: 'Logic'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.DELAY,
    label: 'Wait/Delay',
    description: 'Add time delay or waiting period',
    icon: '⏱️',
    color: '#6b7280',
    category: 'Control'
  },
  {
    type: WORKFLOW_BLOCK_TYPES.NOTIFICATION,
    label: 'Send Notification',
    description: 'Send alerts or notifications',
    icon: '📱',
    color: '#ec4899',
    category: 'Communication'
  },
];