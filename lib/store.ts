import { create } from 'zustand';
import { DocumentationNode, DocumentationEdge } from './types';
import { applyNodeChanges, applyEdgeChanges, OnNodesChange, OnEdgesChange, Connection, addEdge } from 'reactflow';
import { supabase } from './supabase';

interface FlowMetadata {
  flow_id: string;
  title: string;
  description?: string;
  event_type?: 'exhibition' | 'research' | 'curation';
  start_date?: string;
  end_date?: string;
  last_saved?: string;
  is_saving?: boolean;
}

interface ExhibitStore {
  // Flow data
  nodes: DocumentationNode[];
  edges: DocumentationEdge[];
  
  // Flow metadata
  currentFlow: FlowMetadata | null;
  
  // React Flow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  
  // Node operations
  addNode: (node: DocumentationNode) => void;
  updateNode: (id: string, data: Partial<DocumentationNode['data']>) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: DocumentationNode[]) => void;
  setEdges: (edges: DocumentationEdge[]) => void;
  
  // Flow operations
  setCurrentFlow: (flow: FlowMetadata) => void;
  saveCurrentFlow: () => Promise<void>;
  loadFlow: (flowId: string) => Promise<void>;
  createNewFlow: (title: string, description?: string, eventType?: 'exhibition' | 'research' | 'curation', startDate?: string, endDate?: string) => void;
  
  // Auto-save functionality
  triggerAutoSave: () => void;
}

// Debounce function for auto-save
let saveTimeout: NodeJS.Timeout | null = null;

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper function to save flow to API
async function saveFlowToAPI(flowData: FlowMetadata, nodes: DocumentationNode[], edges: DocumentationEdge[]): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch('/api/flows/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      flow_id: flowData.flow_id,
      title: flowData.title,
      description: flowData.description,
      event_type: flowData.event_type,
      start_date: flowData.start_date,
      end_date: flowData.end_date,
      nodes,
      edges,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save flow');
  }
}

export const useExhibitStore = create<ExhibitStore>((set, get) => ({
  nodes: [],
  edges: [],
  currentFlow: null,
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    // Trigger auto-save after node changes
    get().triggerAutoSave();
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    // Trigger auto-save after edge changes
    get().triggerAutoSave();
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    // Trigger auto-save after connection
    get().triggerAutoSave();
  },
  
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
    // Trigger auto-save after adding node
    get().triggerAutoSave();
  },
  
  updateNode: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
    // Trigger auto-save after updating node
    get().triggerAutoSave();
  },
  
  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    });
    // Trigger auto-save after deleting node
    get().triggerAutoSave();
  },
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  setCurrentFlow: (flow) => set({ currentFlow: flow }),
  
  saveCurrentFlow: async () => {
    const { currentFlow, nodes, edges } = get();
    
    if (!currentFlow) {
      throw new Error('No current flow to save');
    }

    set({
      currentFlow: { ...currentFlow, is_saving: true }
    });

    try {
      await saveFlowToAPI(currentFlow, nodes, edges);
      
      set({
        currentFlow: {
          ...currentFlow,
          is_saving: false,
          last_saved: new Date().toISOString(),
        }
      });
    } catch (error) {
      set({
        currentFlow: { ...currentFlow, is_saving: false }
      });
      throw error;
    }
  },
  
  loadFlow: async (flowId: string) => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`/api/flows/load?flow_id=${flowId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load flow');
    }

    const { flow } = await response.json();
    
    set({
      nodes: flow.nodes || [],
      edges: flow.edges || [],
      currentFlow: {
        flow_id: flow.flow_id,
        title: flow.title,
        description: flow.description,
        event_type: flow.event_type,
        start_date: flow.start_date,
        end_date: flow.end_date,
        last_saved: flow.updated_at,
      },
    });
  },
  
  createNewFlow: (title: string, description?: string, eventType?: 'exhibition' | 'research' | 'curation', startDate?: string, endDate?: string) => {
    const flowId = `flow-${Date.now()}`;
    
    set({
      nodes: [],
      edges: [],
      currentFlow: {
        flow_id: flowId,
        title,
        description,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate,
      },
    });
  },
  
  triggerAutoSave: () => {
    const { currentFlow } = get();
    
    // Only auto-save if we have a current flow
    if (!currentFlow) return;
    
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout for auto-save (debounced by 2 seconds)
    saveTimeout = setTimeout(async () => {
      try {
        await get().saveCurrentFlow();
        console.log('Flow auto-saved successfully');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);
  },
})); 